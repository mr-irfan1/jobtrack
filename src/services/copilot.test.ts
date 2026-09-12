// JobTrack — AI Application Copilot Unit Test Suite
// ===================================================
// Comprehensive tests for Step 11: Unified Workspace, State Derivation,
// Readiness Scoring, and Next Best Action Selection.

import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  calculateCopilotReadiness,
  deriveApplicationCopilotState,
  determineNextBestAction,
} from './copilotService.ts'
import {
  deleteCoverLetter,
  generateLocalCoverLetter,
  getCoverLetterForJob,
  getCoverLetters,
  saveCoverLetter,
} from './coverLetterService.ts'
import type { JobApplication } from '../types/application.ts'
import type { CopilotCandidateContext, CopilotJobContext } from '../types/copilot.ts'
import type { FollowUp } from '../types/followUp.ts'
import type { Resume } from '../types/resume.ts'

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

beforeEach(() => {
  globalThis.localStorage = createLocalStorageMock()
})

const mockJob: CopilotJobContext = {
  id: 'job-stripe-1',
  title: 'Staff Frontend Engineer',
  company: 'Stripe',
  location: 'San Francisco, CA',
  employmentType: 'Full-time',
  workplaceType: 'Remote',
  skills: ['React', 'TypeScript', 'Tailwind', 'GraphQL'],
  description: 'Looking for a Staff Engineer to lead dashboard web interfaces.',
}

const mockCandidate: CopilotCandidateContext = {
  fullName: 'Jordan Lee',
  headline: 'Senior Frontend Architect',
  skills: ['React', 'TypeScript', 'Node.js'],
  achievements: ['Delivered core payment dashboard to 50k users'],
}

const mockResumeA: Resume = {
  id: 'res-a',
  name: 'Primary Developer Resume',
  fileName: 'resume.pdf',
  fileType: 'pdf',
  fileSize: 42000,
  isPrimary: true,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
}

const mockResumeB: Resume = {
  id: 'res-b',
  name: 'Tailored Stripe Resume',
  fileName: 'stripe_resume.pdf',
  fileType: 'pdf',
  fileSize: 45000,
  isPrimary: false,
  createdAt: '2026-09-05T00:00:00Z',
  updatedAt: '2026-09-05T00:00:00Z',
}

test('1. No application state: defaults to not_applied and zero readiness when materials missing', () => {
  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    resumes: [],
  })

  assert.equal(state.isApplied, false)
  assert.equal(state.status, 'not_applied')
  assert.equal(state.hasResume, false)
  assert.equal(state.hasJobMatch, false)
  assert.equal(state.hasTailoring, false)
  assert.equal(state.hasCoverLetter, false)
  assert.equal(state.hasInterview, false)
  assert.equal(state.readinessScore, 0)
  assert.equal(state.nextBestAction.actionType, 'select_resume')
})

test('2. Saved job without application reflects isSaved=true', () => {
  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    savedJobIds: [mockJob.id],
    resumes: [mockResumeA],
  })

  assert.equal(state.isSaved, true)
  assert.equal(state.isApplied, false)
  assert.equal(state.hasResume, true)
  assert.equal(state.selectedResume?.id, mockResumeA.id)
})

test('3. Application without resume: selects primary resume if available', () => {
  const mockApp: JobApplication = {
    id: 'app-stripe-1',
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    status: 'applied',
    appliedDate: '2026-09-10',
  }

  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    existingApplication: mockApp,
    resumes: [mockResumeA, mockResumeB],
  })

  assert.equal(state.isApplied, true)
  assert.equal(state.status, 'applied')
  assert.equal(state.selectedResume?.id, mockResumeA.id)
  assert.equal(state.resumePrecedenceReason, 'primary')
})

test('4. Application with linked resume: honors linked resume over primary resume', () => {
  const mockAppWithResume: JobApplication = {
    id: 'app-stripe-1',
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    status: 'applied',
    appliedDate: '2026-09-10',
    resumeId: mockResumeB.id,
  }

  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    existingApplication: mockAppWithResume,
    resumes: [mockResumeA, mockResumeB],
  })

  assert.equal(state.selectedResume?.id, mockResumeB.id)
  assert.equal(state.resumePrecedenceReason, 'application_linked')
})

