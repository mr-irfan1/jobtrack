/**
 * App path that Supabase should send the password-recovery email link back to.
 * The reset page itself is built in a later step; the service only needs the
 * path now so it can construct the redirect URL.
 */
export const RESET_PASSWORD_PATH = '/reset-password'

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
