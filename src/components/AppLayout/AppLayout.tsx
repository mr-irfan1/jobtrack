import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../Header/Header'
import Sidebar from '../Sidebar/Sidebar'
import JobTrackFooter from '../Footer/JobTrackFooter'

/**
 * The full-viewport application shell: a persistent, collapsible Sidebar beside a
 * content column (Header above a scrollable main region). Rendered as a layout
 * route so every in-app page shares it via <Outlet />.
 *
 * It owns only presentation state — the desktop collapsed rail and the mobile
 * drawer's open flag — which is local UI concern (the same category as the
 * Applications view's form-open state), so no MVVM boundary is crossed: no data,
 * model, or storage access happens here.
 */
const SIDEBAR_COLLAPSED_KEY = 'jobtrack_sidebar_collapsed'

function AppLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {
        // Ignore quota/storage errors
      }
      return next
    })
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white dark:bg-[#111315] text-foreground">
      <Header onOpenSidebar={() => setMobileOpen(true)} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={handleToggleCollapse}
          onClose={() => setMobileOpen(false)}
        />
        <main className="flex-1 overflow-y-auto bg-[#EEF3FB] dark:bg-[#181a1f] sm:rounded-tl-[36px] lg:rounded-tl-[48px] transition-all duration-150">
          <Outlet />
          <JobTrackFooter />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
