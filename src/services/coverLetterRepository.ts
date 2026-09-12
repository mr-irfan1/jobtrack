import type { CoverLetterDraft } from '../types/coverLetter.ts'
import { supabase } from './supabaseClient.ts'
import * as localCoverLetterStore from './coverLetterService.ts'

const COVER_LETTERS_TABLE = 'cover_letters'

interface CoverLetterRow {
  id: string
  user_id: string
  job_id: string | null
  application_id: string | null
  job_title: string
  company: string
  content: string
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

function rowToDraft(row: CoverLetterRow): CoverLetterDraft {
  return {
    id: row.id,
    jobId: row.job_id || undefined,
    applicationId: row.application_id || undefined,
    jobTitle: row.job_title,
    company: row.company,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getCoverLetters(): Promise<CoverLetterDraft[]> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localCoverLetterStore.getCoverLetters()
  }

  try {
    const { data, error } = await supabase
      .from(COVER_LETTERS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as CoverLetterRow[]).map(rowToDraft)
  } catch {
    return localCoverLetterStore.getCoverLetters()
  }
}

export async function getCoverLetterForJob(
  jobId?: string,
  applicationId?: string,
): Promise<CoverLetterDraft | null> {
  const letters = await getCoverLetters()
  if (!jobId && !applicationId) return null
  return (
    letters.find(
      (l) =>
        (applicationId && l.applicationId === applicationId) ||
        (jobId && l.jobId === jobId),
    ) || null
  )
}

export async function saveCoverLetter(draft: CoverLetterDraft): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) {
    localCoverLetterStore.saveCoverLetter(draft)
    return
  }

  try {
    const payload = {
      id: draft.id,
      user_id: userId,
      job_id: draft.jobId || null,
      application_id: draft.applicationId || null,
      job_title: draft.jobTitle,
      company: draft.company,
      content: draft.content,
      updated_at: new Date().toISOString(),
    }

    await supabase
      .from(COVER_LETTERS_TABLE)
      .upsert(payload, { onConflict: 'id' })

    localCoverLetterStore.saveCoverLetter(draft)
  } catch {
    localCoverLetterStore.saveCoverLetter(draft)
  }
}

export async function deleteCoverLetter(id: string): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) {
    localCoverLetterStore.deleteCoverLetter(id)
    return
  }

  try {
    await supabase
      .from(COVER_LETTERS_TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    localCoverLetterStore.deleteCoverLetter(id)
  } catch {
    localCoverLetterStore.deleteCoverLetter(id)
  }
}
