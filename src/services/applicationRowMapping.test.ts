import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../types/application.ts'
import {
  applicationToInsertRow,
  applicationToUpdatePayload,
  rowToApplication,
} from './applicationRowMapping.ts'
import type { ApplicationRow } from './applicationRowMapping.ts'

/** A full DB row; interview_* default to null (no interview scheduled). */
function makeRow(overrides: Partial<ApplicationRow> = {}): ApplicationRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    user_id: '22222222-2222-4222-8222-222222222222',
    company: 'Acme',
    job_title: 'Frontend Engineer',
    location: 'Remote',
    job_url: 'https://example.com/job',
    application_date: '2026-08-26',
    status: 'Applied',
    notes: 'Left a note',
    interview_date: null,
    interview_time: null,
    interview_type: null,
    meeting_link: null,
    created_at: '2026-08-26T10:00:00.000Z',
    updated_at: null,
    ...overrides,
  }
}

/** The domain equivalent of makeRow() with no interview fields set. */
function makeApplication(
  overrides: Partial<JobApplication> = {},
): JobApplication {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    company: 'Acme',
    jobTitle: 'Frontend Engineer',
    location: 'Remote',
    jobUrl: 'https://example.com/job',
    applicationDate: '2026-08-26',
    status: 'Applied',
    notes: 'Left a note',
    ...overrides,
  }
}

test('rowToApplication maps required columns and omits DB-only columns', () => {
  const application = rowToApplication(makeRow())
  assert.deepEqual(application, makeApplication())
  // user_id and the timestamps are persistence concerns, not domain fields.
  assert.ok(!('user_id' in application))
  assert.ok(!('created_at' in application))
  assert.ok(!('updated_at' in application))
})

test('rowToApplication carries interview fields and trims time to HH:MM', () => {
  const application = rowToApplication(
    makeRow({
      status: 'Interview',
      interview_date: '2026-08-30',
      interview_time: '11:00:00',
      interview_type: 'Technical Interview',
      meeting_link: 'https://meet.example.com/abc',
    }),
  )
  assert.equal(application.interviewDate, '2026-08-30')
  assert.equal(application.interviewTime, '11:00')
  assert.equal(application.interviewType, 'Technical Interview')
  assert.equal(application.meetingLink, 'https://meet.example.com/abc')
})

test('rowToApplication maps null interview columns to absent optional fields', () => {
  const application = rowToApplication(makeRow())
  assert.equal(application.interviewDate, undefined)
  assert.equal(application.interviewTime, undefined)
  assert.equal(application.interviewType, undefined)
  assert.equal(application.meetingLink, undefined)
  // Absent, not present-with-undefined — matches buildApplication's output.
  assert.ok(!('interviewDate' in application))
  assert.ok(!('interviewTime' in application))
  assert.ok(!('interviewType' in application))
  assert.ok(!('meetingLink' in application))
})

test('rowToApplication preserves each status value', () => {
  const statuses = [
    'Wishlist',
    'Applied',
    'Interview',
    'Offer',
    'Rejected',
  ] as const
  for (const status of statuses) {
    assert.equal(rowToApplication(makeRow({ status })).status, status)
  }
})

test('applicationToInsertRow maps to snake_case and stamps id + user_id', () => {
  const row = applicationToInsertRow(makeApplication(), 'user-42')
  assert.equal(row.id, '11111111-1111-4111-8111-111111111111')
  assert.equal(row.user_id, 'user-42')
  assert.equal(row.company, 'Acme')
  assert.equal(row.job_title, 'Frontend Engineer')
  assert.equal(row.location, 'Remote')
  assert.equal(row.job_url, 'https://example.com/job')
  assert.equal(row.application_date, '2026-08-26')
  assert.equal(row.status, 'Applied')
  assert.equal(row.notes, 'Left a note')
  // The DB manages these; an insert payload must not carry them.
  assert.ok(!('created_at' in row))
  assert.ok(!('updated_at' in row))
})

test('applicationToInsertRow maps absent optional fields to null', () => {
  const row = applicationToInsertRow(makeApplication(), 'user-42')
  assert.equal(row.interview_date, null)
  assert.equal(row.interview_time, null)
  assert.equal(row.interview_type, null)
  assert.equal(row.meeting_link, null)
})

test('applicationToInsertRow passes interview fields through', () => {
  const row = applicationToInsertRow(
    makeApplication({
      status: 'Interview',
      interviewDate: '2026-08-30',
      interviewTime: '11:00',
      interviewType: 'Technical Interview',
      meetingLink: 'https://meet.example.com/abc',
    }),
    'user-42',
  )
  assert.equal(row.interview_date, '2026-08-30')
  assert.equal(row.interview_time, '11:00')
  assert.equal(row.interview_type, 'Technical Interview')
  assert.equal(row.meeting_link, 'https://meet.example.com/abc')
})

test('applicationToUpdatePayload omits ownership and timestamp columns', () => {
  const payload = applicationToUpdatePayload(makeApplication())
  assert.ok(!('id' in payload))
  assert.ok(!('user_id' in payload))
  assert.ok(!('created_at' in payload))
  assert.ok(!('updated_at' in payload))
  assert.equal(payload.job_title, 'Frontend Engineer')
  assert.equal(payload.status, 'Applied')
})

test('applicationToUpdatePayload maps cleared optional fields to null', () => {
  const payload = applicationToUpdatePayload(
    makeApplication({ interviewDate: undefined, interviewTime: undefined }),
  )
  assert.equal(payload.interview_date, null)
  assert.equal(payload.interview_time, null)
  assert.equal(payload.interview_type, null)
  assert.equal(payload.meeting_link, null)
})

test('round-trip row -> application -> insert row preserves app-facing columns', () => {
  const original = makeRow({
    status: 'Interview',
    interview_date: '2026-08-30',
    interview_time: '11:00:00',
    interview_type: 'Technical Interview',
    meeting_link: 'https://meet.example.com/abc',
  })
  const application = rowToApplication(original)
  const insert = applicationToInsertRow(application, original.user_id)

  assert.equal(insert.id, original.id)
  assert.equal(insert.user_id, original.user_id)
  assert.equal(insert.company, original.company)
  assert.equal(insert.job_title, original.job_title)
  assert.equal(insert.location, original.location)
  assert.equal(insert.job_url, original.job_url)
  assert.equal(insert.application_date, original.application_date)
  assert.equal(insert.status, original.status)
  assert.equal(insert.notes, original.notes)
  assert.equal(insert.interview_date, original.interview_date)
  // interview_time is normalized to HH:MM on the way into the domain model.
  assert.equal(insert.interview_time, '11:00')
  assert.equal(insert.interview_type, original.interview_type)
  assert.equal(insert.meeting_link, original.meeting_link)
})
