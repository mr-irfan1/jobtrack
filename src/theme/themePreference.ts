/**
 * Pure, framework-free helpers for the JobTrack color-theme preference.
 *
 * This module is the one place that knows the storage key, the Theme union, and
 * the "stored preference wins, otherwise follow the system" resolution rule. It
 * is deliberately UI- and React-agnostic (no hooks, no context) so it can be
 * unit-tested directly and reused by both the pre-paint boot script's logic and
 * the ThemeProvider. It never touches auth or application data — the only
 * storage key it references is the theme key.
 */

/** localStorage key holding the user's explicit theme choice ('light' | 'dark'). */
export const THEME_STORAGE_KEY = 'jobtrack_theme'

export type Theme = 'light' | 'dark'

/**
 * Narrow an unknown value (e.g. a raw localStorage string or DOM attribute) to
 * a valid Theme, or null if it isn't one. Anything that isn't exactly 'light'
 * or 'dark' — empty string, legacy value, null, wrong case — is rejected.
 */
export function normalizeTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null
}

/** Map the OS-level dark-mode preference to our Theme union. */
export function systemTheme(prefersDark: boolean): Theme {
  return prefersDark ? 'dark' : 'light'
}

/**
 * Resolve the theme to use at startup: a valid stored preference always wins;
 * with no (or invalid) stored value, fall back to the system preference.
 */
export function resolveInitialTheme(
  stored: unknown,
  prefersDark: boolean,
): Theme {
  return normalizeTheme(stored) ?? systemTheme(prefersDark)
}

/**
 * Apply a theme to the document root. This is the single place React writes the
 * `data-theme` attribute the CSS tokens key off of (the pre-paint script sets
 * the very first value before this ever runs).
 */
export function applyThemeAttribute(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}
