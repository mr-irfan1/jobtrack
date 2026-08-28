import type { ExtractedJobData } from '../../services/jobExtractorService'
import type { ApplicationDraft, JobApplication } from '../../types/application'

/**
 * Maps extracted job metadata into an ApplicationDraft suitable for saving.
 * Uses default status ('Applied') and local ISO date string.
 */
export function mapExtractedJobToDraft(
  job: ExtractedJobData,
  todayIsoDate?: string,
): ApplicationDraft {
  const date = todayIsoDate || new Date().toLocaleDateString('en-CA')
  const company = job.company?.trim() || job.source?.trim() || 'Unknown Company'
  const jobTitle = job.title?.trim() || 'Job Application'
  const location = job.location?.trim() || ''
  const jobUrl = job.jobUrl?.trim() || ''
  const notes = job.description?.trim() || ''

  return {
    company,
    jobTitle,
    location,
    jobUrl,
    applicationDate: date,
    status: 'Applied',
    notes,
  }
}

/**
 * Checks whether an application with the given job URL already exists in the user's application list.
 * Performs normalized case-insensitive comparison.
 */
export function findDuplicateApplication(
  targetUrl: string,
  applications: JobApplication[],
): JobApplication | undefined {
  if (!targetUrl || !targetUrl.trim()) return undefined
  const normalizedTarget = targetUrl.trim().toLowerCase()
  return applications.find((app) => {
    if (!app.jobUrl) return false
    return app.jobUrl.trim().toLowerCase() === normalizedTarget
  })
}

export interface ImportJobResult {
  success: boolean
  isDuplicate?: boolean
  duplicateApp?: JobApplication
  application?: JobApplication
  error?: string
}

/**
 * Handles checking for duplicates and saving an imported job draft using the provided save function.
 */
export async function processJobImport(
  job: ExtractedJobData,
  existingApplications: JobApplication[],
  saveFn: (draft: ApplicationDraft) => Promise<JobApplication>,
): Promise<ImportJobResult> {
  const duplicate = findDuplicateApplication(job.jobUrl, existingApplications)
  if (duplicate) {
    return {
      success: false,
      isDuplicate: true,
      duplicateApp: duplicate,
      error: 'This job is already in your tracker.',
    }
  }

  const draft = mapExtractedJobToDraft(job)

  try {
    const created = await saveFn(draft)
    return {
      success: true,
      application: created,
    }
  } catch (err: unknown) {
    const msg =
      err instanceof Error && err.message
        ? err.message
        : 'Unable to save application. Please make sure you are signed in and try again.'
    return {
      success: false,
      error: msg,
    }
  }
}
