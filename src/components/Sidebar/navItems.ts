import type { ComponentType, SVGProps } from 'react'
import {
  ApplicationsIcon,
  BellAlertIcon,
  BellIcon,
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockArrowIcon,
  DashboardIcon,
  DocumentTextIcon,
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
  { to: '/jobs', label: 'Job Feed', icon: BriefcaseIcon },
  { to: '/saved-jobs', label: 'Saved Jobs', icon: BookmarkIcon },
  { to: '/job-alerts', label: 'Job Alerts', icon: BellAlertIcon },
  { to: '/applications', label: 'Applications', icon: ApplicationsIcon },
  { to: '/follow-ups', label: 'Follow-ups', icon: ClockArrowIcon },
  { to: '/resumes', label: 'Resume Center', icon: DocumentTextIcon },
  { to: '/application-pipeline', label: 'Application Pipeline', icon: PipelineIcon },
  { to: '/interviews', label: 'Interviews', icon: CalendarIcon },
  { to: '/notifications', label: 'Notifications', icon: BellIcon },
]
