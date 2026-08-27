import { Link } from 'react-router-dom'
import StatCard from '../../components/StatCard/StatCard'
import {
  BriefcaseIcon,
  CalendarIcon,
  PlusIcon,
  SendIcon,
  TrophyIcon,
} from '../../components/icons/Icons'
import { getMonthlyActivity } from './applicationActivity'
import { isDashboardEmpty } from './dashboardEmptyState'
import { getRecentApplications } from './recentApplications'
import { getUpcomingInterviews } from './upcomingInterviews'
import { useDashboardViewModel } from './useDashboardViewModel'
import ApplicationActivity from './components/ApplicationActivity'
import ApplicationPipeline from './components/ApplicationPipeline'
import DashboardHeader from './components/DashboardHeader'
import EmptyState from './components/EmptyState'
import QuickActions from './components/QuickActions'
import RecentApplications from './components/RecentApplications'
import UpcomingInterviews from './components/UpcomingInterviews'

// Shared primary call-to-action styling (welcome hero mirrors this in its own file).
const primaryActionClasses =
  'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/** Time-of-day greeting; pure so it stays trivial and predictable. */
function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Supporting line for a status stat card: its share of all applications. */
function formatShare(count: number, total: number): string {
  if (total <= 0) return '—'
  return `${Math.round((count / total) * 100)}% of total`
}

/** Lightweight loading placeholder that mirrors the populated layout. */
function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {['s1', 's2', 's3', 's4'].map((key) => (
          <div
            key={key}
            className="h-28 animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  )
}

/**
 * The Dashboard page. Presentation only: it reads everything from
 * useDashboardViewModel and pure display helpers, then composes the redesigned
 * sections (welcome hero → stats → activity → pipeline → upcoming interviews →
 * recent applications → quick actions). No storage, model, or CRUD logic lives
 * here — the MVVM boundary is preserved.
 */
function DashboardView() {
  const { applications, loading, error, total, statusCounts } =
    useDashboardViewModel()

  // A single "now" seeds both the greeting and the local YYYY-MM-DD "today"
  // (en-CA), matching the app's date convention and avoiding UTC off-by-one.
  const now = new Date()
  const today = now.toLocaleDateString('en-CA')
  const greeting = `${greetingForHour(now.getHours())} 👋`

  // Display-only derivations from the single source of truth (the loaded list).
  const recentApplications = getRecentApplications(applications, 5)
  const upcomingInterviews = getUpcomingInterviews(applications, today)
  const activity = getMonthlyActivity(applications, today, 6)
  const dashboardEmpty = isDashboardEmpty(applications)

  const stats = [
    {
      label: 'Total Applications',
      value: total,
      icon: <BriefcaseIcon className="h-5 w-5" />,
      iconClassName: 'bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300',
      hint: 'Across all statuses',
    },
    {
      label: 'Applied',
      value: statusCounts.Applied,
      icon: <SendIcon className="h-5 w-5" />,
      iconClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
      hint: formatShare(statusCounts.Applied, total),
    },
    {
      label: 'Interviews',
      value: statusCounts.Interview,
      icon: <CalendarIcon className="h-5 w-5" />,
      iconClassName: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
      hint: formatShare(statusCounts.Interview, total),
    },
    {
      label: 'Offers',
      value: statusCounts.Offer,
      icon: <TrophyIcon className="h-5 w-5" />,
      iconClassName: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      hint: formatShare(statusCounts.Offer, total),
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
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
          className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger-fg"
        >
          {error}
        </div>
      ) : dashboardEmpty ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface shadow-sm">
          <EmptyState
            className="py-16"
            icon={<BriefcaseIcon className="h-6 w-6" />}
            title="No applications yet"
            description="Add your first job application to start tracking your job search."
            action={
              <Link to="/applications" className={primaryActionClasses}>
                <PlusIcon className="h-4 w-4" />
                Add Application
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          <DashboardHeader greeting={greeting} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                iconClassName={stat.iconClassName}
                hint={stat.hint}
              />
            ))}
          </div>

          <ApplicationActivity data={activity} />

          <ApplicationPipeline statusCounts={statusCounts} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <UpcomingInterviews interviews={upcomingInterviews} />
            <RecentApplications applications={recentApplications} />
          </div>

          <QuickActions />
        </div>
      )}
    </div>
  )
}

export default DashboardView
