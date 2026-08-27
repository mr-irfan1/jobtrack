import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../../types/application.ts'
import { getMonthlyActivity } from './applicationActivity.ts'

// A fixed "today" keeps the month-window assertions deterministic.
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
    applicationDate: '2026-08-26',
    status: 'Applied',
    notes: '',
    ...overrides,
  }
}

test('getMonthlyActivity returns the last 6 months by default, oldest first', () => {
  const result = getMonthlyActivity([], TODAY)
  assert.deepEqual(
    result.map((entry) => entry.month),
    ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'],
  )
  assert.deepEqual(
    result.map((entry) => entry.label),
    ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
  )
})

test('getMonthlyActivity reports 0 for every month when there are no applications', () => {
  const result = getMonthlyActivity([], TODAY)
  assert.deepEqual(
    result.map((entry) => entry.count),
    [0, 0, 0, 0, 0, 0],
  )
})

test('getMonthlyActivity counts applications into their applicationDate month', () => {
  const applications = [
    makeApplication({ id: 'a', applicationDate: '2026-08-01' }),
    makeApplication({ id: 'b', applicationDate: '2026-08-20' }),
    makeApplication({ id: 'c', applicationDate: '2026-06-15' }),
  ]
  const result = getMonthlyActivity(applications, TODAY)
  const byMonth = Object.fromEntries(
    result.map((entry) => [entry.month, entry.count]),
  )
  assert.equal(byMonth['2026-08'], 2)
  assert.equal(byMonth['2026-06'], 1)
  assert.equal(byMonth['2026-07'], 0)
})

test('getMonthlyActivity excludes applications outside the window', () => {
  const applications = [
    makeApplication({ id: 'old', applicationDate: '2025-12-31' }),
    makeApplication({ id: 'in', applicationDate: '2026-03-02' }),
  ]
  const result = getMonthlyActivity(applications, TODAY)
  const total = result.reduce((sum, entry) => sum + entry.count, 0)
  assert.equal(total, 1)
  assert.equal(
    result.find((entry) => entry.month === '2026-03')?.count,
    1,
  )
})

test('getMonthlyActivity honors a custom month count and crosses year boundaries', () => {
  const result = getMonthlyActivity([], '2026-01-15', 3)
  assert.deepEqual(
    result.map((entry) => entry.month),
    ['2025-11', '2025-12', '2026-01'],
  )
  assert.deepEqual(
    result.map((entry) => entry.label),
    ['Nov', 'Dec', 'Jan'],
  )
})

test('getMonthlyActivity returns an empty array for a non-positive month count', () => {
  assert.deepEqual(getMonthlyActivity([], TODAY, 0), [])
})

test('getMonthlyActivity does not mutate the input array', () => {
  const applications = [
    makeApplication({ id: 'a', applicationDate: '2026-08-01' }),
    makeApplication({ id: 'b', applicationDate: '2026-07-01' }),
  ]
  const originalOrder = applications.map((application) => application.id)
  getMonthlyActivity(applications, TODAY)
  assert.deepEqual(
    applications.map((application) => application.id),
    originalOrder,
  )
})
