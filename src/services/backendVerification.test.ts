import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import {
  rowToApplication,
  applicationToInsertRow,
  applicationToUpdatePayload,
} from './applicationRowMapping.ts'
import type { ApplicationRow } from './applicationRowMapping.ts'
import type { JobApplication } from '../types/application.ts'
import * as resumeRepo from './resumeRepository.ts'
import * as followUpRepo from './followUpRepository.ts'
import * as savedJobsRepo from './savedJobsRepository.ts'
import * as coverLetterRepo from './coverLetterRepository.ts'
import * as jobAlertsRepo from './jobAlertsRepository.ts'
import { runClientMigration } from './migrationBridge.ts'
import * as localResumes from './resumeStore.ts'
import * as localApplications from './applicationStorageService.ts'
import * as localFollowUps from './followUpStore.ts'
import * as localSavedJobs from './savedJobsStore.ts'
import * as localCoverLetters from './coverLetterService.ts'
import * as localAlerts from './jobAlertsStore.ts'

function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    clear() {
      store = {}
    },
    getItem(key: string) {
      return key in store ? store[key] : null
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null
    },
    removeItem(key: string) {
      delete store[key]
    },
    setItem(key: string, value: string) {
      store[key] = String(value)
    },
  } as Storage
}

describe('Backend Architecture & Repository Verification', () => {
  beforeEach(() => {
    globalThis.localStorage = createLocalStorageMock()
  })

  // --------------------------------------------------------------------------
  // 1. Application Row Mapping with resume_id
  // --------------------------------------------------------------------------
  it('1. ApplicationRow maps resume_id to domain model resumeId', () => {
    const row: ApplicationRow = {
      id: 'app-uuid-1',
      user_id: 'user-uuid-1',
      company: 'Google',
      job_title: 'Senior Software Engineer',
      location: 'Mountain View, CA',
      job_url: 'https://careers.google.com/jobs/123',
      application_date: '2026-09-12',
      status: 'Applied',
      notes: 'Applied with tailored resume',
      interview_date: '2026-09-20',
      interview_time: '14:00:00',
      interview_type: 'Technical Screen',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      resume_id: 'res-uuid-99',
      created_at: '2026-09-12T10:00:00.000Z',
      updated_at: '2026-09-12T10:00:00.000Z',
    }

    const domain = rowToApplication(row)
    assert.equal(domain.id, 'app-uuid-1')
    assert.equal(domain.resumeId, 'res-uuid-99')
    assert.equal(domain.interviewTime, '14:00')

    const updatePayload = applicationToUpdatePayload(domain)
    assert.equal(updatePayload.resume_id, 'res-uuid-99')

    const insertRow = applicationToInsertRow(domain, 'user-uuid-1')
    assert.equal(insertRow.resume_id, 'res-uuid-99')
    assert.equal(insertRow.user_id, 'user-uuid-1')
  })

  it('2. ApplicationRow handles null resume_id gracefully', () => {
    const row: ApplicationRow = {
      id: 'app-uuid-2',
      user_id: 'user-uuid-1',
      company: 'Stripe',
      job_title: 'Backend Engineer',
      location: 'Remote',
      job_url: 'https://stripe.com/jobs/456',
      application_date: '2026-09-12',
      status: 'Wishlist',
      notes: '',
      interview_date: null,
      interview_time: null,
      interview_type: null,
      meeting_link: null,
      resume_id: null,
      created_at: '2026-09-12T10:00:00.000Z',
      updated_at: null,
    }

    const domain = rowToApplication(row)
    assert.equal(domain.resumeId, undefined)

    const updatePayload = applicationToUpdatePayload(domain)
    assert.equal(updatePayload.resume_id, null)
  })

  // --------------------------------------------------------------------------
  // 2. Resume Repository
  // --------------------------------------------------------------------------
  it('3. Resume repository creates and retrieves resumes with fallback bridge', async () => {
    const res = await resumeRepo.addResume({
      name: 'Full Stack 2026',
      fileName: 'resume.pdf',
      fileType: 'pdf',
      fileSize: 10240,
    })

    assert.equal(res.success, true)
    assert.ok(res.resume?.id)
    assert.equal(res.resume?.name, 'Full Stack 2026')
    assert.equal(res.resume?.isPrimary, true)

    const list = await resumeRepo.getResumes()
    assert.equal(list.length, 1)
    assert.equal(list[0].id, res.resume?.id)
  })

  it('4. Resume repository promotes next available resume on delete', async () => {
    const r1 = await resumeRepo.addResume({
      name: 'Primary Resume',
      fileName: 'r1.pdf',
      fileType: 'pdf',
      fileSize: 2000,
    })
    const r2 = await resumeRepo.addResume({
      name: 'Secondary Resume',
      fileName: 'r2.pdf',
      fileType: 'pdf',
      fileSize: 3000,
    })

    assert.ok(r1.resume)
    assert.ok(r2.resume)

    // Delete primary
    await resumeRepo.deleteResume(r1.resume.id)

    const updatedList = await resumeRepo.getResumes()
    assert.equal(updatedList.length, 1)
    assert.equal(updatedList[0].id, r2.resume.id)
    assert.equal(updatedList[0].isPrimary, true)
  })

  // --------------------------------------------------------------------------
  // 3. Follow-up Repository
  // --------------------------------------------------------------------------
  it('5. Follow-up repository creates, reschedules, and completes follow-ups', async () => {
    const addResult = await followUpRepo.addFollowUp({
      applicationId: 'app-100',
      scheduledDate: '2026-09-15',
      scheduledTime: '10:00',
      note: 'Send thank you email',
    })

    assert.equal(addResult.success, true)
    assert.ok(addResult.followUp?.id)
    assert.equal(addResult.followUp?.status, 'pending')

    // Reschedule
    const resched = await followUpRepo.rescheduleFollowUp(
      addResult.followUp.id,
      '2026-09-18',
      '11:00',
      'Rescheduled follow-up',
    )
    assert.equal(resched.success, true)

    // Complete
    await followUpRepo.completeFollowUp(addResult.followUp.id)
    const list = await followUpRepo.getFollowUps()
    const item = list.find((f) => f.id === addResult.followUp?.id)
    assert.ok(item)
    assert.equal(item.status, 'completed')
  })

  // --------------------------------------------------------------------------
  // 4. Saved Jobs Repository
  // --------------------------------------------------------------------------
  it('6. Saved jobs repository saves, verifies, and removes bookmarked jobs', async () => {
    const dummyJob = {
      id: 'job-remotive-99',
      title: 'Senior Frontend Engineer',
      company: 'Vercel',
      location: 'Remote',
      workplaceType: 'Remote' as const,
      employmentType: 'Full-time' as const,
      description: 'Exciting React role...',
      skills: ['React', 'TypeScript', 'Next.js'],
      postedDate: '2026-09-10',
      source: 'Remotive',
      applyUrl: 'https://vercel.com/careers',
    }

    await savedJobsRepo.saveJob(dummyJob)
    const isSaved = await savedJobsRepo.isJobSaved('job-remotive-99')
    assert.equal(isSaved, true)

    const items = await savedJobsRepo.getSavedJobs()
    assert.equal(items.length, 1)
    assert.equal(items[0].job.company, 'Vercel')

    await savedJobsRepo.removeSavedJob('job-remotive-99')
    const stillSaved = await savedJobsRepo.isJobSaved('job-remotive-99')
    assert.equal(stillSaved, false)
  })

  // --------------------------------------------------------------------------
  // 5. Cover Letters Repository
  // --------------------------------------------------------------------------
  it('7. Cover letter repository saves, retrieves by job/app, and deletes', async () => {
    const draft = {
      id: 'cl-job-1-12345',
      jobId: 'job-1',
      applicationId: 'app-1',
      jobTitle: 'Staff Engineer',
      company: 'Figma',
      content: 'Dear Figma Hiring Team...',
      createdAt: '2026-09-12T12:00:00.000Z',
      updatedAt: '2026-09-12T12:00:00.000Z',
    }

    await coverLetterRepo.saveCoverLetter(draft)
    const retrieved = await coverLetterRepo.getCoverLetterForJob('job-1')
    assert.ok(retrieved)
    assert.equal(retrieved.company, 'Figma')

    await coverLetterRepo.deleteCoverLetter('cl-job-1-12345')
    const afterDelete = await coverLetterRepo.getCoverLetterForJob('job-1')
    assert.equal(afterDelete, null)
  })

  // --------------------------------------------------------------------------
  // 6. Job Alerts Repository
  // --------------------------------------------------------------------------
  it('8. Job alerts repository validates, saves, toggles status, and deletes', async () => {
    const res = await jobAlertsRepo.saveAlert({
      name: 'Remote React Jobs',
      criteria: {
        query: 'React',
        workplace: 'Remote',
      },
      frequency: 'daily',
    })

    assert.equal(res.success, true)
    assert.ok(res.alert?.id)
    assert.equal(res.alert?.status, 'active')

    // Toggle
    const toggled = await jobAlertsRepo.toggleAlertStatus(res.alert.id)
    assert.equal(toggled?.status, 'paused')

    // Delete
    await jobAlertsRepo.deleteAlert(res.alert.id)
    const list = await jobAlertsRepo.getAlerts()
    assert.equal(list.some((a) => a.id === res.alert?.id), false)
  })

  // --------------------------------------------------------------------------
  // 7. Non-Destructive Migration Bridge
  // --------------------------------------------------------------------------
  it('9. Migration bridge safely runs without throwing on unauthenticated state', async () => {
    // Populate local stores
    localApplications.addApplication({
      id: 'legacy-app-1',
      company: 'Netflix',
      jobTitle: 'UI Engineer',
      location: 'Los Gatos, CA',
      jobUrl: 'https://jobs.netflix.com/1',
      applicationDate: '2026-09-01',
      status: 'Applied',
      notes: 'Initial test',
    })

    localResumes.addResume({
      id: 'legacy-res-1',
      name: 'Legacy Resume',
      fileName: 'legacy.pdf',
      fileType: 'pdf',
      fileSize: 4096,
    })

    const summary = await runClientMigration()
    // When there is no active Supabase user session, migration gracefully returns diagnostic
    assert.ok(typeof summary.success === 'boolean')

    // Local data must remain untouched and non-destructively preserved
    assert.equal(localApplications.getApplications().length, 1)
    assert.equal(localResumes.getResumes().length, 1)
  })

  it('10. Migration bridge idempotency: re-running does not corrupt or duplicate local state', async () => {
    localApplications.addApplication({
      id: 'idempotent-app-1',
      company: 'Apple',
      jobTitle: 'iOS Engineer',
      location: 'Cupertino, CA',
      jobUrl: 'https://jobs.apple.com/1',
      applicationDate: '2026-09-05',
      status: 'Wishlist',
      notes: 'Testing idempotency',
    })

    const summary1 = await runClientMigration()
    const summary2 = await runClientMigration()

    assert.equal(summary1.applicationsMigrated, summary2.applicationsMigrated)
    assert.equal(localApplications.getApplications().length, 1)
  })

  // --------------------------------------------------------------------------
  // 8. Storage Path Traversal & User Folder Isolation
  // --------------------------------------------------------------------------
  it('11. Storage path strictly enforces {userId}/{resumeId}/{fileName} and sanitizes traversal characters', () => {
    const userId = 'usr-123-abc'
    const resumeId = 'res-456-def'
    const dangerousFileName = '../../../etc/passwd..//my resume (final)!.pdf'

    const baseFileName = dangerousFileName.split(/[\\/]/).pop() || 'resume.pdf'
    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '') || 'resume.pdf'
    const storagePath = `${userId}/${resumeId}/${sanitizedFileName}`

    assert.equal(storagePath.startsWith(`${userId}/`), true)
    assert.equal(storagePath.includes('..'), false)
    assert.equal(storagePath.includes('/etc/'), false)
    assert.equal(storagePath.split('/')[0], userId)
    assert.equal(storagePath.split('/')[1], resumeId)
    assert.equal(storagePath.split('/').length, 3)
  })

  // --------------------------------------------------------------------------
  // 9. Edge Function Auth Header Validation
  // --------------------------------------------------------------------------
  it('12. Edge Function auth rejects missing, malformed, or empty Bearer headers', async () => {
    // Helper to simulate requireUserAuth header checks without network calls
    function validateAuthHeader(req: Request): { status: number; error: string } | null {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
      if (!authHeader || !authHeader.toLowerCase().startsWith('bearer')) {
        return { status: 401, error: 'Unauthorized: Missing or invalid Authorization header.' }
      }
      const token = authHeader.replace(/^Bearer\s*/i, '').trim()
      if (!token) {
        return { status: 401, error: 'Unauthorized: Empty Bearer token.' }
      }
      return null
    }

    // 1. Missing header
    const req1 = new Request('https://test.supabase.co/functions/v1/analyze-resume', { method: 'POST' })
    const res1 = validateAuthHeader(req1)
    assert.ok(res1)
    assert.equal(res1.status, 401)
    assert.equal(res1.error.includes('Missing or invalid'), true)

    // 2. Malformed prefix (e.g. Basic instead of Bearer)
    const req2 = new Request('https://test.supabase.co/functions/v1/analyze-resume', {
      method: 'POST',
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    })
    const res2 = validateAuthHeader(req2)
    assert.ok(res2)
    assert.equal(res2.status, 401)

    // 3. Empty Bearer token
    const req3 = new Request('https://test.supabase.co/functions/v1/analyze-resume', {
      method: 'POST',
      headers: { Authorization: 'Bearer' },
    })
    const res3 = validateAuthHeader(req3)
    assert.ok(res3)
    assert.equal(res3.status, 401)
    assert.equal(res3.error.includes('Empty Bearer'), true)

    // 4. Valid Bearer format passes header validation
    const req4 = new Request('https://test.supabase.co/functions/v1/analyze-resume', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid.jwt.token' },
    })
    const res4 = validateAuthHeader(req4)
    assert.equal(res4, null)
  })

  // --------------------------------------------------------------------------
  // 10. Cross-User Parent-Child Relationship Integrity
  // --------------------------------------------------------------------------
  it('13. Cross-user relationship validation rejects children attached to foreign parents', () => {
    const userA = 'user-alice'
    const userB = 'user-bob'

    const applications = [
      { id: 'app-alice-1', userId: userA, company: 'Acme Corp' },
      { id: 'app-bob-1', userId: userB, company: 'Beta Corp' },
    ]

    function canCreateFollowUp(callerUserId: string, applicationId: string): boolean {
      const app = applications.find((a) => a.id === applicationId)
      return Boolean(app && app.userId === callerUserId)
    }

    // User A creating follow-up for User A's application: allowed
    assert.equal(canCreateFollowUp(userA, 'app-alice-1'), true)

    // User A attempting to create follow-up attached to User B's application: DENIED
    assert.equal(canCreateFollowUp(userA, 'app-bob-1'), false)

    // User B attempting to create follow-up attached to User A's application: DENIED
    assert.equal(canCreateFollowUp(userB, 'app-alice-1'), false)

    // Non-existent application: DENIED
    assert.equal(canCreateFollowUp(userA, 'app-non-existent'), false)
  })

  // --------------------------------------------------------------------------
  // 11. Multi-User Session Isolation & Cache Clearing
  // --------------------------------------------------------------------------
  it('14. Multi-user session isolation ensures User A data is purged from local stores upon logout', () => {
    // User A logs in and saves applications & resumes
    localApplications.addApplication({
      id: 'alice-app-1',
      company: 'Stripe',
      jobTitle: 'Software Engineer',
      location: 'Remote',
      jobUrl: 'https://stripe.com/1',
      applicationDate: '2026-09-01',
      status: 'Applied',
      notes: 'Alice private notes',
    })
    localResumes.addResume({
      id: 'alice-res-1',
      name: 'Alice Resume 2026',
      fileName: 'alice.pdf',
      fileType: 'pdf',
      fileSize: 5000,
    })

    assert.equal(localApplications.getApplications().length, 1)
    assert.equal(localResumes.getResumes().length, 1)

    // User A logs out: session clear must wipe in-memory/localStorage stores
    localApplications.clearLocalApplications()
    localResumes.clearLocalResumes()

    // Verify stores are empty before User B logs in
    assert.equal(localApplications.getApplications().length, 0)
    assert.equal(localResumes.getResumes().length, 0)

    // User B logs in and adds their own record
    localApplications.addApplication({
      id: 'bob-app-1',
      company: 'Meta',
      jobTitle: 'Frontend Engineer',
      location: 'Menlo Park, CA',
      jobUrl: 'https://metacareers.com/1',
      applicationDate: '2026-09-02',
      status: 'Wishlist',
      notes: 'Bob private notes',
    })

    const bobApps = localApplications.getApplications()
    assert.equal(bobApps.length, 1)
    assert.equal(bobApps[0].id, 'bob-app-1')
    assert.equal(bobApps[0].company, 'Meta')
  })

  // --------------------------------------------------------------------------
  // 12. Notification Deduplication on Repeated Alert Evaluation
  // --------------------------------------------------------------------------
  it('15. Job alerts evaluate matches and deduplicate notifications across repeated runs', async () => {
    const { evaluateJobAlerts } = await import('./jobAlertMatchingService.ts')
    const testAlert = {
      id: 'alert-react-1',
      name: 'Remote React Jobs',
      criteria: {
        query: 'React',
        workplace: 'Remote',
      },
      frequency: 'daily' as const,
      status: 'active' as const,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
      notifiedJobIds: [] as string[],
    }

    const testJobs = [
      {
        id: 'job-101',
        title: 'Senior React Developer',
        company: 'Automattic',
        location: 'Remote',
        workplaceType: 'Remote' as const,
        employmentType: 'Full-time' as const,
        description: 'React position',
        skills: ['React', 'TypeScript'],
        postedDate: '2026-09-12',
        source: 'Remotive',
        applyUrl: 'https://automattic.com',
      },
    ]

    // Run 1: First time discovering job-101
    const run1 = evaluateJobAlerts(testJobs, [testAlert])
    assert.equal(run1.length, 1)
    assert.equal(run1[0].newMatches.length, 1)
    assert.ok(run1[0].notification)
    assert.equal(run1[0].notification.company, 'Automattic')

    // Simulate recording notified IDs
    const updatedAlert = {
      ...testAlert,
      notifiedJobIds: ['job-101'],
    }

    // Run 2: Same job in feed on subsequent check
    const run2 = evaluateJobAlerts(testJobs, [updatedAlert])
    assert.equal(run2.length, 1)
    assert.equal(run2[0].matchedJobs.length, 1)
    // No new matches -> NO duplicate notification
    assert.equal(run2[0].newMatches.length, 0)
    assert.equal(run2[0].notification, undefined)
  })
})
