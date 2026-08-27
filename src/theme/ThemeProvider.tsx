import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from './ThemeContext'
import type { ThemeContextValue } from './ThemeContext'
import {
  applyThemeAttribute,
  normalizeTheme,
  resolveInitialTheme,
  systemTheme,
  THEME_STORAGE_KEY,
} from './themePreference'
import type { Theme } from './themePreference'

interface ThemeProviderProps {
  children: ReactNode
}

/** Current OS dark-mode preference (guards environments without matchMedia). */
function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

/**
 * Seed React state from the attribute the pre-paint script already placed on
 * <html>, so the first render matches the first paint and nothing flashes. If
 * for any reason the attribute is missing, resolve it the same way the script
 * does (stored preference, else system).
 */
function readInitialTheme(): Theme {
  if (typeof document !== 'undefined') {
    const fromAttribute = normalizeTheme(
      document.documentElement.getAttribute('data-theme'),
    )
    if (fromAttribute) return fromAttribute
  }
  let stored: string | null = null
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    stored = null
  }
  return resolveInitialTheme(stored, prefersDark())
}

/** Whether the user has an explicit, stored theme choice (vs. system fallback). */
function hasStoredPreference(): boolean {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY)) !== null
  } catch {
    return false
  }
}

/** Persist an explicit choice; storage failures (private mode) are non-fatal. */
function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore — the in-memory theme still applies for this session.
  }
}

/**
 * UI-only provider for the app's color theme. It owns the current theme and the
 * two actions to change it, keeps the <html data-theme> attribute in sync, and
 * persists an explicit choice to localStorage. It is completely independent of
 * the AuthProvider and never reads or writes application data — the only storage
 * key it touches is `jobtrack_theme`.
 *
 *   React UI -> useTheme() -> ThemeProvider -> localStorage[jobtrack_theme] + <html data-theme>
 *
 * Persistence policy: localStorage is written ONLY on a user-initiated change
 * (setTheme/toggleTheme). A session that merely followed the system preference
 * leaves no stored value, so the OS remains the source of truth until the user
 * actively picks a theme.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme)

  // Reflect the current theme onto <html> whenever it changes. On mount this
  // re-sets the same value the pre-paint script wrote (a no-op visually, so no
  // transition fires). This is the only side effect here — no setState.
  useEffect(() => {
    applyThemeAttribute(theme)
  }, [theme])

  // While the user has NOT chosen a theme, live-follow the OS preference. Once a
  // stored preference exists, the guard makes this listener a no-op so the
  // user's choice is never overridden by an OS change. State is only set inside
  // the event handler (never synchronously during the effect).
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      if (hasStoredPreference()) return
      setThemeState(systemTheme(event.matches))
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    persistTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      persistTheme(next)
      return next
    })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
