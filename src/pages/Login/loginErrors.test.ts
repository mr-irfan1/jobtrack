import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AuthError } from '@supabase/supabase-js'
import { signInErrorMessage } from './loginErrors.ts'

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

test('signInErrorMessage maps null (rejected/offline) to the network message', () => {
  assert.match(signInErrorMessage(null), /could not reach the server/i)
})

test('signInErrorMessage maps a code/status-less error to the network message', () => {
  assert.match(signInErrorMessage(authError({})), /could not reach the server/i)
})

test('signInErrorMessage maps invalid_credentials to a friendly message', () => {
  const message = signInErrorMessage(
    authError({ code: 'invalid_credentials', status: 400 }),
  )
  assert.equal(message, 'Incorrect email or password. Please try again.')
})

test('signInErrorMessage maps email_not_confirmed to a confirmation prompt', () => {
  const message = signInErrorMessage(
    authError({ code: 'email_not_confirmed', status: 400 }),
  )
  assert.match(message, /confirm your email address/i)
})

test('signInErrorMessage maps rate limiting (429) to a wait message', () => {
  assert.match(signInErrorMessage(authError({ status: 429 })), /too many attempts/i)
})

test('signInErrorMessage falls back to message text when no code is present', () => {
  const message = signInErrorMessage(
    authError({ status: 400, message: 'Invalid login credentials' }),
  )
  assert.equal(message, 'Incorrect email or password. Please try again.')
})

test('signInErrorMessage returns a generic message for unknown errors', () => {
  const message = signInErrorMessage(
    authError({ code: 'some_new_code', status: 500, message: 'boom' }),
  )
  assert.equal(message, 'Something went wrong signing you in. Please try again.')
})

test('signInErrorMessage never echoes raw error text', () => {
  const raw = 'DB connection string postgres://user:pass@host'
  const message = signInErrorMessage(authError({ status: 500, message: raw }))
  assert.ok(!message.includes(raw))
})
