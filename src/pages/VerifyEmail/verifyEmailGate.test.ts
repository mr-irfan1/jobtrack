import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Session } from '@supabase/supabase-js'
import { resolveVerifyEmailGate } from './verifyEmailGate.ts'

// Minimal stand-in: the gate only checks presence, never reads Session fields.
const fakeSession = {} as Session

test('resolveVerifyEmailGate waits while auth is loading', () => {
  assert.equal(
    resolveVerifyEmailGate({ loading: true, session: null }),
    'loading',
  )
  // Loading wins even if a session is already present.
  assert.equal(
    resolveVerifyEmailGate({ loading: true, session: fakeSession }),
    'loading',
  )
})

test('resolveVerifyEmailGate reports an invalid link once settled with no session', () => {
  assert.equal(
    resolveVerifyEmailGate({ loading: false, session: null }),
    'invalid',
  )
})

test('resolveVerifyEmailGate reports verified when a session is present', () => {
  assert.equal(
    resolveVerifyEmailGate({ loading: false, session: fakeSession }),
    'verified',
  )
})
