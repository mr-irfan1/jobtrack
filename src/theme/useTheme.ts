import { useContext } from 'react'
import { ThemeContext } from './ThemeContext'
import type { ThemeContextValue } from './ThemeContext'

/**
 * Access the current theme and the actions to change it.
 *
 * Must be called from within a <ThemeProvider>. If the context is missing it
 * throws immediately, turning a forgotten provider into a clear, early error
 * instead of a silent `undefined`-access bug. Mirrors {@link useAuth}.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider.')
  }
  return context
}
