import { useEffect } from 'react'
import type { JobFeedFilterState, JobSortOption } from '../../../types/jobFeed'
import { CloseIcon, FilterIcon } from '../../../components/icons/Icons'

interface JobFeedMobileFilterDrawerProps {
  isOpen: boolean
  filters: JobFeedFilterState
  categories: string[]
  onWorkplaceChange: (workplace: string) => void
  onEmploymentTypeChange: (type: string) => void
  onCategoryChange: (category: string) => void
  onLocationChange: (location: string) => void
  onSortChange: (sort: JobSortOption) => void
  onReset: () => void
  onClose: () => void
  totalCount: number
}

const labelClasses = 'block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5'
const selectClasses =
  'block w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function JobFeedMobileFilterDrawer({
  isOpen,
  filters,
  categories,
  onWorkplaceChange,
  onEmploymentTypeChange,
  onCategoryChange,
  onLocationChange,
  onSortChange,
  onReset,
  onClose,
  totalCount,
}: JobFeedMobileFilterDrawerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filter-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* DRAWER CONTENT */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FilterIcon className="h-4 w-4" />
            </div>
            <h2 id="mobile-filter-title" className="text-base font-bold text-foreground">
              Filter Opportunities
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* WORKPLACE TYPE */}
          <div>
            <label htmlFor="mobile-filter-workplace" className={labelClasses}>
              Workplace Type
            </label>
            <select
              id="mobile-filter-workplace"
              value={filters.workplace}
              onChange={(e) => onWorkplaceChange(e.target.value)}
              className={selectClasses}
            >
              <option value="all">All Workplaces</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-site">On-site</option>
            </select>
          </div>

          {/* EMPLOYMENT TYPE */}
          <div>
            <label htmlFor="mobile-filter-employment" className={labelClasses}>
              Employment Type
            </label>
            <select
              id="mobile-filter-employment"
              value={filters.employmentType}
              onChange={(e) => onEmploymentTypeChange(e.target.value)}
              className={selectClasses}
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
            <label htmlFor="mobile-filter-category" className={labelClasses}>
              Category
            </label>
            <select
              id="mobile-filter-category"
              value={filters.category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={selectClasses}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat.toLowerCase()}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* LOCATION SEARCH / FILTER */}
          <div>
            <label htmlFor="mobile-filter-location" className={labelClasses}>
              Location (e.g. Worldwide, US, Europe)
            </label>
            <input
              id="mobile-filter-location"
              type="text"
              value={filters.location === 'all' ? '' : filters.location}
              onChange={(e) => onLocationChange(e.target.value || 'all')}
              placeholder="Any location..."
              className={selectClasses}
            />
          </div>

          {/* SORT BY */}
          <div>
            <label htmlFor="mobile-filter-sort" className={labelClasses}>
              Sort By
            </label>
            <select
              id="mobile-filter-sort"
              value={filters.sortBy}
              onChange={(e) => onSortChange(e.target.value as JobSortOption)}
              className={selectClasses}
            >
              <option value="relevant">Most Relevant</option>
              <option value="newest">Newest First</option>
              <option value="company">Company (A-Z)</option>
            </select>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface p-4 sm:p-5">
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shadow-xs"
          >
            Show {totalCount} {totalCount === 1 ? 'Role' : 'Roles'}
          </button>
        </div>
      </div>
    </div>
  )
}
