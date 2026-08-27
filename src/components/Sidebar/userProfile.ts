/**
 * Pure, framework-free helpers for presenting the signed-in user in the sidebar.
 *
 * They take only the raw name/email strings (never the Supabase client or React)
 * so the "what do we show for this user" rules can be unit-tested in isolation.
 * Nothing here fabricates identity: with no real name we fall back to the email's
 * local part, and only when neither exists do we use a neutral generic label.
 */

/** Best human-readable source for this user: real name, else the email local part. */
function pickSource(fullName?: string, email?: string): string {
  const name = fullName?.trim()
  if (name) return name
  const local = email?.split('@')[0]?.trim()
  return local ?? ''
}

/** Display name for the profile row (never empty; neutral when nothing is known). */
export function displayName(fullName?: string, email?: string): string {
  return pickSource(fullName, email) || 'Your account'
}

/** Up to two uppercase initials for the avatar, derived from the name or email. */
export function initials(fullName?: string, email?: string): string {
  const parts = pickSource(fullName, email)
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? ''
  const letters =
    parts.length === 1 ? first.slice(0, 2) : first.charAt(0) + last.charAt(0)
  return letters.toUpperCase()
}
