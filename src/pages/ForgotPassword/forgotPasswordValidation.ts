/**
 * Pure, framework-free validation for the forgot-password form. Kept separate
 * from the ViewModel so the rules can be unit-tested without React or a Supabase
 * connection, mirroring loginValidation/signupValidation. Only the single field
 * this form needs is validated — nothing more.
 */

export interface ForgotPasswordFormValues {
  email: string
}

export interface ForgotPasswordFieldErrors {
  email?: string
}

// The same pragmatic shape check the other auth forms use, duplicated here so
// each auth page's validation stays self-contained rather than coupling them.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Whether a string looks like a valid email address. */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email)
}

/**
 * Validate the forgot-password form. Returns a map of field -> user-facing
 * message; an empty object means valid. Email is required and must be
 * well-formed — no other rules.
 */
export function validateForgotPasswordForm(
  values: ForgotPasswordFormValues,
): ForgotPasswordFieldErrors {
  const errors: ForgotPasswordFieldErrors = {}

  const email = values.email.trim()
  if (!email) {
    errors.email = 'Email is required.'
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

/** True when at least one field failed validation. */
export function hasForgotPasswordFieldErrors(
  errors: ForgotPasswordFieldErrors,
): boolean {
  return errors.email !== undefined
}
