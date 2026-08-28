import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AuthError } from '@supabase/supabase-js'
import {
  emailAlreadyRegisteredMessage,
  signUpErrorMessage,
} from './signupErrors.ts'

/** Build a minimal AuthError-shaped object for the fields the mapper reads. */
function authError(fields: {
  code?: string
  status?: number
  message?: string
}): AuthError {
  return {
    code: fields.code,
    status: fields.status,
    message: fields.message ?? '',
  } as unknown as AuthError
}

test('signUpErrorMessage maps null (rejected/offline) to the network message', () => {
  assert.match(signUpErrorMessage(null), /could not reach the server/i)
})

test('signUpErrorMessage maps a code/status-less error to the network message', () => {
  assert.match(signUpErrorMessage(authError({})), /could not reach the server/i)
})

test('signUpErrorMessage maps an already-registered email to a friendly message', () => {
  assert.match(
    signUpErrorMessage(authError({ code: 'user_already_exists', status: 422 })),
    /already exists/i,
  )
  assert.match(
    signUpErrorMessage(
      authError({ status: 400, message: 'User already registered' }),
    ),
    /already exists/i,
  )
})

test('signUpErrorMessage maps a weak password to a friendly message', () => {
  assert.match(
    signUpErrorMessage(authError({ code: 'weak_password', status: 422 })),
    /stronger password/i,
  )
})

test('signUpErrorMessage maps an invalid-email code', () => {
  assert.equal(
    signUpErrorMessage(authError({ code: 'email_address_invalid', status: 400 })),
    'Enter a valid email address.',
  )
})

test('signUpErrorMessage maps rate limiting (429) to a wait message', () => {
  assert.match(
    signUpErrorMessage(authError({ status: 429 })),
    /too many attempts/i,
  )
})

test('signUpErrorMessage returns a generic message for unknown errors', () => {
  assert.equal(
    signUpErrorMessage(authError({ code: 'weird', status: 500, message: 'boom' })),
    'Something went wrong creating your account. Please try again.',
  )
})

test('signUpErrorMessage never echoes raw error text', () => {
  const raw = 'secret token abcdef123456'
  assert.ok(!signUpErrorMessage(authError({ status: 500, message: raw })).includes(raw))
})

test('emailAlreadyRegisteredMessage matches the already-exists error copy', () => {
  // The enumeration-safe duplicate path must show the exact same message a
  // user_already_exists error would, so the two code paths stay indistinguishable.
  assert.equal(
    emailAlreadyRegisteredMessage(),
    signUpErrorMessage(authError({ code: 'user_already_exists', status: 422 })),
  )
  assert.match(emailAlreadyRegisteredMessage(), /already exists/i)
})
