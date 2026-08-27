import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MIN_PASSWORD_LENGTH,
  hasSignupFieldErrors,
  validateSignupForm,
} from './signupValidation.ts'

const valid = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'supersecret',
  confirmPassword: 'supersecret',
}

test('validateSignupForm returns no errors for a valid form', () => {
  assert.deepEqual(validateSignupForm(valid), {})
})

test('validateSignupForm requires the full name', () => {
  const errors = validateSignupForm({ ...valid, fullName: '   ' })
  assert.equal(errors.fullName, 'Full name is required.')
})

test('validateSignupForm rejects an unreasonably long full name', () => {
  const errors = validateSignupForm({ ...valid, fullName: 'a'.repeat(200) })
  assert.match(errors.fullName ?? '', /characters or fewer/)
})

test('validateSignupForm requires a valid email', () => {
  assert.equal(
    validateSignupForm({ ...valid, email: '' }).email,
    'Email is required.',
  )
  assert.equal(
    validateSignupForm({ ...valid, email: 'nope' }).email,
    'Enter a valid email address.',
  )
})

test('validateSignupForm requires a password', () => {
  const errors = validateSignupForm({
    ...valid,
    password: '',
    confirmPassword: '',
  })
  assert.equal(errors.password, 'Password is required.')
})

test('validateSignupForm enforces the minimum password length', () => {
  const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1)
  const errors = validateSignupForm({
    ...valid,
    password: short,
    confirmPassword: short,
  })
  assert.equal(
    errors.password,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  )
})

test('validateSignupForm requires confirming the password', () => {
  const errors = validateSignupForm({ ...valid, confirmPassword: '' })
  assert.equal(errors.confirmPassword, 'Please confirm your password.')
})

test('validateSignupForm rejects mismatched passwords', () => {
  const errors = validateSignupForm({
    ...valid,
    confirmPassword: 'different-value',
  })
  assert.equal(errors.confirmPassword, 'Passwords do not match.')
})

test('hasSignupFieldErrors reflects whether any field failed', () => {
  assert.equal(hasSignupFieldErrors({}), false)
  assert.equal(hasSignupFieldErrors({ email: 'Email is required.' }), true)
})
