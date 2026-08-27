import { APPLICATION_STATUSES } from '../../types/application.ts'
import type { ApplicationStatus, JobApplication } from '../../types/application.ts'

/**
 * Number of applications in each status. Keyed by every ApplicationStatus, so a
 * status with no applications is present with a count of 0 (never absent) — the
 * dashboard can therefore render a stable, complete set of status tiles.
 */
export type StatusCounts = Record<ApplicationStatus, number>

export interface ApplicationSummary {
  /** Total number of applications, across all statuses. */
  total: number
  /** Per-status counts; every APPLICATION_STATUSES value is always present. */
  statusCounts: StatusCounts
}

/**
 * Pure summary of a list of applications: the total count and a per-status
 * count. Derives its status keys from APPLICATION_STATUSES (never a duplicated
 * list) and takes a plain array — it does not read localStorage or any other
 * source — so it is deterministic and trivially unit-testable.
 */
export function summarizeApplications(
  applications: JobApplication[],
): ApplicationSummary {
  // Seed every known status at 0 so absent statuses still report a count.
  const statusCounts = {} as StatusCounts
  for (const status of APPLICATION_STATUSES) {
    statusCounts[status] = 0
  }

  for (const application of applications) {
    statusCounts[application.status] += 1
  }

  return { total: applications.length, statusCounts }
}

/**
 * Percentage width for a status progress bar, where the largest count in the set
 * fills its bar (100%) and the rest are proportional to it. Returns 0 when there
 * is nothing to scale against (max <= 0), so an all-zero dataset yields empty
 * bars instead of dividing by zero. Pure: no imports, no side effects.
 */
export function progressPercent(count: number, max: number): number {
  if (max <= 0) return 0
  return (count / max) * 100
}
