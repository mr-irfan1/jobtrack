import { APPLICATION_STATUSES } from '../../types/application'
import { ALL_STATUSES } from '../../pages/Applications/applicationFilters'
import type { StatusFilter } from '../../pages/Applications/applicationFilters'

interface ApplicationsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
}

const labelClasses = 'block text-sm font-medium text-foreground'
const controlClasses =
  'mt-1 block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Presentational search + status-filter toolbar for the Applications list. It
 * holds no state and never touches storage: the current values arrive as props
 * and changes are delegated upward. The actual filtering is performed by the
 * ViewModel via applicationFilters — this component only renders the controls.
 */
function ApplicationsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: ApplicationsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="application-search" className={labelClasses}>
          Search
        </label>
        <input
          id="application-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by company, job title or location"
          className={controlClasses}
        />
      </div>
      <div className="sm:w-56">
        <label htmlFor="application-status-filter" className={labelClasses}>
          Status
        </label>
        <select
          id="application-status-filter"
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as StatusFilter)
          }
          className={controlClasses}
        >
          <option value={ALL_STATUSES}>All statuses</option>
          {APPLICATION_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default ApplicationsToolbar
