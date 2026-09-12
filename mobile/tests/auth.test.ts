import assert from 'node:assert/strict'
import { test } from 'node:test'

export function getFriendlyAuthErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.'
  const message = err instanceof Error ? err.message : String(err)
  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (lower.includes('password should be at least 6 characters')) {
    return 'Password must be at least 6 characters long.'
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.'
  }
  return message
}

test('Auth: getFriendlyAuthErrorMessage maps invalid credentials', () => {
  const error = new Error('Invalid login credentials')
  assert.equal(
    getFriendlyAuthErrorMessage(error),
    'Invalid email or password. Please check your credentials and try again.',
  )
})

test('Auth: getFriendlyAuthErrorMessage maps already registered user', () => {
  const error = new Error('User already registered')
  assert.equal(
    getFriendlyAuthErrorMessage(error),
    'An account with this email already exists. Try signing in instead.',
  )
})

test('Auth: getFriendlyAuthErrorMessage maps weak password', () => {
  const error = new Error('Password should be at least 6 characters')
  assert.equal(
    getFriendlyAuthErrorMessage(error),
    'Password must be at least 6 characters long.',
  )
})

test('Auth: getFriendlyAuthErrorMessage maps rate limiting', () => {
  const error = new Error('Too many requests. Rate limit exceeded.')
  assert.equal(
    getFriendlyAuthErrorMessage(error),
    'Too many attempts. Please wait a moment before trying again.',
  )
})

test('Auth: getFriendlyAuthErrorMessage falls back gracefully for unknown errors', () => {
  assert.equal(
    getFriendlyAuthErrorMessage(new Error('Unknown network anomaly')),
    'Unknown network anomaly',
  )
  assert.equal(
    getFriendlyAuthErrorMessage(null),
    'An unexpected error occurred. Please try again.',
  )
})
