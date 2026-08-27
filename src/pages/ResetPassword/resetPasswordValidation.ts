/**
 * Pure, framework-free validation for the reset-password form. Mirrors the
 * confirm-match logic of the Signup page and applies the same minimum password
 * length. No additional password requirements are invented.
 */

export interface ResetPasswordFormValues {
  password: string
  confirmPassword: string
}

export interface ResetPasswordFieldErrors {
  password?: string
  confirmPassword?: string
}

/**
 * Minimum password length. Duplicated from Signup's MIN_PASSWORD_LENGTH (rather
 * than imported) so each auth page's validation stays self-contained — the same
 * pattern signupValidation uses for its shared EMAIL_PATTERN. Keep these two in
 * step if the convention ever changes.
 */
export const MIN_PASSWORD_LENGTH = 8

/**
 * Validate the reset-password form. Returns a map of field -> user-facing
 * message; an empty object means valid. New password required + at least
 * MIN_PASSWORD_LENGTH; confirm password required + matching.
 */
export function validateResetPasswordForm(
  values: ResetPasswordFormValues,
): ResetPasswordFieldErrors {
  const errors: ResetPasswordFieldErrors = {}

  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

/** True when at least one field failed validation. */
export function hasResetPasswordFieldErrors(
  errors: ResetPasswordFieldErrors,
): boolean {
  return errors.password !== undefined || errors.confirmPassword !== undefined
}
