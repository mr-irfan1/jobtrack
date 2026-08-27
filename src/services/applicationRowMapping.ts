import type { ApplicationStatus, JobApplication } from '../types/application'

/**
 * Pure, framework-free mapping between the app's JobApplication domain model
 * (camelCase, optional interview fields) and a row of the public.applications
 * table (snake_case, nullable interview_* columns). This module performs no I/O
 * and imports only types, so it stays easy to unit-test in isolation.
 *
 * Field mapping (domain -> column): id, company, jobTitle -> job_title,
 * location, jobUrl -> job_url, applicationDate -> application_date, status,
 * notes, interviewDate -> interview_date, interviewTime -> interview_time,
 * interviewType -> interview_type, meetingLink -> meeting_link. user_id and the
 * created_at/updated_at timestamps are persistence concerns, not part of the
 * domain model.
 */

/**
 * Shape of a public.applications row as returned by Supabase, matching the live
 * schema verified in Step 8.4.2: the text columns are NOT NULL, the four
 * interview_* columns and updated_at are nullable, and Postgres date/time values
 * arrive as strings ('YYYY-MM-DD' for date, 'HH:MM:SS' for time).
 */
export interface ApplicationRow {
  id: string
  user_id: string
  company: string
  job_title: string
  location: string
  job_url: string
  application_date: string
  status: string
  notes: string
  interview_date: string | null
  interview_time: string | null
  interview_type: string | null
  meeting_link: string | null
  created_at: string
  updated_at: string | null
}

/**
 * Columns supplied when inserting an application. id and user_id are set by the
 * app (client-minted UUID + owner); created_at/updated_at are left to the DB.
 */
export type ApplicationInsertRow = Omit<ApplicationRow, 'created_at' | 'updated_at'>

/**
 * Mutable columns for an update. Ownership (id, user_id) is never reassigned and
 * the timestamps are DB-managed, so all three are excluded here.
 */
export type ApplicationUpdatePayload = Omit<ApplicationInsertRow, 'id' | 'user_id'>

/**
 * Normalize a Postgres `time` value ('HH:MM:SS') to the 'HH:MM' form the app
 * uses — its <input type="time"> only ever produces hours and minutes. Returns
 * undefined for a null/empty value so it maps to an absent optional field.
 */
function toInputTime(value: string | null): string | undefined {
  if (!value) return undefined
  return value.slice(0, 5)
}

/**
 * Map a database row to the JobApplication domain model. snake_case -> camelCase;
 * nullable columns collapse to absent optional fields (null -> omitted, matching
 * how buildApplication leaves out interview fields when a draft has none); and
 * interview_time is trimmed to 'HH:MM'. status is trusted — the DB CHECK
 * constraint guarantees one of the five ApplicationStatus values.
 */
export function rowToApplication(row: ApplicationRow): JobApplication {
  const application: JobApplication = {
    id: row.id,
    company: row.company,
    jobTitle: row.job_title,
    location: row.location,
    jobUrl: row.job_url,
    applicationDate: row.application_date,
    status: row.status as ApplicationStatus,
    notes: row.notes,
  }
  if (row.interview_date) application.interviewDate = row.interview_date
  const interviewTime = toInputTime(row.interview_time)
  if (interviewTime) application.interviewTime = interviewTime
  if (row.interview_type) application.interviewType = row.interview_type
  if (row.meeting_link) application.meetingLink = row.meeting_link
  return application
}

/**
 * Map the mutable, app-owned columns of a JobApplication to snake_case for an
 * update. Absent optional fields become explicit null so an update can clear a
 * previously-set interview field. Excludes id, user_id and the DB timestamps.
 */
export function applicationToUpdatePayload(
  application: JobApplication,
): ApplicationUpdatePayload {
  return {
    company: application.company,
    job_title: application.jobTitle,
    location: application.location,
    job_url: application.jobUrl,
    application_date: application.applicationDate,
    status: application.status,
    notes: application.notes,
    interview_date: application.interviewDate ?? null,
    interview_time: application.interviewTime ?? null,
    interview_type: application.interviewType ?? null,
    meeting_link: application.meetingLink ?? null,
  }
}

/**
 * Map a JobApplication (already carrying its client-minted UUID id) plus its
 * owner to an insert row: the mutable columns stamped with id and user_id. The
 * DB fills created_at/updated_at.
 */
export function applicationToInsertRow(
  application: JobApplication,
  userId: string,
): ApplicationInsertRow {
  return {
    id: application.id,
    user_id: userId,
    ...applicationToUpdatePayload(application),
  }
}
