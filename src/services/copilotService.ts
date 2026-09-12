// JobTrack — AI Application Copilot Service
// ==========================================
// Pure deterministic state derivation and orchestration engine.
// Combines Job Feed, Applications, Resumes, Materials, Follow-ups, and Interviews.

import type { JobApplication } from '../types/application.ts'
import type {
  ApplicationCopilotState,
  CopilotCandidateContext,
  CopilotJobContext,
  CopilotNextBestAction,
  CopilotReadinessDimension,
  CopilotWorkflowStep,
} from '../types/copilot.ts'
import type { CoverLetterDraft } from '../types/coverLetter.ts'
import type { FollowUp } from '../types/followUp.ts'
import type { JobMatchAnalysis } from '../types/jobMatch.ts'
import type { Resume } from '../types/resume.ts'
import type { ResumeAnalysis } from '../types/resumeAnalysis.ts'
import type { ResumeTailoringAnalysis } from '../types/resumeTailoring.ts'

export interface DeriveCopilotStateParams {
  job: CopilotJobContext
  candidate: CopilotCandidateContext
  existingApplication?: JobApplication | null
  allApplications?: JobApplication[]
  savedJobIds?: string[]
  resumes?: Resume[]
  followUps?: FollowUp[]
  coverLetters?: CoverLetterDraft[]
  cachedJobMatch?: JobMatchAnalysis | null
  cachedResumeAnalysis?: ResumeAnalysis | null
  cachedTailoring?: ResumeTailoringAnalysis | null
  explicitResumeId?: string | null
}

/**
 * Calculates deterministic workflow readiness (0 - 100%) across 5 dimensions.
 */
export function calculateCopilotReadiness(params: {
  hasJobMatch: boolean
  hasResume: boolean
  hasTailoring: boolean
  hasCoverLetter: boolean
  isApplied: boolean
}): {
  score: number
  dimensions: CopilotReadinessDimension[]
} {
  const dimensions: CopilotReadinessDimension[] = [
    {
      id: 'job_fit',
      name: 'Role Fit Analyzed',
      completed: params.hasJobMatch,
      description: params.hasJobMatch
        ? 'Skill overlap and role alignment evaluated'
        : 'Compare your background with job requirements',
      weight: 20,
    },
    {
      id: 'resume_selected',
      name: 'Resume Selected',
      completed: params.hasResume,
      description: params.hasResume
        ? 'Target resume attached and verified'
        : 'Attach or upload a tailored resume',
      weight: 20,
    },
    {
      id: 'resume_tailored',
      name: 'Resume Tailored',
      completed: params.hasTailoring,
      description: params.hasTailoring
        ? 'Role-specific keywords and emphasis optimized'
        : 'Optimize keywords for this role before applying',
      weight: 20,
    },
    {
      id: 'cover_letter',
      name: 'Cover Letter Ready',
      completed: params.hasCoverLetter,
      description: params.hasCoverLetter
        ? 'Personalized letter drafted and reviewed'
        : 'Generate a grounded cover letter',
      weight: 20,
    },
    {
      id: 'application_tracked',
      name: 'Application Tracked',
      completed: params.isApplied,
      description: params.isApplied
        ? 'Logged in JobTrack pipeline'
        : 'Record application to enable follow-ups',
      weight: 20,
    },
  ]

  const totalScore = dimensions.reduce(
    (acc, dim) => acc + (dim.completed ? dim.weight : 0),
    0,
  )

  return {
    score: totalScore,
    dimensions,
  }
}

/**
 * Determines the single highest-priority next best action.
 */
