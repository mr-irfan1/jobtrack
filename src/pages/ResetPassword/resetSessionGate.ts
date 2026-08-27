import type { Session } from '@supabase/supabase-js'

/**
 * The three states the Reset Password page can be in, derived purely from the
 * global auth state so the decision is unit-testable without React or Supabase.
 * Mirrors RequireAuth's authGate. The page maps each to UI:
 * 'loading' -> loading indicator, 'ready' -> the reset form,
 * 'no-session' -> the invalid/expired-link message.
 *
 * A recovery session (established by following the reset link) and a normal
 * authenticated session are treated identically: both are usable sessions that
 * updateUser({ password }) can act on, so both allow the form. This relies on
 * AuthProvider already exposing the recovery session as `session` (it handles
 * the PASSWORD_RECOVERY event) — the page never reads tokens from the URL.
 */
export type ResetSessionDecision = 'loading' | 'ready' | 'no-session'

export function resolveResetSessionGate(state: {
  loading: boolean
  session: Session | null
}): ResetSessionDecision {
  if (state.loading) return 'loading'
  if (!state.session) return 'no-session'
  return 'ready'
}
