import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Session, User } from '@supabase/supabase-js'
import { snapshotFromSession } from './authState.ts'

test('snapshotFromSession returns null user for a null session', () => {
  assert.deepEqual(snapshotFromSession(null), { session: null, user: null })
})

test('snapshotFromSession derives the user from the session', () => {
  const user = { id: 'user-1', email: 'person@example.com' } as unknown as User
  const session = { access_token: 'token', user } as unknown as Session

  const snapshot = snapshotFromSession(session)

  assert.equal(snapshot.session, session)
  assert.equal(snapshot.user, user)
})

test('snapshotFromSession keeps user consistent with session (same reference)', () => {
  const user = { id: 'user-2' } as unknown as User
  const session = { user } as unknown as Session

  // The user must be the session's own user, never fabricated or copied.
  assert.equal(snapshotFromSession(session).user, session.user)
})
