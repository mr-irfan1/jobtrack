import type { JobListing } from '../../../types/jobFeed'
import type { JobRelevance } from '../../../services/jobRecommendationService'
import { ExternalLinkIcon, MapPinIcon, SparklesIcon } from '../../../components/icons/Icons'

interface JobCardProps {
  job: JobListing
  isSaved: boolean
  relevance?: JobRelevance
  onToggleSave: (job: JobListing) => void
  onSelect: (job: JobListing) => void
}

function formatRelativeDate(isoDate: string): string {
  try {
    const diff = Date.now() - new Date(isoDate).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days <= 0) return 'Today'
    if (days === 1) return '1d ago'
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
  } catch {
    return 'Recently'
  }
}

export function JobCard({
  job,
  isSaved,
  relevance,
  onToggleSave,
  onSelect,
}: JobCardProps) {
  const companyInitial = job.company.charAt(0).toUpperCase() || 'J'

  return (
    <article className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div>
        {/* HEADER: COMPANY INFO + SAVE BUTTON */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt=""
                onError={(e) => {
                  // Fallback to avatar if remote image fails
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
                className="h-10 w-10 shrink-0 rounded-xl border border-border bg-surface object-contain p-1"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                {companyInitial}
              </div>
            )}
            <div className="min-w-0">
              <span className="block truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {job.company}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                via {job.source}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleSave(job)}
            aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
            title={isSaved ? 'Saved to bookmarks' : 'Save for later'}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isSaved
                ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                : 'border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill={isSaved ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
          </button>
        </div>

        {/* RELEVANCE OR APPLIED BADGE */}
        {relevance?.isApplied ? (
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              <span>In Applications{relevance.applicationStatus ? ` (${relevance.applicationStatus})` : ''}</span>
            </span>
          </div>
        ) : relevance && relevance.score >= 50 ? (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <SparklesIcon className="h-3 w-3" />
              <span>{relevance.score}% Match</span>
            </span>
            {relevance.reasons.length > 0 && (
              <span className="truncate text-[11px] text-muted-foreground">
                ✓ {relevance.reasons[0].label}
              </span>
            )}
          </div>
        ) : null}

        {/* ROLE TITLE */}
        <h2 className="mt-2 text-base font-bold text-foreground transition-colors group-hover:text-primary">
          <button
            type="button"
            onClick={() => onSelect(job)}
            className="text-left hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm line-clamp-2"
          >
            {job.title}
          </button>
        </h2>

        {/* META PILLS: LOCATION, WORKPLACE, EMPLOYMENT TYPE, SALARY */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-medium text-foreground">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate max-w-[150px]">{job.location}</span>
          </span>

          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary">
            {job.employmentType}
          </span>

          {job.salary ? (
            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-600 dark:text-emerald-400">
              {job.salary}
            </span>
          ) : null}
        </div>

        {/* SKILLS TAGS */}
        {job.skills && job.skills.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap gap-1">
            {job.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-border/60 bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 3 ? (
              <span className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground/70">
                +{job.skills.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* FOOTER: TIME AGO + VIEW DETAILS & APPLY */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(job.postedDate)}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect(job)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Details
          </button>
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Apply for ${job.title} at ${job.company} on Remotive (opens in a new tab)`}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>Apply</span>
            <ExternalLinkIcon className="h-3 w-3 shrink-0" />
          </a>
        </div>
      </div>
    </article>
  )
}