export function determineNextBestAction(params: {
  isApplied: boolean
  applicationStatus?: string
  hasResume: boolean
  hasJobMatch: boolean
  hasTailoring: boolean
  hasCoverLetter: boolean
  followUpState: 'none' | 'scheduled' | 'overdue' | 'completed'
  hasInterview: boolean
  isInterviewSoon: boolean
}): CopilotNextBestAction {
  const {
    isApplied,
    applicationStatus,
    hasResume,
    hasJobMatch,
    hasTailoring,
    hasCoverLetter,
    followUpState,
    hasInterview,
    isInterviewSoon,
  } = params

  // 1. Offer received
  if (applicationStatus === 'offer') {
    return {
      id: 'nba-offer',
      title: 'Offer Received!',
      description: 'Review compensation package, benefits, and schedule acceptance timeline.',
      actionType: 'celebrate_offer',
      buttonLabel: 'Review Offer Details',
    }
  }

  // 2. Application rejected / closed
  if (applicationStatus === 'rejected') {
    return {
      id: 'nba-rejected',
      title: 'Application Completed',
      description: 'This opportunity is closed. Keep momentum by exploring high-match roles in Job Feed.',
      actionType: 'explore_jobs',
      buttonLabel: 'Explore Job Feed',
    }
  }

  // 3. Interview scheduled soon or upcoming
  if (hasInterview) {
    return {
      id: 'nba-interview',
      title: isInterviewSoon ? 'Interview Approaching Soon' : 'Interview Scheduled',
      description: 'Review technical questions, system design topics, and practice your STAR answers with AI.',
      actionType: 'prepare_interview',
      buttonLabel: 'Prepare with AI',
    }
  }

  // 4. Follow-up is overdue
  if (followUpState === 'overdue') {
    return {
      id: 'nba-followup-overdue',
      title: 'Follow-up Overdue',
      description: 'Your scheduled follow-up date has passed. Send a polite check-in note to the recruiter.',
      actionType: 'complete_followup',
      buttonLabel: 'Complete Follow-up',
    }
  }

  // 5. Application is tracked, but no follow-up scheduled yet
  if (isApplied && followUpState === 'none') {
    return {
      id: 'nba-schedule-followup',
      title: 'Schedule Follow-up Reminder',
      description: 'Stay top of mind by setting a reminder to follow up in 5–7 business days.',
      actionType: 'schedule_followup',
      buttonLabel: 'Schedule Follow-up',
    }
  }

  // 6. Application is NOT tracked yet
  if (!isApplied) {
    if (!hasResume) {
      return {
        id: 'nba-select-resume',
        title: 'Select a Resume',
        description: 'Choose or upload a resume to evaluate keyword alignment for this position.',
        actionType: 'select_resume',
        buttonLabel: 'Select Resume',
      }
    }

    if (!hasJobMatch) {
      return {
        id: 'nba-review-match',
        title: 'Evaluate Job Fit',
        description: 'Analyze how your technical background matches the core requirements for this position.',
        actionType: 'review_match',
        buttonLabel: 'Analyze Fit',
      }
    }

    if (!hasTailoring) {
      return {
        id: 'nba-tailor-resume',
        title: 'Tailor Your Resume',
        description: 'Identify under-emphasized skills and keywords to align your resume with this role.',
        actionType: 'tailor_resume',
        buttonLabel: 'Tailor Resume',
      }
    }

    if (!hasCoverLetter) {
      return {
        id: 'nba-cover-letter',
        title: 'Draft a Cover Letter',
        description: 'Generate a concise, grounded cover letter connecting your verified skills to the role.',
        actionType: 'generate_cover_letter',
        buttonLabel: 'Generate Cover Letter',
      }
    }

    return {
      id: 'nba-track-application',
      title: 'Track Your Application',
      description: 'Your application materials are ready! Track this opportunity to unlock follow-up reminders.',
      actionType: 'track_application',
      buttonLabel: 'Track Application',
    }
  }

  // Default fallback
  return {
    id: 'nba-default',
    title: 'Application in Progress',
    description: 'Review your application progress, follow-up timeline, and interview milestones.',
    actionType: 'track_application',
    buttonLabel: 'View Application',
  }
}

/**
 * Builds the visual milestone progression.
 */
function buildWorkflowSteps(params: {
  isSaved: boolean
  hasResume: boolean
  hasTailoring: boolean
  hasCoverLetter: boolean
  isApplied: boolean
  followUpState: string
  hasInterview: boolean
  applicationStatus?: string
}): CopilotWorkflowStep[] {
  const {
    isSaved,
    hasResume,
    hasTailoring,
    hasCoverLetter,
    isApplied,
    followUpState,
    hasInterview,
    applicationStatus,
  } = params

  return [
    {
      id: 'job_found',
      label: 'Job Discovered',
      status: 'completed',
    },
    {
      id: 'resume_selected',
      label: 'Resume Selected',
      status: hasResume ? 'completed' : isSaved ? 'current' : 'upcoming',
    },
    {
      id: 'tailored',
      label: 'Materials Ready',
      status: hasTailoring && hasCoverLetter ? 'completed' : hasResume ? 'current' : 'upcoming',
    },
    {
      id: 'application_tracked',
      label: 'Application Tracked',
      status: isApplied ? 'completed' : hasResume ? 'current' : 'upcoming',
    },
    {
      id: 'followup',
      label: 'Follow-up',
      status:
        followUpState === 'completed'
          ? 'completed'
          : followUpState !== 'none'
            ? 'current'
            : isApplied
              ? 'current'
              : 'upcoming',
    },
    {
      id: 'interview',
      label: 'Interview',
      status:
        applicationStatus === 'offer'
          ? 'completed'
          : hasInterview
            ? 'current'
            : 'upcoming',
    },
  ]
}

/**
 * Pure deterministic state derivation function for Application Copilot.
 */
export function deriveApplicationCopilotState(
  params: DeriveCopilotStateParams,
): ApplicationCopilotState {
  const {
    job,
    existingApplication,
    allApplications = [],
    savedJobIds = [],
    resumes = [],
    followUps = [],
    coverLetters = [],
    cachedJobMatch,
    cachedResumeAnalysis,
    cachedTailoring,
    explicitResumeId,
  } = params

  // 1. Determine Application matching this job
  const matchedApp =
    existingApplication ||
    allApplications.find(
      (a) =>
        (job.id && a.id === job.id) ||
        (a.company.toLowerCase() === job.company.toLowerCase() &&
          a.jobTitle.toLowerCase() === job.title.toLowerCase()),
    ) ||
    null

  const isApplied = Boolean(matchedApp)
  const status = matchedApp?.status || 'not_applied'
  const isSaved = savedJobIds.includes(job.id)

  // 2. Determine Selected Resume based on precedence:
  //    1. Application-linked resume
  //    2. Explicitly selected resume
  //    3. Primary resume
  //    4. First available resume
  let selectedResume: Resume | null = null
  let precedenceReason: 'application_linked' | 'primary' | 'explicit' | 'none' = 'none'

  if (matchedApp?.resumeId) {
    selectedResume = resumes.find((r) => r.id === matchedApp.resumeId) || null
    if (selectedResume) precedenceReason = 'application_linked'
  }

  if (!selectedResume && explicitResumeId) {
    selectedResume = resumes.find((r) => r.id === explicitResumeId) || null
    if (selectedResume) precedenceReason = 'explicit'
  }

  if (!selectedResume) {
    const primary = resumes.find((r) => r.isPrimary) || null
    if (primary) {
      selectedResume = primary
      precedenceReason = 'primary'
    } else if (resumes.length > 0) {
      selectedResume = resumes[0]
      precedenceReason = 'explicit'
    }
  }

  const hasResume = Boolean(selectedResume)

  // 3. AI Insights State
  const hasJobMatch = Boolean(cachedJobMatch)
  const jobMatchScore = cachedJobMatch?.score ?? null
  const jobMatchVerdict = cachedJobMatch?.verdict ?? null

  const hasTailoring = Boolean(cachedTailoring)
  const tailoringScore = cachedTailoring?.matchScore ?? null

  // 4. Cover Letter State
  const coverLetter =
    coverLetters.find(
      (cl) =>
        (matchedApp && cl.applicationId === matchedApp.id) ||
        (job.id && cl.jobId === job.id) ||
        (cl.company.toLowerCase() === job.company.toLowerCase() &&
          cl.jobTitle.toLowerCase() === job.title.toLowerCase()),
    ) || null
  const hasCoverLetter = Boolean(coverLetter)

  // 5. Follow-up State
  const appFollowUps = matchedApp
    ? followUps.filter((f) => f.applicationId === matchedApp.id)
    : []

  let followUpState: 'none' | 'scheduled' | 'overdue' | 'completed' = 'none'
  let activeFollowUp: FollowUp | null = null

  if (appFollowUps.length > 0) {
    const pending = appFollowUps.filter((f) => f.status === 'pending')
    if (pending.length > 0) {
      // Sort by scheduled date
      pending.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      activeFollowUp = pending[0]

      const todayStr = new Date().toISOString().split('T')[0]
      if (activeFollowUp.scheduledDate < todayStr) {
        followUpState = 'overdue'
      } else {
        followUpState = 'scheduled'
      }
    } else {
      followUpState = 'completed'
      activeFollowUp = appFollowUps[0]
    }
  }

  // 6. Interview State
  const hasInterview = Boolean(matchedApp?.interviewDate)
  let isInterviewSoon = false
  let interviewDateFormatted: string | null = null

  if (matchedApp?.interviewDate) {
    try {
      const interviewTime = new Date(`${matchedApp.interviewDate}T${matchedApp.interviewTime || '09:00'}:00`).getTime()
      const now = Date.now()
      const diffHours = (interviewTime - now) / (1000 * 60 * 60)
      isInterviewSoon = diffHours >= 0 && diffHours <= 48
      interviewDateFormatted = new Date(matchedApp.interviewDate).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      interviewDateFormatted = matchedApp.interviewDate
    }
  }

  // 7. Calculate Readiness & Next Best Action
  const { score: readinessScore, dimensions: readinessDimensions } =
    calculateCopilotReadiness({
      hasJobMatch,
      hasResume,
      hasTailoring,
      hasCoverLetter,
      isApplied,
    })

  const nextBestAction = determineNextBestAction({
    isApplied,
    applicationStatus: status,
    hasResume,
    hasJobMatch,
    hasTailoring,
    hasCoverLetter,
    followUpState,
    hasInterview,
    isInterviewSoon,
  })

  const workflowSteps = buildWorkflowSteps({
    isSaved,
    hasResume,
    hasTailoring,
    hasCoverLetter,
    isApplied,
    followUpState,
    hasInterview,
    applicationStatus: status,
  })

  return {
    job,
    isSaved,
    isApplied,
    application: matchedApp,
    status,
    selectedResume,
    resumePrecedenceReason: precedenceReason,
    hasResume,
    hasJobMatch,
    jobMatchScore,
    jobMatchVerdict,
    cachedJobMatch,
    hasTailoring,
    tailoringScore,
    cachedTailoring,
    cachedResumeAnalysis,
    hasCoverLetter,
    coverLetter,
    followUpState,
    activeFollowUp,
    hasInterview,
    isInterviewSoon,
    interviewDateFormatted,
    interviewDetails: matchedApp?.interviewDate
      ? {
          date: matchedApp.interviewDate,
          time: matchedApp.interviewTime,
          type: matchedApp.interviewType,
        }
      : undefined,
    readinessScore,
    readinessDimensions,
    nextBestAction,
    workflowSteps,
  }
}
