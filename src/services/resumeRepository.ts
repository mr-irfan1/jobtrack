import type { Resume, ResumeDraft, ResumeFileType } from '../types/resume.ts'
import { supabase } from './supabaseClient.ts'
import * as localResumeStore from './resumeStore.ts'

const RESUMES_TABLE = 'resumes'
const RESUMES_BUCKET = 'resumes'

interface ResumeRow {
  id: string
  user_id: string
  name: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user.id || null
  } catch {
    return null
  }
}

function rowToResume(row: ResumeRow): Resume {
  return {
    id: row.id,
    name: row.name,
    fileName: row.file_name,
    fileType: row.file_type as ResumeFileType,
    fileSize: row.file_size,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Fetch resumes for the authenticated user from Supabase.
 * Falls back to local storage if user is not authenticated or Supabase request fails.
 */
export async function getResumes(): Promise<Resume[]> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localResumeStore.getResumes()
  }

  try {
    const { data, error } = await supabase
      .from(RESUMES_TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as ResumeRow[]).map(rowToResume)
  } catch {
    return localResumeStore.getResumes()
  }
}

/**
 * Upload resume file to private Supabase storage and persist metadata row.
 */
export async function addResume(
  draft: ResumeDraft,
  fileBlob?: Blob | File,
): Promise<{ success: boolean; resume?: Resume; error?: string }> {
  const userId = await getAuthUserId()
  if (!userId) {
    // Unauthenticated: save to local store
    const localRes = localResumeStore.addResume(draft)
    return localRes
  }

  const resumeId = draft.id || crypto.randomUUID()
  const baseFileName = draft.fileName.split(/[\\/]/).pop() || 'resume.pdf'
  const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '') || 'resume.pdf'
  const storagePath = `${userId}/${resumeId}/${sanitizedFileName}`

  try {
    // 1. If fileBlob is provided, upload to private Supabase Storage
    if (fileBlob) {
      const { error: uploadError } = await supabase.storage
        .from(RESUMES_BUCKET)
        .upload(storagePath, fileBlob, {
          contentType: fileBlob.type || 'application/pdf',
          upsert: true,
        })
      if (uploadError) {
        console.warn('Storage upload error, continuing to metadata:', uploadError.message)
      }
    }

    // 2. If should be primary, unset existing primary
    const existing = await getResumes()
    const shouldBePrimary = existing.length === 0 ? true : Boolean(draft.isPrimary)

    if (shouldBePrimary) {
      await supabase
        .from(RESUMES_TABLE)
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    }

    // 3. Insert row into public.resumes
    const insertRow = {
      id: resumeId,
      user_id: userId,
      name: draft.name.trim(),
      file_name: draft.fileName.trim(),
      file_type: draft.fileType || 'pdf',
      file_size: draft.fileSize || 0,
      storage_path: storagePath,
      is_primary: shouldBePrimary,
    }

    const { data, error: insertError } = await supabase
      .from(RESUMES_TABLE)
      .insert(insertRow)
      .select('*')
      .single()

    if (insertError) throw insertError

    const created = rowToResume(data as ResumeRow)
    // Keep local store in sync as safety cache
    localResumeStore.addResume({ ...draft, id: resumeId, isPrimary: shouldBePrimary })

    return { success: true, resume: created }
  } catch (err) {
    // Fallback to local store
    const localRes = localResumeStore.addResume(draft)
    return {
      success: localRes.success,
      resume: localRes.resume,
      error: localRes.error || (err instanceof Error ? err.message : 'Failed to save resume'),
    }
  }
}

/**
 * Set a specific resume as Primary.
 */
export async function setPrimaryResume(id: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localResumeStore.setPrimaryResume(id)
  }

  try {
    const now = new Date().toISOString()
    // Unset all
    await supabase
      .from(RESUMES_TABLE)
      .update({ is_primary: false, updated_at: now })
      .eq('user_id', userId)

    // Set target
    const { error } = await supabase
      .from(RESUMES_TABLE)
      .update({ is_primary: true, updated_at: now })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    localResumeStore.setPrimaryResume(id)
    return { success: true }
  } catch (err) {
    localResumeStore.setPrimaryResume(id)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to set primary resume' }
  }
}

/**
 * Rename a resume.
 */
export async function renameResume(id: string, newName: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = newName.trim()
  if (!trimmed) {
    return { success: false, error: 'Resume name cannot be empty.' }
  }

  const userId = await getAuthUserId()
  if (!userId) {
    return localResumeStore.renameResume(id, trimmed)
  }

  try {
    const { error } = await supabase
      .from(RESUMES_TABLE)
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    localResumeStore.renameResume(id, trimmed)
    return { success: true }
  } catch (err) {
    localResumeStore.renameResume(id, trimmed)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to rename resume' }
  }
}

/**
 * Delete a resume and its storage file.
 */
export async function deleteResume(id: string): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) {
    localResumeStore.deleteResume(id)
    return
  }

  try {
    // Get row to find storage_path
    const { data } = await supabase
      .from(RESUMES_TABLE)
      .select('storage_path, is_primary')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (data?.storage_path) {
      await supabase.storage.from(RESUMES_BUCKET).remove([data.storage_path])
    }

    await supabase.from(RESUMES_TABLE).delete().eq('id', id).eq('user_id', userId)

    // If was primary, promote next available
    if (data?.is_primary) {
      const remaining = await getResumes()
      if (remaining.length > 0) {
        await setPrimaryResume(remaining[0].id)
      }
    }

    localResumeStore.deleteResume(id)
  } catch {
    localResumeStore.deleteResume(id)
  }
}

/**
 * Get short-lived signed URL (e.g. 60 seconds) for private resume viewing or download.
 */
export async function getResumeSignedUrl(storagePath: string, expiresInSeconds = 60): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(RESUMES_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds)

    if (error || !data?.signedUrl) return null
    return data.signedUrl
  } catch {
    return null
  }
}
