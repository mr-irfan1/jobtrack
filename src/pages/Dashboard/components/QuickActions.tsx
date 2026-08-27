import { Link } from 'react-router-dom'
import Panel from '../../../components/Panel/Panel'
import {
  ApplicationsIcon,
  ArrowRightIcon,
  PlusIcon,
} from '../../../components/icons/Icons'
import type { ReactNode } from 'react'

interface QuickAction {
  to: string
  label: string
  description: string
  icon: ReactNode
  iconClassName: string
}

// Both actions reuse existing routes only — no new routes or behavior.
const QUICK_ACTIONS: QuickAction[] = [
  {
    to: '/applications',
    label: 'Add Application',
    description: 'Track a new job you’ve applied to.',
    icon: <PlusIcon className="h-5 w-5" />,
    iconClassName: 'bg-primary text-primary-foreground',
  },
  {
    to: '/applications',
    label: 'View Applications',
    description: 'Search, filter and manage your list.',
    icon: <ApplicationsIcon className="h-5 w-5" />,
    iconClassName: 'bg-muted text-muted-foreground',
  },
]

/**
 * Quick actions: shortcuts into the existing application flows. Presentational
 * only — each tile is a react-router Link to an existing route, adding no new
 * behavior.
 */
function QuickActions() {
  return (
    <Panel title="Quick Actions" titleId="quick-actions-heading">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.iconClassName}`}
            >
              {action.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {action.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {action.description}
              </span>
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </Link>
        ))}
      </div>
    </Panel>
  )
}

export default QuickActions