test('5. Explicit resume selection prop takes precedence when no application resume is linked', () => {
  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    resumes: [mockResumeA, mockResumeB],
    explicitResumeId: mockResumeB.id,
  })

  assert.equal(state.selectedResume?.id, mockResumeB.id)
  assert.equal(state.resumePrecedenceReason, 'explicit')
})

test('6. Cover letter missing vs ready updates hasCoverLetter flag', () => {
  const stateMissing = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    coverLetters: [],
  })
  assert.equal(stateMissing.hasCoverLetter, false)

  const mockCoverLetter = {
    id: 'cl-1',
    jobId: mockJob.id,
    jobTitle: mockJob.title,
    company: mockJob.company,
    content: 'Sample letter',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
  }

  const stateReady = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    coverLetters: [mockCoverLetter],
  })
  assert.equal(stateReady.hasCoverLetter, true)
  assert.equal(stateReady.coverLetter?.id, 'cl-1')
})

test('7. Follow-up state: none when no application or no follow-ups scheduled', () => {
  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    followUps: [],
  })

  assert.equal(state.followUpState, 'none')
  assert.equal(state.activeFollowUp, null)
})

test('8. Upcoming follow-up: correctly identified and scheduled', () => {
  const mockApp: JobApplication = {
    id: 'app-stripe-1',
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    status: 'applied',
    appliedDate: '2026-09-10',
  }

  const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const mockFollowUp: FollowUp = {
    id: 'fu-1',
    applicationId: mockApp.id,
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    scheduledDate: futureDate,
    status: 'pending',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
  }

  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    existingApplication: mockApp,
    followUps: [mockFollowUp],
  })

  assert.equal(state.followUpState, 'scheduled')
  assert.equal(state.activeFollowUp?.id, 'fu-1')
})

test('9. Overdue follow-up: triggers overdue status and next best action', () => {
  const mockApp: JobApplication = {
    id: 'app-stripe-1',
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    status: 'applied',
    appliedDate: '2026-09-01',
  }

  const pastDate = '2026-09-02'
  const mockFollowUp: FollowUp = {
    id: 'fu-overdue',
    applicationId: mockApp.id,
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    scheduledDate: pastDate,
    status: 'pending',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  }

  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    existingApplication: mockApp,
    followUps: [mockFollowUp],
  })

  assert.equal(state.followUpState, 'overdue')
  assert.equal(state.nextBestAction.actionType, 'complete_followup')
})

test('10. Completed follow-up: reflects completed status', () => {
  const mockApp: JobApplication = {
    id: 'app-stripe-1',
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    status: 'applied',
    appliedDate: '2026-09-01',
  }

  const mockFollowUp: FollowUp = {
    id: 'fu-completed',
    applicationId: mockApp.id,
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    scheduledDate: '2026-09-05',
    status: 'completed',
    completedAt: '2026-09-05T10:00:00Z',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-05T10:00:00Z',
  }

  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    existingApplication: mockApp,
    followUps: [mockFollowUp],
  })

  assert.equal(state.followUpState, 'completed')
})

test('11. Interview state: reflects scheduled interview date and format', () => {
  const mockAppWithInterview: JobApplication = {
    id: 'app-stripe-1',
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    status: 'Interview',
    applicationDate: '2026-09-01',
    location: '',
    jobUrl: '',
    notes: '',
    interviewDate: '2026-09-20',
    interviewTime: '14:00',
    interviewType: 'technical',
  }

  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    existingApplication: mockAppWithInterview,
  })

  assert.equal(state.hasInterview, true)
  assert.equal(state.interviewDetails?.date, '2026-09-20')
  assert.equal(state.interviewDetails?.type, 'technical')
  assert.equal(state.nextBestAction.actionType, 'prepare_interview')
})

