import { Link } from 'react-router-dom'
import {
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlusIcon,
  SparklesIcon,
} from '../../../components/icons/Icons'

interface DashboardHeaderProps {
  greeting: string
  userName?: string
  activeApplicationsCount: number
  interviewsCount: number
  hasPrimaryResume: boolean
}

/**
 * Editorial Hero Surface inspired by Google Developer Program dashboard.
 * Focuses on strong typography, generous whitespace, calm platform styling,
 * pill action buttons, and an editorial vector illustration instead of
 * boxy metric tiles.
 */
function DashboardHeader({
  greeting,
  userName,
  activeApplicationsCount,
  interviewsCount,
  hasPrimaryResume,
}: DashboardHeaderProps) {
  const headingText = userName ? `${greeting}, ${userName}` : greeting

  const statusSummary = [
    `${activeApplicationsCount} active application${activeApplicationsCount === 1 ? '' : 's'}`,
    interviewsCount > 0
      ? `${interviewsCount} interview${interviewsCount === 1 ? '' : 's'} scheduled`
      : null,
    hasPrimaryResume ? 'Resume active' : 'Resume needed',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/40 bg-surface dark:bg-surface-elevated/70 p-8 sm:p-10 lg:p-12 shadow-2xs transition-colors">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        {/* LEFT COPY & CTAS */}
        <div className="max-w-xl space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-4xl">
              {headingText}
            </h1>
            <p className="text-lg font-medium text-foreground/90">
              Your job search, organized.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Track active submissions, schedule recruiter follow-ups, practice with AI interview tools, and land your next role.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-2xs transition-all duration-150 hover:bg-primary/90 hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BriefcaseIcon className="h-4 w-4" />
              <span>Explore Jobs</span>
            </Link>

            <Link
              to="/applications"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Application</span>
            </Link>

            <Link
              to="/application-pipeline"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>View Pipeline</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* SUBTLE STATUS CONTEXT LINE */}
          <div className="pt-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {statusSummary}
            </span>
          </div>
        </div>

        {/* RIGHT EDITORIAL VECTOR ILLUSTRATION (Inspired by Google Developer Program folder visual) */}
        <div
          aria-hidden="true"
          className="relative flex shrink-0 items-center justify-center select-none py-4 lg:py-0"
        >
          <div className="relative h-44 w-64 sm:w-72">
            {/* Curved dashed connector line */}
            <svg
              className="absolute inset-0 h-full w-full text-muted-foreground/30 dark:text-muted-foreground/20"
              fill="none"
              viewBox="0 0 280 170"
            >
              <path
                d="M 60 120 C 100 40, 160 40, 210 50 C 240 60, 240 120, 210 130"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Folder 1: Active Applications (Top Right) */}
            <div className="absolute right-4 top-2 flex h-16 w-20 flex-col items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-2xs backdrop-blur-xs transition-transform hover:-translate-y-1">
              <BriefcaseIcon className="h-6 w-6" />
              <span className="mt-1 text-[10px] font-bold tracking-tight">Pipeline</span>
            </div>

            {/* Folder 2: Verified Resume (Bottom Left) */}
            <div className="absolute left-2 bottom-2 flex h-18 w-22 flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-2xs backdrop-blur-xs transition-transform hover:-translate-y-1">
              <DocumentTextIcon className="h-6 w-6" />
              <span className="mt-1 text-[10px] font-bold tracking-tight">Resume ATS</span>
            </div>

            {/* Node 3: AI Interview Prep (Bottom Right) */}
            <div className="absolute right-8 bottom-3 flex h-14 w-16 flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-2xs backdrop-blur-xs transition-transform hover:-translate-y-1">
              <CalendarIcon className="h-5 w-5" />
              <span className="mt-0.5 text-[9px] font-bold tracking-tight">Interviews</span>
            </div>

            {/* Center spark badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-surface shadow-xs text-primary">
              <SparklesIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardHeader
