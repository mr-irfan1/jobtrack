import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AuthError } from '@supabase/supabase-js'
import { updatePasswordErrorMessage } from './resetPasswordErrors.ts'

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

test('updatePasswordErrorMessage maps null (rejected/offline) to the network message', () => {
  assert.match(updatePasswordErrorMessage(null), /could not reach the server/i)
})

test('updatePasswordErrorMessage maps a code/status-less error to the network message', () => {
  assert.match(
    updatePasswordErrorMessage(authError({})),
    /could not reach the server/i,
  )
})

test('updatePasswordErrorMessage maps a missing/expired session to the invalid-link message', () => {
  assert.match(
    updatePasswordErrorMessage(
      authError({ code: 'session_not_found', status: 401 }),
    ),
    /invalid or has expired/i,
  )
  assert.match(
    updatePasswordErrorMessage(
      authError({ status: 403, message: 'Auth session missing!' }),
    ),
    /invalid or has expired/i,
  )
})

test('updatePasswordErrorMessage maps a weak password to a friendly message', () => {
  assert.match(
    updatePasswordErrorMessage(authError({ code: 'weak_password', status: 422 })),
    /stronger password/i,
  )
})

test('updatePasswordErrorMessage maps rate limiting (429) to a wait message', () => {
  assert.match(
    updatePasswordErrorMessage(authError({ status: 429 })),
    /too many attempts/i,
  )
})

test('updatePasswordErrorMessage returns a generic message for unknown errors', () => {
  assert.equal(
    updatePasswordErrorMessage(
      authError({ code: 'weird', status: 500, message: 'boom' }),
    ),
    'Something went wrong updating your password. Please try again.',
  )
})

test('updatePasswordErrorMessage never echoes raw error text', () => {
  const raw = 'access_token abcdef123456'
  assert.ok(
    !updatePasswordErrorMessage(
      authError({ status: 500, message: raw }),
    ).includes(raw),
  )
})
