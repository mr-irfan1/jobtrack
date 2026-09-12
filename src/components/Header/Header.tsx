import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { MenuIcon } from '../icons/Icons'
import NotificationBell from '../Notifications/NotificationBell'
import { initials } from '../Sidebar/userProfile'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import { pageTitleForPath } from './pageTitle'

interface HeaderProps {
  /** Opens the mobile navigation drawer (the hamburger only shows below lg). */
  onOpenSidebar: () => void
}

/**
 * Top bar of the content column. Minimal, clean, and calm: provides
 * mobile navigation toggle, context title, notification center, theme toggle,
 * and quick settings access avatar.
 */
function Header({ onOpenSidebar }: HeaderProps) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const title = pageTitleForPath(pathname)

  const metaName = user?.user_metadata?.full_name
  const fullName = typeof metaName === 'string' ? metaName : undefined
  const mono = initials(fullName, user?.email)

  return (
    <header className="shrink-0 bg-white dark:bg-[#111315]">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="inline-flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <Link
          to="/"
          aria-label="JobTrack home"
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-foreground transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src="/assets/logo.png"
            alt=""
            className="h-8 w-8 shrink-0 rounded-xl object-cover shadow-xs"
          />
          <span className="text-base font-bold tracking-tight text-foreground">
            JobTrack
          </span>
        </Link>

        {title !== 'JobTrack' && title !== 'Dashboard' ? (
          <>
            <span className="hidden h-4 w-px bg-border/60 lg:block ml-1" aria-hidden="true" />
            <h1 className="hidden text-sm font-medium tracking-normal text-muted-foreground lg:block">
              {title}
            </h1>
          </>
        ) : (
          <h1 className="sr-only">JobTrack Dashboard</h1>
        )}

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Link
            to="/settings"
            title="Account Settings"
            aria-label="Account Settings"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {mono}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
