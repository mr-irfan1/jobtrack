import Panel from '../../../components/Panel/Panel'
import { ActivityIcon } from '../../../components/icons/Icons'
import { progressPercent } from '../dashboardStats'
import type { MonthlyActivity } from '../applicationActivity'

interface ApplicationActivityProps {
  data: MonthlyActivity[]
}

/**
 * "Application Activity" chart: a bar per month showing how many applications
 * were submitted, derived entirely from real applicationDate data (never
 * fabricated — an empty month is simply a zero bar). Bars scale to the busiest
 * month in the window. Presentational only; the monthly series is computed by
 * getMonthlyActivity and passed in.
 */
function ApplicationActivity({ data }: ApplicationActivityProps) {
  const max = Math.max(0, ...data.map((entry) => entry.count))
  const rangeTotal = data.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <Panel
      title="Application Activity"
      titleId="application-activity-heading"
      icon={<ActivityIcon className="h-4 w-4" />}
      action={
        <span className="text-xs font-medium text-muted-foreground/70">
          Last {data.length} months
        </span>
      }
    >
      {rangeTotal === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-foreground">
            No activity in this period
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Applications you add will chart here by month.
          </p>
        </div>
      ) : (
        <>
          <p className="sr-only">
            {rangeTotal} applications submitted over the last {data.length}{' '}
            months.
          </p>
          <div className="flex h-48 items-end gap-2 sm:gap-4">
            {data.map((entry) => {
              const percent = progressPercent(entry.count, max)
              return (
                <div
                  key={entry.month}
                  className="flex h-full flex-1 flex-col items-center"
                >
                  <span className="mb-1.5 h-4 text-xs font-semibold tabular-nums text-muted-foreground">
                    {entry.count > 0 ? entry.count : ''}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/60 transition-all duration-300"
                      style={{
                        height: `${percent}%`,
                        minHeight: entry.count > 0 ? '0.5rem' : '0',
                      }}
                    />
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">
                    {entry.label}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {rangeTotal}
            </span>{' '}
            {rangeTotal === 1 ? 'application' : 'applications'} in the last{' '}
            {data.length} months
          </p>
        </>
      )}
    </Panel>
  )
}

export default ApplicationActivity
