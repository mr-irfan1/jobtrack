import type { Session } from '@supabase/supabase-js'

/**
 * The three outcomes of the auth gate, derived purely from global auth state so
 * the decision can be unit-tested without React Router or a Supabase connection.
 * RequireAuth maps each to UI: 'loading' -> a loading indicator,
 * 'redirect' -> <Navigate to="/login">, 'authenticated' -> the protected content.
 */
export type AuthGateDecision = 'loading' | 'redirect' | 'authenticated'

/**
 * Decide what a protected route should do given the current auth state.
 *
 * While the initial session check is in flight we wait ('loading') rather than
 * bouncing to /login — otherwise a refresh on a protected page would flash the
 * login screen before the restored session resolves. Once settled, a present
 * session renders the content; its absence redirects.
 */
export function resolveAuthGate(state: {
  loading: boolean
  session: Session | null
}): AuthGateDecision {
  if (state.loading) return 'loading'
  if (!state.session) return 'redirect'
  return 'authenticated'
}
