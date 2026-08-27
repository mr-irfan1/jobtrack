import { Link, Navigate } from 'react-router-dom'
import AuthField from '../../components/auth/AuthField'
import AuthHero from '../../components/auth/AuthHero'
import AuthShell from '../../components/auth/AuthShell'
import PasswordField from '../../components/auth/PasswordField'
import { authPrimaryButton, authSecondaryLink } from '../../components/auth/authTheme'
import { ArrowRightIcon } from '../../components/icons/Icons'
import { MIN_PASSWORD_LENGTH } from './signupValidation'
import { useSignupViewModel } from './useSignupViewModel'

/** Signup hero: step 1 of the journey is the current page. */
const signupHero = (
  <AuthHero
    headline={
      <>
        Your next opportunity
        <br />
        starts here.
      </>
    }
    subheadline="Track applications, stay organized, and never lose sight of your next opportunity."
    activeStep={1}
  />
)

/**
 * Presentational Signup page. All behavior (validation, submit, response and
 * error handling) lives in useSignupViewModel; this component only renders the
 * premium two-column auth UI (or a success state) and wires inputs to the
 * ViewModel. It never touches Supabase or the session directly. Rendered
 * full-screen (outside AuthLayout) via the /signup route.
 */
function SignupView() {
  const {
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
  } = useSignupViewModel()

  // Confirmation disabled (the project's configured default): the account is
  // created and AuthProvider already holds the returned session, so send the
  // user straight to the dashboard — no interstitial "check your email" screen.
  // RequireAuth admits them because the session is live.
  if (status === 'signed-in') {
    return <Navigate to="/" replace />
  }

  // Fallback, only reachable if email confirmation is still enabled in the
  // Supabase project: no session was returned, so the user is NOT logged in.
  // Point them back to sign in rather than pretending they are authenticated.
  if (status === 'awaiting-confirmation') {
    return (
      <AuthShell hero={signupHero}>
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
            Account created
          </h1>
        </div>
        <div
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success-fg"
        >
          Account created. Please check your email to confirm your account.
        </div>
        <div className="mt-6">
          <Link to="/login" className={authPrimaryButton}>
            Return to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell hero={signupHero}>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
          Create your JobTrack account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start organizing your job search in one place.
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
          id="fullName"
          name="name"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={setFullName}
          error={fieldErrors.fullName}
        />

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

        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={fieldErrors.password}
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
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
          {submitting ? 'Creating account...' : 'Create account'}
          {submitting ? null : (
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className={authSecondaryLink}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export default SignupView
