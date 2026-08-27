import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ApplicationStatus, JobApplication } from '../../types/application.ts'
import { progressPercent, summarizeApplications } from './dashboardStats.ts'

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

/** Build `count` applications with the given status, each with a unique id. */
function withStatus(
  status: ApplicationStatus,
  count: number,
): JobApplication[] {
  return Array.from({ length: count }, (_, index) =>
    makeApplication({ id: `${status}-${index}`, status }),
  )
}

test('summarizeApplications reports zero total and zeroed status counts for an empty list', () => {
  const summary = summarizeApplications([])
  assert.equal(summary.total, 0)
  assert.deepEqual(summary.statusCounts, {
    Wishlist: 0,
    Applied: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
  })
})

test('summarizeApplications total equals the number of applications', () => {
  const applications = [
    makeApplication({ id: 'a' }),
    makeApplication({ id: 'b' }),
    makeApplication({ id: 'c' }),
  ]
  assert.equal(summarizeApplications(applications).total, 3)
})

test('summarizeApplications counts applications across multiple statuses', () => {
  const applications = [
    ...withStatus('Wishlist', 2),
    ...withStatus('Applied', 3),
    ...withStatus('Interview', 2),
    ...withStatus('Offer', 1),
    ...withStatus('Rejected', 4),
  ]
  const summary = summarizeApplications(applications)
  assert.equal(summary.total, 12)
  assert.deepEqual(summary.statusCounts, {
    Wishlist: 2,
    Applied: 3,
    Interview: 2,
    Offer: 1,
    Rejected: 4,
  })
})

test('summarizeApplications counts Applied applications', () => {
  const summary = summarizeApplications(withStatus('Applied', 3))
  assert.equal(summary.statusCounts.Applied, 3)
})

test('summarizeApplications counts Interview applications', () => {
  const summary = summarizeApplications(withStatus('Interview', 2))
  assert.equal(summary.statusCounts.Interview, 2)
})

test('summarizeApplications counts Offer applications', () => {
  const summary = summarizeApplications(withStatus('Offer', 5))
  assert.equal(summary.statusCounts.Offer, 5)
})

test('summarizeApplications counts Rejected applications', () => {
  const summary = summarizeApplications(withStatus('Rejected', 4))
  assert.equal(summary.statusCounts.Rejected, 4)
})

test('progressPercent returns 100 when the count equals the max (largest fills the bar)', () => {
  assert.equal(progressPercent(5, 5), 100)
})

test('progressPercent scales other counts proportionally to the max', () => {
  assert.equal(progressPercent(2, 5), 40)
  assert.equal(progressPercent(3, 6), 50)
  assert.equal(progressPercent(1, 4), 25)
})

test('progressPercent returns 0 for a zero count', () => {
  assert.equal(progressPercent(0, 5), 0)
})

test('progressPercent returns 0 when the max is 0 (no applications, empty bars)', () => {
  assert.equal(progressPercent(0, 0), 0)
})
