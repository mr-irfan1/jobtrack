import type { ApplicationResumeMap, Resume, ResumeDraft, ResumeFileType } from '../types/resume'

export const RESUMES_STORAGE_KEY = 'jobtrack_resumes'
export const APPLICATION_RESUMES_STORAGE_KEY = 'jobtrack_application_resumes'
export const RESUMES_EVENT = 'jobtrack_resumes_updated'

const VALID_FILE_TYPES: ResumeFileType[] = ['pdf', 'doc', 'docx', 'other']

/**
 * Validates whether an arbitrary object is a valid Resume record.
 */
function isValidResume(item: unknown): item is Resume {
  if (!item || typeof item !== 'object') return false
  const candidate = item as Partial<Resume>
  if (typeof candidate.id !== 'string' || !candidate.id) return false
  if (typeof candidate.name !== 'string' || !candidate.name) return false
  if (typeof candidate.fileName !== 'string' || !candidate.fileName) return false
  if (typeof candidate.fileType !== 'string' || !VALID_FILE_TYPES.includes(candidate.fileType as ResumeFileType)) {
    return false
  }
  if (typeof candidate.fileSize !== 'number' || candidate.fileSize < 0) return false
  if (typeof candidate.isPrimary !== 'boolean') return false
  if (typeof candidate.createdAt !== 'string') return false
  return true
}

/**
 * Reads all resumes safely from localStorage.
 */
export function getResumes(): Resume[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(RESUMES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidResume)
  } catch {
    return []
  }
}

/**
 * Reads the active Primary resume from localStorage.
 */
export function getPrimaryResume(): Resume | null {
  const resumes = getResumes()
  return resumes.find((r) => r.isPrimary) || null
}

/**
 * Persists resumes list to localStorage and emits an update event.
 */
function persistResumes(resumes: Resume[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(resumes))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(RESUMES_EVENT))
    }
  } catch {
    // Graceful fallback for quota exceeded or storage disabled
  }
}

export interface AddResumeResult {
  success: boolean
  error?: string
  resume?: Resume
}

/**
 * Adds a new resume. Automatically sets as Primary if it is the first resume.
 */
