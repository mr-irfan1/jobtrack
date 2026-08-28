import { Link } from 'react-router-dom'
import AuthField from '../../components/auth/AuthField'
import AuthHero from '../../components/auth/AuthHero'
import AuthShell from '../../components/auth/AuthShell'
import PasswordField from '../../components/auth/PasswordField'
import { authPrimaryButton, authSecondaryLink } from '../../components/auth/authTheme'
import { ArrowRightIcon } from '../../components/icons/Icons'
import { LOGIN_SEO } from '../../seo/seo'
import { useDocumentMeta } from '../../seo/useDocumentMeta'
import { useLoginViewModel } from './useLoginViewModel'

/**
 * Presentational Login page. All behavior (validation, submit, error mapping,
 * redirect) lives in useLoginViewModel; this component only renders the premium
 * two-column auth UI and wires inputs to the ViewModel. It never touches
 * Supabase or the session directly. Rendered full-screen (outside AuthLayout)
 * via the /login route.
 */
function LoginView() {
  const {
    email,
    password,
    setEmail,
    setPassword,
    fieldErrors,
    formError,
    submitting,
    handleSubmit,
  } = useLoginViewModel()

  useDocumentMeta(LOGIN_SEO)

  return (
    <AuthShell
      hero={
        <AuthHero
          headline={
            <>
              Welcome back.
              <br />
              Let&apos;s get you hired.
            </>
          }
          subheadline="Track applications, stay organized, and never lose sight of your next opportunity."
          activeStep={null}
        />
      }
    >
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to continue tracking your applications.
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

        <div>
          <PasswordField
            id="password"
            name="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
          />
          <div className="mt-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={authPrimaryButton}
        >
          {submitting ? 'Signing in...' : 'Sign in'}
          {submitting ? null : (
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className={authSecondaryLink}>
          Create account
        </Link>
      </p>
    </AuthShell>
  )
}

export default LoginView
