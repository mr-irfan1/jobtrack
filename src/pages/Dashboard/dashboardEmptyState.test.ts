import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../../types/application.ts'
import { isDashboardEmpty } from './dashboardEmptyState.ts'

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

test('isDashboardEmpty is true when there are no applications (empty state shown)', () => {
  assert.equal(isDashboardEmpty([]), true)
})

test('isDashboardEmpty is false when a single application exists (empty state hidden)', () => {
  assert.equal(isDashboardEmpty([makeApplication()]), false)
})

test('isDashboardEmpty is false when multiple applications exist', () => {
  const applications = [
    makeApplication({ id: 'a' }),
    makeApplication({ id: 'b' }),
  ]
  assert.equal(isDashboardEmpty(applications), false)
})
