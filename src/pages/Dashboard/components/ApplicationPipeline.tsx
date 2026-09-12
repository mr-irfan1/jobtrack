import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, PipelineIcon } from '../../../components/icons/Icons'
import { STATUS_DOT_CLASSES } from '../../../components/StatusBadge/statusStyles'
import { APPLICATION_STATUSES } from '../../../types/application'
import { progressPercent } from '../dashboardStats'
import type { StatusCounts } from '../dashboardStats'

interface ApplicationPipelineProps {
  statusCounts: StatusCounts
}

/**
 * Editorial Application Pipeline Breakdown on the Dashboard.
 */
function ApplicationPipeline({ statusCounts }: ApplicationPipelineProps) {
  const max = Math.max(
    0,
    ...APPLICATION_STATUSES.map((status) => statusCounts[status]),
  )

  return (
    <section
      aria-labelledby="dashboard-pipeline-heading"
      className="rounded-3xl border border-border/70 bg-surface p-6 shadow-sm transition-all sm:p-7"
    >
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400"
          >
            <PipelineIcon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2
              id="dashboard-pipeline-heading"
              className="text-base font-bold text-foreground sm:text-lg"
            >
              Application Pipeline Stages
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time distribution of your active applications
            </p>
          </div>
        </div>

        <Link
          to="/application-pipeline"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1.5 py-1"
        >
          <span>Open Board</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* PIPELINE PROGRESS ROW */}
      <div className="mt-5 flex items-stretch gap-3 overflow-x-auto pb-1 no-scrollbar">
        {APPLICATION_STATUSES.map((status, index) => {
          const count = statusCounts[status]
          const percent = progressPercent(count, max)
          return (
            <Fragment key={status}>
              {index > 0 ? (
                <ArrowRightIcon
                  className="h-4 w-4 shrink-0 self-center text-muted-foreground/40 hidden sm:block"
                  aria-hidden="true"
                />
              ) : null}
              <div className="flex min-w-[8.5rem] flex-1 flex-col justify-between rounded-2xl border border-border/60 bg-muted/40 p-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`block h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT_CLASSES[status]}`}
                  />
                  <span className="truncate text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {status}
                  </span>
                </div>
                <p className="my-2 text-2xl font-bold tabular-nums text-foreground">
                  {count}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${STATUS_DOT_CLASSES[status]}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </Fragment>
          )
        })}
      </div>
    </section>
  )
}

export default ApplicationPipeline
