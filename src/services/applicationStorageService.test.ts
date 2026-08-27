import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import type { JobApplication } from '../types/application.ts'
import {
  addApplication,
  deleteApplication,
  getApplications,
  updateApplication,
} from './applicationStorageService.ts'

const STORAGE_KEY = 'jobtrack_applications'

/** Minimal in-memory Storage stand-in so the service can run under Node. */
function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    clear() {
      store = {}
    },
    getItem(key: string) {
      return key in store ? store[key] : null
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null
    },
    removeItem(key: string) {
      delete store[key]
    },
    setItem(key: string, value: string) {
      store[key] = String(value)
    },
  } as Storage
}

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

beforeEach(() => {
  globalThis.localStorage = createLocalStorageMock()
})

test('getApplications returns an empty array when nothing is stored', () => {
  assert.deepEqual(getApplications(), [])
})

test('getApplications returns an empty array when the stored JSON is malformed', () => {
  localStorage.setItem(STORAGE_KEY, '{ not valid json')
  assert.deepEqual(getApplications(), [])
})

test('getApplications returns an empty array when the stored value is not an array', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }))
  assert.deepEqual(getApplications(), [])
})

test('addApplication stores the complete object and preserves its id', () => {
  const app = makeApplication({ id: 'keep-me' })
  addApplication(app)
  const stored = getApplications()
  assert.equal(stored.length, 1)
  assert.deepEqual(stored[0], app)
  assert.equal(stored[0].id, 'keep-me')
})

test('addApplication appends without dropping existing entries', () => {
  addApplication(makeApplication({ id: 'a' }))
  addApplication(makeApplication({ id: 'b' }))
  assert.deepEqual(
    getApplications().map((a) => a.id),
    ['a', 'b'],
  )
})

test('updateApplication updates only the matching id and preserves others', () => {
  addApplication(makeApplication({ id: 'a', company: 'Acme' }))
  addApplication(makeApplication({ id: 'b', company: 'Globex' }))
  updateApplication(
    makeApplication({ id: 'b', company: 'Globex Updated', status: 'Interview' }),
  )
  const stored = getApplications()
  assert.equal(stored.find((a) => a.id === 'a')?.company, 'Acme')
  const updated = stored.find((a) => a.id === 'b')
  assert.equal(updated?.company, 'Globex Updated')
  assert.equal(updated?.status, 'Interview')
})

test('updateApplication is a no-op when no id matches', () => {
  addApplication(makeApplication({ id: 'a' }))
  updateApplication(makeApplication({ id: 'missing', company: 'Nope' }))
  const stored = getApplications()
  assert.equal(stored.length, 1)
  assert.equal(stored[0].id, 'a')
})

test('deleteApplication removes only the matching id', () => {
  addApplication(makeApplication({ id: 'a' }))
  addApplication(makeApplication({ id: 'b' }))
  addApplication(makeApplication({ id: 'c' }))
  deleteApplication('b')
  assert.deepEqual(
    getApplications().map((a) => a.id),
    ['a', 'c'],
  )
})
