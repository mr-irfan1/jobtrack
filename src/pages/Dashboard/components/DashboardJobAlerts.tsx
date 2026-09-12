import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellAlertIcon, PlusIcon } from '../../../components/icons/Icons'
import { getAlerts, subscribeJobAlerts } from '../../../services/jobAlertsStore'
import { buildJobFeedUrlFromCriteria } from '../../../services/jobAlertsModel'
import type { JobAlert } from '../../../types/jobAlert'

export function DashboardJobAlerts() {
  const [alerts, setAlerts] = useState<JobAlert[]>(() => getAlerts())

  useEffect(() => {
    const update = () => setAlerts(getAlerts())
    return subscribeJobAlerts(update)
  }, [])

  const activeAlerts = alerts.filter((a) => a.status === 'active')
  const featuredAlert = activeAlerts[0]

  if (alerts.length === 0) {
    return (
      <section aria-labelledby="dashboard-job-alerts-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <BellAlertIcon className="h-4 w-4" />
            </span>
            <h2
              id="dashboard-job-alerts-heading"
              className="text-sm font-semibold tracking-normal text-foreground"
            >
              Job Alerts
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-surface dark:bg-surface-elevated/60 p-4 shadow-2xs">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Never miss a relevant role. Define search criteria and get notified when new matching jobs arrive.
          </p>
          <div className="mt-3">
            <Link
              to="/job-alerts"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Create Job Alert</span>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="dashboard-job-alerts-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <BellAlertIcon className="h-4 w-4" />
          </span>
          <h2
            id="dashboard-job-alerts-heading"
            className="text-sm font-semibold tracking-normal text-foreground"
          >
            Job Alerts
          </h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {activeAlerts.length} active
          </span>
        </div>

        <Link
          to="/job-alerts"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
        >
          <span>Manage</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-border/40 bg-surface dark:bg-surface-elevated/60 shadow-2xs overflow-hidden divide-y divide-border/30">
        {featuredAlert ? (
          <div className="p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="truncate text-xs font-semibold text-foreground block">
                {featuredAlert.name}
              </span>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {featuredAlert.criteria.query
                  ? `"${featuredAlert.criteria.query}"`
                  : 'All titles'}{' '}
                {featuredAlert.criteria.workplace &&
                featuredAlert.criteria.workplace !== 'all'
                  ? `• ${featuredAlert.criteria.workplace}`
                  : ''}
              </p>
            </div>

            <Link
              to={buildJobFeedUrlFromCriteria(featuredAlert.criteria)}
              className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              View Feed
            </Link>
          </div>
        ) : null}

        <div className="bg-muted/20 p-2 text-center">
          <Link
            to="/job-alerts"
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            View all alerts ({alerts.length}) →
          </Link>
        </div>
      </div>
    </section>
  )
}
