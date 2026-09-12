import type { JobListing } from '../types/jobFeed'

/**
 * Client-side store for Saved Jobs.
 *
 * ARCHITECTURAL BOUNDARY:
 * Per Step 1 and Step 2 constraints, a "Saved Job" is strictly distinct from an
 * active "JobApplication". Saving a job bookmarks it here; it does NOT write
 * to the public.applications database table and does NOT create a phantom application.
 *
 * Persists a safe snapshot of the JobListing along with the saved timestamp
 * so that even if the remote external feed rotates, saved jobs remain completely
 * accessible without missing data or broken UI.
 *
 * Dispatches synchronization events so /jobs and /saved-jobs maintain ONE
 * single source of truth at all times.
 */

const STORAGE_KEY_IDS = 'jobtrack_saved_job_ids'
const STORAGE_KEY_JOBS = 'jobtrack_saved_jobs_data'
export const SAVED_JOBS_EVENT = 'jobtrack:saved_jobs_changed'

export interface SavedJobItem {
  id: string
  savedAt: string
  job: JobListing
}

export function getSavedJobItems(): SavedJobItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is SavedJobItem =>
        Boolean(item && typeof item === 'object' && typeof item.id === 'string' && item.job),
    )
  } catch {
    return []
  }
}

export function getSavedJobIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_IDS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === 'string')
      }
    }
  } catch {
    // Fall back to items below
  }
  // Also cross-reference with saved job items
  const items = getSavedJobItems()
  return items.map((i) => i.id)
}

function dispatchChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SAVED_JOBS_EVENT))
  }
}

export function saveJob(job: JobListing): SavedJobItem[] {
  const currentItems = getSavedJobItems()
  const existingIndex = currentItems.findIndex((item) => item.id === job.id)

  let nextItems: SavedJobItem[]
  if (existingIndex >= 0) {
    // Already saved; update snapshot with latest data
    nextItems = currentItems.map((item) =>
      item.id === job.id ? { ...item, job } : item,
    )
  } else {
    const newItem: SavedJobItem = {
      id: job.id,
      savedAt: new Date().toISOString(),
      job,
    }
    nextItems = [newItem, ...currentItems]
  }

  try {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(nextItems))
    // Keep IDs list synchronized
    const idSet = Array.from(new Set(nextItems.map((i) => i.id)))
    localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(idSet))
  } catch {
    // Ignore storage write errors (e.g. quota)
  }

  dispatchChange()
  return nextItems
}

export function saveJobId(id: string): string[] {
  const currentIds = getSavedJobIds()
  if (!currentIds.includes(id)) {
    const nextIds = [...currentIds, id]
    try {
      localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(nextIds))
    } catch {
      // Ignore quota errors
    }
    dispatchChange()
    return nextIds
  }
  return currentIds
}

export function removeSavedJob(id: string): SavedJobItem[] {
  const currentItems = getSavedJobItems()
  const nextItems = currentItems.filter((item) => item.id !== id)
  const currentIds = getSavedJobIds()
  const nextIds = currentIds.filter((item) => item !== id)

  try {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(nextItems))
    localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(nextIds))
  } catch {
    // Ignore quota errors
  }

  dispatchChange()
  return nextItems
}

export function removeSavedJobId(id: string): string[] {
  removeSavedJob(id)
  return getSavedJobIds()
}

export function isJobIdSaved(id: string): boolean {
  return getSavedJobIds().includes(id)
}

export function clearAllSavedJobs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_JOBS)
    localStorage.removeItem(STORAGE_KEY_IDS)
  } catch {
    // Ignore storage errors
  }
  dispatchChange()
}

export function subscribeSavedJobs(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  function handleCustom() {
    callback()
  }

  function handleStorage(e: StorageEvent) {
    if (e.key === STORAGE_KEY_JOBS || e.key === STORAGE_KEY_IDS) {
      callback()
    }
  }

  window.addEventListener(SAVED_JOBS_EVENT, handleCustom)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(SAVED_JOBS_EVENT, handleCustom)
    window.removeEventListener('storage', handleStorage)
  }
}
