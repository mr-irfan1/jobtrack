import type { JobListing } from '../types/jobFeed.ts'
import type { JobAlert } from '../types/jobAlert.ts'
import type { JobTrackNotification } from '../components/Notifications/notifications.ts'
import { deduplicateJobListings } from './jobRecommendationService.ts'
import {
  buildJobFeedUrlFromCriteria,
  matchesAlertCriteria,
  isJobActiveAndNotExpired,
} from './jobAlertsModel.ts'
import { recordAlertNotification } from './jobAlertsStore.ts'
import { fetchJobListings } from './jobFeedService.ts'

/**
 * Job Alert Matching Service
 * ===========================
 * Evaluates active user job alerts against canonical jobs from Supabase `public.jobs`.
 *
 * Runtime Flow:
 *   Supabase public.jobs
 *        ↓
 *   Job Feed Service (fetchJobListings)
 *        ↓
 *   Job Alert Matching Service (evaluateJobAlerts)
 *        ↓
 *   Match against alert criteria (query, workplace, type, category, location, skills)
 *        ↓
 *   Multi-provider Deduplication (checks UUID, sourceJobId, and canonicalUrl)
 *        ↓
 *   Store alert state (notifiedJobIds)
 *
 * Architectural Boundary Notice:
 *   Job Alerts are evaluated reactively client-side when the application/feed flow runs
 *   (e.g. when the user opens the application, visits /alerts, or views the notification bell).
 *   Background notifications/emails while the browser/app is completely closed are NOT
 *   implemented in this task and require an external push or server-side scheduler.
 */

export interface AlertMatchResult {
  alert: JobAlert
  matchedJobs: JobListing[]
  newMatches: JobListing[]
  notification?: JobTrackNotification
}

export interface EvaluateJobAlertsOptions {
  recordNotified?: boolean
  readIds?: ReadonlySet<string>
}

/**
 * Checks whether a job has already been notified under any known provider identifier.
 * Prevents repeatedly notifying the same job across UUIDs, provider source IDs, and canonical URLs.
 */
export function isJobAlreadyNotified(
  job: JobListing,
  notifiedSet: ReadonlySet<string>,
): boolean {
  if (notifiedSet.has(job.id)) return true
  if (job.sourceJobId && notifiedSet.has(job.sourceJobId)) return true
  if (
    job.source &&
    job.sourceJobId &&
    notifiedSet.has(`${job.source.toLowerCase()}::${job.sourceJobId}`)
  ) {
    return true
  }
  if (job.canonicalUrl && notifiedSet.has(job.canonicalUrl)) return true
  return false
}

/**
 * Evaluates active alerts against a list of canonical job listings.
 *
 * Rules:
 * - Filters out inactive or expired jobs (never alerts on delisted/stale roles).
 * - Deduplicates incoming jobs first using canonical job signatures.
 * - Paused alerts are skipped completely (produce zero matches and zero notifications).
 * - Identifies new matches that were not previously notified for that alert.
 * - Groups multiple matches from the same alert run into a single summary notification.
 * - Records notified IDs to prevent duplicate alerts on future runs.
 * - Provides actionUrl linking to /jobs with the exact alert criteria.
 */
export function evaluateJobAlerts(
  rawJobs: JobListing[],
  alerts: JobAlert[],
  options?: EvaluateJobAlertsOptions,
): AlertMatchResult[] {
  // 1. Deduplicate incoming jobs and filter out inactive/expired jobs
  const deduplicated = deduplicateJobListings(rawJobs)
  const activeJobs = deduplicated.filter(isJobActiveAndNotExpired)

  const results: AlertMatchResult[] = []
  const readIds = options?.readIds || new Set<string>()

  for (const alert of alerts) {
    if (alert.status === 'paused') {
      results.push({
        alert,
        matchedJobs: [],
        newMatches: [],
      })
      continue
    }

    // Match against alert criteria (query/keywords, workplace, type, category, location, skills)
    const matchedJobs = activeJobs.filter((job) =>
      matchesAlertCriteria(job, alert.criteria),
    )

    const notifiedSet = new Set(alert.notifiedJobIds || [])
    const newMatches = matchedJobs.filter((job) => !isJobAlreadyNotified(job, notifiedSet))

    let notification: JobTrackNotification | undefined

    if (newMatches.length > 0) {
      // Deterministic notification ID based on alert id and newest match id
      const primaryJob = newMatches[0]
      const notifId = `job_alert::${alert.id}::${primaryJob.id}::count_${newMatches.length}`
      const actionUrl = buildJobFeedUrlFromCriteria(alert.criteria)

      if (newMatches.length === 1) {
        notification = {
          id: notifId,
          type: 'job_alert',
          category: 'JOB_ALERT_MATCH',
          title: `New job matches "${alert.name}"`,
          company: primaryJob.company,
          jobTitle: primaryJob.title,
          description: `A newly discovered opportunity for ${primaryJob.title} at ${primaryJob.company} (${primaryJob.location}) matches your alert.`,
          meta: `${alert.name} • 1 new match`,
          actionUrl,
          alertId: alert.id,
          read: readIds.has(notifId),
        }
      } else {
        const otherCount = newMatches.length - 1
        const otherLabel = otherCount === 1 ? '1 other role' : `${otherCount} other roles`
        notification = {
          id: notifId,
          type: 'job_alert',
          category: 'JOB_ALERT_MATCH',
          title: `${newMatches.length} new jobs match "${alert.name}"`,
          company: primaryJob.company,
          jobTitle: primaryJob.title,
          description: `${primaryJob.title} at ${primaryJob.company} and ${otherLabel} match your criteria.`,
          meta: `${alert.name} • ${newMatches.length} new matches`,
          actionUrl,
          alertId: alert.id,
          read: readIds.has(notifId),
        }
      }

      if (options?.recordNotified) {
        const idsToRecord: string[] = []
        for (const j of newMatches) {
          idsToRecord.push(j.id)
          if (j.sourceJobId) {
            idsToRecord.push(j.sourceJobId)
            if (j.source) {
              idsToRecord.push(`${j.source.toLowerCase()}::${j.sourceJobId}`)
            }
          }
          if (j.canonicalUrl) {
            idsToRecord.push(j.canonicalUrl)
          }
        }
        recordAlertNotification(alert.id, idsToRecord)
      }
    }

    results.push({
      alert,
      matchedJobs,
      newMatches,
      notification,
    })
  }

  return results
}

/**
 * Evaluates alerts directly against the latest canonical jobs from Supabase public.jobs.
 */
export async function evaluateJobAlertsFromFeed(
  alerts: JobAlert[],
  options?: EvaluateJobAlertsOptions & { forceRefresh?: boolean },
): Promise<AlertMatchResult[]> {
  const jobs = await fetchJobListings({ forceRefresh: options?.forceRefresh })
  return evaluateJobAlerts(jobs, alerts, options)
}
