import { Link } from 'react-router-dom'
import {
  BookmarkIcon,
  BriefcaseIcon,
  ExternalLinkIcon,
} from '../../../components/icons/Icons'
import type { SavedJobItem } from '../../../services/savedJobsStore'

interface DashboardSavedJobsProps {
  savedJobs: SavedJobItem[]
}

/**
 * Editorial Saved Opportunities section on the Dashboard.
 * Quiet editorial list matching Google Developer Program reference.
 */
function DashboardSavedJobs({ savedJobs }: DashboardSavedJobsProps) {
  const displayItems = savedJobs.slice(0, 3)

  return (
    <section aria-labelledby="dashboard-saved-jobs-heading" className="space-y-3">
      {/* SECTION HEADER WITH CIRCULAR BADGE & LINK */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/12 text-amber-600 dark:text-amber-400"
          >
            <BookmarkIcon className="h-4 w-4" />
          </span>
          <h2
            id="dashboard-saved-jobs-heading"
            className="text-sm font-semibold tracking-normal text-foreground"
          >
            Saved Opportunities
          </h2>
        </div>

        <Link
          to="/saved-jobs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
        >
          <span>View all</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* QUIET LIST CARD */}
      <div className="rounded-2xl border border-border/40 bg-surface dark:bg-surface-elevated/60 shadow-2xs overflow-hidden transition-colors">
        {displayItems.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <BookmarkIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No saved jobs yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Browse curated developer roles in the job feed and bookmark positions to review later.
            </p>
            <div className="mt-4">
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
              >
                <BriefcaseIcon className="h-3.5 w-3.5" />
                <span>Explore Feed</span>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/30" aria-label="Saved jobs list">
            {displayItems.map((item) => {
              const metaTokens = [
                item.job.company,
                item.job.location,
                item.job.employmentType,
                item.job.salary,
              ].filter(Boolean)

              return (
                <li
                  key={item.id}
                  className="group flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      <Link to="/saved-jobs">{item.job.title}</Link>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {metaTokens.join(' · ')}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={item.job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                    >
                      <span>Apply</span>
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>

                    <Link
                      to="/saved-jobs"
                      className="inline-flex rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 text-xs font-medium transition-colors"
                    >
                      View
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

export default DashboardSavedJobs
