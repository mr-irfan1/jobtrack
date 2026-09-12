import type { FollowUp, FollowUpDraft, FollowUpStatus } from '../types/followUp.ts'
import type { AddFollowUpResult } from './followUpStore.ts'
import { supabase } from './supabaseClient.ts'
import * as localFollowUpStore from './followUpStore.ts'

const FOLLOW_UPS_TABLE = 'follow_ups'

interface FollowUpRow {
  id: string
  user_id: string
  application_id: string
  scheduled_date: string
  scheduled_time: string | null
  scheduled_for: string
  note: string | null
  status: string
  completed_at: string | null
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

function rowToFollowUp(row: FollowUpRow): FollowUp {
  return {
    id: row.id,
    applicationId: row.application_id,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time || undefined,
    scheduledFor: row.scheduled_for,
    note: row.note || undefined,
    status: row.status as FollowUpStatus,
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
  }
}

export async function getFollowUps(): Promise<FollowUp[]> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localFollowUpStore.getFollowUps()
  }

  try {
    const { data, error } = await supabase
      .from(FOLLOW_UPS_TABLE)
      .select('*')
      .order('scheduled_for', { ascending: true })

    if (error) throw error
    return ((data ?? []) as FollowUpRow[]).map(rowToFollowUp)
  } catch {
    return localFollowUpStore.getFollowUps()
  }
}

export async function addFollowUp(draft: FollowUpDraft): Promise<AddFollowUpResult> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localFollowUpStore.addFollowUp(draft)
  }

  const id = crypto.randomUUID()
  const scheduledFor = localFollowUpStore.computeScheduledFor(draft.scheduledDate, draft.scheduledTime)

  try {
    const insertPayload = {
      id,
      user_id: userId,
      application_id: draft.applicationId,
      scheduled_date: draft.scheduledDate,
      scheduled_time: draft.scheduledTime || null,
      scheduled_for: scheduledFor,
      note: draft.note?.trim() || null,
      status: draft.status || 'pending',
    }

    const { data, error } = await supabase
      .from(FOLLOW_UPS_TABLE)
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) throw error

    const created = rowToFollowUp(data as FollowUpRow)
    localFollowUpStore.addFollowUp({ ...draft })
    return { success: true, followUp: created }
  } catch (err) {
    const localRes = localFollowUpStore.addFollowUp(draft)
    return {
      success: localRes.success,
      followUp: localRes.followUp,
      error: localRes.error || (err instanceof Error ? err.message : 'Failed to add follow-up'),
    }
  }
}

export async function updateFollowUp(updated: FollowUp): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) {
    localFollowUpStore.updateFollowUp(updated)
    return
  }

  try {
    await supabase
      .from(FOLLOW_UPS_TABLE)
      .update({
        scheduled_date: updated.scheduledDate,
        scheduled_time: updated.scheduledTime || null,
        scheduled_for: updated.scheduledFor,
        note: updated.note || null,
        status: updated.status,
        completed_at: updated.completedAt || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updated.id)
      .eq('user_id', userId)

    localFollowUpStore.updateFollowUp(updated)
  } catch {
    localFollowUpStore.updateFollowUp(updated)
  }
}

export async function rescheduleFollowUp(
  id: string,
  newDate: string,
  newTime?: string,
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localFollowUpStore.rescheduleFollowUp(id, newDate, newTime, note)
  }

  const scheduledFor = localFollowUpStore.computeScheduledFor(newDate, newTime)

  try {
    const { error } = await supabase
      .from(FOLLOW_UPS_TABLE)
      .update({
        scheduled_date: newDate,
        scheduled_time: newTime || null,
        scheduled_for: scheduledFor,
        note: note !== undefined ? note.trim() || null : undefined,
        status: 'pending',
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    localFollowUpStore.rescheduleFollowUp(id, newDate, newTime, note)
    return { success: true }
  } catch (err) {
    localFollowUpStore.rescheduleFollowUp(id, newDate, newTime, note)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to reschedule follow-up' }
  }
}

export async function completeFollowUp(id: string): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) {
    localFollowUpStore.completeFollowUp(id)
    return
  }

  try {
    await supabase
      .from(FOLLOW_UPS_TABLE)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)

    localFollowUpStore.completeFollowUp(id)
  } catch {
    localFollowUpStore.completeFollowUp(id)
  }
}

export async function cancelFollowUp(id: string): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) {
    localFollowUpStore.cancelFollowUp(id)
    return
  }

  try {
    await supabase
      .from(FOLLOW_UPS_TABLE)
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)

    localFollowUpStore.cancelFollowUp(id)
  } catch {
    localFollowUpStore.cancelFollowUp(id)
  }
}

export async function deleteFollowUp(id: string): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) {
    localFollowUpStore.deleteFollowUp(id)
    return
  }

  try {
    await supabase
      .from(FOLLOW_UPS_TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    localFollowUpStore.deleteFollowUp(id)
  } catch {
    localFollowUpStore.deleteFollowUp(id)
  }
}
