import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  RESET_PASSWORD_PATH,
  VERIFY_EMAIL_PATH,
  authRedirectUrl,
} from './authRedirects.ts'

test('authRedirectUrl joins origin and path with a single slash', () => {
  assert.equal(
    authRedirectUrl('https://app.example.com', '/reset-password'),
    'https://app.example.com/reset-password',
  )
})

test('authRedirectUrl adds a leading slash when the path lacks one', () => {
  assert.equal(
    authRedirectUrl('https://app.example.com', 'reset-password'),
    'https://app.example.com/reset-password',
  )
})

test('authRedirectUrl collapses a trailing slash on the origin', () => {
  assert.equal(
    authRedirectUrl('https://app.example.com/', '/reset-password'),
    'https://app.example.com/reset-password',
  )
})

test('authRedirectUrl preserves a localhost origin with a port', () => {
  assert.equal(
    authRedirectUrl('http://localhost:5173', RESET_PASSWORD_PATH),
    'http://localhost:5173/reset-password',
  )
})

test('RESET_PASSWORD_PATH points at the reset-password route', () => {
  assert.equal(RESET_PASSWORD_PATH, '/reset-password')
})

test('VERIFY_EMAIL_PATH points at the verify-email route', () => {
  assert.equal(VERIFY_EMAIL_PATH, '/verify-email')
})

test('authRedirectUrl builds the signup verification redirect for the live origin', () => {
  assert.equal(
    authRedirectUrl('https://www.jobtrack.co.in', VERIFY_EMAIL_PATH),
    'https://www.jobtrack.co.in/verify-email',
  )
  // Trailing slash on the production origin collapses to a single separator.
  assert.equal(
    authRedirectUrl('https://www.jobtrack.co.in/', VERIFY_EMAIL_PATH),
    'https://www.jobtrack.co.in/verify-email',
  )
})
