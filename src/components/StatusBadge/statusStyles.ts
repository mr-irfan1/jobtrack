import type { ApplicationStatus } from '../../types/application'

/**
 * Presentational status color maps, shared by every surface that shows a status
 * (the application card, the dashboard lists and tiles) so a status looks
 * identical everywhere and its colors are defined in one place. Typed as Records
 * over ApplicationStatus, so adding a status to the union is a compile error
 * until a style is defined for it here. Full literal class strings so the
 * Tailwind scanner can see them.
 *
 * Status pills keep their semantic hues in both themes: the light classes are a
 * soft tint + darker text, and the appended `dark:` variants swap to a
 * translucent fill with lighter text so the pill stays legible and on-hue on a
 * dark surface (the `dark:` variant is data-theme driven; see index.css).
 */

/** Pill/badge classes (background + text + inset ring) per status. */
export const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  Wishlist:
    'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/25',
  Applied:
    'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/25',
  Interview:
    'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25',
  Offer:
    'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25',
  Rejected:
    'bg-red-100 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25',
}

/** Small solid dot color per status, for compact indicators (e.g. stat tiles). */
export const STATUS_DOT_CLASSES: Record<ApplicationStatus, string> = {
  Wishlist: 'bg-slate-400',
  Applied: 'bg-blue-500',
  Interview: 'bg-amber-500',
  Offer: 'bg-emerald-500',
  Rejected: 'bg-red-500',
}
