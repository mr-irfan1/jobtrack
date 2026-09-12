import type { JobAlert, JobAlertCriteria, JobAlertDraft, AlertFrequency, AlertStatus } from '../types/jobAlert.ts'
import { supabase } from './supabaseClient.ts'
import * as localJobAlertsStore from './jobAlertsStore.ts'
import { generateAlertName, validateAlertDraft, canonicalCriteriaSignature } from './jobAlertsModel.ts'

const JOB_ALERTS_TABLE = 'job_alerts'

interface JobAlertRow {
  id: string
  user_id: string
  name: string
  criteria: unknown
  frequency: string
  status: string
  last_checked_at: string | null
  last_notified_at: string | null
  notified_job_ids: string[]
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

function rowToAlert(row: JobAlertRow): JobAlert {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    criteria: (row.criteria as JobAlertCriteria) || {},
    frequency: (row.frequency as AlertFrequency) || 'daily',
    status: (row.status as AlertStatus) || 'active',
    lastCheckedAt: row.last_checked_at || undefined,
    lastNotifiedAt: row.last_notified_at || undefined,
    notifiedJobIds: row.notified_job_ids || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAlerts(): Promise<JobAlert[]> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localJobAlertsStore.getAllAlerts()
  }

  try {
    const { data, error } = await supabase
      .from(JOB_ALERTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as JobAlertRow[]).map(rowToAlert)
  } catch {
    return localJobAlertsStore.getAllAlerts()
  }
}

export async function getAlertById(id: string): Promise<JobAlert | null> {
  const alerts = await getAlerts()
  return alerts.find((a) => a.id === id) || null
}

export async function saveAlert(
  draft: JobAlertDraft,
): Promise<{ success: boolean; alert?: JobAlert; error?: string }> {
  const validation = validateAlertDraft(draft)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const userId = await getAuthUserId()
  if (!userId) {
    return localJobAlertsStore.saveAlert(draft)
  }

  const existing = await getAlerts()
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

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const name =
    draft.name && draft.name.trim()
      ? draft.name.trim()
      : generateAlertName(draft.criteria)

  try {
    const payload = {
      id,
      user_id: userId,
      name,
      criteria: draft.criteria,
      frequency: draft.frequency || 'daily',
      status: 'active',
      notified_job_ids: [],
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await supabase
      .from(JOB_ALERTS_TABLE)
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error

    const created = rowToAlert(data as JobAlertRow)
    localJobAlertsStore.saveAlert(draft, userId)
    return { success: true, alert: created }
  } catch (err) {
    const localRes = localJobAlertsStore.saveAlert(draft, userId)
    return {
      success: localRes.success,
      alert: localRes.alert,
      error: localRes.error || (err instanceof Error ? err.message : 'Failed to save alert'),
    }
  }
}

export async function updateAlert(
  alert: JobAlert,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId()
  const updates = { name: alert.name, criteria: alert.criteria, frequency: alert.frequency }
  if (!userId) {
    const res = localJobAlertsStore.updateAlert(alert.id, updates)
    return { success: res.success, error: res.error }
  }

  try {
    const { error } = await supabase
      .from(JOB_ALERTS_TABLE)
      .update({
        name: alert.name,
        criteria: alert.criteria,
        frequency: alert.frequency,
        status: alert.status,
        last_checked_at: alert.lastCheckedAt || null,
        last_notified_at: alert.lastNotifiedAt || null,
        notified_job_ids: alert.notifiedJobIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alert.id)
      .eq('user_id', userId)

    if (error) throw error

    localJobAlertsStore.updateAlert(alert.id, updates, userId)
    return { success: true }
  } catch (err) {
    localJobAlertsStore.updateAlert(alert.id, updates, userId)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update alert' }
  }
}

export async function toggleAlertStatus(id: string): Promise<JobAlert | null> {
  const alert = await getAlertById(id)
  if (!alert) return null

  const nextStatus: AlertStatus = alert.status === 'active' ? 'paused' : 'active'
  const updated: JobAlert = { ...alert, status: nextStatus, updatedAt: new Date().toISOString() }

  await updateAlert(updated)
  return updated
}

export async function deleteAlert(id: string): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) {
    localJobAlertsStore.deleteAlert(id)
    return
  }

  try {
    await supabase
      .from(JOB_ALERTS_TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    localJobAlertsStore.deleteAlert(id)
  } catch {
    localJobAlertsStore.deleteAlert(id)
  }
}
