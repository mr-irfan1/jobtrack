import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../../types/application.ts'
import { getRecentApplications } from './recentApplications.ts'

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

test('getRecentApplications sorts applications newest first by applicationDate', () => {
  const applications = [
    makeApplication({ id: 'old', applicationDate: '2026-01-01' }),
    makeApplication({ id: 'new', applicationDate: '2026-08-26' }),
    makeApplication({ id: 'mid', applicationDate: '2026-05-15' }),
  ]
  const result = getRecentApplications(applications, 5)
  assert.deepEqual(
    result.map((application) => application.id),
    ['new', 'mid', 'old'],
  )
})

test('getRecentApplications limits the result to the requested count (newest kept)', () => {
  const applications = Array.from({ length: 8 }, (_, index) =>
    makeApplication({
      id: `a-${index}`,
      applicationDate: `2026-08-${String(index + 1).padStart(2, '0')}`,
    }),
  )
  const result = getRecentApplications(applications, 5)
  assert.equal(result.length, 5)
  assert.deepEqual(
    result.map((application) => application.id),
    ['a-7', 'a-6', 'a-5', 'a-4', 'a-3'],
  )
})

test('getRecentApplications returns all applications when fewer than the limit exist', () => {
  const applications = [
    makeApplication({ id: 'a', applicationDate: '2026-03-01' }),
    makeApplication({ id: 'b', applicationDate: '2026-07-01' }),
  ]
  const result = getRecentApplications(applications, 5)
  assert.equal(result.length, 2)
  assert.deepEqual(
    result.map((application) => application.id),
    ['b', 'a'],
  )
})

test('getRecentApplications returns an empty array when there are no applications', () => {
  assert.deepEqual(getRecentApplications([], 5), [])
})

test('getRecentApplications does not mutate the input array', () => {
  const applications = [
    makeApplication({ id: 'a', applicationDate: '2026-01-01' }),
    makeApplication({ id: 'b', applicationDate: '2026-09-01' }),
  ]
  const originalOrder = applications.map((application) => application.id)
  getRecentApplications(applications, 5)
  assert.deepEqual(
    applications.map((application) => application.id),
    originalOrder,
  )
})
