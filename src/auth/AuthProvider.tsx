import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import * as authService from '../services/authService'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'
import { snapshotFromSession } from './authState'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Global session layer for the app.
 *
 * Establishes the current auth session once on mount (via authService, never by
 * touching Supabase directly) and then keeps it live through the SDK's auth
 * state-change events. It owns only auth state + action pass-throughs: it renders
 * no UI of its own, defines no routes, holds no user-facing copy, and never reads
 * localStorage or application data. Consumers read everything through
 * {@link useAuth}. The dependency flow is:
 *
 *   React UI -> useAuth() -> AuthProvider -> authService -> supabaseClient -> Supabase Auth
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<AuthError | null>(null)

  // Initial session check + subscription to future auth changes.
  //
  // Empty deps: this runs once per mount; authService functions and the state
  // setters are all stable. Under React StrictMode (dev) the effect mounts
  // twice — the cleanup unsubscribes the first run's listener before the second
  // subscribes, and the `active` flag drops any late `getSession()` resolution
  // from the discarded first run, so exactly one live subscription remains and
  // no state is set after unmount.
  useEffect(() => {
    let active = true

    // Single derivation point: store session and the user derived from it
    // together so they never drift.
    const applySession = (next: Session | null) => {
      const snapshot = snapshotFromSession(next)
      setSession(snapshot.session)
      setUser(snapshot.user)
    }

    const loadInitialSession = async () => {
      try {
        const { data, error: sessionError } = await authService.getSession()
        if (!active) return
        applySession(data.session)
        setError(sessionError)
      } catch {
        // Unexpected failure reading the stored session (e.g. transient storage
        // access issue). Treat as signed-out; a future ViewModel can retry. No
        // raw error text is surfaced as UI copy.
        if (active) applySession(null)
      } finally {
        // The initial check is complete either way — stop blocking on it.
        if (active) setLoading(false)
      }
    }

    void loadInitialSession()

    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, nextSession) => {
      if (!active) return
      switch (event) {
        case 'SIGNED_OUT':
          applySession(null)
          break
        // PASSWORD_RECOVERY carries a short-lived recovery session. Store it (the
        // same way a normal sign-in is stored) so the future reset-password flow
        // can call updatePassword against it. Deliberately no redirect/navigation
        // here — routing belongs to a later step.
        case 'PASSWORD_RECOVERY':
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
        case 'INITIAL_SESSION':
          applySession(nextSession)
          break
        default:
          // MFA_CHALLENGE_VERIFIED and any future events still carry the current
          // session; keep provider state in sync rather than dropping it.
          applySession(nextSession)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // Actions are thin pass-throughs to authService: no duplicated Supabase logic,
  // no UI messages. Each returns the SDK's native `{ data, error }` so a future
  // ViewModel can react to the outcome. Stable identities (empty deps) keep the
  // context value from changing on every render.
  const signUp = useCallback(
    (email: string, password: string, fullName?: string) =>
      authService.signUp(email, password, fullName),
    [],
  )
  const signIn = useCallback(
    (email: string, password: string) =>
      authService.signInWithPassword(email, password),
    [],
  )
  const signOut = useCallback(() => authService.signOut(), [])
  const sendPasswordReset = useCallback(
    (email: string) => authService.resetPasswordForEmail(email),
    [],
  )
  const updatePassword = useCallback(
    (password: string) => authService.updateUserPassword(password),
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [
      session,
      user,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
