/**
 * Pure, framework-free validation for the login form. Kept separate from the
 * ViewModel so the rules can be unit-tested without React or a Supabase
 * connection. Login intentionally has only minimal rules — the server is the
 * real authority on credentials; these checks just catch obvious mistakes before
 * a network round-trip.
 */

export interface LoginFormValues {
  email: string
  password: string
}

export interface LoginFieldErrors {
  email?: string
  password?: string
}

// Pragmatic email shape check: a non-empty local part, an "@", and a dotted
// domain. Deliberately simple — full RFC 5322 validation belongs on the server,
// not in a login form.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Whether a string looks like a valid email address. */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email)
}

/**
 * Validate the login form. Returns a map of field -> user-facing message; an
 * empty object means the form is valid. Email is required and must look valid;
 * password is required (no complexity rules on sign-in).
 */
export function validateLoginForm(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  const email = values.email.trim()

  if (!email) {
    errors.email = 'Email is required.'
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  }

  return errors
}

/** True when at least one field failed validation. */
export function hasLoginFieldErrors(errors: LoginFieldErrors): boolean {
  return errors.email !== undefined || errors.password !== undefined
}
