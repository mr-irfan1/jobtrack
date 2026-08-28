import type { ComponentType, SVGProps } from 'react'
import {
  ApplicationsIcon,
  BellIcon,
  CalendarIcon,
  DashboardIcon,
  PipelineIcon,
} from '../icons/Icons'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Match the path exactly (used for the index route so it isn't always active). */
  end?: boolean
}

/**
 * Primary navigation for the app sidebar. Declarative so the Sidebar renders the
 * same set on desktop and in the mobile drawer without duplicating markup.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/applications', label: 'Applications', icon: ApplicationsIcon },
  { to: '/application-pipeline', label: 'Application Pipeline', icon: PipelineIcon },
  { to: '/interviews', label: 'Interviews', icon: CalendarIcon },
  { to: '/notifications', label: 'Notifications', icon: BellIcon },
]
