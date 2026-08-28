import { createContext } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import type {
  resetPasswordForEmail,
  signInWithOAuth,
  signInWithPassword,
  signOut,
  signUp,
  updateUserPassword,
} from '../services/authService'

/**
 * The value exposed by the auth context (read via {@link useAuth}).
 *
 * State (`session`, `user`, `loading`, `error`) is owned by the AuthProvider.
 * The actions are typed via `typeof` of the corresponding authService functions
 * so they stay exact, faithful pass-throughs: the provider adds no logic on top,
 * and each action returns Supabase's native `{ data, error }` result unchanged
 * for a future ViewModel to interpret. `error` holds the actual Supabase
 * `AuthError` from the initial session check (never a UI string) so ViewModels —
 * not this layer — own mapping it to user-facing copy.
 */
export interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  error: AuthError | null
  signUp: typeof signUp
  signIn: typeof signInWithPassword
  signInWithOAuth: typeof signInWithOAuth
  signOut: typeof signOut
  sendPasswordReset: typeof resetPasswordForEmail
  updatePassword: typeof updateUserPassword
}

/**
 * Kept in its own module (not AuthProvider.tsx) so the provider file exports only
 * a component — this keeps React Fast Refresh happy and lets the context be
 * imported without pulling in the provider. Defaults to `undefined` so
 * {@link useAuth} can detect and reject usage outside an <AuthProvider>.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
