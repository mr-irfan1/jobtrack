import type { JobApplication } from '../../types/application'
import { getApplications as getApplicationsFromRepository } from '../../services/applicationRepository'

/**
 * Data layer for notifications.
 *
 * Reads the same single source of truth (the Supabase-backed
 * applicationRepository) that the Dashboard and Applications pages use, so the
 * bell reflects exactly the signed-in user's applications — scoped server-side
 * by row-level security, with no second client and no duplicated auth. Read-only
 * by design: it never writes or migrates application data. Mirrors
 * DashboardModel/ApplicationsModel so the View → ViewModel → Model → repository
 * boundary is preserved. Async because the repository talks to the network.
 */
export function getApplications(): Promise<JobApplication[]> {
  return getApplicationsFromRepository()
}
