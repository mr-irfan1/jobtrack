import type { JobApplication } from '../types/application'
import { supabase } from './supabaseClient'
import type { ApplicationRow } from './applicationRowMapping'
import {
  applicationToInsertRow,
  applicationToUpdatePayload,
  rowToApplication,
} from './applicationRowMapping'

/**
 * Supabase-backed data access for job applications. This is the async
 * counterpart to applicationStorageService (localStorage): it exposes the same
 * four operations but returns Promises and persists to the public.applications
 * table under the signed-in user.
 *
 * Boundaries: this module talks to Supabase and delegates all row<->domain
 * translation to the pure applicationRowMapping. It performs no React work and
 * throws (rejects) on failure so the calling layer can decide on user-facing
 * messaging — mirroring how the localStorage service and its ViewModel already
 * split responsibilities. It is not yet wired into any Model/ViewModel; the
 * localStorage path remains the app's live storage.
 *
 * Ownership: row-level security (verified in Step 8.4.2) scopes every read and
 * write to auth.uid() = user_id, so reads need no explicit user filter and
 * update/delete cannot touch another user's row. Inserts must still stamp
 * user_id because that column has no default.
 */

/** The table backing job applications. */
const TABLE = 'applications'

/**
 * Resolve the signed-in user's id from the locally-cached session (no network
 * round trip). Throws when there is no active session, since an insert cannot
 * satisfy the RLS INSERT policy without it.
 */
async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const userId = data.session?.user.id
  if (!userId) throw new Error('No authenticated user')
  return userId
}

/**
 * Fetch the signed-in user's applications, mapped to the domain model. RLS
 * scopes the result to the owner; ordering by created_at ascending mirrors the
 * insertion order the localStorage service preserves.
 */
export async function getApplications(): Promise<JobApplication[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as ApplicationRow[]
  return rows.map(rowToApplication)
}

/**
 * Insert a new application for the signed-in user and return the stored row
 * mapped back to the domain model. The id is the client-minted UUID already on
 * the application (mirroring the localStorage/factory flow); the DB fills
 * created_at.
 */
export async function addApplication(
  application: JobApplication,
): Promise<JobApplication> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from(TABLE)
    .insert(applicationToInsertRow(application, userId))
    .select('*')
    .single()
  if (error) throw error
  return rowToApplication(data as ApplicationRow)
}

/**
 * Update an existing application (matched by id; RLS ensures only the owner's
 * row is affected) and return the stored row mapped back. Stamps updated_at
 * because the schema intentionally has no trigger for it.
 */
export async function updateApplication(
  application: JobApplication,
): Promise<JobApplication> {
  const payload = {
    ...applicationToUpdatePayload(application),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', application.id)
    .select('*')
    .single()
  if (error) throw error
  return rowToApplication(data as ApplicationRow)
}

/**
 * Delete an application by id. RLS ensures a user can only delete their own row.
 */
export async function deleteApplication(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
