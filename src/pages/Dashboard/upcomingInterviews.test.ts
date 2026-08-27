import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../../types/application.ts'
import { getUpcomingInterviews } from './upcomingInterviews.ts'

// A fixed "today" keeps every past/today/future assertion deterministic.
const TODAY = '2026-08-26'

function makeApplication(
  overrides: Partial<JobApplication> = {},
): JobApplication {
  return {
    id: 'app-1',
    company: 'Acme',
    jobTitle: 'Frontend Engineer',
    location: 'Remote',
    jobUrl: 'https://example.com/job',
    applicationDate: '2026-08-01',
    status: 'Interview',
    notes: '',
    ...overrides,
  }
}

test('getUpcomingInterviews returns an empty array when there are no applications', () => {
  assert.deepEqual(getUpcomingInterviews([], TODAY), [])
})

test('getUpcomingInterviews excludes applications without a valid interview date', () => {
  const applications = [
    makeApplication({ id: 'no-date' }), // interviewDate undefined
    makeApplication({ id: 'empty-date', interviewDate: '' }),
  ]
  assert.deepEqual(getUpcomingInterviews(applications, TODAY), [])
})

test('getUpcomingInterviews excludes past interviews (before today)', () => {
  const applications = [
    makeApplication({ id: 'yesterday', interviewDate: '2026-08-25' }),
  ]
  assert.deepEqual(getUpcomingInterviews(applications, TODAY), [])
})

test("getUpcomingInterviews includes today's interview (today counts as upcoming)", () => {
  const applications = [makeApplication({ id: 'today', interviewDate: TODAY })]
  const result = getUpcomingInterviews(applications, TODAY)
  assert.deepEqual(
    result.map((application) => application.id),
    ['today'],
  )
})

test('getUpcomingInterviews includes a future interview', () => {
  const applications = [
    makeApplication({ id: 'future', interviewDate: '2026-09-10' }),
  ]
  const result = getUpcomingInterviews(applications, TODAY)
  assert.deepEqual(
    result.map((application) => application.id),
    ['future'],
  )
})

test('getUpcomingInterviews sorts upcoming interviews chronologically, nearest first', () => {
  const applications = [
    makeApplication({ id: 'far', interviewDate: '2026-12-01' }),
    makeApplication({ id: 'today', interviewDate: TODAY }),
    makeApplication({ id: 'soon', interviewDate: '2026-09-05' }),
    makeApplication({ id: 'past', interviewDate: '2026-01-01' }),
  ]
  const result = getUpcomingInterviews(applications, TODAY)
  assert.deepEqual(
    result.map((application) => application.id),
    ['today', 'soon', 'far'],
  )
})

test('getUpcomingInterviews returns at most 5 interviews (the nearest 5)', () => {
  const applications = Array.from({ length: 8 }, (_, index) =>
    makeApplication({
      id: `a-${index}`,
      interviewDate: `2026-09-${String(index + 1).padStart(2, '0')}`,
    }),
  )
  const result = getUpcomingInterviews(applications, TODAY)
  assert.equal(result.length, 5)
  assert.deepEqual(
    result.map((application) => application.id),
    ['a-0', 'a-1', 'a-2', 'a-3', 'a-4'],
  )
})

test('getUpcomingInterviews does not mutate the input array', () => {
  const applications = [
    makeApplication({ id: 'far', interviewDate: '2026-12-01' }),
    makeApplication({ id: 'soon', interviewDate: '2026-09-05' }),
  ]
  const originalOrder = applications.map((application) => application.id)
  getUpcomingInterviews(applications, TODAY)
  assert.deepEqual(
    applications.map((application) => application.id),
    originalOrder,
  )
})
