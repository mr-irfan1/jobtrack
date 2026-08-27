import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout/AppLayout'
import RequireAuth from './components/RequireAuth/RequireAuth'
import ApplicationsView from './pages/Applications/ApplicationsView'
import DashboardView from './pages/Dashboard/DashboardView'
import ForgotPasswordView from './pages/ForgotPassword/ForgotPasswordView'
import LoginView from './pages/Login/LoginView'
import ResetPasswordView from './pages/ResetPassword/ResetPasswordView'
import SignupView from './pages/Signup/SignupView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* In-app pages require an authenticated session. RequireAuth gates the
            whole branch (redirecting to /login when signed out) and the standard
            Header + main shell is shared via AppLayout. */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardView />} />
            <Route path="/applications" element={<ApplicationsView />} />
          </Route>
        </Route>
        {/* Public auth pages each render their own full-screen two-column
            shell (AuthShell) — no shared route layout. Paths are unchanged. */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/signup" element={<SignupView />} />
        <Route path="/forgot-password" element={<ForgotPasswordView />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
