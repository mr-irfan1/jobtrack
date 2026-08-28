import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout/AppLayout'
import HomeRoute from './components/HomeRoute/HomeRoute'
import RequireAuth from './components/RequireAuth/RequireAuth'
import SplashCursor from './components/SplashCursor/SplashCursor'
import ApplicationDetailsView from './pages/ApplicationDetails/ApplicationDetailsView'
import ApplicationPipelineView from './pages/ApplicationPipeline/ApplicationPipelineView'
import ApplicationsView from './pages/Applications/ApplicationsView'
import DashboardView from './pages/Dashboard/DashboardView'
import AuthCallbackView from './pages/AuthCallback/AuthCallbackView'
import ForgotPasswordView from './pages/ForgotPassword/ForgotPasswordView'
import InterviewsView from './pages/Interviews/InterviewsView'
import LoginView from './pages/Login/LoginView'
import NotificationsView from './pages/Notifications/NotificationsView'
import PrivacyPolicyView from './pages/PrivacyPolicy/PrivacyPolicyView'
import ResetPasswordView from './pages/ResetPassword/ResetPasswordView'
import SettingsView from './pages/Settings/SettingsView'
import SignupView from './pages/Signup/SignupView'
import TermsView from './pages/Terms/TermsView'
import VerifyEmailView from './pages/VerifyEmail/VerifyEmailView'

function App() {
  return (
    <BrowserRouter>
      <SplashCursor RAINBOW_MODE COLOR="#7C3AED" />
      <Routes>
        {/* "/" is public. HomeRoute serves the marketing LandingView to
            signed-out visitors and crawlers, and the dashboard (inside the app
            shell) to authenticated users via the nested Outlet — so signed-in
            users keep the dashboard at "/" exactly as before. */}
        <Route path="/" element={<HomeRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardView />} />
          </Route>
        </Route>
        {/* Public informational pages (Privacy Policy & Terms) share the main
            AppLayout shell (Header + scrollable main + Footer) without requiring
            authentication. */}
        <Route element={<AppLayout />}>
          <Route path="/privacy-policy" element={<PrivacyPolicyView />} />
          <Route path="/terms" element={<TermsView />} />
        </Route>
        {/* Remaining in-app pages require an authenticated session. RequireAuth
            gates the branch (redirecting to /login when signed out) and the
            standard Header + main shell is shared via AppLayout. */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/applications" element={<ApplicationsView />} />
            <Route path="/applications/:id" element={<ApplicationDetailsView />} />
            <Route path="/application-pipeline" element={<ApplicationPipelineView />} />
            <Route path="/pipeline" element={<ApplicationPipelineView />} />
            <Route path="/interviews" element={<InterviewsView />} />
            <Route path="/notifications" element={<NotificationsView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Route>
        </Route>
        {/* Public auth pages each render their own full-screen two-column
            shell (AuthShell) — no shared route layout. Paths are unchanged.
            /verify-email is the landing route for Supabase's signup
            verification (magic) link. */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/signup" element={<SignupView />} />
        <Route path="/forgot-password" element={<ForgotPasswordView />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route path="/verify-email" element={<VerifyEmailView />} />
        <Route path="/auth/callback" element={<AuthCallbackView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
