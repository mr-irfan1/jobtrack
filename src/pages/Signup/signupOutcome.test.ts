import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Session, User, UserIdentity } from '@supabase/supabase-js'
import { classifySignupSuccess } from './signupOutcome.ts'

// Minimal stand-ins: the classifier only checks presence of a session and the
// length of the user's identities array, never any other field.
const fakeSession = {} as Session
const userWithIdentities = (identities: UserIdentity[] | undefined): User =>
  ({ identities } as unknown as User)

test('classifySignupSuccess reports signed-in when a session is returned', () => {
  assert.equal(
    classifySignupSuccess({ session: fakeSession, user: userWithIdentities([]) }),
    'signed-in',
  )
  // A session wins regardless of the user payload.
  assert.equal(
    classifySignupSuccess({ session: fakeSession, user: null }),
    'signed-in',
  )
})

test('classifySignupSuccess reports email-exists for an empty identities array', () => {
  assert.equal(
    classifySignupSuccess({ session: null, user: userWithIdentities([]) }),
    'email-exists',
  )
})

test('classifySignupSuccess reports awaiting-confirmation for a real new identity', () => {
  assert.equal(
    classifySignupSuccess({
      session: null,
      user: userWithIdentities([{} as UserIdentity]),
    }),
    'awaiting-confirmation',
  )
})

test('classifySignupSuccess defaults to awaiting-confirmation when the user is absent or identities are unknown', () => {
  assert.equal(
    classifySignupSuccess({ session: null, user: null }),
    'awaiting-confirmation',
  )
  assert.equal(
    classifySignupSuccess({
      session: null,
      user: userWithIdentities(undefined),
    }),
    'awaiting-confirmation',
  )
})
