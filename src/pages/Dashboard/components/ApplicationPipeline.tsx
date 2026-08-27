import { Fragment } from 'react'
import Panel from '../../../components/Panel/Panel'
import { ArrowRightIcon } from '../../../components/icons/Icons'
import { STATUS_DOT_CLASSES } from '../../../components/StatusBadge/statusStyles'
import { APPLICATION_STATUSES } from '../../../types/application'
import { progressPercent } from '../dashboardStats'
import type { StatusCounts } from '../dashboardStats'

interface ApplicationPipelineProps {
  statusCounts: StatusCounts
}

/**
 * A horizontal pipeline across every ApplicationStatus, in their canonical
 * order, showing the real count per stage. Each stage bar is scaled to the
 * largest stage so the distribution reads at a glance. Presentational only:
 * counts are supplied by the ViewModel. On narrow screens the row scrolls
 * horizontally (contained within the card) rather than overflowing the page.
 */
function ApplicationPipeline({ statusCounts }: ApplicationPipelineProps) {
  const max = Math.max(
    0,
    ...APPLICATION_STATUSES.map((status) => statusCounts[status]),
  )

  return (
    <Panel title="Application Pipeline" titleId="application-pipeline-heading">
      <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
        {APPLICATION_STATUSES.map((status, index) => {
          const count = statusCounts[status]
          const percent = progressPercent(count, max)
          return (
            <Fragment key={status}>
              {index > 0 ? (
                <ArrowRightIcon
                  className="h-4 w-4 shrink-0 self-center text-muted-foreground/60"
                  aria-hidden="true"
                />
              ) : null}
              <div className="flex min-w-[8.5rem] flex-1 flex-col rounded-xl border border-border bg-muted/60 p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`block h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT_CLASSES[status]}`}
                  />
                  <span className="truncate text-sm font-medium text-muted-foreground">
                    {status}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {count}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${STATUS_DOT_CLASSES[status]}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </Fragment>
          )
        })}
      </div>
    </Panel>
  )
}

export default ApplicationPipeline
