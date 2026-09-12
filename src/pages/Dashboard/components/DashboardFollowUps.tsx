import { Link } from 'react-router-dom'
import {
  ClockArrowIcon,
  CheckIcon,
} from '../../../components/icons/Icons'
import type { FollowUp } from '../../../types/followUp'
import type { JobApplication } from '../../../types/application'

interface DashboardFollowUpsProps {
  followUps: FollowUp[]
  applications: JobApplication[]
  today: string
}

/**
 * Editorial Follow-ups reminder section on the Dashboard.
 * Quiet list design with restrained status treatments matching Google reference.
 */
function DashboardFollowUps({
  followUps,
  applications,
  today,
}: DashboardFollowUpsProps) {
  const pending = followUps
    .filter((f) => f.status === 'pending')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 3)

  const applicationMap = new Map(applications.map((a) => [a.id, a]))

  return (
    <section aria-labelledby="dashboard-followups-heading" className="space-y-3">
      {/* SECTION HEADER WITH CIRCULAR BADGE & LINK */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/12 text-purple-600 dark:text-purple-400"
          >
            <ClockArrowIcon className="h-4 w-4" />
          </span>
          <h2
            id="dashboard-followups-heading"
            className="text-sm font-semibold tracking-normal text-foreground"
          >
            Follow-up Checkpoints
          </h2>
        </div>

        <Link
          to="/follow-ups"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
        >
          <span>View all</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* QUIET LIST CARD */}
      <div className="rounded-2xl border border-border/40 bg-surface dark:bg-surface-elevated/60 shadow-2xs overflow-hidden transition-colors">
        {pending.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <CheckIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">All follow-ups caught up</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              Schedule follow-up reminders on applications to maintain regular contact with recruiters.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/30" aria-label="Follow-ups reminder list">
            {pending.map((item) => {
              const app = item.applicationId ? applicationMap.get(item.applicationId) : null
              const isOverdue = item.scheduledDate < today
              const isToday = item.scheduledDate === today

              return (
                <li
                  key={item.id}
                  className="group flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      <Link to={`/follow-ups?applicationId=${item.applicationId || ''}`}>
                        {app ? app.company : 'Application Follow-up'}
                      </Link>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app ? app.jobTitle : item.note || 'Follow-up checkpoint'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                        isOverdue
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : isToday
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-muted/60 text-muted-foreground border-border/40'
                      }`}
                    >
                      {isOverdue ? 'Overdue' : isToday ? 'Due Today' : item.scheduledDate}
                    </span>

                    <Link
                      to={`/follow-ups?applicationId=${item.applicationId || ''}`}
                      className="hidden sm:inline-flex rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                    >
                      Action
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

export default DashboardFollowUps
