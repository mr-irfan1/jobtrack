import assert from 'node:assert/strict'
import { test } from 'node:test'
import { displayName, initials } from './userProfile.ts'

test('displayName returns the trimmed full name when present', () => {
  assert.equal(displayName('  Mohammad Irfan  ', 'x@example.com'), 'Mohammad Irfan')
})

test('displayName prefers the full name over the email', () => {
  assert.equal(displayName('Irfan', 'someone@example.com'), 'Irfan')
})

test('displayName falls back to the email local part when there is no name', () => {
  assert.equal(displayName(undefined, 'jane.doe@example.com'), 'jane.doe')
  assert.equal(displayName('   ', 'jane.doe@example.com'), 'jane.doe')
})

test('displayName uses a neutral label when neither name nor email is available', () => {
  assert.equal(displayName(undefined, undefined), 'Your account')
  assert.equal(displayName('', ''), 'Your account')
})

test('initials builds two letters from a full name', () => {
  assert.equal(initials('Mohammad Irfan', undefined), 'MI')
})

test('initials builds two letters from a single-word name', () => {
  assert.equal(initials('Irfan', undefined), 'IR')
})

test('initials derives from the email local part when there is no name', () => {
  assert.equal(initials(undefined, 'jane.doe@example.com'), 'JD')
  assert.equal(initials(undefined, 'user@example.com'), 'US')
})

test('initials prefers the name over the email', () => {
  assert.equal(initials('Alan Turing', 'zz@example.com'), 'AT')
})

test('initials returns a neutral placeholder when there is nothing to use', () => {
  assert.equal(initials(undefined, undefined), '?')
  assert.equal(initials('   ', ''), '?')
})
