import type { ApplicationStatus, JobApplication } from '../types/application'

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
  const status: ApplicationStatus = (
    ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'].includes(row.status)
      ? row.status
      : 'Applied'
  ) as ApplicationStatus

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
