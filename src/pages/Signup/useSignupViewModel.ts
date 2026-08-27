import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  hasSignupFieldErrors,
  validateSignupForm,
} from './signupValidation'
import type { SignupFieldErrors } from './signupValidation'
import { signUpErrorMessage } from './signupErrors'
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
          // Account creation succeeded. Trigger the welcome email as a
          // fire-and-forget side effect: never await or gate on it, so a failed
          // or slow send cannot affect auth state or the dashboard redirect.
          // sendWelcomeEmail never rejects.
          void sendWelcomeEmail({ name: trimmedName, email: trimmedEmail })
          // A session means confirmation is disabled and AuthProvider has signed
          // the user in; no session means confirmation is required. Never fake a
          // login when there is no session.
          setStatus(data.session ? 'signed-in' : 'awaiting-confirmation')
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
