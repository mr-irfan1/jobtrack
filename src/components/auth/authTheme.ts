/**
 * Shared class strings for the authentication UI (Login / Signup / Forgot /
 * Reset).
 *
 * These are presentation-only Tailwind utility bundles for the auth form column
 * — no behavior, no state. Centralized here so the field components and the auth
 * views stay visually identical without duplicating long class lists. They are
 * routed through the app's theme tokens (`bg-input`, `text-foreground`,
 * `bg-primary`, `ring-ring`, …), so the form side follows Light/Dark like the
 * rest of the app; the AuthShell's video hero is intentionally left pure and
 * un-themed. Kept as a plain constants module (no component export) to match the
 * repo's co-located style-module pattern (e.g. StatusBadge/statusStyles).
 */

/** Input: 48px tall, themed surface, 12px radius, subtle focus ring. */
export const authInputBase =
  'h-12 w-full rounded-xl border border-border bg-input px-4 text-[15px] text-foreground transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/20'

/** Applied in addition to the base when a field is invalid. */
export const authInputError =
  'border-danger focus:border-danger focus:ring-danger/20'

/** Field label: 13px, medium. */
export const authLabel = 'block text-[13px] font-medium text-foreground'

/** Helper/hint text beneath a field (e.g. password length). */
export const authHintText = 'text-[13px] text-muted-foreground'

/** Inline validation / error message beneath a field. */
export const authErrorText = 'text-sm text-danger-fg'

/**
 * Primary action button: full-width, ~52px, accent fill, 12px radius, with a
 * gentle press (active:scale) and a hover-revealed trailing arrow via `group`.
 */
export const authPrimaryButton =
  'group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[15px] font-semibold text-primary-foreground transition duration-150 hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60'

/** Secondary footer link in the JobTrack accent. */
export const authSecondaryLink =
  'rounded font-medium text-primary transition-colors hover:text-primary/80 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
