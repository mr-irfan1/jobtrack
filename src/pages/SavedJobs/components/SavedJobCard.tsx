import { Link } from 'react-router-dom'
import type { JobListing } from '../../../types/jobFeed'
import type { JobApplication } from '../../../types/application'
import {
  CheckIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '../../../components/icons/Icons'

interface SavedJobCardProps {
  id: string
  savedAt: string
  job?: JobListing
  existingApplication?: JobApplication
  onRemove: (id: string) => void
  onSelect: (job: JobListing) => void
  onAddApplication: (job: JobListing) => void
  onOpenCopilot?: (job: JobListing) => void
  addingApp?: boolean
}

function formatSavedDate(isoDate: string): string {
  try {
    const diff = Date.now() - new Date(isoDate).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 60) return `${Math.max(1, minutes)}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Yesterday'
    return `${days}d ago`
  } catch {
    return 'Recently'
  }
}

export function SavedJobCard({
  id,
  savedAt,
  job,
  existingApplication,
  onRemove,
  onSelect,
  onAddApplication,
  onOpenCopilot,
  addingApp,
}: SavedJobCardProps) {
  // If job listing is missing or corrupted from legacy store
  if (!job || !job.title) {
    return (
      <article className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-border bg-surface p-5 shadow-xs">
        <div>
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              Unavailable Job
            </span>
            <button
              type="button"
              onClick={() => onRemove(id)}
              aria-label="Remove unavailable job"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger-fg transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-3 text-base font-semibold text-foreground">
            Job listing may no longer be available
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            This saved role is no longer present in the active feed snapshot.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            Saved {formatSavedDate(savedAt)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="rounded-xl border border-danger/30 bg-surface px-3 py-1.5 text-xs font-semibold text-danger-fg hover:bg-danger/10"
          >
            Remove
          </button>
        </div>
      </article>
    )
  }

  const companyInitial = job.company.charAt(0).toUpperCase() || 'J'
  const isAlreadyApplied = Boolean(existingApplication)

  return (
    <article className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div>
        {/* HEADER: COMPANY INFO + REMOVE BUTTON */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt=""
                onError={(e) => {
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
            onClick={() => onRemove(id)}
            aria-label={`Remove ${job.title} at ${job.company} from saved jobs`}
            title="Remove from saved jobs"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground hover:border-danger/30 hover:bg-danger/10 hover:text-danger-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-danger transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ROLE TITLE */}
        <h2 className="mt-3.5 text-base font-bold text-foreground transition-colors group-hover:text-primary">
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
            <span className="truncate max-w-[140px]">{job.location}</span>
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

      {/* FOOTER ACTIONS */}
      <div className="mt-5 space-y-3 border-t border-border pt-4">
        {/* ROW 1: TIME SAVED & DETAILS / APPLY */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Saved {formatSavedDate(savedAt)}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {onOpenCopilot ? (
              <button
                type="button"
                onClick={() => onOpenCopilot(job)}
                title="Open AI Application Copilot"
                className="inline-flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SparklesIcon className="h-3 w-3" />
                <span>Copilot</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onSelect(job)}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Details
            </button>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open job posting for ${job.title} on ${job.source}`}
              className="inline-flex items-center gap-1 rounded-xl bg-surface border border-border px-3 py-1.5 font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>Open</span>
              <ExternalLinkIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* ROW 2: APPLICATION TRACKING STATUS / CTA */}
        <div className="border-t border-border/60 pt-2.5">
          {isAlreadyApplied && existingApplication ? (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckIcon className="h-3.5 w-3.5" />
                <span>In Applications</span>
              </span>
              <Link
                to={`/applications/${existingApplication.id}`}
                className="text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                View Application →
              </Link>
            </div>
          ) : (
            <button
              type="button"
              disabled={addingApp}
              onClick={() => onAddApplication(job)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>{addingApp ? 'Adding...' : 'Add to Applications'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
