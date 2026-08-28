import { Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { resolveAuthGate } from '../RequireAuth/authGate'
import LandingView from '../landing/LandingView'

/**
 * Boundary for the "/" route. Unlike RequireAuth (which redirects signed-out
 * visitors to /login), "/" is public: signed-out visitors and crawlers get the
 * marketing LandingView, while authenticated users get the app — the nested
 * <Outlet /> renders AppLayout + the dashboard exactly as before.
 *
 * The auth decision reuses the same tested resolveAuthGate as RequireAuth:
 * - 'loading'       -> the identical centered loading state, so a signed-in user
 *                      refreshing "/" never flashes the public landing page
 *                      before their restored session resolves;
 * - 'redirect'      -> no session, so show the public LandingView (NOT a
 *                      redirect — this route is the landing page);
 * - 'authenticated' -> render the nested in-app routes via <Outlet />.
 *
 * Reads auth only through useAuth(); it never touches Supabase, storage, or CRUD.
 */
function HomeRoute() {
  const { loading, session } = useAuth()

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
    return <LandingView />
  }

  return <Outlet />
}

export default HomeRoute
