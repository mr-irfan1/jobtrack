import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { resolveAuthGate } from './authGate'

/**
 * Route guard for authenticated-only areas. Rendered as a layout route wrapping
 * the in-app shell, so its <Outlet /> is the protected page tree.
 *
 * Reads the single source of truth via useAuth() (never Supabase directly):
 * - while the initial session check runs, shows an accessible loading state;
 * - with no session, redirects to /login, stashing the attempted location in
 *   history state so a future login flow can send the user back;
 * - with a session, renders the nested routes.
 */
function RequireAuth() {
  const { loading, session } = useAuth()
  const location = useLocation()

  const decision = resolveAuthGate({ loading, session })

  if (decision === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p role="status" className="text-sm text-muted-foreground">
          Loading…
        </p>
      </div>
    )
  }

  if (decision === 'redirect') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default RequireAuth
