import type { JobListing } from '../types/jobFeed.ts'
import type { JobAlert } from '../types/jobAlert.ts'
import type { JobTrackNotification } from '../components/Notifications/notifications.ts'
import { deduplicateJobListings } from './jobRecommendationService.ts'
import {
  buildJobFeedUrlFromCriteria,
  matchesAlertCriteria,
} from './jobAlertsModel.ts'
import { recordAlertNotification } from './jobAlertsStore.ts'

export interface AlertMatchResult {
  alert: JobAlert
  matchedJobs: JobListing[]
  newMatches: JobListing[]
  notification?: JobTrackNotification
}

/**
 * Evaluates active alerts against a list of job listings.
 *
 * Rules:
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
  options?: {
    recordNotified?: boolean
    readIds?: ReadonlySet<string>
  },
): AlertMatchResult[] {
  const jobs = deduplicateJobListings(rawJobs)
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

    const matchedJobs = jobs.filter((job) =>
      matchesAlertCriteria(job, alert.criteria),
    )

    const notifiedSet = new Set(alert.notifiedJobIds || [])
    const newMatches = matchedJobs.filter((job) => !notifiedSet.has(job.id))

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
        recordAlertNotification(
          alert.id,
          newMatches.map((j) => j.id),
        )
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
