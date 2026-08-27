import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Session } from '@supabase/supabase-js'
import { resolveAuthGate } from './authGate.ts'

// Minimal stand-in: the gate only checks presence, never reads Session fields.
const fakeSession = {} as Session

test('resolveAuthGate waits while the initial check is loading', () => {
  assert.equal(resolveAuthGate({ loading: true, session: null }), 'loading')
  // Loading wins even if a session is present, avoiding a premature render.
  assert.equal(
    resolveAuthGate({ loading: true, session: fakeSession }),
    'loading',
  )
})

test('resolveAuthGate redirects when settled with no session', () => {
  assert.equal(resolveAuthGate({ loading: false, session: null }), 'redirect')
})

test('resolveAuthGate renders content when a session is present', () => {
  assert.equal(
    resolveAuthGate({ loading: false, session: fakeSession }),
    'authenticated',
  )
})
