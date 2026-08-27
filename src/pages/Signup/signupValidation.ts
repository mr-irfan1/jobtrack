/**
 * Pure, framework-free validation for the signup form. Kept separate from the
 * ViewModel so the rules can be unit-tested without React or a Supabase
 * connection, mirroring the Login page's loginValidation. Rules are deliberately
 * minimal and user-friendly — the server remains the real authority.
 */

export interface SignupFormValues {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export interface SignupFieldErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

/**
 * Minimum password length enforced on signup. Kept modest and paired with a
 * clear message; no character-class rules (they hurt UX for little real gain).
 */
export const MIN_PASSWORD_LENGTH = 8

/** Upper bound on the display name, to reject clearly-unreasonable input. */
export const MAX_FULL_NAME_LENGTH = 80

// The same pragmatic shape check the Login form uses, duplicated here so each
// auth page's validation stays self-contained rather than coupling the two.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Whether a string looks like a valid email address. */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email)
}

/**
 * Validate the signup form. Returns a map of field -> user-facing message; an
 * empty object means valid. Full name required (with a sane max length); email
 * required + well-formed; password required + at least MIN_PASSWORD_LENGTH;
 * confirm password required + matching.
 */
export function validateSignupForm(
  values: SignupFormValues,
): SignupFieldErrors {
  const errors: SignupFieldErrors = {}

  const fullName = values.fullName.trim()
  if (!fullName) {
    errors.fullName = 'Full name is required.'
  } else if (fullName.length > MAX_FULL_NAME_LENGTH) {
    errors.fullName = `Full name must be ${MAX_FULL_NAME_LENGTH} characters or fewer.`
  }

  const email = values.email.trim()
  if (!email) {
    errors.email = 'Email is required.'
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.'
  }

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
export function hasSignupFieldErrors(errors: SignupFieldErrors): boolean {
  return (
    errors.fullName !== undefined ||
    errors.email !== undefined ||
    errors.password !== undefined ||
    errors.confirmPassword !== undefined
  )
}
