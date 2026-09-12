import type { SavedJobsFilterState, SavedJobsSortOption } from '../SavedJobsModel'

interface SavedJobsToolbarProps {
  filters: SavedJobsFilterState
  onSearchChange: (search: string) => void
  onWorkplaceTypeChange: (type: string) => void
  onEmploymentTypeChange: (type: string) => void
  onSortChange: (sort: SavedJobsSortOption) => void
  onReset: () => void
  totalCount: number
}

const labelClasses = 'block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1'
const controlClasses =
  'block w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function SavedJobsToolbar({
  filters,
  onSearchChange,
  onWorkplaceTypeChange,
  onEmploymentTypeChange,
  onSortChange,
  onReset,
  totalCount,
}: SavedJobsToolbarProps) {
  const isFiltered =
    Boolean(filters.search) ||
    filters.workplaceType !== 'all' ||
    filters.employmentType !== 'all' ||
    filters.sortBy !== 'recently_saved'

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
      {/* SEARCH INPUT */}
      <div>
        <label htmlFor="saved-jobs-search" className={labelClasses}>
          Search Saved Jobs
        </label>
        <div className="relative">
          <input
            id="saved-jobs-search"
            type="search"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by role title, company, skills, or location..."
            className={`${controlClasses} pl-10`}
          />
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4 items-end">
        <div>
          <label htmlFor="saved-workplace-type" className={labelClasses}>
            Workplace
          </label>
          <select
            id="saved-workplace-type"
            value={filters.workplaceType}
            onChange={(e) => onWorkplaceTypeChange(e.target.value)}
            className={controlClasses}
          >
            <option value="all">All Workplaces</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on-site">On-site</option>
          </select>
        </div>

        <div>
          <label htmlFor="saved-employment-type" className={labelClasses}>
            Employment Type
          </label>
          <select
            id="saved-employment-type"
            value={filters.employmentType}
            onChange={(e) => onEmploymentTypeChange(e.target.value)}
            className={controlClasses}
          >
            <option value="all">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="contract">Contract</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <div>
          <label htmlFor="saved-jobs-sort" className={labelClasses}>
            Sort By
          </label>
          <select
            id="saved-jobs-sort"
            value={filters.sortBy}
            onChange={(e) => onSortChange(e.target.value as SavedJobsSortOption)}
            className={controlClasses}
          >
            <option value="recently_saved">Recently Saved</option>
            <option value="newest">Newest Posted</option>
            <option value="company">Company (A-Z)</option>
            <option value="title">Job Title (A-Z)</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-1">
          <span className="text-xs font-medium text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'saved role' : 'saved roles'}
          </span>
          {isFiltered ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
