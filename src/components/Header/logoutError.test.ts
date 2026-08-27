import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AuthError } from '@supabase/supabase-js'
import { signOutErrorMessage } from './logoutError.ts'

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

test('signOutErrorMessage maps null (rejected/offline) to the network message', () => {
  assert.match(signOutErrorMessage(null), /could not reach the server/i)
})

test('signOutErrorMessage maps a code/status-less error to the network message', () => {
  assert.match(signOutErrorMessage(authError({})), /could not reach the server/i)
})

test('signOutErrorMessage maps a server error to the generic message', () => {
  assert.equal(
    signOutErrorMessage(authError({ status: 500, message: 'boom' })),
    'Something went wrong signing you out. Please try again.',
  )
})

test('signOutErrorMessage never echoes raw error text', () => {
  const raw = 'session token abcdef123456'
  assert.ok(
    !signOutErrorMessage(authError({ status: 500, message: raw })).includes(raw),
  )
})
