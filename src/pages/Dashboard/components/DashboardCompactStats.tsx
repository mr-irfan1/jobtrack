import { Link } from 'react-router-dom'
import type { StatusCounts } from '../dashboardStats'

interface DashboardCompactStatsProps {
  statusCounts: StatusCounts
  followUpsDueCount: number
}

/**
 * Secondary compact summary metrics.
 * Quiet, restrained inline cards or row that do NOT dominate the initial viewport.
 */
function DashboardCompactStats({
  statusCounts,
  followUpsDueCount,
}: DashboardCompactStatsProps) {
  const activeApplications =
    statusCounts.Applied + statusCounts.Interview + statusCounts.Wishlist

  const stats = [
    {
      label: 'Active Applications',
      value: activeApplications,
      to: '/applications',
    },
    {
      label: 'Interviews',
      value: statusCounts.Interview,
      to: '/interviews',
    },
    {
      label: 'Offers',
      value: statusCounts.Offer,
      to: '/application-pipeline',
    },
    {
      label: 'Follow-ups Due',
      value: followUpsDueCount,
      to: '/follow-ups',
    },
  ]

  return (
    <section aria-label="Application Summary" className="pt-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="rounded-2xl border border-border/40 bg-surface dark:bg-surface-elevated/40 px-4 py-3 shadow-2xs hover:border-border transition-colors group"
          >
            <p className="text-xl font-bold tabular-nums text-foreground group-hover:text-primary transition-colors">
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {item.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default DashboardCompactStats
