import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  APPLICATION_RESUMES_STORAGE_KEY,
  RESUMES_STORAGE_KEY,
  addResume,
  clearAllResumes,
  deleteResume,
  getApplicationResumeId,
  getResumes,
  renameResume,
  setApplicationResume,
  setPrimaryResume,
} from './resumeStore.ts'

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

test('getResumes returns empty array when nothing is stored or JSON is invalid', () => {
  assert.deepEqual(getResumes(), [])

  localStorage.setItem(RESUMES_STORAGE_KEY, 'invalid-json{{')
  assert.deepEqual(getResumes(), [])

  localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify([null, { id: 'missing-fields' }]))
  assert.deepEqual(getResumes(), [])
})

test('addResume validates required name and fileName', () => {
  const missingName = addResume({
    name: '  ',
    fileName: 'resume.pdf',
    fileType: 'pdf',
    fileSize: 1024,
    isPrimary: false,
  })
  assert.equal(missingName.success, false)
  assert.match(missingName.error || '', /name is required/i)

  const missingFile = addResume({
    name: 'SWE Resume',
    fileName: '  ',
    fileType: 'pdf',
    fileSize: 1024,
    isPrimary: false,
  })
  assert.equal(missingFile.success, false)
  assert.match(missingFile.error || '', /file name is required/i)
})

test('first added resume automatically becomes Primary', () => {
  const res = addResume({
    name: 'General Resume',
    fileName: 'resume.pdf',
    fileType: 'pdf',
    fileSize: 50000,
    isPrimary: false, // Even if requested false, first should be true
  })

  assert.equal(res.success, true)
  assert.equal(res.resume?.isPrimary, true)

  const list = getResumes()
  assert.equal(list.length, 1)
  assert.equal(list[0].isPrimary, true)
})

test('adding a new primary resume unsets previous primary so only one is primary', () => {
  const first = addResume({
    name: 'Resume 1',
    fileName: 'r1.pdf',
    fileType: 'pdf',
    fileSize: 1000,
    isPrimary: true,
  }).resume!

  const second = addResume({
    name: 'Resume 2',
    fileName: 'r2.pdf',
    fileType: 'pdf',
    fileSize: 2000,
    isPrimary: true,
  }).resume!

  const list = getResumes()
  const r1 = list.find((r) => r.id === first.id)!
  const r2 = list.find((r) => r.id === second.id)!

  assert.equal(r1.isPrimary, false)
  assert.equal(r2.isPrimary, true)
})

test('setPrimaryResume switches primary cleanly', () => {
  const r1 = addResume({ name: 'R1', fileName: 'r1.pdf', fileType: 'pdf', fileSize: 100, isPrimary: true }).resume!
  const r2 = addResume({ name: 'R2', fileName: 'r2.pdf', fileType: 'pdf', fileSize: 200, isPrimary: false }).resume!

  setPrimaryResume(r2.id)

  const list = getResumes()
  assert.equal(list.find((r) => r.id === r1.id)?.isPrimary, false)
  assert.equal(list.find((r) => r.id === r2.id)?.isPrimary, true)
})

test('deleteResume promotes next available resume when primary is deleted', () => {
  const r1 = addResume({ name: 'R1', fileName: 'r1.pdf', fileType: 'pdf', fileSize: 100, isPrimary: true }).resume!
  const r2 = addResume({ name: 'R2', fileName: 'r2.pdf', fileType: 'pdf', fileSize: 200, isPrimary: false }).resume!

  deleteResume(r1.id)

  const list = getResumes()
  assert.equal(list.length, 1)
  assert.equal(list[0].id, r2.id)
  assert.equal(list[0].isPrimary, true) // Promoted to primary
})

test('addResume prevents duplicate submission', () => {
  addResume({ name: 'R1', fileName: 'r1.pdf', fileType: 'pdf', fileSize: 100, isPrimary: false })
  const duplicate = addResume({ name: 'R1', fileName: 'r1.pdf', fileType: 'pdf', fileSize: 100, isPrimary: false })

  assert.equal(duplicate.success, false)
  assert.match(duplicate.error || '', /already been added/i)

  // Different version name is allowed
  const v2 = addResume({ name: 'R1 v2', fileName: 'r1.pdf', fileType: 'pdf', fileSize: 100, isPrimary: false })
  assert.equal(v2.success, true)
})

test('renameResume updates resume name', () => {
  const r = addResume({ name: 'Old Name', fileName: 'r.pdf', fileType: 'pdf', fileSize: 100, isPrimary: false }).resume!
  const result = renameResume(r.id, 'New Name')
  assert.equal(result.success, true)

  const updated = getResumes().find((item) => item.id === r.id)!
  assert.equal(updated.name, 'New Name')
})

test('application resume linking and unlinking works as expected', () => {
  const appId = 'app-123'
  const resumeId = 'res-456'

  assert.equal(getApplicationResumeId(appId), undefined)

  setApplicationResume(appId, resumeId)
  assert.equal(getApplicationResumeId(appId), resumeId)

  // Unlinking
  setApplicationResume(appId, null)
  assert.equal(getApplicationResumeId(appId), undefined)
})
