import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pageTitleForPath } from './pageTitle.ts'

test('pageTitleForPath returns Dashboard for the index route', () => {
  assert.equal(pageTitleForPath('/'), 'Dashboard')
})

test('pageTitleForPath returns Job Feed for the jobs route', () => {
  assert.equal(pageTitleForPath('/jobs'), 'Job Feed')
})

test('pageTitleForPath returns Saved Jobs for the saved-jobs route', () => {
  assert.equal(pageTitleForPath('/saved-jobs'), 'Saved Jobs')
})

test('pageTitleForPath returns Applications for the applications route', () => {
  assert.equal(pageTitleForPath('/applications'), 'Applications')
})

test('pageTitleForPath returns Follow-ups for the follow-ups route', () => {
  assert.equal(pageTitleForPath('/follow-ups'), 'Follow-ups')
})

test('pageTitleForPath returns Resume Center for the resumes route', () => {
  assert.equal(pageTitleForPath('/resumes'), 'Resume Center')
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
