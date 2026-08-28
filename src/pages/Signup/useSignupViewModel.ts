import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  hasSignupFieldErrors,
  validateSignupForm,
} from './signupValidation'
import type { SignupFieldErrors } from './signupValidation'
import { emailAlreadyRegisteredMessage, signUpErrorMessage } from './signupErrors'
import { classifySignupSuccess } from './signupOutcome'
import { sendWelcomeEmail } from '../../services/welcomeEmailService'

/**
 * Outcome of the signup attempt:
 * - 'idle': not yet submitted, or a submit that failed (the form is shown).
 * - 'awaiting-confirmation': account created but no session returned — email
 *   confirmation is required. The user is NOT logged in.
 * - 'signed-in': account created and a session was returned (confirmation off);
 *   AuthProvider has already updated the global session.
 */
export type SignupStatus = 'idle' | 'awaiting-confirmation' | 'signed-in'

export interface SignupViewModel {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  setFullName: (value: string) => void
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  setConfirmPassword: (value: string) => void
  fieldErrors: SignupFieldErrors
  formError: string | null
  submitting: boolean
  status: SignupStatus
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/**
 * ViewModel for the Signup page. Owns form state, validation errors, a
 * form-level error, the submitting flag, and the post-submit status. Drives
 * account creation through useAuth().signUp — never Supabase/authService
 * directly — and never manipulates the session/localStorage. It distinguishes
 * the two Supabase success shapes (session vs. email-confirmation-required) and
 * never pretends the user is logged in when no session was returned.
 */
export function useSignupViewModel(): SignupViewModel {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<SignupStatus>('idle')

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const trimmedName = fullName.trim()
      const trimmedEmail = email.trim()
      const errors = validateSignupForm({
        fullName: trimmedName,
        email: trimmedEmail,
        password,
        confirmPassword,
      })
      setFieldErrors(errors)
      if (hasSignupFieldErrors(errors)) return

      setFormError(null)
      setSubmitting(true)

      signUp(trimmedEmail, password, trimmedName)
        .then(({ data, error }) => {
          if (error) {
            setFormError(signUpErrorMessage(error))
            return
          }
          // Supabase does not return an error when someone signs up with an
          // email that already belongs to a confirmed account. To avoid leaking
          // which emails are registered, it returns a successful response with
          // an empty identities array and no session. Detect that here so we
          // neither claim a new account was created nor email the existing
          // owner — this is Supabase Auth's own one-account-per-email handling,
          // surfaced to the user rather than reimplemented.
          const outcome = classifySignupSuccess(data)
          if (outcome === 'email-exists') {
            setFormError(emailAlreadyRegisteredMessage())
            return
          }
          // A real account was created (or a session was returned because email
          // confirmation is disabled). Trigger the welcome email as a
          // fire-and-forget side effect: never awaited or gated on, and kept
          // entirely separate from Supabase's verification email. It never
          // rejects, so a failed/slow send cannot affect auth state or routing.
          void sendWelcomeEmail({ name: trimmedName, email: trimmedEmail })
          // 'signed-in' only when a session came back (confirmation disabled);
          // otherwise 'awaiting-confirmation' — the user must click the
          // verification link before signing in. Never fake a login without a
          // session.
          setStatus(outcome)
        })
        .catch(() => {
          setFormError(signUpErrorMessage(null))
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
    [fullName, email, password, confirmPassword, signUp],
  )

  return {
    fullName,
    email,
    password,
    confirmPassword,
    setFullName,
    setEmail,
    setPassword,
    setConfirmPassword,
    fieldErrors,
    formError,
    submitting,
    status,
    handleSubmit,
  }
}
