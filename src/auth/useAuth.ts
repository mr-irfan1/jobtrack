import { useContext } from 'react'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'

/**
 * Access the global auth state and actions.
 *
 * Must be called from within an <AuthProvider>. If the context is missing it
 * throws immediately, turning a forgotten provider into a clear, early error
 * instead of silent `undefined`-access bugs deep in the UI.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }
  return context
}
