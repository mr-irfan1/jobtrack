import { Link, Navigate } from 'react-router-dom'
import AuthField from '../../components/auth/AuthField'
import AuthHero from '../../components/auth/AuthHero'
import AuthShell from '../../components/auth/AuthShell'
import PasswordField from '../../components/auth/PasswordField'
import {
  authPrimaryButton,
  authSecondaryLink,
  authSocialButton,
} from '../../components/auth/authTheme'
import { ArrowRightIcon, GitHubIcon, GoogleIcon } from '../../components/icons/Icons'
import { SIGNUP_SEO } from '../../seo/seo'
import { useDocumentMeta } from '../../seo/useDocumentMeta'
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
    oauthLoadingProvider,
    status,
    handleSubmit,
    handleOAuthSignUp,
  } = useSignupViewModel()

  useDocumentMeta(SIGNUP_SEO)

  // Email confirmation disabled in the Supabase project: signUp returned a
  // session, AuthProvider already holds it, so send the user straight to the
  // dashboard — no interstitial screen. RequireAuth admits them because the
  // session is live. With verification enabled this branch is not reached.
  if (status === 'signed-in') {
    return <Navigate to="/" replace />
  }

  // Primary path with email verification enabled: the account was created but
  // no session was returned, so the user is NOT logged in yet. Supabase has
  // emailed a verification (magic) link; they must click it to confirm before
  // signing in. Never pretend they are authenticated here.
  if (status === 'awaiting-confirmation') {
    return (
      <AuthShell hero={signupHero}>
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
            Confirm your email
          </h1>
        </div>
        <div
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success-fg"
        >
          Your account was created. We&rsquo;ve sent a verification link to{' '}
          <span className="font-medium">{email}</span>. Click it to confirm your
          account, then sign in. If it&rsquo;s not in your inbox, check your spam
          folder.
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

      {/* SOCIAL OAUTH SIGN UP */}
      <div className="mb-6 space-y-3">
        <button
          type="button"
          disabled={submitting || oauthLoadingProvider !== null}
          onClick={() => handleOAuthSignUp('google')}
          className={authSocialButton}
        >
          <GoogleIcon className="h-5 w-5" />
          <span>
            {oauthLoadingProvider === 'google'
              ? 'Connecting to Google...'
              : 'Continue with Google'}
          </span>
        </button>

        <button
          type="button"
          disabled={submitting || oauthLoadingProvider !== null}
          onClick={() => handleOAuthSignUp('github')}
          className={authSocialButton}
        >
          <GitHubIcon className="h-5 w-5" />
          <span>
            {oauthLoadingProvider === 'github'
              ? 'Connecting to GitHub...'
              : 'Continue with GitHub'}
          </span>
        </button>

        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="absolute bg-background px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

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
          disabled={submitting || oauthLoadingProvider !== null}
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
