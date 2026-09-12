import type { FollowUp, FollowUpDraft, FollowUpStatus } from '../types/followUp'

export const FOLLOW_UPS_STORAGE_KEY = 'jobtrack_follow_ups'
export const FOLLOW_UPS_EVENT = 'jobtrack_follow_ups_updated'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const ISO_TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Validates a single follow-up item against the schema.
 * Rejects null, non-objects, invalid dates, and unsupported statuses.
 */
function isValidFollowUp(item: unknown): item is FollowUp {
  if (!item || typeof item !== 'object') return false
  const candidate = item as Partial<FollowUp>
  if (typeof candidate.id !== 'string' || !candidate.id) return false
  if (typeof candidate.applicationId !== 'string' || !candidate.applicationId) return false
  if (typeof candidate.scheduledDate !== 'string' || !ISO_DATE_REGEX.test(candidate.scheduledDate)) return false
  if (candidate.scheduledTime && (typeof candidate.scheduledTime !== 'string' || !ISO_TIME_REGEX.test(candidate.scheduledTime))) {
    return false
  }
  const validStatuses: FollowUpStatus[] = ['pending', 'completed', 'cancelled']
  if (!candidate.status || !validStatuses.includes(candidate.status)) return false
  if (typeof candidate.createdAt !== 'string') return false
  return true
}

/**
 * Reads all stored follow-ups defensively.
 * Handles storage failure or corrupted JSON by degrading to an empty array.
 */
export function getFollowUps(): FollowUp[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(FOLLOW_UPS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidFollowUp)
  } catch {
    return []
  }
}

/**
 * Writes follow-ups to localStorage and notifies active listeners.
 */
function persistFollowUps(followUps: FollowUp[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(FOLLOW_UPS_STORAGE_KEY, JSON.stringify(followUps))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FOLLOW_UPS_EVENT))
    }
  } catch {
    // Gracefully handle quota exceeded or unavailable storage
  }
}

/**
 * Generates the standardized scheduledFor string.
 */
export function computeScheduledFor(date: string, time?: string): string {
  return `${date}${time ? `T${time}:00` : 'T09:00:00'}`
}

export interface AddFollowUpResult {
  success: boolean
  error?: string
  followUp?: FollowUp
}

/**
 * Adds a new follow-up with validation and duplicate prevention.
 * Prevents adding duplicate pending follow-ups for the same application at the same date/time.
 */
export function addFollowUp(draft: FollowUpDraft): AddFollowUpResult {
  if (!draft.applicationId?.trim()) {
    return { success: false, error: 'Application ID is required.' }
  }
  if (!draft.scheduledDate || !ISO_DATE_REGEX.test(draft.scheduledDate)) {
    return { success: false, error: 'A valid date (YYYY-MM-DD) is required.' }
  }
  if (draft.scheduledTime && !ISO_TIME_REGEX.test(draft.scheduledTime)) {
    return { success: false, error: 'Time must be in 24-hour HH:mm format.' }
  }

  const existingList = getFollowUps()

  // Duplicate check: Same application + pending status + same scheduled date + same scheduled time
  const normalizedTime = draft.scheduledTime || ''
  const isDuplicate = existingList.some(
    (f) =>
      f.status === 'pending' &&
      f.applicationId === draft.applicationId &&
      f.scheduledDate === draft.scheduledDate &&
      (f.scheduledTime || '') === normalizedTime,
  )

  if (isDuplicate) {
    return {
      success: false,
      error: 'A pending follow-up is already scheduled for this application at this time.',
    }
  }

  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `fu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const newFollowUp: FollowUp = {
    id,
    applicationId: draft.applicationId,
    scheduledDate: draft.scheduledDate,
    scheduledTime: draft.scheduledTime,
    scheduledFor: computeScheduledFor(draft.scheduledDate, draft.scheduledTime),
    note: draft.note?.trim() || undefined,
    status: draft.status || 'pending',
    createdAt: new Date().toISOString(),
  }

  existingList.push(newFollowUp)
  persistFollowUps(existingList)

  return { success: true, followUp: newFollowUp }
}

/**
 * Updates an existing follow-up.
 */
export function updateFollowUp(updated: FollowUp): void {
  const list = getFollowUps()
  const next = list.map((item) => (item.id === updated.id ? updated : item))
  persistFollowUps(next)
}

/**
 * Reschedules a follow-up and resets its status to pending.
 */
export function rescheduleFollowUp(
  id: string,
  newDate: string,
  newTime?: string,
  note?: string,
): { success: boolean; error?: string } {
  if (!ISO_DATE_REGEX.test(newDate)) {
    return { success: false, error: 'A valid date is required.' }
  }
  if (newTime && !ISO_TIME_REGEX.test(newTime)) {
    return { success: false, error: 'Time must be in HH:mm format.' }
  }

  const list = getFollowUps()
  const target = list.find((item) => item.id === id)
  if (!target) {
    return { success: false, error: 'Follow-up not found.' }
  }

  // Duplicate check excluding this record
  const normalizedTime = newTime || ''
  const isDuplicate = list.some(
    (f) =>
      f.id !== id &&
      f.status === 'pending' &&
      f.applicationId === target.applicationId &&
      f.scheduledDate === newDate &&
      (f.scheduledTime || '') === normalizedTime,
  )

  if (isDuplicate) {
    return {
      success: false,
      error: 'Another pending follow-up is already scheduled for this application at this time.',
    }
  }

  const next = list.map((item) => {
    if (item.id !== id) return item
    return {
      ...item,
      scheduledDate: newDate,
      scheduledTime: newTime,
      scheduledFor: computeScheduledFor(newDate, newTime),
      note: note !== undefined ? note.trim() || undefined : item.note,
      status: 'pending' as const,
      completedAt: undefined,
    }
  })

  persistFollowUps(next)
  return { success: true }
}

/**
 * Marks a follow-up as completed and records completion timestamp.
 */
export function completeFollowUp(id: string): void {
  const list = getFollowUps()
  const next = list.map((item) => {
    if (item.id !== id) return item
    return {
      ...item,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
    }
  })
  persistFollowUps(next)
}

/**
 * Cancels a follow-up.
 */
export function cancelFollowUp(id: string): void {
  const list = getFollowUps()
  const next = list.map((item) => {
    if (item.id !== id) return item
    return {
      ...item,
      status: 'cancelled' as const,
    }
  })
  persistFollowUps(next)
}

/**
 * Deletes a follow-up completely.
 */
export function deleteFollowUp(id: string): void {
  const list = getFollowUps()
  const next = list.filter((item) => item.id !== id)
  persistFollowUps(next)
}

/**
 * Clears all follow-ups (useful in tests or account resets).
 */
export function clearAllFollowUps(): void {
  persistFollowUps([])
}

/**
 * Subscribes to changes in follow-up storage.
 */
export function subscribeFollowUps(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleCustom = () => callback()
  const handleStorage = (e: StorageEvent) => {
    if (e.key === FOLLOW_UPS_STORAGE_KEY) {
      callback()
    }
  }

  window.addEventListener(FOLLOW_UPS_EVENT, handleCustom)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(FOLLOW_UPS_EVENT, handleCustom)
    window.removeEventListener('storage', handleStorage)
  }
}
