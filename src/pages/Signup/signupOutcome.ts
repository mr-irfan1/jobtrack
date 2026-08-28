import type { Session, User } from '@supabase/supabase-js'

/**
 * The three meaningful shapes a *successful* (error-free) Supabase signUp
 * response can take, derived purely from the returned `{ user, session }` so the
 * decision is unit-testable without React or a live Supabase connection. This is
 * the success-path counterpart to signupErrors' error mapping.
 *
 * - 'signed-in': a session was returned. Email confirmation is disabled, so the
 *   user is already authenticated (AuthProvider holds the session).
 * - 'email-exists': no session, and the returned user has an EMPTY identities
 *   array. Supabase Auth returns exactly this (with no error) when the email is
 *   already registered to a confirmed account — its built-in, enumeration-safe
 *   way of enforcing one account per email. We surface it rather than pretend a
 *   new account was created.
 * - 'awaiting-confirmation': no session and a real new identity — the account
 *   was created and Supabase has sent its verification email; the user must
 *   click the link before they can sign in.
 */
export type SignupOutcome = 'signed-in' | 'awaiting-confirmation' | 'email-exists'

/** The subset of the signUp `data` payload this classifier reads. */
export interface SignupSuccessData {
  session: Session | null
  user: User | null
}

export function classifySignupSuccess(data: SignupSuccessData): SignupOutcome {
  // A session always means the user is authenticated now (confirmation off).
  if (data.session) return 'signed-in'

  // Enumeration-safe duplicate signal: a user object whose `identities` array is
  // empty. A genuine new signup carries exactly one identity here; only an
  // already-registered confirmed email comes back empty.
  const identities = data.user?.identities
  if (identities !== undefined && identities.length === 0) return 'email-exists'

  // No session, but a real identity (or, defensively, no user at all): the
  // account was created and awaits email verification.
  return 'awaiting-confirmation'
}
