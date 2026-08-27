import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AuthError } from '@supabase/supabase-js'
import { sendPasswordResetErrorMessage } from './forgotPasswordErrors.ts'

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

test('sendPasswordResetErrorMessage maps null (rejected/offline) to the network message', () => {
  assert.match(
    sendPasswordResetErrorMessage(null),
    /could not reach the server/i,
  )
})

test('sendPasswordResetErrorMessage maps a code/status-less error to the network message', () => {
  assert.match(
    sendPasswordResetErrorMessage(authError({})),
    /could not reach the server/i,
  )
})

test('sendPasswordResetErrorMessage maps rate limiting (429) to a wait message', () => {
  assert.match(
    sendPasswordResetErrorMessage(authError({ status: 429 })),
    /too many attempts/i,
  )
})

test('sendPasswordResetErrorMessage maps the email-send rate-limit code', () => {
  assert.match(
    sendPasswordResetErrorMessage(
      authError({ code: 'over_email_send_rate_limit', status: 429 }),
    ),
    /too many attempts/i,
  )
})

test('sendPasswordResetErrorMessage returns a generic message for unknown errors', () => {
  assert.equal(
    sendPasswordResetErrorMessage(authError({ status: 500, message: 'boom' })),
    'Something went wrong sending the reset link. Please try again.',
  )
})

test('sendPasswordResetErrorMessage never echoes raw error text', () => {
  const raw = 'reset token abcdef123456'
  assert.ok(
    !sendPasswordResetErrorMessage(
      authError({ status: 500, message: raw }),
    ).includes(raw),
  )
})
