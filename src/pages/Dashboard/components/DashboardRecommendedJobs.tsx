import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SparklesIcon } from '../../../components/icons/Icons'
import { useAuth } from '../../../auth/useAuth'
import { fetchJobListings } from '../../../services/jobFeedService'
import { getSavedJobItems } from '../../../services/savedJobsStore'
import {
  getRecommendedJobs,
  rankJobListings,
  type CandidateSignals,
  type ScoredJobListing,
} from '../../../services/jobRecommendationService'
import type { JobApplication } from '../../../types/application'

interface DashboardRecommendedJobsProps {
  applications: JobApplication[]
}

/**
 * Editorial Recommended Jobs preview widget for the Dashboard.
 * Displays up to 3 high-relevance curated opportunities with match scores.
 */
export function DashboardRecommendedJobs({ applications }: DashboardRecommendedJobsProps) {
  const { user } = useAuth()
  const [recommended, setRecommended] = useState<ScoredJobListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadRecommendations() {
      try {
        const jobs = await fetchJobListings()
        if (!isMounted) return

        const meta = user?.user_metadata || {}
        const rawSkills = Array.isArray(meta.skills) ? meta.skills : []
        const profileSkills = rawSkills.filter(
          (s): s is string => typeof s === 'string' && Boolean(s.trim()),
        )
        const prefs = meta.preferences || {}
        const savedItems = getSavedJobItems()

        const signals: CandidateSignals = {
          skills: profileSkills,
          preferredJobTitle:
            typeof prefs.preferredJobTitle === 'string' ? prefs.preferredJobTitle : undefined,
          headline: typeof meta.headline === 'string' ? meta.headline : undefined,
          preferredLocation:
            typeof prefs.preferredLocation === 'string' ? prefs.preferredLocation : undefined,
          workPreference:
            typeof prefs.workPreference === 'string' ? prefs.workPreference : undefined,
          employmentType:
            typeof prefs.employmentType === 'string' ? prefs.employmentType : undefined,
          savedJobs: savedItems.map((s) => s.job),
          applications,
        }

        const scored = rankJobListings(jobs, signals)
        const top = getRecommendedJobs(scored, 3)
        if (isMounted) {
          setRecommended(top)
        }
      } catch {
        // Fail quietly on dashboard; do not disrupt other dashboard sections
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadRecommendations()

    return () => {
      isMounted = false
    }
  }, [user, applications])

  if (loading || recommended.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="dashboard-recommended-jobs-heading" className="space-y-3">
      {/* SECTION HEADER WITH CIRCULAR BADGE & LINK */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          >
            <SparklesIcon className="h-4 w-4" />
          </span>
          <h2
            id="dashboard-recommended-jobs-heading"
            className="text-sm font-semibold tracking-normal text-foreground"
          >
            Recommended Jobs
          </h2>
        </div>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
        >
          <span>Explore all</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* QUIET LIST CARD */}
      <div className="rounded-2xl border border-border/40 bg-surface dark:bg-surface-elevated/60 shadow-2xs overflow-hidden divide-y divide-border/30">
        {recommended.map(({ job, relevance }) => (
          <div
            key={job.id}
            className="p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-semibold text-foreground">
                  {job.title}
                </span>
                <span className="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {relevance.score}% match
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {job.company} • {job.location}
              </p>
            </div>

            <Link
              to="/jobs"
              className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              View
            </Link>
          </div>
        ))}

        <div className="bg-muted/20 p-2.5 text-center">
          <Link
            to="/jobs"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Explore Recommended Jobs →
          </Link>
        </div>
      </div>
    </section>
  )
}
