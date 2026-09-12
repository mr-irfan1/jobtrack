import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { JobApplication } from '../../../types/application'
import type { JobListing } from '../../../types/jobFeed'
import type { JobRelevance } from '../../../services/jobRecommendationService'
import {
  CheckIcon,
  CloseIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PlusIcon,
  SparklesIcon,
} from '../../../components/icons/Icons'
import { JobMatchSection } from './JobMatchSection'
import { ResumeTailoringModal } from '../../ResumeCenter/components/ResumeTailoringModal'
import { ApplicationCopilotModal } from '../../../components/Copilot/ApplicationCopilotModal'

interface JobDetailsModalProps {
  job: JobListing | null
  isSaved: boolean
  relevance?: JobRelevance
  existingApplication?: JobApplication
  onToggleSave: (job: JobListing) => void
  onAddToApplications?: (job: JobListing) => Promise<void> | void
  isAddingApp?: boolean
  onClose: () => void
}

export function JobDetailsModal({
  job,
  isSaved,
  relevance,
  existingApplication,
  onToggleSave,
  onAddToApplications,
  isAddingApp,
  onClose,
}: JobDetailsModalProps) {
  const [isTailoringModalOpen, setIsTailoringModalOpen] = useState<boolean>(false)
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (job) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [job, onClose])

  if (!job) return null

  const companyInitial = job.company.charAt(0).toUpperCase() || 'J'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* MODAL WINDOW */}
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] w-full max-w-3xl flex-col rounded-3xl border border-border bg-surface shadow-2xl text-foreground overflow-hidden">
        {/* MODAL HEADER */}
        <header className="flex shrink-0 items-start justify-between border-b border-border p-6 sm:p-7">
          <div className="flex items-start gap-4 min-w-0 pr-4">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt=""
                onError={(e) => {
                  ; (e.target as HTMLElement).style.display = 'none'
                }}
                className="h-14 w-14 shrink-0 rounded-2xl border border-border bg-surface object-contain p-1.5"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                {companyInitial}
              </div>
            )}

            <div className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {job.company}
              </span>
              <h1
                id="job-details-title"
                className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
              >
                {job.title}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {job.location}
                </span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  {job.employmentType}
                </span>
                {job.salary ? (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    {job.salary}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* RELEVANCE & FEED MATCH EXPLANATION */}
          {relevance && relevance.reasons.length > 0 ? (
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/5 via-surface to-primary/5 p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <SparklesIcon className="h-4 w-4 text-primary" />
                  <span>Feed Discovery Relevance: {relevance.score}%</span>
                </div>
                {relevance.isApplied && (
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    In Applications ({relevance.applicationStatus || 'Active'})
                  </span>
                )}
              </div>
              <ul className="mt-2.5 space-y-1.5 text-muted-foreground">
                {relevance.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                    <span>{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* SKILLS */}
          {job.skills && job.skills.length > 0 ? (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                Skills & Technologies
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-border bg-muted/80 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* AI JOB MATCH INTELLIGENCE */}
          <JobMatchSection
            job={job}
            existingApplication={existingApplication}
          />

          {/* DESCRIPTION */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Role Description
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
              {job.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* ATTRIBUTION & LEGAL NOTICE */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4 text-xs text-muted-foreground">
            <p>
              This job opportunity is sourced via <span className="font-semibold text-foreground">Remotive</span>.
              Job listings are published directly by employers and verified through official developer APIs.
            </p>
          </div>
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:p-6 bg-surface">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(job)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSaved
                  ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                  : 'border-border bg-surface text-foreground hover:bg-muted'
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
              <span>{isSaved ? 'Saved to Bookmarks' : 'Save Job'}</span>
            </button>

            {existingApplication ? (
              <Link
                to={`/applications/${existingApplication.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                <span>In Applications (View →)</span>
              </Link>
            ) : onAddToApplications ? (
              <button
                type="button"
                disabled={isAddingApp}
                onClick={() => onAddToApplications(job)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                <span>{isAddingApp ? 'Adding...' : 'Track in Applications'}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setIsCopilotOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-primary/90 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>AI Copilot</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTailoringModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Tailor Resume</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              Close
            </button>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              <span>Apply on {job.source}</span>
              <ExternalLinkIcon className="h-4 w-4 shrink-0" />
            </a>
          </div>
        </footer>
      </div>

      <ResumeTailoringModal
        isOpen={isTailoringModalOpen}
        onClose={() => setIsTailoringModalOpen(false)}
        job={job}
        existingApplication={existingApplication}
      />

      <ApplicationCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        job={job}
        existingApplication={existingApplication}
      />
    </div>
  )
}
