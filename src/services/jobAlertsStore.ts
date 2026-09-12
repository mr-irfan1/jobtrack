import type { JobAlert, JobAlertDraft } from '../types/jobAlert.ts'
import {
  canonicalCriteriaSignature,
  generateAlertName,
  validateAlertDraft,
} from './jobAlertsModel.ts'

export const JOB_ALERTS_STORAGE_KEY = 'jobtrack_job_alerts'
export const JOB_ALERTS_EVENT = 'jobtrack:job_alerts_updated'

const MAX_NOTIFIED_JOBS_PER_ALERT = 200

function isValidAlert(item: unknown): item is JobAlert {
  if (!item || typeof item !== 'object') return false
  const cand = item as Partial<JobAlert>
  if (typeof cand.id !== 'string' || !cand.id) return false
  if (typeof cand.name !== 'string' || !cand.name) return false
  if (!cand.criteria || typeof cand.criteria !== 'object') return false
  if (cand.frequency !== 'daily' && cand.frequency !== 'weekly') return false
  if (cand.status !== 'active' && cand.status !== 'paused') return false
  if (typeof cand.createdAt !== 'string') return false
  if (typeof cand.updatedAt !== 'string') return false
  if (!Array.isArray(cand.notifiedJobIds)) return false
  return true
}

export function getAllAlerts(): JobAlert[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(JOB_ALERTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidAlert)
  } catch {
    return []
  }
}

export function getAlerts(userId?: string): JobAlert[] {
  const all = getAllAlerts()
  if (!userId) return all
  return all.filter((a) => !a.userId || a.userId === userId)
}

export function getAlertById(id: string, userId?: string): JobAlert | null {
  const alerts = getAlerts(userId)
  return alerts.find((a) => a.id === id) || null
}

function persistAlerts(alerts: JobAlert[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(JOB_ALERTS_STORAGE_KEY, JSON.stringify(alerts))
    dispatchChange()
  } catch {
    // Defensively handle storage quota or privacy mode errors
  }
}

function dispatchChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(JOB_ALERTS_EVENT))
  }
}

export function subscribeJobAlerts(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(JOB_ALERTS_EVENT, callback)
  return () => {
    window.removeEventListener(JOB_ALERTS_EVENT, callback)
  }
}

export function saveAlert(
  draft: JobAlertDraft,
  userId?: string,
): { success: boolean; alert?: JobAlert; error?: string } {
  const validation = validateAlertDraft(draft)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const existing = getAlerts(userId)
  const targetSig = canonicalCriteriaSignature(draft.criteria)

  const duplicate = existing.find(
    (a) => canonicalCriteriaSignature(a.criteria) === targetSig,
  )
  if (duplicate) {
    return {
      success: false,
      error: 'An alert with these criteria already exists.',
    }
  }

  const now = new Date().toISOString()
  const name =
    draft.name && draft.name.trim()
      ? draft.name.trim()
      : generateAlertName(draft.criteria)

  const newAlert: JobAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    name,
    criteria: { ...draft.criteria },
    frequency: draft.frequency || 'daily',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    notifiedJobIds: [],
  }

  const allAlerts = getAllAlerts()
  persistAlerts([newAlert, ...allAlerts])

  return { success: true, alert: newAlert }
}

export function updateAlert(
  id: string,
  updates: Partial<JobAlertDraft>,
  userId?: string,
): { success: boolean; alert?: JobAlert; error?: string } {
  const allAlerts = getAllAlerts()
  const targetIndex = allAlerts.findIndex((a) => a.id === id)

  if (targetIndex === -1) {
    return { success: false, error: 'Alert not found.' }
  }

  const target = allAlerts[targetIndex]
  if (userId && target.userId && target.userId !== userId) {
    return { success: false, error: 'Unauthorized to update this alert.' }
  }

  const mergedCriteria = updates.criteria
    ? { ...updates.criteria }
    : target.criteria

  const validation = validateAlertDraft({
    name: updates.name ?? target.name,
    criteria: mergedCriteria,
    frequency: updates.frequency ?? target.frequency,
  })
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  // Duplicate check excluding self
  const targetSig = canonicalCriteriaSignature(mergedCriteria)
  const duplicate = allAlerts.find(
    (a) =>
      a.id !== id &&
      (!userId || !a.userId || a.userId === userId) &&
      canonicalCriteriaSignature(a.criteria) === targetSig,
  )
  if (duplicate) {
    return {
      success: false,
      error: 'Another alert with these criteria already exists.',
    }
  }

  const now = new Date().toISOString()
  const nextName =
    updates.name !== undefined
      ? updates.name.trim() || generateAlertName(mergedCriteria)
      : target.name

  const updatedAlert: JobAlert = {
    ...target,
    name: nextName,
    criteria: mergedCriteria,
    frequency: updates.frequency || target.frequency,
    updatedAt: now,
  }

  allAlerts[targetIndex] = updatedAlert
  persistAlerts(allAlerts)

  return { success: true, alert: updatedAlert }
}

export function toggleAlertStatus(
  id: string,
  userId?: string,
): JobAlert | null {
  const allAlerts = getAllAlerts()
  const targetIndex = allAlerts.findIndex((a) => a.id === id)
  if (targetIndex === -1) return null

  const target = allAlerts[targetIndex]
  if (userId && target.userId && target.userId !== userId) return null

  const nextStatus = target.status === 'active' ? 'paused' : 'active'
  const updatedAlert: JobAlert = {
    ...target,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  }

  allAlerts[targetIndex] = updatedAlert
  persistAlerts(allAlerts)
  return updatedAlert
}

export function deleteAlert(id: string, userId?: string): boolean {
  const allAlerts = getAllAlerts()
  const targetIndex = allAlerts.findIndex((a) => a.id === id)
  if (targetIndex === -1) return false

  const target = allAlerts[targetIndex]
  if (userId && target.userId && target.userId !== userId) return false

  const nextAlerts = allAlerts.filter((a) => a.id !== id)
  persistAlerts(nextAlerts)
  return true
}

export function recordAlertNotification(
  alertId: string,
  newNotifiedJobIds: string[],
): void {
  if (newNotifiedJobIds.length === 0) return

  const allAlerts = getAllAlerts()
  const targetIndex = allAlerts.findIndex((a) => a.id === alertId)
  if (targetIndex === -1) return

  const target = allAlerts[targetIndex]
  const now = new Date().toISOString()

  const combinedSet = new Set([...target.notifiedJobIds, ...newNotifiedJobIds])
  // Cap history to avoid unbounded storage
  const cappedList = Array.from(combinedSet).slice(-MAX_NOTIFIED_JOBS_PER_ALERT)

  allAlerts[targetIndex] = {
    ...target,
    notifiedJobIds: cappedList,
    lastCheckedAt: now,
    lastNotifiedAt: now,
  }

  persistAlerts(allAlerts)
}

export function clearAllAlerts(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(JOB_ALERTS_STORAGE_KEY)
    dispatchChange()
  } catch {
    // Fail silently
  }
}
