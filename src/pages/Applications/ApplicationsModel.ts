import type { ApplicationDraft, JobApplication } from '../../types/application'
import {
  addApplication as addApplicationToRepository,
  deleteApplication as deleteApplicationFromRepository,
  getApplications as getApplicationsFromRepository,
  updateApplication as updateApplicationInRepository,
} from '../../services/applicationRepository'
import { buildApplication } from './applicationFactory'

/**
 * Business/data layer for the Applications feature.
 *
 * It delegates persistence to the Supabase-backed applicationRepository, which
 * scopes every read and write to the signed-in user via row-level security, so
 * applications are stored server-side and follow the user across devices. This
 * is the only layer (besides the repository itself) that knows how applications
 * are stored. It uses no React hooks and renders no JSX, so it can be consumed
 * by the ViewModel or tested in isolation. Every operation is async because the
 * repository talks to the network; the repository derives user_id from the
 * authenticated session (never from the UI).
 */

export function getApplications(): Promise<JobApplication[]> {
  return getApplicationsFromRepository()
}

export function createApplication(
  draft: ApplicationDraft,
): Promise<JobApplication> {
  return addApplicationToRepository(buildApplication(draft))
}

export function updateApplication(
  application: JobApplication,
): Promise<JobApplication> {
  return updateApplicationInRepository(application)
}

export function deleteApplication(id: string): Promise<void> {
  return deleteApplicationFromRepository(id)
}