export function addResume(draft: ResumeDraft): AddResumeResult {
  const name = draft.name.trim()
  const fileName = draft.fileName.trim()

  if (!name) {
    return { success: false, error: 'Resume name is required.' }
  }
  if (!fileName) {
    return { success: false, error: 'File name is required.' }
  }

  const existing = getResumes()

  // Prevent exact duplicate submission (same name and file content / size)
  const isDuplicate = existing.some(
    (r) =>
      r.name.toLowerCase() === name.toLowerCase() &&
      r.fileName.toLowerCase() === fileName.toLowerCase() &&
      r.fileSize === draft.fileSize,
  )

  if (isDuplicate) {
    return {
      success: false,
      error: 'A resume with this name and file has already been added.',
    }
  }

  const shouldBePrimary = existing.length === 0 ? true : Boolean(draft.isPrimary)

  const id =
    draft.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `resume_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)

  const now = new Date().toISOString()
  const newResume: Resume = {
    id,
    name,
    fileName,
    fileType: draft.fileType || 'pdf',
    fileSize: draft.fileSize,
    fileData: draft.fileData,
    isPrimary: shouldBePrimary,
    createdAt: now,
    updatedAt: now,
  }

  let updatedList = existing
  if (shouldBePrimary) {
    updatedList = existing.map((r) => ({ ...r, isPrimary: false }))
  }

  updatedList.push(newResume)
  persistResumes(updatedList)

  return { success: true, resume: newResume }
}

/**
 * Sets a specific resume as the Primary resume and unsets all others.
 */
export function setPrimaryResume(id: string): { success: boolean; error?: string } {
  const existing = getResumes()
  const target = existing.find((r) => r.id === id)
  if (!target) {
    return { success: false, error: 'Resume not found.' }
  }

  const next = existing.map((r) => ({
    ...r,
    isPrimary: r.id === id,
    updatedAt: r.id === id ? new Date().toISOString() : r.updatedAt,
  }))

  persistResumes(next)
  return { success: true }
}

/**
 * Renames or updates a resume's display name.
 */
export function renameResume(id: string, newName: string): { success: boolean; error?: string } {
  const trimmed = newName.trim()
  if (!trimmed) {
    return { success: false, error: 'Resume name cannot be empty.' }
  }

  const existing = getResumes()
  const target = existing.find((r) => r.id === id)
  if (!target) {
    return { success: false, error: 'Resume not found.' }
  }

  const next = existing.map((r) => {
    if (r.id !== id) return r
    return {
      ...r,
      name: trimmed,
      updatedAt: new Date().toISOString(),
    }
  })

  persistResumes(next)
  return { success: true }
}

/**
 * Deletes a resume. If the deleted resume was Primary, promotes the first
 * remaining resume to Primary so a primary resume is always available when possible.
 */
export function deleteResume(id: string): void {
  const existing = getResumes()
  const target = existing.find((r) => r.id === id)
  if (!target) return

  const filtered = existing.filter((r) => r.id !== id)

  if (target.isPrimary && filtered.length > 0) {
    filtered[0] = {
      ...filtered[0],
      isPrimary: true,
      updatedAt: new Date().toISOString(),
    }
  }

  persistResumes(filtered)
}

/**
 * Clears all resumes (for test tear-downs).
 */
export function clearAllResumes(): void {
  persistResumes([])
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(APPLICATION_RESUMES_STORAGE_KEY)
  }
}

// ---------------------------------------------------------------------------
// Application -> Resume Associations
// ---------------------------------------------------------------------------

/**
 * Reads all application-to-resume associations.
 */
export function getAllApplicationResumes(): ApplicationResumeMap {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(APPLICATION_RESUMES_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as ApplicationResumeMap) : {}
  } catch {
    return {}
  }
}

/**
 * Gets the resumeId associated with an application.
 */
export function getApplicationResumeId(applicationId: string): string | undefined {
  const map = getAllApplicationResumes()
  return map[applicationId]
}

/**
 * Resolves the full Resume object associated with an application, or null if unlinked/deleted.
 */
export function getApplicationResume(applicationId: string): Resume | null {
  const resumeId = getApplicationResumeId(applicationId)
  if (!resumeId) return null
  const resumes = getResumes()
  return resumes.find((r) => r.id === resumeId) || null
}

/**
 * Associates a resume with an application, or clears the association if resumeId is null/empty.
 */
export function setApplicationResume(applicationId: string, resumeId: string | null): void {
  if (typeof localStorage === 'undefined') return
  try {
    const map = getAllApplicationResumes()
    if (!resumeId) {
      delete map[applicationId]
    } else {
      map[applicationId] = resumeId
    }
    localStorage.setItem(APPLICATION_RESUMES_STORAGE_KEY, JSON.stringify(map))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(RESUMES_EVENT))
    }
  } catch {
    // Graceful fallback
  }
}

/**
 * Subscribes to changes in resume storage.
 */
export function subscribeResumes(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleCustom = () => callback()
  const handleStorage = (e: StorageEvent) => {
    if (e.key === RESUMES_STORAGE_KEY || e.key === APPLICATION_RESUMES_STORAGE_KEY) {
      callback()
    }
  }

  window.addEventListener(RESUMES_EVENT, handleCustom)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(RESUMES_EVENT, handleCustom)
    window.removeEventListener('storage', handleStorage)
  }
}

/**
 * Clears all local resumes and application mappings from localStorage.
 */
export function clearLocalResumes(): void {
  localStorage.removeItem(RESUMES_STORAGE_KEY)
  localStorage.removeItem(APPLICATION_RESUMES_STORAGE_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RESUMES_EVENT))
  }
}
