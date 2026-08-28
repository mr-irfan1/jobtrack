import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { hasLoginFieldErrors, validateLoginForm } from './loginValidation'
import type { LoginFieldErrors } from './loginValidation'
import { signInErrorMessage } from './loginErrors'

export interface LoginViewModel {
  email: string
  password: string
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  /** Per-field validation messages; empty when the form is valid. */
  fieldErrors: LoginFieldErrors
  /** A single form-level message for a failed sign-in attempt. */
  formError: string | null
  submitting: boolean
  oauthLoadingProvider: 'google' | 'github' | null
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  handleOAuthSignIn: (provider: 'google' | 'github') => void
}

/**
 * ViewModel for the Login page. Owns the form's UI state (fields, validation
 * errors, a form-level error, and the submitting flag) and drives the sign-in
 * flow through useAuth() — it never calls Supabase or authService directly, and
 * never manipulates the session/localStorage itself. On success it lets
 * AuthProvider's listener update the global session, then navigates to the
 * originally requested protected route (stashed by RequireAuth in
 * location.state.from) or, by default, to the dashboard. On failure it surfaces
 * a vetted, user-friendly message and never the raw error.
 */
export function useLoginViewModel(): LoginViewModel {
  const { signIn, signInWithOAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(
    (location.state as { authError?: string } | null)?.authError ?? null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<
    'google' | 'github' | null
  >(null)

  const handleOAuthSignIn = useCallback(
    (provider: 'google' | 'github') => {
      setFormError(null)
      setOauthLoadingProvider(provider)
      signInWithOAuth(provider)
        .then(({ error }) => {
          if (error) {
            setFormError(signInErrorMessage(error))
            setOauthLoadingProvider(null)
          }
        })
        .catch(() => {
          setFormError(signInErrorMessage(null))
          setOauthLoadingProvider(null)
        })
    },
    [signInWithOAuth],
  )

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const trimmedEmail = email.trim()
      const errors = validateLoginForm({ email: trimmedEmail, password })
      setFieldErrors(errors)
      if (hasLoginFieldErrors(errors)) return

      setFormError(null)
      setSubmitting(true)

      signIn(trimmedEmail, password)
        .then(({ error }) => {
          if (error) {
            setFormError(signInErrorMessage(error))
            return
          }
          // Success: AuthProvider's auth-state listener has updated the global
          // session. Leave /login for the originally requested protected route
          // (RequireAuth stashes it as location.state.from), defaulting to the
          // dashboard. No session or localStorage is touched here.
          const state = location.state as { from?: Location } | null
          navigate(state?.from ?? '/', { replace: true })
        })
        .catch(() => {
          // Rejected before a response (offline/unexpected). Show the network
          // message; never surface raw error text.
          setFormError(signInErrorMessage(null))
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
    [email, password, signIn, navigate, location.state],
  )

  return {
    email,
    password,
    setEmail,
    setPassword,
    fieldErrors,
    formError,
    submitting,
    oauthLoadingProvider,
    handleSubmit,
    handleOAuthSignIn,
  }
}
