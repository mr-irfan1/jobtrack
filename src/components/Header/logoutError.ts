import type { AuthError } from '@supabase/supabase-js'

/**
 * Map a Supabase sign-out failure to a short, user-friendly message — the logout
 * counterpart to loginErrors/signupErrors. Sign-out rarely fails and the
 * outcomes are not individually actionable, so the mapping is deliberately
 * small. Never exposes raw error detail, tokens, sessions, or credentials; pure
 * and connection-free for unit testing. `null` means the promise rejected before
 * a response (offline / unexpected), mapped to the network copy.
 */

const GENERIC = 'Something went wrong signing you out. Please try again.'
const NETWORK =
  'We could not reach the server. Check your connection and try again.'

export function signOutErrorMessage(error: AuthError | null): string {
  if (!error) return NETWORK

  const { code, status } = error
  // Failures before a response carry neither code nor status (network-level).
  if (code === undefined && status === undefined) return NETWORK

  return GENERIC
}
