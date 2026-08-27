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
function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
          <JobTrackFooter />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
