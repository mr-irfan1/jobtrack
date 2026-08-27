import type { JobApplication } from '../../types/application'
import { getApplications as getApplicationsFromRepository } from '../../services/applicationRepository'

/**
 * Data layer for the Dashboard feature.
 *
 * Like ApplicationsModel, it reads through the shared Supabase-backed
 * applicationRepository, so the Dashboard observes the exact same single source
 * of truth (the signed-in user's rows in public.applications, scoped by RLS) as
 * the Applications page — it never keeps its own copy. Read-only by design: the
 * Dashboard summarizes applications and never mutates them. Async because the
 * repository talks to the network.
 */
export function getApplications(): Promise<JobApplication[]> {
  return getApplicationsFromRepository()
}