test('12. Readiness score calculation increments 20% per completed dimension', () => {
  const r0 = calculateCopilotReadiness({
    hasJobMatch: false,
    hasResume: false,
    hasTailoring: false,
    hasCoverLetter: false,
    isApplied: false,
  })
  assert.equal(r0.score, 0)

  const r2 = calculateCopilotReadiness({
    hasJobMatch: true,
    hasResume: true,
    hasTailoring: false,
    hasCoverLetter: false,
    isApplied: false,
  })
  assert.equal(r2.score, 40)

  const rFull = calculateCopilotReadiness({
    hasJobMatch: true,
    hasResume: true,
    hasTailoring: true,
    hasCoverLetter: true,
    isApplied: true,
  })
  assert.equal(rFull.score, 100)
})

test('13. Next Best Action priority: offer received overrides other tasks', () => {
  const action = determineNextBestAction({
    isApplied: true,
    applicationStatus: 'offer',
    hasResume: true,
    hasJobMatch: true,
    hasTailoring: true,
    hasCoverLetter: true,
    followUpState: 'overdue', // Even if follow-up is overdue
    hasInterview: true,
    isInterviewSoon: true,
  })

  assert.equal(action.actionType, 'celebrate_offer')
})

test('14. Next Best Action priority: rejected status suggests exploring other jobs', () => {
  const action = determineNextBestAction({
    isApplied: true,
    applicationStatus: 'rejected',
    hasResume: true,
    hasJobMatch: true,
    hasTailoring: true,
    hasCoverLetter: true,
    followUpState: 'none',
    hasInterview: false,
    isInterviewSoon: false,
  })

  assert.equal(action.actionType, 'explore_jobs')
})

test('15. Next Best Action priority: interview scheduled suggests preparing with AI', () => {
  const action = determineNextBestAction({
    isApplied: true,
    applicationStatus: 'interviewing',
    hasResume: true,
    hasJobMatch: true,
    hasTailoring: true,
    hasCoverLetter: true,
    followUpState: 'none',
    hasInterview: true,
    isInterviewSoon: true,
  })

  assert.equal(action.actionType, 'prepare_interview')
})

test('16. Next Best Action priority: application tracked without follow-up suggests scheduling follow-up', () => {
  const action = determineNextBestAction({
    isApplied: true,
    applicationStatus: 'applied',
    hasResume: true,
    hasJobMatch: true,
    hasTailoring: true,
    hasCoverLetter: true,
    followUpState: 'none',
    hasInterview: false,
    isInterviewSoon: false,
  })

  assert.equal(action.actionType, 'schedule_followup')
})

test('17. Next Best Action priority: materials ready suggests tracking application in JobTrack', () => {
  const action = determineNextBestAction({
    isApplied: false,
    hasResume: true,
    hasJobMatch: true,
    hasTailoring: true,
    hasCoverLetter: true,
    followUpState: 'none',
    hasInterview: false,
    isInterviewSoon: false,
  })

  assert.equal(action.actionType, 'track_application')
})

test('18. State isolation: state does not leak between different jobs', () => {
  const job2: CopilotJobContext = {
    id: 'job-airbnb-2',
    title: 'Backend Engineer',
    company: 'Airbnb',
  }

  const appStripe: JobApplication = {
    id: 'app-stripe-1',
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    status: 'applied',
    appliedDate: '2026-09-10',
  }

  const stateStripe = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    existingApplication: appStripe,
  })

  const stateAirbnb = deriveApplicationCopilotState({
    job: job2,
    candidate: mockCandidate,
    allApplications: [appStripe],
  })

  assert.equal(stateStripe.isApplied, true)
  assert.equal(stateAirbnb.isApplied, false, 'Airbnb job must not be marked as applied based on Stripe application')
})

test('19. generateLocalCoverLetter produces grounded letter without fabricated metrics', () => {
  const draft = generateLocalCoverLetter({
    job: mockJob,
    candidate: mockCandidate,
  })

  assert.ok(draft.content.includes(mockJob.title))
  assert.ok(draft.content.includes(mockJob.company))
  assert.ok(draft.content.includes('Jordan Lee'))
  assert.ok(draft.content.includes('React'))
  // Factuality check: no fake percentages
  assert.ok(!draft.content.includes('%'))
})

