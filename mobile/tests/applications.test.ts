import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../types/application'

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

test('Applications: rowToApplication correctly maps database fields', () => {
  const row: ApplicationRow = {
    id: 'app-123',
    user_id: 'user-456',
    company: 'Stripe',
    job_title: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    job_url: 'https://stripe.com/jobs/123',
    application_date: '2026-08-25',
    status: 'Interview',
    notes: 'Completed technical screen',
    interview_date: '2026-08-30',
    interview_time: '14:30:00',
    interview_type: 'System Design',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    created_at: '2026-08-25T10:00:00Z',
    updated_at: '2026-08-28T12:00:00Z',
  }

  const app = rowToApplication(row)

  assert.equal(app.id, 'app-123')
  assert.equal(app.company, 'Stripe')
  assert.equal(app.jobTitle, 'Senior Software Engineer')
  assert.equal(app.location, 'San Francisco, CA')
  assert.equal(app.jobUrl, 'https://stripe.com/jobs/123')
  assert.equal(app.applicationDate, '2026-08-25')
  assert.equal(app.status, 'Interview')
  assert.equal(app.notes, 'Completed technical screen')
  assert.equal(app.interviewDate, '2026-08-30')
  assert.equal(app.interviewTime, '14:30')
  assert.equal(app.interviewType, 'System Design')
  assert.equal(app.meetingLink, 'https://meet.google.com/abc-defg-hij')
  assert.equal(app.createdAt, '2026-08-25')
  assert.equal(app.updatedAt, '2026-08-28')
})

test('Applications: applicationToInsertRow creates valid DB payload', () => {
  const app: JobApplication = {
    id: 'app-999',
    company: 'Google',
    jobTitle: 'Staff Engineer',
    location: 'Mountain View, CA',
    jobUrl: 'https://google.com/careers',
    applicationDate: '2026-08-28',
    status: 'Applied',
    notes: 'Referred by teammate',
  }

  const row = applicationToInsertRow(app, 'user-001')

  assert.equal(row.id, 'app-999')
  assert.equal(row.user_id, 'user-001')
  assert.equal(row.company, 'Google')
  assert.equal(row.job_title, 'Staff Engineer')
  assert.equal(row.location, 'Mountain View, CA')
  assert.equal(row.status, 'Applied')
  assert.equal(row.interview_date, null)
})

test('Applications: search and status filter matching', () => {
  const apps: JobApplication[] = [
    {
      id: '1',
      company: 'Amazon',
      jobTitle: 'Backend Dev',
      location: 'Seattle',
      jobUrl: 'https://amazon.jobs/1',
      applicationDate: '2026-08-20',
      status: 'Applied',
      notes: '',
    },
    {
      id: '2',
      company: 'Apple',
      jobTitle: 'iOS Engineer',
      location: 'Cupertino',
      jobUrl: 'https://apple.com/jobs/2',
      applicationDate: '2026-08-22',
      status: 'Interview',
      notes: '',
    },
    {
      id: '3',
      company: 'Meta',
      jobTitle: 'React Native Dev',
      location: 'Menlo Park',
      jobUrl: 'https://meta.com/jobs/3',
      applicationDate: '2026-08-24',
      status: 'Offer',
      notes: '',
    },
  ]

  // Status Filter
  const interviewOnly = apps.filter((a) => a.status === 'Interview')
  assert.equal(interviewOnly.length, 1)
  assert.equal(interviewOnly[0].company, 'Apple')

  // Search Filter
  const searchMatch = apps.filter(
    (a) =>
      a.company.toLowerCase().includes('meta') ||
      a.jobTitle.toLowerCase().includes('meta'),
  )
  assert.equal(searchMatch.length, 1)
  assert.equal(searchMatch[0].company, 'Meta')
})
