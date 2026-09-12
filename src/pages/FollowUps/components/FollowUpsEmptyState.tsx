import { Link } from 'react-router-dom'
import { CalendarIcon, CheckIcon } from '../../../components/icons/Icons'
import type { FollowUpTabFilter } from '../../../types/followUp'

interface FollowUpsEmptyStateProps {
  totalCount: number
  activeTab: FollowUpTabFilter
  searchQuery: string
  onClearFilters: () => void
  onScheduleClick: () => void
}

export function FollowUpsEmptyState({
  totalCount,
  activeTab,
  searchQuery,
  onClearFilters,
  onScheduleClick,
}: FollowUpsEmptyStateProps) {
  // If user has zero follow-ups overall
  if (totalCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CalendarIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-foreground">
          No follow-ups yet
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
          Schedule a follow-up after applying so you never lose track of the next step.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onScheduleClick}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Schedule Follow-up
          </button>
          <Link
            to="/applications"
            className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View Applications
          </Link>
        </div>
      </div>
    )
  }

  // If specific tab or search has no results
  let title = 'No matching follow-ups'
  let description = 'Try adjusting your search query or filter to see more follow-ups.'

  if (activeTab === 'overdue') {
    title = 'No overdue follow-ups'
    description = 'Great job! All your follow-up reminders are up to date.'
  } else if (activeTab === 'upcoming') {
    title = 'No upcoming follow-ups'
    description = 'You have no pending follow-ups scheduled for future dates.'
  } else if (activeTab === 'completed') {
    title = 'No completed follow-ups'
    description = 'Completed follow-up reminders will appear here once marked done.'
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-xs">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {activeTab === 'completed' || activeTab === 'overdue' ? (
          <CheckIcon className="h-5 w-5" />
        ) : (
          <CalendarIcon className="h-5 w-5" />
        )}
      </div>
      <h2 className="mt-3 text-base font-bold text-foreground">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {searchQuery ? `No results found for "${searchQuery}".` : description}
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        {searchQuery || activeTab !== 'all' ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Show All Follow-ups
          </button>
        ) : null}
      </div>
    </div>
  )
}
