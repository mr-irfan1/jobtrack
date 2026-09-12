import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { deriveDashboardNextBestAction } from './dashboardNextBestAction.ts'
import type { JobApplication } from '../../types/application.ts'
import type { FollowUp } from '../../types/followUp.ts'
import type { SavedJobItem } from '../../services/savedJobsStore.ts'
import type { Resume } from '../../types/resume.ts'

const mockApp: JobApplication = {
  id: 'app-1',
  company: 'Stripe',
  jobTitle: 'Senior Frontend Engineer',
  location: 'Remote',
  applicationDate: '2026-09-01',
  status: 'Interview',
  interviewDate: '2026-09-15',
  interviewTime: '14:00',
  interviewType: 'System Design',
}

const mockFollowUp: FollowUp = {
  id: 'f-1',
  applicationId: 'app-1',
  scheduledDate: '2026-09-10', // overdue relative to 2026-09-12
  status: 'pending',
  createdAt: '2026-09-01',
  updatedAt: '2026-09-01',
  note: 'Check in on technical interview loop',
}

const mockResume: Resume = {
  id: 'res-1',
  name: 'Primary Resume',
  fileName: 'resume.pdf',
  fileType: 'pdf',
  fileSize: 102400,
  isPrimary: true,
  createdAt: '2026-09-01',
  updatedAt: '2026-09-01',
}

const mockSavedJob: SavedJobItem = {
  id: 'job-1',
  savedAt: '2026-09-11T10:00:00Z',
  job: {
    id: 'job-1',
    title: 'Staff Fullstack Engineer',
    company: 'Vercel',
    location: 'Remote',
    employmentType: 'Full-time',
    postedDate: '2026-09-10',
    description: 'Build developer tooling',
    source: 'Remotive',
    applyUrl: 'https://vercel.com/careers',
  },
}

describe('deriveDashboardNextBestAction', () => {
  it('prioritizes upcoming interview when scheduled soon', () => {
    const action = deriveDashboardNextBestAction({
      applications: [mockApp],
      followUps: [],
      savedJobs: [],
      resumes: [mockResume],
      today: '2026-09-12',
    })

    assert.equal(action.id, 'interview-prep')
    assert.equal(action.badge, 'Upcoming Interview')
    assert.match(action.title, /Stripe/)
    assert.equal(action.actionLabel, 'Prepare for Interview')
  })

  it('prioritizes overdue follow-up when no upcoming interviews', () => {
    const appWithoutInterview = { ...mockApp, interviewDate: undefined }
    const action = deriveDashboardNextBestAction({
      applications: [appWithoutInterview],
      followUps: [mockFollowUp],
      savedJobs: [],
      resumes: [mockResume],
      today: '2026-09-12',
    })

    assert.equal(action.id, 'followup-overdue')
    assert.equal(action.badge, 'Follow-up Overdue')
    assert.match(action.title, /Stripe/)
    assert.equal(action.actionLabel, 'Complete Follow-up')
  })

  it('prompts to apply to saved job when untracked', () => {
    const action = deriveDashboardNextBestAction({
      applications: [],
      followUps: [],
      savedJobs: [mockSavedJob],
      resumes: [mockResume],
      today: '2026-09-12',
    })

    assert.equal(action.id, 'saved-job-apply')
    assert.equal(action.badge, 'Saved Opportunity')
    assert.match(action.title, /Vercel/)
    assert.equal(action.actionLabel, 'Review & Apply')
  })

  it('prompts to upload primary resume when no resumes exist', () => {
    const action = deriveDashboardNextBestAction({
      applications: [],
      followUps: [],
      savedJobs: [],
      resumes: [],
      today: '2026-09-12',
    })

    assert.equal(action.id, 'upload-resume')
    assert.equal(action.badge, 'Profile Setup')
    assert.equal(action.actionLabel, 'Upload Resume')
  })
})
