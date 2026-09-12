import type { JobApplication } from '../types/application'
import { applicationToInsertRow, rowToApplication, type ApplicationRow } from './applicationRowMapping'
import { supabase } from './supabaseNativeClient'

const TABLE = 'applications'

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const userId = data.session?.user.id
  if (!userId) throw new Error('No authenticated user')
  return userId
}

export async function getApplications(): Promise<JobApplication[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as ApplicationRow[]
  return rows.map(rowToApplication)
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
