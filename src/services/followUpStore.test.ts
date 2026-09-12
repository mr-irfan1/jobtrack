import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  FOLLOW_UPS_STORAGE_KEY,
  addFollowUp,
  cancelFollowUp,
  clearAllFollowUps,
  completeFollowUp,
  deleteFollowUp,
  getFollowUps,
  rescheduleFollowUp,
  updateFollowUp,
} from './followUpStore.ts'

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

beforeEach(() => {
  globalThis.localStorage = createLocalStorageMock()
})

test('getFollowUps returns an empty array when nothing is stored', () => {
  assert.deepEqual(getFollowUps(), [])
})

test('getFollowUps handles malformed JSON and corrupted records safely', () => {
  localStorage.setItem(FOLLOW_UPS_STORAGE_KEY, 'not-valid-json{')
  assert.deepEqual(getFollowUps(), [])

  localStorage.setItem(
    FOLLOW_UPS_STORAGE_KEY,
    JSON.stringify([
      null,
      {},
      { id: '1', applicationId: 'app-1', scheduledDate: 'invalid' },
      { id: '2', applicationId: 'app-1', scheduledDate: '2026-09-15', status: 'invalid' },
    ]),
  )
  assert.deepEqual(getFollowUps(), [])
})

test('addFollowUp validates required fields', () => {
  const missingApp = addFollowUp({
    applicationId: '',
    scheduledDate: '2026-09-15',
  })
  assert.equal(missingApp.success, false)
  assert.match(missingApp.error || '', /application id/i)

  const invalidDate = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '15-09-2026',
  })
  assert.equal(invalidDate.success, false)
  assert.match(invalidDate.error || '', /valid date/i)

  const invalidTime = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '2026-09-15',
    scheduledTime: '99:99',
  })
  assert.equal(invalidTime.success, false)
  assert.match(invalidTime.error || '', /24-hour/i)
})

test('addFollowUp successfully persists a valid follow-up and sets default status', () => {
  const res = addFollowUp({
    applicationId: 'app-100',
    scheduledDate: '2026-09-20',
    scheduledTime: '14:30',
    note: 'Send email to recruiter',
  })

  assert.equal(res.success, true)
  assert.ok(res.followUp?.id)
  assert.equal(res.followUp?.status, 'pending')
  assert.equal(res.followUp?.scheduledDate, '2026-09-20')
  assert.equal(res.followUp?.scheduledTime, '14:30')
  assert.equal(res.followUp?.scheduledFor, '2026-09-20T14:30:00')
  assert.equal(res.followUp?.note, 'Send email to recruiter')

  const stored = getFollowUps()
  assert.equal(stored.length, 1)
  assert.equal(stored[0].id, res.followUp?.id)
})

test('addFollowUp prevents duplicate pending follow-ups for the same app at the same date/time', () => {
  const first = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '2026-09-25',
    scheduledTime: '10:00',
  })
  assert.equal(first.success, true)

  const duplicate = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '2026-09-25',
    scheduledTime: '10:00',
  })
  assert.equal(duplicate.success, false)
  assert.match(duplicate.error || '', /already scheduled/i)

  // Different time on the same date is allowed
  const differentTime = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '2026-09-25',
    scheduledTime: '15:00',
  })
  assert.equal(differentTime.success, true)

  // Different date is allowed
  const differentDate = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '2026-09-26',
    scheduledTime: '10:00',
  })
  assert.equal(differentDate.success, true)

  // Different application is allowed
  const differentApp = addFollowUp({
    applicationId: 'app-2',
    scheduledDate: '2026-09-25',
    scheduledTime: '10:00',
  })
  assert.equal(differentApp.success, true)
})

test('rescheduleFollowUp updates date, time, and prevents conflict', () => {
  const item1 = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '2026-09-20',
    scheduledTime: '10:00',
  }).followUp!

  const item2 = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '2026-09-22',
    scheduledTime: '10:00',
  }).followUp!

  // Reschedule item1 to item2's slot -> duplicate error
  const duplicateRes = rescheduleFollowUp(item1.id, '2026-09-22', '10:00')
  assert.equal(duplicateRes.success, false)

  // Reschedule to a free slot
  const validRes = rescheduleFollowUp(item1.id, '2026-09-23', '11:00', 'Updated note')
  assert.equal(validRes.success, true)

  const updated = getFollowUps().find((f) => f.id === item1.id)!
  assert.equal(updated.scheduledDate, '2026-09-23')
  assert.equal(updated.scheduledTime, '11:00')
  assert.equal(updated.note, 'Updated note')
  assert.equal(updated.status, 'pending')
})

test('completeFollowUp marks completed and sets completedAt', () => {
  const item = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '2026-09-20',
  }).followUp!

  completeFollowUp(item.id)
  const updated = getFollowUps().find((f) => f.id === item.id)!
  assert.equal(updated.status, 'completed')
  assert.ok(updated.completedAt)
})

test('cancelFollowUp and deleteFollowUp manage lifecycle', () => {
  const item = addFollowUp({
    applicationId: 'app-1',
    scheduledDate: '2026-09-20',
  }).followUp!

  cancelFollowUp(item.id)
  let stored = getFollowUps().find((f) => f.id === item.id)!
  assert.equal(stored.status, 'cancelled')

  deleteFollowUp(item.id)
  assert.equal(getFollowUps().length, 0)
})
