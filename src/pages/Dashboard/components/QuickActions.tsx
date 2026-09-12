import { Link } from 'react-router-dom'
import {
  ApplicationsIcon,
  BookmarkIcon,
  BriefcaseIcon,
  ClockArrowIcon,
  DocumentTextIcon,
} from '../../../components/icons/Icons'
import type { ReactNode } from 'react'

interface QuickActionItem {
  to: string
  label: string
  icon: ReactNode
}

const SHORTCUT_LINKS: QuickActionItem[] = [
  {
    to: '/jobs',
    label: 'Find Jobs',
    icon: <BriefcaseIcon className="h-4 w-4" />,
  },
  {
    to: '/saved-jobs',
    label: 'Saved Jobs',
    icon: <BookmarkIcon className="h-4 w-4" />,
  },
  {
    to: '/applications',
    label: 'Applications',
    icon: <ApplicationsIcon className="h-4 w-4" />,
  },
  {
    to: '/resumes',
    label: 'Resume Center',
    icon: <DocumentTextIcon className="h-4 w-4" />,
  },
  {
    to: '/follow-ups',
    label: 'Follow-ups',
    icon: <ClockArrowIcon className="h-4 w-4" />,
  },
]

/**
 * Lightweight Quick Actions shortcut row matching Google Developer Program navigation feel.
 * Reduces visual noise; avoids bulky metric-style tiles.
 */
function QuickActions() {
  return (
    <nav
      aria-label="Quick Shortcuts"
      className="flex flex-wrap items-center gap-2 py-1"
    >
      <span className="text-xs font-medium text-muted-foreground mr-1">
        Shortcuts:
      </span>
      {SHORTCUT_LINKS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface dark:bg-surface-elevated/40 px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-muted/60 hover:text-foreground transition-all"
        >
          <span className="text-muted-foreground/80">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default QuickActions
