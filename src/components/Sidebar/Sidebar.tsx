import { Link, NavLink, useLocation } from 'react-router-dom'
import { CloseIcon, CollapseIcon } from '../icons/Icons'
import { useNotifications } from '../Notifications/useNotifications'
import { NAV_ITEMS } from './navItems'
import SidebarUser from './SidebarUser'

interface SidebarProps {
  /** Desktop: collapse to an icon-only rail. */
  collapsed: boolean
  /** Mobile: whether the off-canvas drawer is open. */
  mobileOpen: boolean
  /** Toggle the desktop collapsed rail. */
  onToggleCollapse: () => void
  /** Close the mobile drawer (also called after navigating from it). */
  onClose: () => void
}

/** Nav link classes; layout tightens to a centered icon when collapsed. */
function getNavLinkClass(collapsed: boolean, isActive: boolean): string {
  const base = `relative flex items-center rounded-xl text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
  }`
  return isActive
    ? `${base} bg-primary/10 font-semibold text-primary`
    : `${base} text-muted-foreground hover:bg-muted hover:text-foreground`
}

/**
 * The sidebar's inner content (brand, nav, collapse control, user footer), shared
 * by the desktop rail and the mobile drawer. Purely presentational: it uses
 * react-router links and the declarative NAV_ITEMS, and never touches data or
 * storage. The user footer reads the real signed-in user via SidebarUser.
 */
function SidebarBody({
  collapsed,
  onNavigate,
  showClose,
  onClose,
  onToggleCollapse,
}: {
  collapsed: boolean
  onNavigate?: () => void
  showClose?: boolean
  onClose?: () => void
  onToggleCollapse?: () => void
}) {
  const location = useLocation()
  const { badge } = useNotifications()

  return (
    <div className="flex h-full flex-col border-r border-border bg-surface text-foreground">
      <div
        className={`flex h-16 shrink-0 items-center border-b border-border ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <Link
          to="/"
          onClick={onNavigate}
          aria-label="JobTrack home"
          className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src="/assets/logo.png"
            alt=""
            className="h-9 w-9 shrink-0 rounded-xl object-cover"
          />
          {collapsed ? null : (
            <span className="text-lg font-bold tracking-tight text-foreground">
              JobTrack
            </span>
          )}
        </Link>
        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {collapsed ? null : (
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active =
            item.to === '/dashboard'
              ? location.pathname === '/dashboard' || location.pathname === '/'
              : item.to === '/application-pipeline'
                ? location.pathname === '/application-pipeline' || location.pathname === '/pipeline'
                : location.pathname === item.to

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              className={getNavLinkClass(collapsed, active)}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-primary ${
                    collapsed ? 'h-6 w-0.5' : 'h-5 w-1'
                  }`}
                />
              ) : null}
              <Icon className="h-5 w-5 shrink-0" />
              {collapsed ? null : <span className="truncate">{item.label}</span>}
              {item.to === '/notifications' && badge ? (
                <span
                  aria-hidden="true"
                  className={`inline-flex items-center justify-center rounded-full bg-primary font-bold text-primary-foreground ${
                    collapsed
                      ? 'absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px]'
                      : 'ml-auto h-5 min-w-5 px-1.5 text-xs'
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>

      {onToggleCollapse ? (
        <div className="shrink-0 border-t border-border p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex w-full items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
            }`}
          >
            <CollapseIcon
              className={`h-5 w-5 shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            />
            {collapsed ? null : <span>Collapse</span>}
          </button>
        </div>
      ) : null}

      <SidebarUser collapsed={collapsed} />
    </div>
  )
}

/**
 * The application sidebar. On desktop (lg+) it is an in-flow, collapsible rail;
 * below lg it becomes an off-canvas drawer with a backdrop, toggled from the
 * Header. Navigation state (collapsed / open) is owned by AppLayout and passed in
 * — this component is presentation only.
 */
function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onClose,
}: SidebarProps) {
  return (
    <>
      <aside
        className={`hidden shrink-0 transition-[width] duration-200 ease-in-out lg:block ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarBody collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-label="Sidebar"
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
      >
        <SidebarBody
          collapsed={false}
          onNavigate={onClose}
          showClose
          onClose={onClose}
        />
      </aside>
    </>
  )
}

export default Sidebar
