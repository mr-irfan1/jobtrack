/**
 * App path that Supabase should send the password-recovery email link back to.
 * The reset page itself is built in a later step; the service only needs the
 * path now so it can construct the redirect URL.
 */
export const RESET_PASSWORD_PATH = '/reset-password'

/**
 * App path that Supabase should send the signup verification (magic-link) email
 * back to. Follows the same convention as RESET_PASSWORD_PATH: a dedicated
 * public route that reads the resulting session from AuthProvider and shows a
 * graceful message when the link is invalid or expired. The signup service
 * supplies this as `emailRedirectTo` so confirmation links return to a page the
 * app controls rather than a protected route.
 */
export const VERIFY_EMAIL_PATH = '/verify-email'

/**
 * Join the current app origin with an app path into an absolute redirect URL for
 * Supabase auth emails.
 *
 * Kept pure — the origin is passed in, never read from `window` here — so it can
 * be unit-tested without a browser; the auth service supplies
 * `window.location.origin` at the call site. Collapses a trailing slash on the
 * origin and ensures a single leading slash on the path, so callers may pass
 * either "/path" or "path".
 */
export function authRedirectUrl(origin: string, path: string): string {
  const base = origin.replace(/\/+$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}
