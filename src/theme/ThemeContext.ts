import { createContext } from 'react'
import type { Theme } from './themePreference'

/**
 * The value exposed by the theme context (read via {@link useTheme}).
 *
 * This layer is UI-only: it carries the current `theme` plus the two ways to
 * change it (`setTheme` for an explicit value, `toggleTheme` for flip). It holds
 * no auth or application state and is entirely independent of the AuthProvider.
 */
export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/**
 * Kept in its own module (not ThemeProvider.tsx) so the provider file exports
 * only a component — this keeps React Fast Refresh happy and lets the context be
 * imported without pulling in the provider. Mirrors the auth/ split
 * (AuthContext.ts). Defaults to `undefined` so {@link useTheme} can detect and
 * reject usage outside a <ThemeProvider>.
 */
export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
)
