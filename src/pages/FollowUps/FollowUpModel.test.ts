import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../../types/application.ts'
import type { FollowUp, FollowUpWithApplication } from '../../types/followUp.ts'
import {
  filterFollowUps,
  formatFollowUpDateDisplay,
  getRelativeStatus,
  isCancelled,
  isCompleted,
  isOverdue,
  isUpcoming,
  parseFollowUpDate,
  sortFollowUps,
} from './FollowUpModel.ts'

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 'app-1',
    company: 'Stripe',
    jobTitle: 'Backend Engineer',
    location: 'Remote',
    jobUrl: 'https://stripe.com/jobs/1',
    applicationDate: '2026-09-01',
    status: 'Applied',
    notes: 'Submitted resume via referral',
    ...overrides,
  }
}

function makeFollowUp(overrides: Partial<FollowUp> = {}): FollowUp {
  return {
    id: 'fu-1',
    applicationId: 'app-1',
    scheduledDate: '2026-09-15',
    scheduledTime: '10:00',
    scheduledFor: '2026-09-15T10:00:00',
    status: 'pending',
    createdAt: '2026-09-01T12:00:00Z',
    ...overrides,
  }
}

test('parseFollowUpDate handles date-only and date-with-time in local space', () => {
  const dtWithTime = parseFollowUpDate({ scheduledDate: '2026-09-15', scheduledTime: '14:30' })
  assert.equal(dtWithTime.getFullYear(), 2026)
  assert.equal(dtWithTime.getMonth(), 8) // 0-indexed September
  assert.equal(dtWithTime.getDate(), 15)
  assert.equal(dtWithTime.getHours(), 14)
  assert.equal(dtWithTime.getMinutes(), 30)

  const dtNoTime = parseFollowUpDate({ scheduledDate: '2026-09-15' })
  assert.equal(dtNoTime.getHours(), 9)
  assert.equal(dtNoTime.getMinutes(), 0)
})

test('isOverdue and isUpcoming correctly classify relative to anchor time', () => {
  const anchor = new Date(2026, 8, 15, 12, 0, 0) // Sep 15, 2026 at 12:00

  // Same day earlier time -> Overdue
  const earlierToday = makeFollowUp({ scheduledDate: '2026-09-15', scheduledTime: '10:00' })
  assert.equal(isOverdue(earlierToday, anchor), true)
  assert.equal(isUpcoming(earlierToday, anchor), false)

  // Same day later time -> Upcoming
  const laterToday = makeFollowUp({ scheduledDate: '2026-09-15', scheduledTime: '15:00' })
  assert.equal(isOverdue(laterToday, anchor), false)
  assert.equal(isUpcoming(laterToday, anchor), true)

  // Past day -> Overdue
  const pastDay = makeFollowUp({ scheduledDate: '2026-09-10', scheduledTime: '10:00' })
  assert.equal(isOverdue(pastDay, anchor), true)
  assert.equal(isUpcoming(pastDay, anchor), false)

  // Future day -> Upcoming
  const futureDay = makeFollowUp({ scheduledDate: '2026-09-20', scheduledTime: '10:00' })
  assert.equal(isOverdue(futureDay, anchor), false)
  assert.equal(isUpcoming(futureDay, anchor), true)

  // Completed or Cancelled is neither overdue nor upcoming
  const completed = makeFollowUp({ scheduledDate: '2026-09-10', status: 'completed' })
  assert.equal(isOverdue(completed, anchor), false)
  assert.equal(isUpcoming(completed, anchor), false)
  assert.equal(isCompleted(completed), true)

  const cancelled = makeFollowUp({ scheduledDate: '2026-09-10', status: 'cancelled' })
  assert.equal(isOverdue(cancelled, anchor), false)
  assert.equal(isUpcoming(cancelled, anchor), false)
  assert.equal(isCancelled(cancelled), true)
})

