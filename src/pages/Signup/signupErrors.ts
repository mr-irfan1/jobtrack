import type { AuthError } from '@supabase/supabase-js'

/**
 * Map a Supabase signup error to a short, user-friendly message — the signup
 * counterpart to loginErrors. Never exposes raw technical detail, tokens, or
 * internals; pure and connection-free for unit testing. `null` means the promise
 * rejected before a response (offline / unexpected), mapped to the network copy.
 */

const GENERIC = 'Something went wrong creating your account. Please try again.'
const NETWORK =
  'We could not reach the server. Check your connection and try again.'
const EMAIL_EXISTS =
  'An account with this email already exists. Try signing in instead.'
const INVALID_EMAIL = 'Enter a valid email address.'
const WEAK_PASSWORD = 'Please choose a stronger password and try again.'
const RATE_LIMITED = 'Too many attempts. Please wait a moment and try again.'

export function signUpErrorMessage(error: AuthError | null): string {
  if (!error) return NETWORK

  const { code, status } = error

  // Failures before a response carry neither code nor status (network-level).
  if (code === undefined && status === undefined) return NETWORK

  if (code === 'user_already_exists' || code === 'email_exists') {
    return EMAIL_EXISTS
  }
  if (code === 'email_address_invalid') return INVALID_EMAIL
  if (code === 'weak_password') return WEAK_PASSWORD
  if (
    status === 429 ||
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit'
  ) {
    return RATE_LIMITED
  }

  // Fallback for servers that send only a message (no stable code).
  const message = error.message.toLowerCase()
  if (
    message.includes('already registered') ||
    message.includes('already been registered')
  ) {
    return EMAIL_EXISTS
  }
  if (
    message.includes('weak password') ||
    message.includes('password should be')
  ) {
    return WEAK_PASSWORD
  }

  return GENERIC
}