test('20. Cover letter store persists and retrieves correctly', () => {
  const testLetter = {
    id: 'cl-test-1',
    jobId: 'job-test-99',
    jobTitle: 'Test Engineer',
    company: 'Acme Corp',
    content: 'Test content',
    createdAt: '2026-09-11T00:00:00Z',
    updatedAt: '2026-09-11T00:00:00Z',
  }

  saveCoverLetter(testLetter)
  const retrieved = getCoverLetterForJob('job-test-99')
  assert.ok(retrieved)
  assert.equal(retrieved?.id, 'cl-test-1')

  deleteCoverLetter('cl-test-1')
  const afterDelete = getCoverLetterForJob('job-test-99')
  assert.equal(afterDelete, null)
})

test('21. calculateCopilotReadiness includes transparent dimension explanations', () => {
  const readiness = calculateCopilotReadiness({
    hasJobMatch: true,
    hasResume: false,
    hasTailoring: false,
    hasCoverLetter: false,
    isApplied: false,
  })

  assert.equal(readiness.dimensions.length, 5)
  const jobFit = readiness.dimensions.find((d) => d.id === 'job_fit')
  assert.equal(jobFit?.completed, true)
  assert.ok(jobFit?.description.includes('evaluated'))

  const resumeSel = readiness.dimensions.find((d) => d.id === 'resume_selected')
  assert.equal(resumeSel?.completed, false)
})

test('22. Workflow steps progression maps completed and current milestones accurately', () => {
  const mockApp: JobApplication = {
    id: 'app-stripe-1',
    company: 'Stripe',
    jobTitle: 'Staff Frontend Engineer',
    status: 'applied',
    appliedDate: '2026-09-10',
  }

  const state = deriveApplicationCopilotState({
    job: mockJob,
    candidate: mockCandidate,
    existingApplication: mockApp,
    resumes: [mockResumeA],
  })

  assert.equal(state.workflowSteps.length, 6)
  const jobStep = state.workflowSteps.find((s) => s.id === 'job_found')
  assert.equal(jobStep?.status, 'completed')

  const appStep = state.workflowSteps.find((s) => s.id === 'application_tracked')
  assert.equal(appStep?.status, 'completed')
})

test('23. Next Best Action priority: select_resume is primary when no resume is available', () => {
  const action = determineNextBestAction({
    isApplied: false,
    hasResume: false,
    hasJobMatch: false,
    hasTailoring: false,
    hasCoverLetter: false,
    followUpState: 'none',
    hasInterview: false,
    isInterviewSoon: false,
  })

  assert.equal(action.actionType, 'select_resume')
  assert.equal(action.buttonLabel, 'Select Resume')
})

test('24. Next Best Action priority: tailor_resume suggested when resume selected and fit evaluated', () => {
  const action = determineNextBestAction({
    isApplied: false,
    hasResume: true,
    hasJobMatch: true,
    hasTailoring: false,
    hasCoverLetter: false,
    followUpState: 'none',
    hasInterview: false,
    isInterviewSoon: false,
  })

  assert.equal(action.actionType, 'tailor_resume')
  assert.equal(action.buttonLabel, 'Tailor Resume')
})

test('25. Next Best Action priority: generate_cover_letter suggested when tailored but letter missing', () => {
  const action = determineNextBestAction({
    isApplied: false,
    hasResume: true,
    hasJobMatch: true,
    hasTailoring: true,
    hasCoverLetter: false,
    followUpState: 'none',
    hasInterview: false,
    isInterviewSoon: false,
  })

  assert.equal(action.actionType, 'generate_cover_letter')
  assert.equal(action.buttonLabel, 'Generate Cover Letter')
})

test('26. getCoverLetters returns empty array when nothing is stored or invalid JSON', () => {
  localStorage.clear()
  assert.deepEqual(getCoverLetters(), [])

  localStorage.setItem('jobtrack_cover_letters', 'invalid-json{')
  assert.deepEqual(getCoverLetters(), [])
})

