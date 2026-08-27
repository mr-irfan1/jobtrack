import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  hasForgotPasswordFieldErrors,
  validateForgotPasswordForm,
} from './forgotPasswordValidation'
import type { ForgotPasswordFieldErrors } from './forgotPasswordValidation'
import { sendPasswordResetErrorMessage } from './forgotPasswordErrors'

export interface ForgotPasswordViewModel {
  email: string
  setEmail: (value: string) => void
  fieldErrors: ForgotPasswordFieldErrors
  formError: string | null
  submitting: boolean
  succeeded: boolean
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/**
 * ViewModel for the Forgot Password page. Owns the email field, validation
 * errors, a form-level error, the submitting flag, and a success flag. Requests
 * the reset email through useAuth().sendPasswordReset — never Supabase or
 * authService directly — and never manipulates the session/localStorage.
 *
 * On any non-error response it flips to the success state. For account-enumeration
 * protection that success state is deliberately identical whether or not the
 * email is registered (Supabase does not reveal this), so we never branch on
 * account existence.
 */
export function useForgotPasswordViewModel(): ForgotPasswordViewModel {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ForgotPasswordFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const trimmedEmail = email.trim()
      const errors = validateForgotPasswordForm({ email: trimmedEmail })
      setFieldErrors(errors)
      if (hasForgotPasswordFieldErrors(errors)) return

      setFormError(null)
      setSubmitting(true)

      sendPasswordReset(trimmedEmail)
        .then(({ error }) => {
          if (error) {
            setFormError(sendPasswordResetErrorMessage(error))
            return
          }
          setSucceeded(true)
        })
        .catch(() => {
          setFormError(sendPasswordResetErrorMessage(null))
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
    [email, sendPasswordReset],
  )

  return {
    email,
    setEmail,
    fieldErrors,
    formError,
    submitting,
    succeeded,
    handleSubmit,
  }
}
