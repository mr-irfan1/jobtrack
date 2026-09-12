import { CalendarIcon, CheckIcon, ClockIcon } from '../../../components/icons/Icons'

interface FollowUpsSummaryProps {
  upcomingCount: number
  overdueCount: number
  completedCount: number
  onSelectTab: (tab: 'all' | 'upcoming' | 'overdue' | 'completed') => void
  currentTab: string
}

export function FollowUpsSummary({
  upcomingCount,
  overdueCount,
  completedCount,
  onSelectTab,
  currentTab,
}: FollowUpsSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* UPCOMING CARD */}
      <button
        type="button"
        onClick={() => onSelectTab('upcoming')}
        className={`flex items-center gap-4 rounded-2xl border p-4 text-left shadow-xs transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          currentTab === 'upcoming'
            ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
            : 'border-border bg-surface hover:border-border/80'
        }`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming
          </span>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
            {upcomingCount}
          </p>
        </div>
      </button>

      {/* OVERDUE CARD */}
      <button
        type="button"
        onClick={() => onSelectTab('overdue')}
        className={`flex items-center gap-4 rounded-2xl border p-4 text-left shadow-xs transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          currentTab === 'overdue'
            ? 'border-danger/50 bg-danger/5 ring-1 ring-danger/20'
            : 'border-border bg-surface hover:border-border/80'
        }`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger-fg">
          <ClockIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Overdue
          </span>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
            {overdueCount}
          </p>
        </div>
      </button>

      {/* COMPLETED CARD */}
      <button
        type="button"
        onClick={() => onSelectTab('completed')}
        className={`flex items-center gap-4 rounded-2xl border p-4 text-left shadow-xs transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          currentTab === 'completed'
            ? 'border-success/50 bg-success/5 ring-1 ring-success/20'
            : 'border-border bg-surface hover:border-border/80'
        }`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Completed
          </span>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
            {completedCount}
          </p>
        </div>
      </button>
    </div>
  )
}
