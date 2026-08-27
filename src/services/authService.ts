import { supabase } from './supabaseClient'
import { RESET_PASSWORD_PATH, authRedirectUrl } from './authRedirects'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

/**
 * Thin boundary around `supabase.auth`.
 *
 * Every function delegates straight to the SDK and returns its native
 * `{ data, error }` result unchanged (or the SDK's subscription handle). Nothing
 * is swallowed, so the full, typed `AuthError` reaches the ViewModel/UI layer —
 * which owns mapping errors to user-friendly messages. This module holds no
 * React state, touches no localStorage, performs no navigation, renders no UI,
 * and contains no user-facing copy. It also never logs credentials, tokens, or
 * sessions.
 *
 * Boundary: Auth UI -> Auth ViewModel -> authService -> supabaseClient -> Supabase.
 */

/** Register a new account. An optional display name is stored in Supabase Auth
 * user metadata (`user_metadata.full_name`) so it is preserved for future
 * profile functionality without a separate database table. `emailRedirectTo` is
 * where the confirmation link returns; it uses the live origin so it works in
 * any environment (no hardcoded production domain). */
export function signUp(email: string, password: string, fullName?: string) {
  const name = fullName?.trim()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      // Only attach metadata when a name was supplied; omit it otherwise.
      data: name ? { full_name: name } : undefined,
    },
  })
}

/** Sign in with email + password. */
export function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

/** Sign the current user out (clears the persisted session via the SDK). */
export function signOut() {
  return supabase.auth.signOut()
}

/** Read the current session (null when signed out). */
export function getSession() {
  return supabase.auth.getSession()
}

/** Read the current user, validating the token with Supabase. */
export function getUser() {
  return supabase.auth.getUser()
}

/**
 * Subscribe to auth state changes. Returns the SDK result whose
 * `data.subscription.unsubscribe()` the future AuthProvider must call on
 * cleanup. Intended for that provider — this service does not manage the
 * subscription lifecycle itself.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback)
}

/** Send a password-recovery email whose link returns to the app's
 * /reset-password route on the live origin. */
export function resetPasswordForEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authRedirectUrl(window.location.origin, RESET_PASSWORD_PATH),
  })
}

/** Update the currently authenticated user's password. */
export function updateUserPassword(password: string) {
  return supabase.auth.updateUser({ password })
}
