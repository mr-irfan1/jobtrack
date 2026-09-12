import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  saveJob,
  removeSavedJob,
  isJobIdSaved,
  getSavedJobIds,
} from './savedJobsStore.ts'
import {
  addResume,
  getResumes,
  getPrimaryResume,
  setApplicationResume,
  getApplicationResume,
  getApplicationResumeId,
  deleteResume,
} from './resumeStore.ts'
import {
  addFollowUp,
  getFollowUps,
  completeFollowUp,
} from './followUpStore.ts'
import { getRelativeStatus } from '../pages/FollowUps/FollowUpModel.ts'
import { buildComprehensiveNotifications } from '../components/Notifications/notifications.ts'
import type { JobApplication } from '../types/application.ts'
import type { JobListing } from '../types/jobFeed.ts'

// In-memory localStorage mock for node test runner
class LocalStorageMock {
  private store = new Map<string, string>()
  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  clear(): void {
    this.store.clear()
  }
}

beforeEach(() => {
  // Reset localStorage
  ;(globalThis as unknown as { localStorage: LocalStorageMock }).localStorage =
    new LocalStorageMock()
})

test('WORKFLOW 1: Job Feed save & unsave state synchronization', () => {
  const dummyJob: JobListing = {
    id: 'remotive-101',
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    location: 'Remote, US',
    employmentType: 'Full-time',
    category: 'Software Development',
    applyUrl: 'https://remotive.com/apply/101',
    description: 'Build user-facing payment UIs.',
    source: 'Remotive',
  }

  assert.equal(isJobIdSaved(dummyJob.id), false)
  saveJob(dummyJob)
  assert.equal(isJobIdSaved(dummyJob.id), true)
  assert.deepEqual(getSavedJobIds(), [dummyJob.id])

  removeSavedJob(dummyJob.id)
  assert.equal(isJobIdSaved(dummyJob.id), false)
  assert.equal(getSavedJobIds().length, 0)
})

test('WORKFLOW 2: Application creation auto-links active Primary resume', () => {
  // 1. Upload a primary resume
  const res = addResume({
    name: 'Frontend Engineer Resume',
    fileName: 'frontend-2026.pdf',
    fileSize: 102400,
    fileType: 'pdf',
    fileData: 'data:application/pdf;base64,JVBERi0xLjc...',
    isPrimary: true,
  })
  assert.equal(res.success, true)
  assert.ok(res.resume)
  assert.equal(res.resume.isPrimary, true)
  assert.equal(getPrimaryResume()?.id, res.resume.id)

  // 2. Create application and link resume
  const appId = 'app-stripe-001'
  setApplicationResume(appId, res.resume.id)

  assert.equal(getApplicationResumeId(appId), res.resume.id)
  const attached = getApplicationResume(appId)
  assert.ok(attached)
  assert.equal(attached.id, res.resume.id)
  assert.equal(attached.name, 'Frontend Engineer Resume')

  // 3. Delete resume -> application handles orphan state gracefully
  deleteResume(res.resume.id)
  assert.equal(getApplicationResume(appId), null)
})

test('WORKFLOW 3: Application follow-up tracking and overdue detection', () => {
  const appId = 'app-google-002'
  const todayDate = new Date('2026-09-11T12:00:00')
  const pastDate = '2026-09-01'

  // Add overdue follow-up
  const overdueRes = addFollowUp({
    applicationId: appId,
    scheduledDate: pastDate,
    scheduledTime: '10:00',
    note: 'Check if recruiter reviewed assignment',
  })
  assert.equal(overdueRes.success, true)
  assert.ok(overdueRes.followUp)

  const relative = getRelativeStatus(overdueRes.followUp, todayDate)
  assert.equal(relative.tone, 'danger')
  assert.ok(relative.label.includes('Overdue') || relative.label.includes('d ago'))

  // Complete the follow-up
  completeFollowUp(overdueRes.followUp.id)
  const updated = getFollowUps().find((f) => f.id === overdueRes.followUp?.id)
  assert.equal(updated?.status, 'completed')
})

test('WORKFLOW 4: End-to-end notification derivation for follow-ups and interviews', () => {
  const today = '2026-09-11'
  const app: JobApplication = {
    id: 'app-meta-003',
    company: 'Meta',
    jobTitle: 'Product Engineer',
    location: 'Remote',
    jobUrl: 'https://meta.careers/123',
    applicationDate: '2026-09-10',
    status: 'Interview',
    notes: 'Technical screen passed',
    interviewDate: today,
    interviewTime: '14:00',
    interviewType: 'System Design',
    meetingLink: 'https://zoom.us/j/123456789',
  }

  const followUp = {
    id: 'fu-meta-1',
    applicationId: app.id,
    scheduledDate: today,
    scheduledTime: '11:00',
    status: 'pending' as const,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
  }

  const context = {
    todayISO: today,
    tomorrowISO: '2026-09-12',
    currentYear: 2026,
    readIds: new Set<string>(),
  }

  const notifications = buildComprehensiveNotifications([app], context, [followUp])

  // Interview notification should exist
  const interviewNotif = notifications.find((n) => n.category === 'TODAY_INTERVIEW')
  assert.ok(interviewNotif)
  assert.equal(interviewNotif.applicationId, app.id)
  assert.equal(interviewNotif.meetingLink, app.meetingLink)

  // Due today follow-up notification should exist
  const followUpNotif = notifications.find((n) => n.category === 'FOLLOW_UP_DUE')
  assert.ok(followUpNotif)
  assert.equal(followUpNotif.applicationId, app.id)
  assert.ok(followUpNotif.title.includes('Meta'))
})
