import type { JobApplication } from '../../types/application.ts'
import type { FollowUp } from '../../types/followUp.ts'
import type { SavedJobItem } from '../../services/savedJobsStore.ts'
import type { Resume } from '../../types/resume.ts'

export interface NextBestActionData {
  id: string
  badge: string
  badgeColor: string
  title: string
  subtitle: string
  description: string
  to: string
  actionLabel: string
  iconType: 'calendar' | 'clock' | 'briefcase' | 'document' | 'check' | 'sparkles'
}

/**
 * Derives the single most actionable, highest-priority task for the user's dashboard.
 * Uses real state exclusively: interviews scheduled soon, overdue follow-ups,
 * saved jobs waiting for application, or resume readiness.
 */
export function deriveDashboardNextBestAction(params: {
  applications: JobApplication[]
  followUps: FollowUp[]
  savedJobs: SavedJobItem[]
  resumes: Resume[]
  today: string
}): NextBestActionData {
  const { applications, followUps, savedJobs, resumes, today } = params

  // 1. Priority 1: Upcoming interview scheduled today or in next 3 days
  const pendingInterviews = applications
    .filter((a) => a.interviewDate && a.interviewDate >= today && a.status !== 'Rejected')
    .sort((a, b) => (a.interviewDate || '').localeCompare(b.interviewDate || ''))

  if (pendingInterviews.length > 0) {
    const nextInterview = pendingInterviews[0]
    const isToday = nextInterview.interviewDate === today
    return {
      id: 'interview-prep',
      badge: isToday ? 'Interview Today' : 'Upcoming Interview',
      badgeColor: isToday
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
        : 'bg-primary/15 text-primary border-primary/30',
      title: `${nextInterview.jobTitle} at ${nextInterview.company}`,
      subtitle: `${nextInterview.interviewDate}${nextInterview.interviewTime ? ` at ${nextInterview.interviewTime}` : ''} • ${nextInterview.interviewType || 'Interview'}`,
      description:
        'Prepare role-tailored technical responses, review behavioral STAR stories, and boost your confidence before your discussion.',
      to: `/interviews`,
      actionLabel: 'Prepare for Interview',
      iconType: 'calendar',
    }
  }

  // 2. Priority 2: Overdue or due-today follow-ups
  const overdueFollowUp = followUps.find((f) => f.status === 'pending' && f.scheduledDate < today)
  if (overdueFollowUp) {
    const app = applications.find((a) => a.id === overdueFollowUp.applicationId)
    return {
      id: 'followup-overdue',
      badge: 'Follow-up Overdue',
      badgeColor: 'bg-danger/15 text-danger-fg border-danger/30',
      title: app ? `Follow up with ${app.company}` : 'Recruiter Follow-up Overdue',
      subtitle: app ? `${app.jobTitle} • Due ${overdueFollowUp.scheduledDate}` : `Due ${overdueFollowUp.scheduledDate}`,
      description:
        overdueFollowUp.note ||
        'Your scheduled follow-up reminder has passed. Send a polite check-in note to keep your candidacy top-of-mind.',
      to: `/follow-ups?applicationId=${overdueFollowUp.applicationId || ''}`,
      actionLabel: 'Complete Follow-up',
      iconType: 'clock',
    }
  }

  const dueTodayFollowUp = followUps.find((f) => f.status === 'pending' && f.scheduledDate === today)
  if (dueTodayFollowUp) {
    const app = applications.find((a) => a.id === dueTodayFollowUp.applicationId)
    return {
      id: 'followup-today',
      badge: 'Follow-up Due Today',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      title: app ? `Follow up with ${app.company}` : 'Follow-up Reminder Due Today',
      subtitle: app ? `${app.jobTitle} • Scheduled for today` : 'Scheduled for today',
      description:
        dueTodayFollowUp.note ||
        'Take action today on this scheduled application checkpoint to maintain proactive momentum with hiring managers.',
      to: `/follow-ups?applicationId=${dueTodayFollowUp.applicationId || ''}`,
      actionLabel: 'View Follow-up',
      iconType: 'clock',
    }
  }

  // 3. Priority 3: Saved job without an application
  if (savedJobs.length > 0) {
    const unappliedSavedJob = savedJobs.find(
      (s) => !applications.some((a) => a.company.toLowerCase() === s.job.company.toLowerCase()),
    )
    if (unappliedSavedJob) {
      return {
        id: 'saved-job-apply',
        badge: 'Saved Opportunity',
        badgeColor: 'bg-primary/15 text-primary border-primary/30',
        title: `${unappliedSavedJob.job.title} at ${unappliedSavedJob.job.company}`,
        subtitle: `${unappliedSavedJob.job.location} • ${unappliedSavedJob.job.employmentType}`,
        description:
          'You bookmarked this role recently. Tailor your resume keywords and track your application to stay ahead of competing applicants.',
        to: `/saved-jobs`,
        actionLabel: 'Review & Apply',
        iconType: 'briefcase',
      }
    }
  }

  // 4. Priority 4: No primary resume uploaded yet
  if (resumes.length === 0) {
    return {
      id: 'upload-resume',
      badge: 'Profile Setup',
      badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      title: 'Upload Your Primary Resume',
      subtitle: 'Unlock ATS scoring & role tailoring',
      description:
        'Upload your PDF or Word resume in Resume Center. JobTrack analyzes requirements and provides actionable feedback on every application.',
      to: '/resumes',
      actionLabel: 'Upload Resume',
      iconType: 'document',
    }
  }

  // 5. Default: Recent application progress
  if (applications.length > 0) {
    const latest = applications[0]
    return {
      id: 'latest-application',
      badge: 'Active Application',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      title: `${latest.jobTitle} at ${latest.company}`,
      subtitle: `Status: ${latest.status} • Applied ${latest.applicationDate}`,
      description:
        'Keep track of interview rounds, schedule timely follow-ups, and review personalized interview preparation strategies.',
      to: `/applications/${latest.id}`,
      actionLabel: 'Open Application Details',
      iconType: 'check',
    }
  }

  // 6. Complete Empty State
  return {
    id: 'explore-feed',
    badge: 'Get Started',
    badgeColor: 'bg-primary/15 text-primary border-primary/30',
    title: 'Explore Live Job Opportunities',
    subtitle: 'Curated developer & tech positions',
    description:
      'Search high-match roles, bookmark promising opportunities, and manage your complete application journey in one unified workspace.',
    to: '/jobs',
    actionLabel: 'Browse Job Feed',
    iconType: 'sparkles',
  }
}
