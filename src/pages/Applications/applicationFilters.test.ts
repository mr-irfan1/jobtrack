import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../../types/application.ts'
import {
  ALL_STATUSES,
  filterApplications,
  matchesSearch,
  matchesStatus,
} from './applicationFilters.ts'

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

/** A small, representative dataset reused across the filtering tests. */
const applications: JobApplication[] = [
  makeApplication({
    id: 'a',
    company: 'Acme',
    jobTitle: 'Frontend Engineer',
    location: 'Remote',
    status: 'Applied',
  }),
  makeApplication({
    id: 'b',
    company: 'Globex',
    jobTitle: 'Backend Engineer',
    location: 'Berlin',
    status: 'Interview',
  }),
  makeApplication({
    id: 'c',
    company: 'Initech',
    jobTitle: 'Product Designer',
    location: 'New York',
    status: 'Offer',
  }),
  makeApplication({
    id: 'd',
    company: 'Umbrella',
    jobTitle: 'Data Scientist',
    location: 'Remote',
    status: 'Applied',
  }),
]

const ids = (list: JobApplication[]): string[] => list.map((a) => a.id)

test('filterApplications matches on company name', () => {
  const result = filterApplications(applications, {
    search: 'globex',
    status: ALL_STATUSES,
  })
  assert.deepEqual(ids(result), ['b'])
})

test('filterApplications matches on job title', () => {
  const result = filterApplications(applications, {
    search: 'designer',
    status: ALL_STATUSES,
  })
  assert.deepEqual(ids(result), ['c'])
})

test('filterApplications matches on location', () => {
  const result = filterApplications(applications, {
    search: 'berlin',
    status: ALL_STATUSES,
  })
  assert.deepEqual(ids(result), ['b'])
})

test('search is case-insensitive', () => {
  const lower = filterApplications(applications, {
    search: 'acme',
    status: ALL_STATUSES,
  })
  const upper = filterApplications(applications, {
    search: 'ACME',
    status: ALL_STATUSES,
  })
  assert.deepEqual(ids(lower), ['a'])
  assert.deepEqual(ids(upper), ['a'])
})

test('filterApplications filters by status', () => {
  const result = filterApplications(applications, {
    search: '',
    status: 'Applied',
  })
  assert.deepEqual(ids(result), ['a', 'd'])
})

test('search and status filter compose (both must match)', () => {
  // "engineer" matches a (Frontend Engineer / Applied) and b (Backend Engineer
  // / Interview); the Interview status then narrows the result to just b.
  const result = filterApplications(applications, {
    search: 'engineer',
    status: 'Interview',
  })
  assert.deepEqual(ids(result), ['b'])
})

test('clearing filters (empty search + ALL_STATUSES) restores all applications', () => {
  const result = filterApplications(applications, {
    search: '',
    status: ALL_STATUSES,
  })
  assert.deepEqual(ids(result), ['a', 'b', 'c', 'd'])
})

test('whitespace-only search matches all applications', () => {
  const result = filterApplications(applications, {
    search: '   ',
    status: ALL_STATUSES,
  })
  assert.equal(result.length, applications.length)
})

test('a search that matches nothing yields an empty list', () => {
  const result = filterApplications(applications, {
    search: 'no-such-company-zzz',
    status: ALL_STATUSES,
  })
  assert.deepEqual(result, [])
})

test('matchesSearch checks company, job title and location, case-insensitively', () => {
  const app = makeApplication({
    company: 'Acme',
    jobTitle: 'Frontend Engineer',
    location: 'Remote',
  })
  assert.equal(matchesSearch(app, 'ACME'), true)
  assert.equal(matchesSearch(app, 'frontend'), true)
  assert.equal(matchesSearch(app, 'REMOTE'), true)
  assert.equal(matchesSearch(app, 'backend'), false)
  assert.equal(matchesSearch(app, ''), true)
})

test('matchesStatus honors the selected status and the ALL sentinel', () => {
  const app = makeApplication({ status: 'Interview' })
  assert.equal(matchesStatus(app, 'Interview'), true)
  assert.equal(matchesStatus(app, 'Offer'), false)
  assert.equal(matchesStatus(app, ALL_STATUSES), true)
})

test('filterApplications does not mutate the input array', () => {
  const input = [...applications]
  filterApplications(input, { search: 'acme', status: 'Applied' })
  assert.equal(input.length, applications.length)
  assert.deepEqual(ids(input), ['a', 'b', 'c', 'd'])
})
