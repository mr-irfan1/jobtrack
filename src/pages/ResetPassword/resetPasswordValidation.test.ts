import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MIN_PASSWORD_LENGTH,
  hasResetPasswordFieldErrors,
  validateResetPasswordForm,
} from './resetPasswordValidation.ts'

const valid = {
  password: 'supersecret',
  confirmPassword: 'supersecret',
}

test('validateResetPasswordForm returns no errors for a valid form', () => {
  assert.deepEqual(validateResetPasswordForm(valid), {})
})

test('validateResetPasswordForm requires a password', () => {
  const errors = validateResetPasswordForm({
    password: '',
    confirmPassword: '',
  })
  assert.equal(errors.password, 'Password is required.')
})

test('validateResetPasswordForm enforces the minimum password length', () => {
  const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1)
  const errors = validateResetPasswordForm({
    password: short,
    confirmPassword: short,
  })
  assert.equal(
    errors.password,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  )
})

test('validateResetPasswordForm requires confirming the password', () => {
  const errors = validateResetPasswordForm({ ...valid, confirmPassword: '' })
  assert.equal(errors.confirmPassword, 'Please confirm your password.')
})

test('validateResetPasswordForm rejects mismatched confirmation', () => {
  const errors = validateResetPasswordForm({
    ...valid,
    confirmPassword: 'different-value',
  })
  assert.equal(errors.confirmPassword, 'Passwords do not match.')
})

test('hasResetPasswordFieldErrors reflects whether any field failed', () => {
  assert.equal(hasResetPasswordFieldErrors({}), false)
  assert.equal(
    hasResetPasswordFieldErrors({ password: 'Password is required.' }),
    true,
  )
})
