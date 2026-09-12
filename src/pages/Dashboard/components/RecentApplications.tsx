import { Link } from 'react-router-dom'
import StatusBadge from '../../../components/StatusBadge/StatusBadge'
import { BriefcaseIcon, PlusIcon } from '../../../components/icons/Icons'
import type { JobApplication } from '../../../types/application'

interface RecentApplicationsProps {
  applications: JobApplication[]
}

/**
 * Editorial Recent Applications section on the Dashboard.
 * Quiet list design inspired by the Projects section in Google Developer Program dashboard.
 */
function RecentApplications({ applications }: RecentApplicationsProps) {
  return (
    <section aria-labelledby="recent-applications-heading" className="space-y-3">
      {/* SECTION HEADER WITH CIRCULAR BADGE & VIEW ALL */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          >
            <BriefcaseIcon className="h-4 w-4" />
          </span>
          <h2
            id="recent-applications-heading"
            className="text-sm font-semibold tracking-normal text-foreground"
          >
            Recent Applications
          </h2>
        </div>

        <Link
          to="/applications"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
        >
          <span>View all</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* QUIET LIST CARD */}
      <div className="rounded-2xl border border-border/40 bg-surface dark:bg-surface-elevated/60 shadow-2xs overflow-hidden transition-colors">
        {applications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <BriefcaseIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No applications tracked yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Track your first application to organize submissions and trigger automated prep reminders.
            </p>
            <div className="mt-4">
              <Link
                to="/applications"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                <span>Add Application</span>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/30" aria-label="Recent applications list">
            {applications.map((application) => {
              const initial = (application.company.charAt(0) || 'J').toUpperCase()
              return (
                <li
                  key={application.id}
                  className="group flex flex-col justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-xs font-bold text-foreground border border-border/40 group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                    >
                      {initial}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        <Link
                          to={`/applications/${application.id}`}
                          className="hover:text-primary transition-colors hover:underline"
                        >
                          {application.jobTitle}
                        </Link>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span>{application.company}</span>
                        {application.location ? ` · ${application.location}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:gap-4 pl-12 sm:pl-0">
                    <StatusBadge status={application.status} />
                    <span className="text-xs tabular-nums text-muted-foreground/80 whitespace-nowrap">
                      Applied {application.applicationDate}
                    </span>
                    <Link
                      to={`/applications/${application.id}`}
                      className="hidden sm:inline-flex rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                    >
                      Open
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

export default RecentApplications
