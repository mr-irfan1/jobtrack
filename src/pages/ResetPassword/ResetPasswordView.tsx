import { Link } from 'react-router-dom'
import AuthHero from '../../components/auth/AuthHero'
import AuthShell from '../../components/auth/AuthShell'
import PasswordField from '../../components/auth/PasswordField'
import {
  authPrimaryButton,
  authSecondaryLink,
} from '../../components/auth/authTheme'
import { ArrowRightIcon } from '../../components/icons/Icons'
import { MIN_PASSWORD_LENGTH } from './resetPasswordValidation'
import { useResetPasswordViewModel } from './useResetPasswordViewModel'

/** Reset hero: same brand/journey language as the rest of the auth flow. */
const resetHero = (
  <AuthHero
    headline={
      <>
        Almost there.
        <br />
        Set a new password.
      </>
    }
    subheadline="Track applications, stay organized, and never lose sight of your next opportunity."
    activeStep={null}
  />
)

/**
 * Presentational Reset Password page. All behavior (session-state decision,
 * validation, submit, error and success handling) lives in
 * useResetPasswordViewModel; this component only renders one of four states —
 * loading, success, invalid/expired link, or the form — inside the premium
 * two-column auth UI, and wires inputs to the ViewModel. It never touches
 * Supabase or the session directly and never reads tokens from the URL.
 * Rendered full-screen (outside AuthLayout) via the public /reset-password route.
 */
function ResetPasswordView() {
  const {
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
  } = useResetPasswordViewModel()

  // 1. Initial auth/recovery-session check still running.
  if (sessionState === 'loading') {
    return (
      <AuthShell hero={resetHero}>
        <p role="status" className="text-sm text-muted-foreground">
          Loading…
        </p>
      </AuthShell>
    )
  }

  // 2. Password updated successfully.
  if (succeeded) {
    return (
      <AuthShell hero={resetHero}>
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
            Password updated
          </h1>
        </div>
        <div
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success-fg"
        >
          Your password has been changed successfully.
        </div>
        <div className="mt-6">
          <Link to="/login" className={authPrimaryButton}>
            Continue to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  // 3. No usable recovery/authenticated session — the link is invalid or expired.
  if (sessionState === 'no-session') {
    return (
      <AuthShell hero={resetHero}>
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
            Reset link invalid
          </h1>
        </div>
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger-fg"
        >
          Your password reset link is invalid or has expired.
        </div>
        <div className="mt-6">
          <Link to="/forgot-password" className={authPrimaryButton}>
            Request a new reset link
          </Link>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/login" className={authSecondaryLink}>
            Back to sign in
          </Link>
        </p>
      </AuthShell>
    )
  }

  // 4. Ready: a usable session exists, so show the reset form.
  return (
    <AuthShell hero={resetHero}>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter a new password for your account.
        </p>
      </div>

      {formError ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger-fg"
        >
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <PasswordField
          id="password"
          name="password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={fieldErrors.password}
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={fieldErrors.confirmPassword}
        />

        <button
          type="submit"
          disabled={submitting}
          className={authPrimaryButton}
        >
          {submitting ? 'Updating password...' : 'Update password'}
          {submitting ? null : (
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/login" className={authSecondaryLink}>
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export default ResetPasswordView
