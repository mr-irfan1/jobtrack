import { Link } from 'react-router-dom'
import { BookmarkIcon } from '../../../components/icons/Icons'

interface SavedJobsEmptyStateProps {
  isFiltered: boolean
  onResetFilters: () => void
}

export function SavedJobsEmptyState({
  isFiltered,
  onResetFilters,
}: SavedJobsEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-xs">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BookmarkIcon className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-base font-bold text-foreground sm:text-lg">
        {isFiltered ? 'No saved jobs match your filters' : 'No saved jobs yet'}
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
        {isFiltered
          ? 'Try adjusting your search query or clear the active filters to see all your saved opportunities.'
          : "Save interesting opportunities from the Job Feed and come back to them when you're ready."}
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        {isFiltered ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            Clear filters
          </button>
        ) : null}
        <Link
          to="/jobs"
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Explore Jobs
        </Link>
      </div>
    </div>
  )
}