test('getRelativeStatus formats relative labels accurately', () => {
  const anchor = new Date(2026, 8, 15, 12, 0, 0) // Sep 15, 2026 at 12:00

  assert.deepEqual(
    getRelativeStatus(makeFollowUp({ status: 'completed' }), anchor),
    { label: 'Completed', tone: 'success' },
  )

  assert.deepEqual(
    getRelativeStatus(makeFollowUp({ status: 'cancelled' }), anchor),
    { label: 'Cancelled', tone: 'muted' },
  )

  assert.deepEqual(
    getRelativeStatus(makeFollowUp({ scheduledDate: '2026-09-15', scheduledTime: '10:00' }), anchor),
    { label: 'Overdue today', tone: 'danger' },
  )

  assert.deepEqual(
    getRelativeStatus(makeFollowUp({ scheduledDate: '2026-09-14', scheduledTime: '10:00' }), anchor),
    { label: 'Overdue by 1 day', tone: 'danger' },
  )

  assert.deepEqual(
    getRelativeStatus(makeFollowUp({ scheduledDate: '2026-09-12', scheduledTime: '10:00' }), anchor),
    { label: 'Overdue by 3 days', tone: 'danger' },
  )

  assert.deepEqual(
    getRelativeStatus(makeFollowUp({ scheduledDate: '2026-09-15', scheduledTime: '14:00' }), anchor),
    { label: 'Due today', tone: 'warning' },
  )

  assert.deepEqual(
    getRelativeStatus(makeFollowUp({ scheduledDate: '2026-09-16', scheduledTime: '10:00' }), anchor),
    { label: 'Tomorrow', tone: 'primary' },
  )

  assert.deepEqual(
    getRelativeStatus(makeFollowUp({ scheduledDate: '2026-09-20', scheduledTime: '10:00' }), anchor),
    { label: 'In 5 days', tone: 'primary' },
  )
})

test('formatFollowUpDateDisplay formats date and time cleanly', () => {
  assert.equal(
    formatFollowUpDateDisplay({ scheduledDate: '2026-09-15', scheduledTime: '14:30' }),
    'Sep 15, 2026 at 2:30 PM',
  )
  assert.equal(
    formatFollowUpDateDisplay({ scheduledDate: '2026-09-15' }),
    'Sep 15, 2026',
  )
})

test('filterFollowUps filters by tab and searches across company, title, and notes', () => {
  const anchor = new Date(2026, 8, 15, 12, 0, 0)
  const app1 = makeApplication({ company: 'Google', jobTitle: 'Frontend Lead' })
  const app2 = makeApplication({ company: 'Apple', jobTitle: 'iOS Developer' })

  const items: FollowUpWithApplication[] = [
    { ...makeFollowUp({ id: '1', scheduledDate: '2026-09-10' }), application: app1 }, // overdue
    { ...makeFollowUp({ id: '2', scheduledDate: '2026-09-20', note: 'Call recruiter Alex' }), application: app1 }, // upcoming
    { ...makeFollowUp({ id: '3', scheduledDate: '2026-09-05', status: 'completed' }), application: app2 }, // completed
  ]

  // Tab filter
  assert.equal(filterFollowUps(items, 'all', '', anchor).length, 3)
  assert.equal(filterFollowUps(items, 'overdue', '', anchor).length, 1)
  assert.equal(filterFollowUps(items, 'upcoming', '', anchor).length, 1)
  assert.equal(filterFollowUps(items, 'completed', '', anchor).length, 1)

  // Search by company
  assert.equal(filterFollowUps(items, 'all', 'Google', anchor).length, 2)
  assert.equal(filterFollowUps(items, 'all', 'Apple', anchor).length, 1)

  // Search by job title
  assert.equal(filterFollowUps(items, 'all', 'iOS', anchor).length, 1)

  // Search by note
  assert.equal(filterFollowUps(items, 'all', 'Alex', anchor).length, 1)
})

test('sortFollowUps places overdue first, then upcoming soonest, then completed', () => {
  const anchor = new Date(2026, 8, 15, 12, 0, 0)
  const items: FollowUpWithApplication[] = [
    makeFollowUp({ id: 'upcoming-far', scheduledDate: '2026-09-25' }),
    makeFollowUp({ id: 'completed', scheduledDate: '2026-09-01', status: 'completed' }),
    makeFollowUp({ id: 'overdue-old', scheduledDate: '2026-09-08' }),
    makeFollowUp({ id: 'upcoming-soon', scheduledDate: '2026-09-16' }),
    makeFollowUp({ id: 'overdue-recent', scheduledDate: '2026-09-14' }),
  ]

  const sorted = sortFollowUps(items, anchor)
  const order = sorted.map((s) => s.id)

  assert.deepEqual(order, [
    'overdue-old',
    'overdue-recent',
    'upcoming-soon',
    'upcoming-far',
    'completed',
  ])
})
