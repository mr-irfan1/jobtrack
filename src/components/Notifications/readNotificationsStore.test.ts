import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  READ_STORAGE_KEY,
  getReadIds,
  parseReadIds,
  saveReadIds,
} from './readNotificationsStore.ts'

/** Minimal in-memory Storage, matching the app's other storage-layer tests. */
function createLocalStorageMock(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

beforeEach(() => {
  globalThis.localStorage = createLocalStorageMock()
})

test('the read-state key is the dedicated notifications key, not the app data key', () => {
  assert.equal(READ_STORAGE_KEY, 'jobtrack_read_notifications')
  assert.notEqual(READ_STORAGE_KEY, 'jobtrack_applications')
})

test('parseReadIds returns [] for empty, malformed, or non-array values', () => {
  assert.deepEqual(parseReadIds(null), [])
  assert.deepEqual(parseReadIds(''), [])
  assert.deepEqual(parseReadIds('not json'), [])
  assert.deepEqual(parseReadIds('{}'), [])
  assert.deepEqual(parseReadIds('42'), [])
})

test('parseReadIds keeps only string entries', () => {
  assert.deepEqual(parseReadIds('["a","b"]'), ['a', 'b'])
  assert.deepEqual(parseReadIds('["a",1,null,"b",true]'), ['a', 'b'])
})

test('getReadIds is empty when nothing has been stored', () => {
  assert.equal(getReadIds().size, 0)
})

test('saveReadIds then getReadIds round-trips the ids', () => {
  saveReadIds(['a::2026-09-01::10:00', 'b::2026-09-02::'])
  const ids = getReadIds()
  assert.equal(ids.size, 2)
  assert.ok(ids.has('a::2026-09-01::10:00'))
  assert.ok(ids.has('b::2026-09-02::'))
})

test('saveReadIds accepts a Set (any iterable) and serializes to an array', () => {
  saveReadIds(new Set(['x', 'y']))
  const raw = localStorage.getItem(READ_STORAGE_KEY)
  assert.deepEqual(JSON.parse(raw ?? 'null'), ['x', 'y'])
})

test('saveReadIds writes only the read-state key and never the application data key', () => {
  saveReadIds(['a', 'b'])
  assert.ok(localStorage.getItem(READ_STORAGE_KEY))
  // §17 data safety: application storage must be left completely untouched.
  assert.equal(localStorage.getItem('jobtrack_applications'), null)
})
