import type { Session, User } from '@supabase/supabase-js'

/**
 * The pair of values the AuthProvider stores. `user` is always kept consistent
 * with `session` (it is derived from it, never set independently) so the two can
 * never drift apart.
 */
export interface AuthSnapshot {
  session: Session | null
  user: User | null
}

/**
 * Derive the {session, user} snapshot to store for a given auth session.
 *
 * Pure and connection-free (no `window`, no Supabase client, no React) so the
 * "user is derived from session" invariant can be unit-tested on its own. The
 * provider calls this for the initial `getSession()` result and for every
 * `onAuthStateChange` event, so all state transitions share one derivation rule:
 * a null session yields a null user.
 */
export function snapshotFromSession(session: Session | null): AuthSnapshot {
  return { session, user: session?.user ?? null }
}
