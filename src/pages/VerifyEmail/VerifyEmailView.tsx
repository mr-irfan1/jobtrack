import { Link, Navigate } from 'react-router-dom'
import AuthHero from '../../components/auth/AuthHero'
import AuthShell from '../../components/auth/AuthShell'
import { authPrimaryButton, authSecondaryLink } from '../../components/auth/authTheme'
import { useAuth } from '../../auth/useAuth'
import { resolveVerifyEmailGate } from './verifyEmailGate'

/** Verify hero: same brand/journey language as the rest of the auth flow. */
const verifyHero = (
  <AuthHero
    headline={
      <>
        Confirming your
        <br />
        email address.
      </>
    }
    subheadline="Track applications, stay organized, and never lose sight of your next opportunity."
    activeStep={1}
  />
)

/**
 * Presentational Verify Email page — the landing route for Supabase's signup
 * verification (magic) link. It owns no form state: like RequireAuth it reads the
 * global auth state via useAuth() and derives one of three states through the
 * pure resolveVerifyEmailGate, never touching Supabase or reading tokens from the
 * URL (the SDK's detectSessionInUrl establishes the session, which AuthProvider
 * exposes).
 *
 * - loading: the initial session check is still running.
 * - verified: a session exists — the email is confirmed, so continue into the
 *   app exactly like any signed-in user (RequireAuth admits them at "/").
 * - invalid: settled with no session — the link was invalid, already used, or
 *   expired; show a graceful message and a path to get a fresh link.
 *
 * Rendered full-screen via the public /verify-email route.
 */
function VerifyEmailView() {
  const { loading, session } = useAuth()
  const decision = resolveVerifyEmailGate({ loading, session })

  // 1. Still resolving the session established from the verification link.
  if (decision === 'loading') {
    return (
      <AuthShell hero={verifyHero}>
        <p role="status" className="text-sm text-muted-foreground">
          Confirming your email…
        </p>
      </AuthShell>
    )
  }

  // 2. Verified: a live session exists. Continue through the normal auth flow —
  // send the user to the dashboard, which RequireAuth admits.
  if (decision === 'verified') {
    return <Navigate to="/" replace />
  }

  // 3. Invalid/expired link: no usable session. Explain and offer a fresh start.
  return (
    <AuthShell hero={verifyHero}>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
          Verification link invalid
        </h1>
      </div>
      <div
        role="alert"
        className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger-fg"
      >
        Your email verification link is invalid or has expired. Please sign up
        again to receive a new link.
      </div>
      <div className="mt-6">
        <Link to="/signup" className={authPrimaryButton}>
          Back to sign up
        </Link>
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already confirmed?{' '}
        <Link to="/login" className={authSecondaryLink}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export default VerifyEmailView
