import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { JobListing } from '../../../types/jobFeed'
import type { ScoredJobListing } from '../../../services/jobRecommendationService'
import { ExternalLinkIcon, MapPinIcon, SparklesIcon } from '../../../components/icons/Icons'

interface RecommendedJobsSectionProps {
  recommendedJobs: ScoredJobListing[]
  hasProfileSignals: boolean
  isSaved: (id: string) => boolean
  onToggleSave: (job: JobListing) => void
  onSelect: (job: JobListing) => void
}

export function RecommendedJobsSection({
  recommendedJobs,
  hasProfileSignals,
  isSaved,
  onToggleSave,
  onSelect,
}: RecommendedJobsSectionProps) {
  const [activeReasonJobId, setActiveReasonJobId] = useState<string | null>(null)

  if (!hasProfileSignals) {
    return (
      <div className="mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-surface to-primary/5 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground sm:text-base">
                Unlock Personalized Recommendations
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground max-w-xl">
                Add your technical skills and role preferences in Settings to get smart, explainable job matches curated for your profile.
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>Update Skills in Settings</span>
            <span className="ml-1" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    )
  }

  if (recommendedJobs.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="recommended-jobs-title" className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SparklesIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 id="recommended-jobs-title" className="text-base font-bold text-foreground">
              Recommended for You
            </h2>
            <p className="text-xs text-muted-foreground">
              Curated opportunities matching your verified skills, preferences, and activity.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {recommendedJobs.length} matches
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recommendedJobs.map(({ job, relevance }) => {
          const saved = isSaved(job.id)
          const companyInitial = job.company.charAt(0).toUpperCase() || 'J'
          const showReasons = activeReasonJobId === job.id

          return (
            <article
              key={job.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-primary/30 bg-surface p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
            >
              <div>
                {/* TOP ROW: BADGE + SAVE */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    <SparklesIcon className="h-3 w-3" />
                    <span>{relevance.score}% match</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleSave(job)}
                    aria-label={saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
                    title={saved ? 'Saved' : 'Save for later'}
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      saved
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill={saved ? 'currentColor' : 'none'}
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

                {/* COMPANY & LOGO */}
                <div className="mt-3 flex items-center gap-2.5 min-w-0">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt=""
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                      className="h-8 w-8 shrink-0 rounded-lg border border-border bg-surface object-contain p-0.5"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {companyInitial}
                    </div>
                  )}
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {job.company}
                  </span>
                </div>

                {/* JOB TITLE */}
                <h3 className="mt-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  <button
                    type="button"
                    onClick={() => onSelect(job)}
                    className="text-left line-clamp-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
                  >
                    {job.title}
                  </button>
                </h3>

                {/* META INFO */}
                <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5">
                    <MapPinIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[120px]">{job.location}</span>
                  </span>
                  <span>•</span>
                  <span>{job.employmentType}</span>
                </div>

                {/* WHY RECOMMENDED REASONS */}
                <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                    <span>Why recommended:</span>
                    {relevance.reasons.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setActiveReasonJobId(showReasons ? null : job.id)}
                        className="text-[10px] font-medium text-primary hover:underline"
                        aria-expanded={showReasons}
                      >
                        {showReasons ? 'Show less' : `+${relevance.reasons.length - 2} more`}
                      </button>
                    )}
                  </div>
                  <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                    {(showReasons ? relevance.reasons : relevance.reasons.slice(0, 2)).map(
                      (reason, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                          <span className="truncate">{reason.label}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={() => onSelect(job)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  View Job
                </button>
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Apply for ${job.title} at ${job.company} (opens in a new tab)`}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>Apply</span>
                  <ExternalLinkIcon className="h-3 w-3 shrink-0" />
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
