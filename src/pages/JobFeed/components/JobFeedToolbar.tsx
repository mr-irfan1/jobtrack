import type { JobFeedFilterState, JobSortOption } from '../../../types/jobFeed'
import { CloseIcon, FilterIcon, SearchIcon } from '../../../components/icons/Icons'

interface JobFeedToolbarProps {
  filters: JobFeedFilterState
  categories: string[]
  onSearchChange: (search: string) => void
  onWorkplaceChange: (workplace: string) => void
  onEmploymentTypeChange: (type: string) => void
  onCategoryChange: (category: string) => void
  onSortChange: (sort: JobSortOption) => void
  onReset: () => void
  activeFilterCount: number
  onOpenMobileFilters: () => void
  totalCount: number
}

const labelClasses = 'block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1'
const controlClasses =
  'block w-full rounded-xl border border-border bg-input px-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function JobFeedToolbar({
  filters,
  categories,
  onSearchChange,
  onWorkplaceChange,
  onEmploymentTypeChange,
  onCategoryChange,
  onSortChange,
  onReset,
  activeFilterCount,
  onOpenMobileFilters,
  totalCount,
}: JobFeedToolbarProps) {
  const isFiltered =
    Boolean(filters.search) ||
    filters.workplace !== 'all' ||
    filters.employmentType !== 'all' ||
    filters.category !== 'all' ||
    filters.location !== 'all' ||
    filters.sortBy !== 'relevant'

  return (
    <div className="space-y-3.5 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
      {/* SEARCH ROW + MOBILE FILTER TRIGGER */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <label htmlFor="job-feed-search" className="sr-only">
            Search roles, skills, or companies
          </label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="job-feed-search"
            type="search"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search job title, skills (e.g. React, TypeScript), or company..."
            className="block w-full rounded-xl border border-border bg-input py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* MOBILE FILTER BUTTON (VISIBLE ON SCREENS < 768px) */}
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="inline-flex md:hidden shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          aria-label={`Open filters drawer. ${activeFilterCount} active filters.`}
        >
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* DESKTOP FILTER ROW (VISIBLE ON md AND ABOVE) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-3 items-end pt-1">
        {/* WORKPLACE TYPE */}
        <div>
          <label htmlFor="job-feed-workplace" className={labelClasses}>
            Workplace
          </label>
          <select
            id="job-feed-workplace"
            value={filters.workplace}
            onChange={(e) => onWorkplaceChange(e.target.value)}
            className={controlClasses}
          >
            <option value="all">All Workplaces</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on-site">On-site</option>
          </select>
        </div>

        {/* EMPLOYMENT TYPE */}
        <div>
          <label htmlFor="job-feed-type" className={labelClasses}>
            Employment Type
          </label>
          <select
            id="job-feed-type"
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

        {/* CATEGORY */}
        <div>
          <label htmlFor="job-feed-category" className={labelClasses}>
            Category
          </label>
          <select
            id="job-feed-category"
            value={filters.category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={controlClasses}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat.toLowerCase()}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* SORT BY */}
        <div>
          <label htmlFor="job-feed-sort" className={labelClasses}>
            Sort By
          </label>
          <select
            id="job-feed-sort"
            value={filters.sortBy}
            onChange={(e) => onSortChange(e.target.value as JobSortOption)}
            className={controlClasses}
          >
            <option value="relevant">Most Relevant</option>
            <option value="newest">Newest First</option>
            <option value="company">Company (A-Z)</option>
          </select>
        </div>

        {/* RESULT COUNT & CLEAR ACTION */}
        <div className="flex items-center justify-between lg:justify-end gap-2 pb-1">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {totalCount} {totalCount === 1 ? 'opportunity' : 'opportunities'}
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
