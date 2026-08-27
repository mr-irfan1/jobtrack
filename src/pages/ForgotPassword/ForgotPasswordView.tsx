import { Link } from 'react-router-dom'
import AuthField from '../../components/auth/AuthField'
import AuthHero from '../../components/auth/AuthHero'
import AuthShell from '../../components/auth/AuthShell'
import {
  authPrimaryButton,
  authSecondaryLink,
} from '../../components/auth/authTheme'
import { ArrowRightIcon } from '../../components/icons/Icons'
import { useForgotPasswordViewModel } from './useForgotPasswordViewModel'

/** Recovery hero: same brand/journey language as Login/Signup, steps neutral. */
const forgotHero = (
  <AuthHero
    headline={
      <>
        Let&apos;s get you
        <br />
        back on track.
      </>
    }
    subheadline="Track applications, stay organized, and never lose sight of your next opportunity."
    activeStep={null}
  />
)

/**
 * Presentational Forgot Password page. All behavior (validation, submit, error
 * and success handling) lives in useForgotPasswordViewModel; this component only
 * renders the premium two-column auth UI (or the success state) and wires the
 * input to the ViewModel. It never touches Supabase or the session directly, and
 * the success copy stays enumeration-safe exactly as the ViewModel intends.
 * Rendered full-screen (outside AuthLayout) via the /forgot-password route.
 */
function ForgotPasswordView() {
  const {
    email,
    setEmail,
    fieldErrors,
    formError,
    submitting,
    succeeded,
    handleSubmit,
  } = useForgotPasswordViewModel()

  // After a successful request, replace the form with a neutral confirmation
  // that never reveals whether the address is registered (enumeration safety).
  if (succeeded) {
    return (
      <AuthShell hero={forgotHero}>
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
            Check your email
          </h1>
        </div>
        <div
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success-fg"
        >
          If an account exists for this email, we&apos;ve sent instructions to
          reset your password.
        </div>
        <div className="mt-6">
          <Link to="/login" className={authPrimaryButton}>
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell hero={forgotHero}>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the email associated with your account and we&apos;ll send you a
          link to reset your password.
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
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />

        <button
          type="submit"
          disabled={submitting}
          className={authPrimaryButton}
        >
          {submitting ? 'Sending reset link...' : 'Send reset link'}
          {submitting ? null : (
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link to="/login" className={authSecondaryLink}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export default ForgotPasswordView
