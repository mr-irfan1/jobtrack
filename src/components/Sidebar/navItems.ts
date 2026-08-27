import type { ComponentType, SVGProps } from 'react'
import { ApplicationsIcon, DashboardIcon } from '../icons/Icons'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Match the path exactly (used for the index route so it isn't always active). */
  end?: boolean
}

/**
 * Primary navigation for the app sidebar. Declarative so the Sidebar renders the
 * same set on desktop and in the mobile drawer without duplicating markup. Paths
 * match the existing routes in App.tsx — no routes are added or renamed here.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/applications', label: 'Applications', icon: ApplicationsIcon },
]
