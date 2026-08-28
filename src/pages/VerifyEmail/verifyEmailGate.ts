import type { Session } from '@supabase/supabase-js'

/**
 * The three states the Verify Email callback page can be in, derived purely from
 * the global auth state so the decision is unit-testable without React or
 * Supabase. Mirrors RequireAuth's authGate and the reset flow's resetSessionGate.
 *
 * When a user clicks the verification (magic) link, Supabase confirms the token
 * server-side and redirects back to this route; the SDK's detectSessionInUrl
 * establishes the session, which AuthProvider exposes as `session`. So:
 * 'loading' -> still resolving the session; 'verified' -> a session exists, the
 * email is confirmed and the user can continue into the app; 'invalid' -> the
 * settled state has no session, meaning the link was invalid, already used, or
 * expired. The page never reads tokens from the URL itself.
 */
export type VerifyEmailDecision = 'loading' | 'verified' | 'invalid'

export function resolveVerifyEmailGate(state: {
  loading: boolean
  session: Session | null
}): VerifyEmailDecision {
  if (state.loading) return 'loading'
  if (!state.session) return 'invalid'
  return 'verified'
}
