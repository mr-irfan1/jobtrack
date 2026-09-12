import type { JobApplication } from '../types/application'
import { supabase } from '../lib/supabase'
import {
  getCachedApplications,
  saveCachedApplications,
} from './mobileOfflineCache'

export interface ApplicationRow {
  id: string
  user_id: string
  company: string
  job_title: string
  location: string | null
  job_url: string | null
  application_date: string
  status: string
  notes: string | null
  interview_date?: string | null
  interview_time?: string | null
  interview_type?: string | null
  meeting_link?: string | null
  created_at?: string
  updated_at?: string
}

export function rowToApplication(row: ApplicationRow): JobApplication {
  const status: JobApplication['status'] = (
    ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'].includes(row.status)
      ? row.status
      : 'Applied'
  ) as JobApplication['status']

  const app: JobApplication = {
    id: row.id,
    company: row.company,
    jobTitle: row.job_title,
    location: row.location ?? '',
    jobUrl: row.job_url ?? '',
    applicationDate: row.application_date,
    status,
    notes: row.notes ?? '',
  }

  if (row.interview_date) app.interviewDate = row.interview_date
  if (row.interview_time) app.interviewTime = row.interview_time.slice(0, 5)
  if (row.interview_type) app.interviewType = row.interview_type
  if (row.meeting_link) app.meetingLink = row.meeting_link
  if (row.created_at) app.createdAt = row.created_at.slice(0, 10)
  if (row.updated_at) app.updatedAt = row.updated_at.slice(0, 10)

  return app
}

export function applicationToInsertRow(
  application: JobApplication,
  userId: string,
): ApplicationRow {
  return {
    id: application.id,
    user_id: userId,
    company: application.company,
    job_title: application.jobTitle,
    location: application.location || null,
    job_url: application.jobUrl || null,
    application_date: application.applicationDate,
    status: application.status,
    notes: application.notes || null,
    interview_date: application.interviewDate || null,
    interview_time: application.interviewTime || null,
    interview_type: application.interviewType || null,
    meeting_link: application.meetingLink || null,
  }
}

const TABLE = 'applications'

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const userId = data.session?.user.id
  if (!userId) throw new Error('No authenticated user')
  return userId
}

export async function getApplications(): Promise<JobApplication[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    const rows = (data ?? []) as ApplicationRow[]
    const apps = rows.map(rowToApplication)

    // Save to offline cache for offline resilience
    await saveCachedApplications(apps)
    return apps
  } catch (err) {
    // Offline fallback: try reading from local cache
    const cached = await getCachedApplications()
    if (cached && cached.length >= 0) {
      return cached
    }
    throw err
  }
}

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

export async function updateApplication(
  application: JobApplication,
): Promise<JobApplication> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      company: application.company,
      job_title: application.jobTitle,
      location: application.location || null,
      job_url: application.jobUrl || null,
      application_date: application.applicationDate,
      status: application.status,
      notes: application.notes || null,
      interview_date: application.interviewDate || null,
      interview_time: application.interviewTime || null,
      interview_type: application.interviewType || null,
      meeting_link: application.meetingLink || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', application.id)
    .select('*')
    .single()

  if (error) throw error
  return rowToApplication(data as ApplicationRow)
}

export async function deleteApplication(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
