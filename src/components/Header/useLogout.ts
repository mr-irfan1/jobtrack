import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { signOutErrorMessage } from './logoutError'

export interface Logout {
  /** Begin signing out. */
  signOut: () => void
  /** True while a sign-out request is in flight (disable the control). */
  signingOut: boolean
  /** User-facing error message if the last attempt failed, else null. */
  error: string | null
}

/**
 * Header logout action. Wraps useAuth().signOut() with a busy flag (to prevent
 * duplicate submissions via a disabled control) and friendly error handling. On
 * success it does NOT navigate or touch the session: AuthProvider clears the
 * session and RequireAuth redirects to /login. Never calls Supabase directly,
 * and never surfaces raw errors.
 */
export function useLogout(): Logout {
  const { signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignOut = useCallback(() => {
    setSigningOut(true)
    setError(null)
    signOut()
      .then(({ error: signOutError }) => {
        if (signOutError) setError(signOutErrorMessage(signOutError))
        // On success: the session clears globally and RequireAuth handles the
        // redirect to /login. Nothing to do here.
      })
      .catch(() => {
        setError(signOutErrorMessage(null))
      })
      .finally(() => {
        setSigningOut(false)
      })
  }, [signOut])

  return { signOut: handleSignOut, signingOut, error }
}
