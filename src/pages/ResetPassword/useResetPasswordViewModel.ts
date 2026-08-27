import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  hasResetPasswordFieldErrors,
  validateResetPasswordForm,
} from './resetPasswordValidation'
import type { ResetPasswordFieldErrors } from './resetPasswordValidation'
import { updatePasswordErrorMessage } from './resetPasswordErrors'
import { resolveResetSessionGate } from './resetSessionGate'
import type { ResetSessionDecision } from './resetSessionGate'

export interface ResetPasswordViewModel {
  sessionState: ResetSessionDecision
  password: string
  confirmPassword: string
  setPassword: (value: string) => void
  setConfirmPassword: (value: string) => void
  fieldErrors: ResetPasswordFieldErrors
  formError: string | null
  submitting: boolean
  succeeded: boolean
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/**
 * ViewModel for the Reset Password page. Reads the global auth state via
 * useAuth() (never Supabase directly) to decide whether the reset form can work:
 * 'loading' while the initial session check runs, 'ready' when a usable
 * recovery/authenticated session exists, 'no-session' otherwise. It owns the form
 * fields, validation errors, a form-level error, the submitting flag, and a
 * success flag. It updates the password through useAuth().updatePassword and
 * never manipulates the session/localStorage or reads tokens from the URL.
 */
export function useResetPasswordViewModel(): ResetPasswordViewModel {
  const { loading, session, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const sessionState = resolveResetSessionGate({ loading, session })

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const errors = validateResetPasswordForm({ password, confirmPassword })
      setFieldErrors(errors)
      if (hasResetPasswordFieldErrors(errors)) return

      setFormError(null)
      setSubmitting(true)

      updatePassword(password)
        .then(({ error }) => {
          if (error) {
            setFormError(updatePasswordErrorMessage(error))
            return
          }
          setSucceeded(true)
        })
        .catch(() => {
          setFormError(updatePasswordErrorMessage(null))
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
    [password, confirmPassword, updatePassword],
  )

  return {
    sessionState,
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    fieldErrors,
    formError,
    submitting,
    succeeded,
    handleSubmit,
  }
}
