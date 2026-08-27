import type { AuthError } from '@supabase/supabase-js'

/**
 * Map a Supabase password-reset failure to a short, user-friendly message — the
 * forgot-password counterpart to loginErrors/signupErrors. Never exposes raw
 * technical detail, tokens, sessions, or internals; pure and connection-free for
 * unit testing. `null` means the promise rejected before a response (offline /
 * unexpected), mapped to the network copy.
 *
 * Note: for account-enumeration protection the caller treats any non-error
 * response identically whether or not the address is registered, so this mapper
 * only ever runs for genuine transport / rate-limit / unknown failures.
 */

const GENERIC = 'Something went wrong sending the reset link. Please try again.'
const NETWORK =
  'We could not reach the server. Check your connection and try again.'
const RATE_LIMITED = 'Too many attempts. Please wait a moment and try again.'

export function sendPasswordResetErrorMessage(error: AuthError | null): string {
  if (!error) return NETWORK

  const { code, status } = error

  // Failures before a response carry neither code nor status (network-level).
  if (code === undefined && status === undefined) return NETWORK

  if (
    status === 429 ||
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit'
  ) {
    return RATE_LIMITED
  }

  return GENERIC
}
