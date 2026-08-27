import type { JobApplication } from '../../types/application'

/**
 * Whether the dashboard should show its empty state: true exactly when there
 * are no applications to summarize. Derived from the shared applications array
 * (the single source of truth) — there is no dashboard-specific storage or
 * state. Pure and side-effect free, so the decision is trivially unit-testable.
 */
export function isDashboardEmpty(applications: JobApplication[]): boolean {
  return applications.length === 0
}
