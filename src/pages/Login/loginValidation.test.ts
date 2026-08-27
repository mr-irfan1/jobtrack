import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  hasLoginFieldErrors,
  isValidEmail,
  validateLoginForm,
} from './loginValidation.ts'

test('validateLoginForm returns no errors for a valid email and password', () => {
  assert.deepEqual(
    validateLoginForm({ email: 'person@example.com', password: 'secret' }),
    {},
  )
})

test('validateLoginForm requires the email', () => {
  const errors = validateLoginForm({ email: '', password: 'secret' })
  assert.equal(errors.email, 'Email is required.')
  assert.equal(errors.password, undefined)
})

test('validateLoginForm treats a whitespace-only email as missing', () => {
  const errors = validateLoginForm({ email: '   ', password: 'secret' })
  assert.equal(errors.email, 'Email is required.')
})

test('validateLoginForm rejects a malformed email', () => {
  const errors = validateLoginForm({ email: 'not-an-email', password: 'secret' })
  assert.equal(errors.email, 'Enter a valid email address.')
})

test('validateLoginForm requires the password', () => {
  const errors = validateLoginForm({ email: 'person@example.com', password: '' })
  assert.equal(errors.password, 'Password is required.')
  assert.equal(errors.email, undefined)
})

test('validateLoginForm reports both fields when both are missing', () => {
  const errors = validateLoginForm({ email: '', password: '' })
  assert.equal(errors.email, 'Email is required.')
  assert.equal(errors.password, 'Password is required.')
})

test('isValidEmail accepts a normal address and rejects obvious junk', () => {
  assert.equal(isValidEmail('a@b.co'), true)
  assert.equal(isValidEmail('a@b'), false)
  assert.equal(isValidEmail('a b@c.com'), false)
  assert.equal(isValidEmail('@b.com'), false)
})

test('hasLoginFieldErrors reflects whether any field failed', () => {
  assert.equal(hasLoginFieldErrors({}), false)
  assert.equal(hasLoginFieldErrors({ email: 'Email is required.' }), true)
  assert.equal(hasLoginFieldErrors({ password: 'Password is required.' }), true)
})
