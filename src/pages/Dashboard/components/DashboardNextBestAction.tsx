import { Link } from 'react-router-dom'
import {
  SparklesIcon,
  ArrowRightIcon,
} from '../../../components/icons/Icons'
import type { JobApplication } from '../../../types/application'
import type { FollowUp } from '../../../types/followUp'
import type { SavedJobItem } from '../../../services/savedJobsStore'
import type { Resume } from '../../../types/resume'
import { deriveDashboardNextBestAction } from '../dashboardNextBestAction'

interface DashboardNextBestActionProps {
  applications: JobApplication[]
  followUps: FollowUp[]
  savedJobs: SavedJobItem[]
  resumes: Resume[]
  today: string
}

/**
 * Calm editorial Priority / Next Best Action section.
 * Modeled after the featured card in the Google Developer Program reference,
 * using clear typography, soft accents, and an unobtrusive pill action.
 */
function DashboardNextBestAction(props: DashboardNextBestActionProps) {
  const action = deriveDashboardNextBestAction(props)

  return (
    <section className="space-y-3">
      {/* SECTION HEADER WITH CIRCULAR BADGE */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
          >
            <SparklesIcon className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold tracking-normal text-foreground">
            Next Best Action
          </h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${action.badgeColor}`}
        >
          {action.badge}
        </span>
      </div>

      {/* QUIET FEATURED CARD */}
      <div className="rounded-2xl border border-border/40 bg-surface dark:bg-surface-elevated/60 p-6 shadow-2xs transition-colors">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-2 min-w-0 max-w-xl">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {action.title}
              </h3>
              {action.subtitle && (
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {action.subtitle}
                </p>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {action.description}
            </p>
          </div>

          <div className="shrink-0 pt-1 sm:pt-0">
            <Link
              to={action.to}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-2xs transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>{action.actionLabel}</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardNextBestAction
