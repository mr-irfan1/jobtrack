// JobTrack — AI Application Copilot Types
// =========================================
// Strongly-typed contracts for Step 11: Unified Job Application Workspace

import type { ApplicationStatus, JobApplication } from './application'
import type { FollowUp } from './followUp'
import type { Resume } from './resume'
import type { CoverLetterDraft } from './coverLetter'
import type { JobMatchAnalysis } from './jobMatch'
import type { ResumeTailoringAnalysis } from './resumeTailoring'
import type { ResumeAnalysis } from './resumeAnalysis'

export interface CopilotJobContext {
  id: string
  title: string
  company: string
  location?: string
  employmentType?: string
  workplaceType?: string
  salary?: string | null
  skills?: string[]
  description?: string
  applyUrl?: string
  source?: string
  companyLogo?: string | null
}

export interface CopilotCandidateContext {
  fullName?: string
  headline?: string
  bio?: string
  skills: string[]
  achievements: string[]
}

export interface CopilotReadinessDimension {
  id: 'job_fit' | 'resume_selected' | 'resume_tailored' | 'cover_letter' | 'application_tracked'
  name: string
  completed: boolean
  description: string
  weight: number
}

export type CopilotNextActionType =
  | 'select_resume'
  | 'review_match'
  | 'tailor_resume'
  | 'generate_cover_letter'
  | 'track_application'
  | 'complete_followup'
  | 'schedule_followup'
  | 'prepare_interview'
  | 'celebrate_offer'
  | 'explore_jobs'

export interface CopilotNextBestAction {
  id: string
  title: string
  description: string
  actionType: CopilotNextActionType
  buttonLabel: string
}

export interface CopilotWorkflowStep {
  id: string
  label: string
  status: 'completed' | 'current' | 'upcoming'
}

export interface ApplicationCopilotState {
  job: CopilotJobContext
  isSaved: boolean
  isApplied: boolean
  application: JobApplication | null
  status: ApplicationStatus | 'not_applied'

  // Resume State
  selectedResume: Resume | null
  resumePrecedenceReason: 'application_linked' | 'primary' | 'explicit' | 'none'
  hasResume: boolean

  // AI Insights State
  hasJobMatch: boolean
  jobMatchScore: number | null
  jobMatchVerdict: string | null
  cachedJobMatch?: JobMatchAnalysis | null

  hasTailoring: boolean
  tailoringScore: number | null
  cachedTailoring?: ResumeTailoringAnalysis | null

  cachedResumeAnalysis?: ResumeAnalysis | null

  // Application Materials
  hasCoverLetter: boolean
  coverLetter: CoverLetterDraft | null

  // Follow-up State
  followUpState: 'none' | 'scheduled' | 'overdue' | 'completed'
  activeFollowUp: FollowUp | null

  // Interview State
  hasInterview: boolean
  isInterviewSoon: boolean
  interviewDateFormatted: string | null
  interviewDetails?: {
    date: string
    time?: string
    format?: string
    type?: string
  }

  // Workflow Readiness & Guidance
  readinessScore: number // 0 - 100
  readinessDimensions: CopilotReadinessDimension[]
  nextBestAction: CopilotNextBestAction
  workflowSteps: CopilotWorkflowStep[]
}
