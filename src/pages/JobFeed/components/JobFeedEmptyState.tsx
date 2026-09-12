import type { JobFeedFilterState } from '../../../types/jobFeed'
import { BriefcaseIcon } from '../../../components/icons/Icons'

interface JobFeedEmptyStateProps {
  isFiltered: boolean
  filters?: JobFeedFilterState
  onResetFilters: () => void
  onClearSearch?: () => void
}

export function JobFeedEmptyState({
  isFiltered,
  filters,
  onResetFilters,
  onClearSearch,
}: JobFeedEmptyStateProps) {
  const hasSearch = Boolean(filters?.search?.trim())
  const hasFilterControls = Boolean(
    (filters?.workplace && filters.workplace !== 'all') ||
      (filters?.employmentType && filters.employmentType !== 'all') ||
      (filters?.category && filters.category !== 'all') ||
      (filters?.location && filters.location !== 'all'),
  )

  let suggestion = 'Check back shortly for newly published opportunities.'
  if (isFiltered) {
    if (hasSearch && hasFilterControls) {
      suggestion =
        'Try removing your search term or broadening your workplace and category filters.'
    } else if (hasSearch) {
      suggestion =
        'Try searching for broader keywords like "React", "Developer", or "Frontend".'
    } else if (hasFilterControls) {
      suggestion =
        'Try switching workplace or employment type filters to "All" to view more positions.'
    }
  }

  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-14 text-center shadow-xs">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <BriefcaseIcon className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-base font-bold text-foreground sm:text-lg">
        {isFiltered ? 'No opportunities match your criteria' : 'No jobs available right now'}
      </h2>

      <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {suggestion}
      </p>

      {isFiltered && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {hasSearch && onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear Search "{filters?.search?.trim()}"
            </button>
          )}
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  )
}
