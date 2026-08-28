import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

function AuthCallbackView() {
  const { session, loading, error } = useAuth()

  if (session) {
    return <Navigate to="/" replace />
  }

  if (error) {
    return <Navigate to="/login" replace state={{ authError: error.message }} />
  }

  if (!loading && !session) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h2 className="text-base font-semibold text-foreground">
          Completing authentication...
        </h2>
        <p className="text-xs text-muted-foreground">
          Please wait while we log you into JobTrack.
        </p>
      </div>
    </div>
  )
}

export default AuthCallbackView
