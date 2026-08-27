import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  hasForgotPasswordFieldErrors,
  validateForgotPasswordForm,
} from './forgotPasswordValidation.ts'

test('validateForgotPasswordForm requires an email', () => {
  assert.equal(
    validateForgotPasswordForm({ email: '' }).email,
    'Email is required.',
  )
  assert.equal(
    validateForgotPasswordForm({ email: '   ' }).email,
    'Email is required.',
  )
})

test('validateForgotPasswordForm rejects a malformed email', () => {
  assert.equal(
    validateForgotPasswordForm({ email: 'nope' }).email,
    'Enter a valid email address.',
  )
})

test('validateForgotPasswordForm accepts a valid email', () => {
  assert.deepEqual(validateForgotPasswordForm({ email: 'ada@example.com' }), {})
})

test('hasForgotPasswordFieldErrors reflects whether the email failed', () => {
  assert.equal(hasForgotPasswordFieldErrors({}), false)
  assert.equal(
    hasForgotPasswordFieldErrors({ email: 'Email is required.' }),
    true,
  )
})
