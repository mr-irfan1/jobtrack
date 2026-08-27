import { Link, useLocation } from 'react-router-dom'
import { MenuIcon } from '../icons/Icons'
import NotificationBell from '../Notifications/NotificationBell'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import { pageTitleForPath } from './pageTitle'

interface HeaderProps {
  /** Opens the mobile navigation drawer (the hamburger only shows below lg). */
  onOpenSidebar: () => void
}

/**
 * Top bar of the content column. Primary navigation and the account/logout
 * controls now live in the Sidebar, so the Header stays minimal: on mobile it
 * carries the drawer toggle and a wordmark (the sidebar is hidden on small
 * screens); on desktop it shows the current section title. The right side keeps
 * the existing ThemeToggle. It only reads the route via useLocation() to label
 * the page — it adds no routing, auth, or data logic.
 */
function Header({ onOpenSidebar }: HeaderProps) {
  const { pathname } = useLocation()
  const title = pageTitleForPath(pathname)

  return (
    <header className="shrink-0 border-b border-border bg-surface">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <Link
          to="/"
          aria-label="JobTrack home"
          className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground lg:hidden"
        >
          <img
            src="/assets/logo.png"
            alt=""
            className="h-8 w-8 shrink-0 rounded-lg object-cover"
          />
          JobTrack
        </Link>

        <span className="hidden text-base font-semibold text-foreground lg:block">
          {title}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header
