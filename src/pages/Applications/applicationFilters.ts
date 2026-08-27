import type { ApplicationStatus, JobApplication } from '../../types/application'

/**
 * Sentinel for the "All statuses" filter option. This is a presentation concern
 * (a UI affordance for "no status filter"), so it lives here rather than in the
 * domain ApplicationStatus union. 'All' can never collide with a real status.
 */
export const ALL_STATUSES = 'All' as const

/** The status filter is either a concrete status or the "all statuses" sentinel. */
export type StatusFilter = ApplicationStatus | typeof ALL_STATUSES

export interface ApplicationFilterCriteria {
  /** Free-text query matched against company, job title and location. */
  search: string
  /** The selected status, or ALL_STATUSES to match every status. */
  status: StatusFilter
}

/**
 * Case-insensitive substring match of the query against the fields a user is
 * most likely to search by. An empty or whitespace-only query matches every
 * application.
 */
export function matchesSearch(
  application: JobApplication,
  search: string,
): boolean {
  const query = search.trim().toLowerCase()
  if (query === '') return true
  return (
    application.company.toLowerCase().includes(query) ||
    application.jobTitle.toLowerCase().includes(query) ||
    application.location.toLowerCase().includes(query)
  )
}

/** True when the application has the selected status, or all statuses are allowed. */
export function matchesStatus(
  application: JobApplication,
  status: StatusFilter,
): boolean {
  return status === ALL_STATUSES || application.status === status
}

/**
 * Pure, presentation-level filter: narrow a list of applications by search text
 * and status. The two criteria compose — an application must satisfy both to be
 * included. Input order is preserved and the input array is never mutated.
 */
export function filterApplications(
  applications: JobApplication[],
  criteria: ApplicationFilterCriteria,
): JobApplication[] {
  return applications.filter(
    (application) =>
      matchesSearch(application, criteria.search) &&
      matchesStatus(application, criteria.status),
  )
}
