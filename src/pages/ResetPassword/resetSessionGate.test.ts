import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Session } from '@supabase/supabase-js'
import { resolveResetSessionGate } from './resetSessionGate.ts'

// Minimal stand-in: the gate only checks presence, never reads Session fields.
const fakeSession = {} as Session

test('resolveResetSessionGate waits while auth is loading', () => {
  assert.equal(
    resolveResetSessionGate({ loading: true, session: null }),
    'loading',
  )
  // Loading wins even if a session is already present.
  assert.equal(
    resolveResetSessionGate({ loading: true, session: fakeSession }),
    'loading',
  )
})

test('resolveResetSessionGate reports no session once settled with none', () => {
  assert.equal(
    resolveResetSessionGate({ loading: false, session: null }),
    'no-session',
  )
})

test('resolveResetSessionGate is ready when a usable session is present', () => {
  assert.equal(
    resolveResetSessionGate({ loading: false, session: fakeSession }),
    'ready',
  )
})
