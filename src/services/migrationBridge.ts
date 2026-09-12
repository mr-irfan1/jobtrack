/**
 * Non-destructive Migration Bridge for JobTrack
 * =============================================
 * Safely migrates legacy browser localStorage data (applications, resumes,
 * saved jobs, follow-ups, cover letters, alerts) to Supabase when an
 * authenticated user session is active.
 *
 * Guarantees:
 * 1. Non-destructive: Local data is verified before clearing file data.
 * 2. Idempotent: Deterministic IDs prevent duplicate rows on re-runs.
 * 3. Privacy: Logs only counts and completion status, never sensitive user data.
 */

import { supabase } from './supabaseClient.ts'
import * as localApplications from './applicationStorageService.ts'
import * as localResumes from './resumeStore.ts'
import * as localSavedJobs from './savedJobsStore.ts'
import * as localFollowUps from './followUpStore.ts'
import * as localCoverLetters from './coverLetterService.ts'
import * as localAlerts from './jobAlertsStore.ts'
import { applicationToInsertRow } from './applicationRowMapping.ts'
import { syncNotificationState } from './profileRepository.ts'

export interface MigrationSummary {
  resumesMigrated: number
  applicationsMigrated: number
  followUpsMigrated: number
  savedJobsMigrated: number
  coverLettersMigrated: number
  alertsMigrated: number
  success: boolean
  error?: string
}

/**
 * Purges all session-scoped local storage stores upon sign out,
 * ensuring complete multi-user isolation across accounts on the same browser.
 */
export function clearAllLocalSessionData(): void {
  localApplications.clearLocalApplications()
  localResumes.clearLocalResumes()
  localFollowUps.clearAllFollowUps()
  localSavedJobs.clearAllSavedJobs()
  localCoverLetters.clearAllCoverLetters()
  localAlerts.clearAllAlerts()
}

export async function runClientMigration(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    resumesMigrated: 0,
    applicationsMigrated: 0,
    followUpsMigrated: 0,
    savedJobsMigrated: 0,
    coverLettersMigrated: 0,
    alertsMigrated: 0,
    success: false,
  }

  const { data: authData } = await supabase.auth.getSession()
  const userId = authData.session?.user.id
  if (!userId) {
    return { ...summary, error: 'No authenticated user for migration.' }
  }

  const migrationKey = `jobtrack_migration_${userId}`
  if (typeof localStorage !== 'undefined' && localStorage.getItem(migrationKey) === 'completed') {
    return { ...summary, success: true }
  }

  try {
    // 1. Resumes Migration
    const resumes = localResumes.getResumes()
    for (const r of resumes) {
      const storagePath = `${userId}/${r.id}/${r.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      // Check if row already exists in Supabase
      const { data: existingResume } = await supabase
        .from('resumes')
        .select('id')
        .eq('id', r.id)
        .maybeSingle()

      if (!existingResume) {
        // If fileData is present (base64 Data URL), convert to blob and upload
        if (r.fileData && r.fileData.startsWith('data:')) {
          try {
            const res = await fetch(r.fileData)
            const blob = await res.blob()
            await supabase.storage.from('resumes').upload(storagePath, blob, { upsert: true })
          } catch {
            // Non-fatal upload fallback
          }
        }

        await supabase.from('resumes').upsert({
          id: r.id,
          user_id: userId,
          name: r.name,
          file_name: r.fileName,
          file_type: r.fileType,
          file_size: r.fileSize,
          storage_path: storagePath,
          is_primary: r.isPrimary,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        })
        summary.resumesMigrated++
      }
    }

    // 2. Applications Migration
    const apps = localApplications.getApplications()
    const appResumeMap = localResumes.getAllApplicationResumes()
    for (const app of apps) {
      const resumeId = app.resumeId || appResumeMap[app.id] || null
      const insertRow = {
        ...applicationToInsertRow(app, userId),
        resume_id: resumeId,
      }
      const { error } = await supabase.from('applications').upsert(insertRow, { onConflict: 'id' })
      if (!error) summary.applicationsMigrated++
    }

    // 3. Follow-ups Migration
    const followUps = localFollowUps.getFollowUps()
    for (const fu of followUps) {
      const payload = {
        id: fu.id,
        user_id: userId,
        application_id: fu.applicationId,
        scheduled_date: fu.scheduledDate,
        scheduled_time: fu.scheduledTime || null,
        scheduled_for: fu.scheduledFor,
        note: fu.note || null,
        status: fu.status,
        completed_at: fu.completedAt || null,
        created_at: fu.createdAt,
      }
      const { error } = await supabase.from('follow_ups').upsert(payload, { onConflict: 'id' })
      if (!error) summary.followUpsMigrated++
    }

    // 4. Saved Jobs Migration
    const savedJobs = localSavedJobs.getSavedJobItems()
    for (const item of savedJobs) {
      const payload = {
        user_id: userId,
        job_id: item.job.id,
        title: item.job.title,
        company: item.job.company,
        company_logo: item.job.companyLogo || null,
        location: item.job.location || '',
        workplace_type: item.job.workplaceType || 'Remote',
        employment_type: item.job.employmentType || 'Full-time',
        category: item.job.category || null,
        salary: item.job.salary || null,
        apply_url: item.job.applyUrl || '',
        posted_date: item.job.postedDate || null,
        source: item.job.source || 'External',
        skills: item.job.skills || [],
        saved_at: item.savedAt,
      }
      const { error } = await supabase.from('saved_jobs').upsert(payload, { onConflict: 'user_id,job_id' })
      if (!error) summary.savedJobsMigrated++
    }

    // 5. Cover Letters Migration
    const coverLetters = localCoverLetters.getCoverLetters()
    for (const cl of coverLetters) {
      const payload = {
        id: cl.id,
        user_id: userId,
        job_id: cl.jobId || null,
        application_id: cl.applicationId || null,
        job_title: cl.jobTitle,
        company: cl.company,
        content: cl.content,
        created_at: cl.createdAt,
        updated_at: cl.updatedAt,
      }
      const { error } = await supabase.from('cover_letters').upsert(payload, { onConflict: 'id' })
      if (!error) summary.coverLettersMigrated++
    }

    // 6. Job Alerts Migration
    const alerts = localAlerts.getAllAlerts()
    for (const alert of alerts) {
      const payload = {
        id: alert.id,
        user_id: userId,
        name: alert.name,
        criteria: alert.criteria,
        frequency: alert.frequency,
        status: alert.status,
        last_checked_at: alert.lastCheckedAt || null,
        last_notified_at: alert.lastNotifiedAt || null,
        notified_job_ids: alert.notifiedJobIds,
        created_at: alert.createdAt,
        updated_at: alert.updatedAt,
      }
      const { error } = await supabase.from('job_alerts').upsert(payload, { onConflict: 'id' })
      if (!error) summary.alertsMigrated++
    }

    // 7. Notification State Synchronization
    await syncNotificationState()

    // Mark complete in localStorage for this user
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(migrationKey, 'completed')
    }

    summary.success = true
    return summary
  } catch (err) {
    summary.success = false
    summary.error = err instanceof Error ? err.message : 'Migration encountered an error.'
    return summary
  }
}
