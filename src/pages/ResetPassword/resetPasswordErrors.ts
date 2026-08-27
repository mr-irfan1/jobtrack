import type { AuthError } from '@supabase/supabase-js'

/**
 * Map a Supabase password-update failure to a short, user-friendly message — the
 * reset-password counterpart to loginErrors/signupErrors/forgotPasswordErrors.
 * Never exposes raw technical detail, tokens, sessions, or internals; pure and
 * connection-free for unit testing. `null` means the promise rejected before a
 * response (offline / unexpected), mapped to the network copy.
 */

const GENERIC =
  'Something went wrong updating your password. Please try again.'
const NETWORK =
  'We could not reach the server. Check your connection and try again.'
const SESSION_EXPIRED =
  'Your password reset link is invalid or has expired. Please request a new one.'
const RATE_LIMITED = 'Too many attempts. Please wait a moment and try again.'
const WEAK_PASSWORD = 'Please choose a stronger password and try again.'

export function updatePasswordErrorMessage(error: AuthError | null): string {
  if (!error) return NETWORK

  const { code, status } = error

  // Failures before a response carry neither code nor status (network-level).
  if (code === undefined && status === undefined) return NETWORK

  // A missing/expired recovery (or auth) session — the link can no longer be used.
  if (
    code === 'session_not_found' ||
    code === 'session_expired' ||
    code === 'refresh_token_not_found' ||
    status === 401 ||
    status === 403
  ) {
    return SESSION_EXPIRED
  }
  if (code === 'weak_password') return WEAK_PASSWORD
  if (status === 429 || code === 'over_request_rate_limit') {
    return RATE_LIMITED
  }

  // Fallbacks for servers that send only a message (no stable code).
  const message = error.message.toLowerCase()
  if (
    message.includes('session') &&
    (message.includes('missing') ||
      message.includes('expired') ||
      message.includes('not found'))
  ) {
    return SESSION_EXPIRED
  }
  if (
    message.includes('weak password') ||
    message.includes('password should be')
  ) {
    return WEAK_PASSWORD
  }

  return GENERIC
}
