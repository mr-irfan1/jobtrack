import type { AuthError } from '@supabase/supabase-js'

/**
 * Map a Supabase sign-in error to a short, user-friendly message.
 *
 * The provider/service layer preserves the raw AuthError; this is where the
 * Login feature decides what a person actually sees. It never exposes raw
 * technical detail, tokens, or internals — only these vetted strings. Pure and
 * connection-free so it can be unit-tested with plain error-shaped objects.
 *
 * `null` means the promise rejected before any response (offline / unexpected
 * throw), which the ViewModel maps to the network message.
 */

const GENERIC = 'Something went wrong signing you in. Please try again.'
const NETWORK =
  'We could not reach the server. Check your connection and try again.'
const INVALID_CREDENTIALS = 'Incorrect email or password. Please try again.'
const EMAIL_NOT_CONFIRMED =
  'Please confirm your email address before signing in. Check your inbox for the confirmation link.'
const RATE_LIMITED = 'Too many attempts. Please wait a moment and try again.'

export function signInErrorMessage(error: AuthError | null): string {
  if (!error) return NETWORK

  const { code, status } = error

  // Per the SDK docs, failures that occur before a response is received carry
  // neither a code nor a status — i.e. a network-level problem.
  if (code === undefined && status === undefined) return NETWORK

  if (code === 'invalid_credentials') return INVALID_CREDENTIALS
  if (code === 'email_not_confirmed') return EMAIL_NOT_CONFIRMED
  if (status === 429 || code === 'over_request_rate_limit') return RATE_LIMITED

  // Fallback for older servers that send only a message (no stable code).
  const message = error.message.toLowerCase()
  if (message.includes('invalid login credentials')) return INVALID_CREDENTIALS
  if (message.includes('email not confirmed')) return EMAIL_NOT_CONFIRMED

  return GENERIC
}
