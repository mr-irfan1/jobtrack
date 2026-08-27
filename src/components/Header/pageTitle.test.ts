import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pageTitleForPath } from './pageTitle.ts'

test('pageTitleForPath returns Dashboard for the index route', () => {
  assert.equal(pageTitleForPath('/'), 'Dashboard')
})

test('pageTitleForPath returns Applications for the applications route', () => {
  assert.equal(pageTitleForPath('/applications'), 'Applications')
})

test('pageTitleForPath matches nested sub-paths of a non-index route', () => {
  assert.equal(pageTitleForPath('/applications/123'), 'Applications')
})

test('pageTitleForPath does not let the index route swallow other paths', () => {
  assert.notEqual(pageTitleForPath('/applications'), 'Dashboard')
})

test('pageTitleForPath falls back to the app name for unknown routes', () => {
  assert.equal(pageTitleForPath('/settings'), 'JobTrack')
  // A path that merely shares a prefix (no slash boundary) must not match.
  assert.equal(pageTitleForPath('/app'), 'JobTrack')
})
