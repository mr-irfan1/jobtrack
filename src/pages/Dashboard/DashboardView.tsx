import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import {
  BriefcaseIcon,
  PlusIcon,
} from '../../components/icons/Icons'
import {
  getFollowUps,
  subscribeFollowUps,
} from '../../services/followUpStore'
import {
  getSavedJobItems,
  SAVED_JOBS_EVENT,
  type SavedJobItem,
} from '../../services/savedJobsStore'
import {
  getResumes,
  RESUMES_EVENT,
} from '../../services/resumeStore'
import type { FollowUp } from '../../types/followUp'
import type { Resume } from '../../types/resume'
import { useDashboardViewModel } from './useDashboardViewModel'
import { getRecentApplications } from './recentApplications'
import { getUpcomingInterviews } from './upcomingInterviews'
import DashboardHeader from './components/DashboardHeader'
import DashboardNextBestAction from './components/DashboardNextBestAction'
import { DashboardRecommendedJobs } from './components/DashboardRecommendedJobs'
import RecentApplications from './components/RecentApplications'
import UpcomingInterviews from './components/UpcomingInterviews'
import DashboardFollowUps from './components/DashboardFollowUps'
import DashboardSavedJobs from './components/DashboardSavedJobs'
import { DashboardJobAlerts } from './components/DashboardJobAlerts'
import DashboardCompactStats from './components/DashboardCompactStats'
import QuickActions from './components/QuickActions'

function DashboardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse space-y-8"
    >
      {/* HERO SKELETON */}
      <div className="h-64 rounded-[28px] bg-muted/60" />

      {/* NEXT BEST ACTION SKELETON */}
      <div className="h-32 rounded-2xl bg-muted/60" />

      {/* TWO COLUMN GRID SKELETON */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <div className="h-64 rounded-2xl bg-muted/60" />
          <div className="h-56 rounded-2xl bg-muted/60" />
        </div>
        <div className="space-y-8 lg:col-span-5">
          <div className="h-64 rounded-2xl bg-muted/60" />
          <div className="h-56 rounded-2xl bg-muted/60" />
        </div>
      </div>
    </div>
  )
}

function DashboardView() {
  const { user } = useAuth()
  const { applications, loading, error, statusCounts } = useDashboardViewModel()

  const today = new Date().toISOString().slice(0, 10)
  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'

  // Real data state for follow-ups, saved jobs, and resumes
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => getFollowUps())
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>(() => getSavedJobItems())
  const [resumes, setResumes] = useState<Resume[]>(() => getResumes())

  const metaName = user?.user_metadata?.full_name
  const userFullName = typeof metaName === 'string' ? metaName : undefined
  const firstName = userFullName
    ? userFullName.trim().split(/\s+/)[0]
    : user?.email
      ? user.email.split('@')[0]
      : undefined

  // Subscribe to real-time events for followUps, savedJobs, and resumes
  useEffect(() => {
    const unsubFollowUps = subscribeFollowUps(() => {
      setFollowUps(getFollowUps())
    })

    const handleSavedJobs = () => {
      setSavedJobs(getSavedJobItems())
    }

    const handleResumes = () => {
      setResumes(getResumes())
    }

    window.addEventListener(SAVED_JOBS_EVENT, handleSavedJobs)
    window.addEventListener(RESUMES_EVENT, handleResumes)

    return () => {
      unsubFollowUps()
      window.removeEventListener(SAVED_JOBS_EVENT, handleSavedJobs)
      window.removeEventListener(RESUMES_EVENT, handleResumes)
    }
  }, [])

  // Derived metrics and subsets
  const recentApplications = getRecentApplications(applications, 4)
  const upcomingInterviews = getUpcomingInterviews(applications, today)
  const hasPrimaryResume = resumes.some((r) => r.isPrimary)

  const activeApplicationsCount =
    statusCounts.Applied + statusCounts.Interview + statusCounts.Wishlist
  const interviewsCount = statusCounts.Interview
  const followUpsDueCount = followUps.filter(
    (f) => f.status === 'pending' && f.scheduledDate <= today
  ).length

  const isEmpty = applications.length === 0 && savedJobs.length === 0

  return (
    <div className="min-h-full py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {loading ? (
          <>
            <p className="sr-only" role="status">
              Loading your dashboard…
            </p>
            <DashboardSkeleton />
          </>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-danger/30 bg-danger/10 p-6 text-sm text-danger-fg"
          >
            {error}
          </div>
        ) : isEmpty ? (
          /* EMPTY ONBOARDING STATE */
          <div className="space-y-8">
            <DashboardHeader
              greeting={greeting}
              userName={firstName}
              activeApplicationsCount={0}
              interviewsCount={0}
              hasPrimaryResume={hasPrimaryResume}
            />

            <div className="rounded-2xl border border-dashed border-border/70 bg-surface p-10 sm:p-14 text-center shadow-2xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <BriefcaseIcon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Start Your Job Search Command Center
              </h2>
              <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Discover live remote developer roles, save promising opportunities, and track your applications end-to-end with built-in AI tools.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-all"
                >
                  <BriefcaseIcon className="h-4 w-4" />
                  <span>Browse Job Feed</span>
                </Link>
                <Link
                  to="/applications"
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface px-5 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/70 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add First Application</span>
                </Link>
              </div>
            </div>

            <QuickActions />
          </div>
        ) : (
          /* POPULATED EDITORIAL DASHBOARD */
          <div className="space-y-8">
            {/* 1. HERO BANNER */}
            <DashboardHeader
              greeting={greeting}
              userName={firstName}
              activeApplicationsCount={activeApplicationsCount}
              interviewsCount={interviewsCount}
              hasPrimaryResume={hasPrimaryResume}
            />

            {/* 2. NEXT BEST ACTION (PRIORITY FEATURED CARD) */}
            <DashboardNextBestAction
              applications={applications}
              followUps={followUps}
              savedJobs={savedJobs}
              resumes={resumes}
              today={today}
            />

            {/* 3. EDITORIAL 2-COLUMN ASYMMETRIC CONTENT FLOW */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
              {/* LEFT COLUMN (~58% ON DESKTOP) */}
              <div className="space-y-8 lg:col-span-7">
                {/* RECENT APPLICATIONS */}
                <RecentApplications applications={recentApplications} />

                {/* FOLLOW-UP CHECKPOINTS */}
                <DashboardFollowUps
                  followUps={followUps}
                  applications={applications}
                  today={today}
                />
              </div>

              {/* RIGHT COLUMN (~42% ON DESKTOP) */}
              <div className="space-y-8 lg:col-span-5">
                {/* UPCOMING INTERVIEWS */}
                <UpcomingInterviews interviews={upcomingInterviews} />

                {/* JOB ALERTS */}
                <DashboardJobAlerts />

                {/* SAVED OPPORTUNITIES */}
                <DashboardSavedJobs savedJobs={savedJobs} />

                {/* RECOMMENDED JOBS PREVIEW */}
                <DashboardRecommendedJobs applications={applications} />
              </div>
            </div>

            {/* 4. SECONDARY COMPACT METRICS */}
            <DashboardCompactStats
              statusCounts={statusCounts}
              followUpsDueCount={followUpsDueCount}
            />

            {/* 5. LIGHTWEIGHT QUICK SHORTCUTS ROW */}
            <QuickActions />
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardView
