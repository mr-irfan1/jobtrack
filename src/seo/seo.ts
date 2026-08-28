/**
 * Route-aware SEO content for JobTrack's public pages.
 *
 * JobTrack is a React + Vite single-page app, so one static index.html is served
 * for every route (its defaults describe the public landing page — see
 * index.html). These constants let individual public routes override the
 * document <title>, meta description and canonical while mounted, via
 * {@link useDocumentMeta}. No SEO dependency (react-helmet etc.) is used.
 *
 * Canonicals are hard-pinned to the PRODUCTION origin on purpose: a canonical
 * must point at the live URL, never at a localhost/preview origin. This is the
 * one place a production domain is intentionally hardcoded for SEO — it differs
 * from auth redirects (services/authRedirects.ts), which correctly use the
 * current runtime origin.
 */
export const SITE_ORIGIN = 'https://www.jobtrack.co.in'

export interface RouteSeo {
  /** Full document <title> for the route. */
  title: string
  /** <meta name="description"> content for the route. */
  description: string
  /** Absolute canonical URL for the route (production origin). */
  canonical: string
  /** <meta name="robots"> content for the route. */
  robots?: string
}

/** Build an absolute production URL from a root-relative path (e.g. "/login"). */
export function siteUrl(path: string): string {
  if (path === '/') return `${SITE_ORIGIN}/`
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * The public landing page ("/"). Title/description/canonical are the exact
 * values mirrored statically in index.html so a client-side navigation back to
 * "/" restores them verbatim.
 */
export const LANDING_SEO: RouteSeo = {
  title:
    'JobTrack — Track Jobs, Manage Applications & Land Your Next Opportunity',
  description:
    'JobTrack helps you organize job applications, track application progress, manage interviews, and stay on top of your job search in one place.',
  canonical: siteUrl('/'),
  robots: 'index, follow',
}

/**
 * Login is a returning-user utility page: a plain, non-competitive title that
 * does not fight the landing page for the product's primary keywords.
 */
export const LOGIN_SEO: RouteSeo = {
  title: 'Log in to JobTrack',
  description:
    'Log in to your JobTrack account to manage your job applications, interviews, and job-search progress.',
  canonical: siteUrl('/login'),
  robots: 'index, follow',
}

/** Signup is the public acquisition page — a clear, self-canonical entry point. */
export const SIGNUP_SEO: RouteSeo = {
  title: 'Sign up for JobTrack — Create your account',
  description:
    'Create your JobTrack account to organize job applications, track interviews, and stay on top of your job search.',
  canonical: siteUrl('/signup'),
  robots: 'index, follow',
}

export const PRIVATE_APP_SEO: RouteSeo = {
  title: 'JobTrack App',
  description:
    'Your private JobTrack workspace for managing job applications and interviews.',
  canonical: siteUrl('/'),
  robots: 'noindex, nofollow',
}

export const FORGOT_PASSWORD_SEO: RouteSeo = {
  title: 'Reset your JobTrack password',
  description:
    'Request a password reset link for your JobTrack account.',
  canonical: siteUrl('/forgot-password'),
  robots: 'noindex, nofollow',
}

export const RESET_PASSWORD_SEO: RouteSeo = {
  title: 'Set a new JobTrack password',
  description:
    'Set a new password for your JobTrack account using a valid reset link.',
  canonical: siteUrl('/reset-password'),
  robots: 'noindex, nofollow',
}

export const VERIFY_EMAIL_SEO: RouteSeo = {
  title: 'Verify your JobTrack email',
  description:
    'Confirm the email address for your JobTrack account.',
  canonical: siteUrl('/verify-email'),
  robots: 'noindex, nofollow',
}
