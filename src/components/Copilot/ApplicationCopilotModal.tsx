// JobTrack — AI Application Copilot Workspace Modal
// ===================================================
// Step 11: Unified command center orchestrating Job Fit, Resume Tailoring,
// Materials (Cover Letter), Application Tracking, Follow-ups, and Interview Prep.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  ClockArrowIcon,
  CloseIcon,
  DocumentTextIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PlusIcon,
  SparklesIcon,
} from '../icons/Icons'
import { deriveApplicationCopilotState } from '../../services/copilotService'
import { getSavedJobIds, isJobIdSaved, subscribeSavedJobs, saveJob as saveJobToStore, removeSavedJob } from '../../services/savedJobsStore'
import { getResumes, subscribeResumes } from '../../services/resumeStore'
import { addFollowUp, getFollowUps, subscribeFollowUps } from '../../services/followUpStore'
import { getCoverLetters, subscribeCoverLetters } from '../../services/coverLetterService'
import { getApplications, addApplication, updateApplication } from '../../services/applicationRepository'
import { analyzeJobMatch, verdictToColor, verdictToLabel } from '../../services/jobMatchService'
import type { ApplicationStatus, JobApplication } from '../../types/application'
import { APPLICATION_STATUSES } from '../../types/application'
import type { CopilotCandidateContext, CopilotJobContext } from '../../types/copilot'
import type { FollowUp, FollowUpDraft } from '../../types/followUp'
import type { Resume } from '../../types/resume'
import type { CoverLetterDraft } from '../../types/coverLetter'
import type { JobMatchAnalysis } from '../../types/jobMatch'

// Submodals orchestrated by Copilot
import { ResumeTailoringModal } from '../../pages/ResumeCenter/components/ResumeTailoringModal'
import { ResumeAnalysisModal } from '../../pages/ResumeCenter/components/ResumeAnalysisModal'
import { InterviewPrepModal } from '../../pages/Interviews/components/InterviewPrepModal'
import { FollowUpModal } from '../../pages/FollowUps/components/FollowUpModal'
import { ResumeSelectModal } from '../../pages/ResumeCenter/components/ResumeSelectModal'
import { CoverLetterModal } from '../CoverLetter/CoverLetterModal'

interface ApplicationCopilotModalProps {
  isOpen: boolean
  onClose: () => void
  job: CopilotJobContext | null
  existingApplication?: JobApplication | null
  initialResumeId?: string
}

export function ApplicationCopilotModal({
  isOpen,
  onClose,
  job,
  existingApplication,
  initialResumeId: explicitResumeId,
}: ApplicationCopilotModalProps) {
  const { user } = useAuth()

  // Store data states
  const [savedIds, setSavedIds] = useState<string[]>(() => getSavedJobIds())
  const [resumes, setResumes] = useState<Resume[]>(() => getResumes())
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => getFollowUps())
  const [coverLetters, setCoverLetters] = useState<CoverLetterDraft[]>(() => getCoverLetters())
  const [applications, setApplications] = useState<JobApplication[]>([])

  const refreshApps = useCallback(async () => {
    try {
      const apps = await getApplications()
      setApplications(apps)
    } catch {
      // Graceful fallback
    }
  }, [])

  // Submodal open states
  const [isTailoringOpen, setIsTailoringOpen] = useState<boolean>(false)
  const [isAtsOpen, setIsAtsOpen] = useState<boolean>(false)
  const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState<boolean>(false)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState<boolean>(false)
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState<boolean>(false)
  const [isResumeSelectOpen, setIsResumeSelectOpen] = useState<boolean>(false)

  // In-session job match result
  const [jobMatch, setJobMatch] = useState<JobMatchAnalysis | null>(null)
  const [isMatching, setIsMatching] = useState<boolean>(false)
  const [matchError, setMatchError] = useState<string | null>(null)

  // Local feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Subscriptions to external stores
  useEffect(() => {
    const unsubSaved = subscribeSavedJobs(() => setSavedIds(getSavedJobIds()))
    const unsubResumes = subscribeResumes(() => setResumes(getResumes()))
    const unsubFollowUps = subscribeFollowUps(() => setFollowUps(getFollowUps()))
    const unsubLetters = subscribeCoverLetters(() => setCoverLetters(getCoverLetters()))
    return () => {
      unsubSaved()
      unsubResumes()
      unsubFollowUps()
      unsubLetters()
    }
  }, [])

  // Sync applications on open or change
  useEffect(() => {
    if (isOpen) {
      refreshApps()
      setSavedIds(getSavedJobIds())
      setResumes(getResumes())
      setFollowUps(getFollowUps())
      setCoverLetters(getCoverLetters())
    }
  }, [isOpen, refreshApps])

  // Candidate Context
  const candidateContext: CopilotCandidateContext = useMemo(() => {
    const meta = user?.user_metadata || {}
    const rawSkills = Array.isArray(meta.skills) ? meta.skills : []
    const profileSkills = rawSkills.filter(
      (s): s is string => typeof s === 'string' && Boolean(s.trim()),
    )
    const rawAchievements = Array.isArray(meta.achievements)
      ? meta.achievements
          .map((a: unknown) =>
            a && typeof a === 'object' && 'title' in a
              ? String((a as { title: unknown }).title)
              : '',
          )
          .filter(Boolean)
      : []

    return {
      fullName: typeof meta.full_name === 'string' ? meta.full_name : undefined,
      headline: typeof meta.headline === 'string' ? meta.headline : undefined,
      bio: typeof meta.bio === 'string' ? meta.bio : undefined,
      skills: profileSkills,
      achievements: rawAchievements,
    }
  }, [user])

  // Derive Current Copilot State
  const copilotState = useMemo(() => {
    if (!job) return null
    return deriveApplicationCopilotState({
      job,
      candidate: candidateContext,
      existingApplication,
      allApplications: applications,
      savedJobIds: savedIds,
      resumes,
      followUps,
      coverLetters,
      cachedJobMatch: jobMatch,
      explicitResumeId: explicitResumeId ?? undefined,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    job,
    candidateContext,
    existingApplication,
    applications,
    savedIds,
    resumes,
    followUps,
    coverLetters,
    jobMatch,
    explicitResumeId,
  ])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  if (!isOpen || !job || !copilotState) return null

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Action Handlers
  const handleToggleSave = () => {
    const wasSaved = isJobIdSaved(job.id)
    if (wasSaved) {
      removeSavedJob(job.id)
    } else {
      // Build a minimal JobListing-compatible object for the store
      saveJobToStore({
        id: job.id,
        title: job.title,
        company: job.company,
        companyLogo: job.companyLogo ?? null,
        location: job.location ?? '',
        workplaceType: (job.workplaceType as 'Remote' | 'Hybrid' | 'On-site') ?? 'Remote',
        employmentType: (job.employmentType as 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Other') ?? 'Full-time',
        salary: job.salary ?? null,
        description: job.description ?? '',
        skills: job.skills ?? [],
        postedDate: new Date().toISOString(),
        source: job.source ?? 'JobTrack',
        applyUrl: job.applyUrl ?? '',
      })
    }
    setSavedIds(getSavedJobIds())
    showToast(wasSaved ? 'Removed from bookmarks' : 'Saved to bookmarks')
  }

  const handleTrackApplication = async () => {
    if (copilotState.isApplied && copilotState.application) return
    try {
      const newApp: JobApplication = {
        id: crypto.randomUUID(),
        company: job.company,
        jobTitle: job.title,
        status: 'Applied',
        applicationDate: new Date().toISOString().split('T')[0],
        location: job.location || '',
        jobUrl: job.applyUrl || '',
        notes: `Opportunity discovered via Job Feed (${job.source || 'Remotive'}).`,
        resumeId: copilotState.selectedResume?.id,
      }
      await addApplication(newApp)
      await refreshApps()
      showToast('Application successfully tracked in your pipeline!')
    } catch {
      showToast('Unable to track application.')
    }
  }

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!copilotState.application) return
    try {
      const updated: JobApplication = {
        ...copilotState.application,
        status: newStatus,
      }
      await updateApplication(updated)
      await refreshApps()
      showToast(`Status updated to "${newStatus}".`)
    } catch {
      showToast('Unable to update application status.')
    }
  }

  const handleAnalyzeFit = async () => {
    setIsMatching(true)
    setMatchError(null)
    try {
      const res = await analyzeJobMatch({
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          companyLogo: job.companyLogo ?? null,
          location: job.location || '',
          employmentType: (job.employmentType as 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Other') ?? 'Full-time',
          workplaceType: (job.workplaceType as 'Remote' | 'Hybrid' | 'On-site') ?? 'Remote',
          salary: job.salary ?? null,
          skills: job.skills ?? [],
          description: job.description || '',
          postedDate: '',
          source: job.source || 'JobTrack',
          applyUrl: job.applyUrl || '',
        },
        candidate: {
          fullName: candidateContext.fullName,
          headline: candidateContext.headline,
          skills: candidateContext.skills,
          achievements: candidateContext.achievements,
          resumeId: copilotState.selectedResume?.id,
          resumeName: copilotState.selectedResume?.fileName,
        },
      })

      if (res.success && res.analysis) {
        setJobMatch(res.analysis)
        showToast(`Fit evaluated: ${res.analysis.score}% match!`)
      } else {
        setMatchError(res.message || 'Unable to analyze fit.')
      }
    } catch {
      setMatchError('Network error while evaluating fit.')
    } finally {
      setIsMatching(false)
    }
  }

  // Execute Next Best Action
  const handleExecuteNextBestAction = () => {
    switch (copilotState.nextBestAction.actionType) {
      case 'select_resume':
        setIsResumeSelectOpen(true)
        break
      case 'review_match':
        handleAnalyzeFit()
        break
      case 'tailor_resume':
        setIsTailoringOpen(true)
        break
      case 'generate_cover_letter':
        setIsCoverLetterOpen(true)
        break
      case 'track_application':
        handleTrackApplication()
        break
      case 'schedule_followup':
      case 'complete_followup':
        setIsFollowUpOpen(true)
        break
      case 'prepare_interview':
        setIsInterviewPrepOpen(true)
        break
      case 'celebrate_offer':
      case 'explore_jobs':
        handleClose()
        break
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
      />

      {/* MODAL WINDOW */}
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] w-full max-w-4xl flex-col rounded-3xl border border-border bg-surface shadow-2xl text-foreground overflow-hidden">
        {/* MODAL HEADER */}
        <header className="flex shrink-0 items-start justify-between border-b border-border p-5 sm:p-6 bg-surface/90 backdrop-blur-xs">
          <div className="flex items-start gap-3.5 min-w-0 pr-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-xs">
              <SparklesIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase text-primary">
                  Application Copilot
                </span>
                <span className="text-xs text-muted-foreground">
                  • Unified Job Command Center
                </span>
              </div>

              <h1
                id="copilot-modal-title"
                className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl truncate"
              >
                {job.title}
              </h1>

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{job.company}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  {job.location || 'Remote'}
                </span>
                {job.employmentType && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-foreground">{job.employmentType}</span>
                  </>
                )}
                {job.salary && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {job.salary}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleSave}
              aria-label={copilotState.isSaved ? 'Remove from bookmarks' : 'Save job'}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                copilotState.isSaved
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill={copilotState.isSaved ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close dialog"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TOAST NOTIFICATION BANNER */}
          {toastMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-fade-in">
              <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* SPOTLIGHT BANNER: NEXT BEST ACTION */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-5 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Next Best Action
                  </span>
                </div>
                <h2 className="text-base font-bold text-foreground">
                  {copilotState.nextBestAction.title}
                </h2>
                <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                  {copilotState.nextBestAction.description}
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleExecuteNextBestAction}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  <span>{copilotState.nextBestAction.buttonLabel}</span>
                </button>
              </div>
            </div>
          </div>

          {/* APPLICATION READINESS PROGRESS */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Application Readiness
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Workflow completion indicator across 5 core preparation steps.
                </p>
              </div>
              <span className="text-xl font-extrabold text-foreground">
                {copilotState.readinessScore}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                style={{ width: `${copilotState.readinessScore}%` }}
              />
            </div>

            {/* 5-step checklist pills */}
            <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-5 text-[11px]">
              {copilotState.readinessDimensions.map((dim) => (
                <div
                  key={dim.id}
                  className={`flex items-center gap-1.5 rounded-lg border p-2 ${
                    dim.completed
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200'
                      : 'border-border bg-muted/20 text-muted-foreground'
                  }`}
                  title={dim.description}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      dim.completed ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted'
                    }`}
                  >
                    {dim.completed ? <CheckIcon className="h-2.5 w-2.5" /> : '○'}
                  </span>
                  <span className="font-semibold truncate">{dim.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WORKSPACE CARDS GRID */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* CARD 1: YOUR FIT / JOB MATCH */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Your Fit (Job Match)</h3>
                  </div>
                  {copilotState.hasJobMatch && copilotState.jobMatchScore !== null && (
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                        verdictToColor(copilotState.cachedJobMatch?.verdict || 'moderate_match').badgeBg
                      } ${verdictToColor(copilotState.cachedJobMatch?.verdict || 'moderate_match').badgeText}`}
                    >
                      {copilotState.jobMatchScore}% • {verdictToLabel(copilotState.cachedJobMatch?.verdict || 'moderate_match')}
                    </span>
                  )}
                </div>

                {matchError && (
                  <p className="mt-2 text-xs text-danger-fg">{matchError}</p>
                )}

                {copilotState.hasJobMatch && copilotState.cachedJobMatch ? (
                  <div className="mt-3 space-y-2 text-xs">
                    <p className="text-muted-foreground leading-relaxed">
                      {copilotState.cachedJobMatch.recommendation}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {copilotState.cachedJobMatch.matchedSkills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                          ✓ {s}
                        </span>
                      ))}
                      {copilotState.cachedJobMatch.missingSkills.slice(0, 2).map((s) => (
                        <span key={s} className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                          • {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Compare your verified skills with {job.skills?.length || 0} role requirements to assess match probability.
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {copilotState.hasJobMatch ? 'Evaluated' : 'Not analyzed yet'}
                </span>
                <button
                  type="button"
                  disabled={isMatching}
                  onClick={handleAnalyzeFit}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
                >
                  <SparklesIcon className="h-3 w-3 text-primary" />
                  <span>{isMatching ? 'Evaluating...' : copilotState.hasJobMatch ? 'Re-evaluate' : 'Analyze Fit'}</span>
                </button>
              </div>
            </div>

            {/* CARD 2: APPLICATION TRACKER */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Application Tracker</h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      copilotState.isApplied
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {copilotState.isApplied ? 'Tracked in Pipeline' : 'Not Tracked'}
                  </span>
                </div>

                {copilotState.isApplied && copilotState.application ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Application Status:</span>
                      <select
                        value={copilotState.application.status}
                        onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground"
                      >
                        {APPLICATION_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Applied on {copilotState.application.applicationDate || 'Recently'}.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Track this application to record outcomes, schedule recruiter follow-ups, and organize interview prep.
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                {copilotState.isApplied && copilotState.application ? (
                  <Link
                    to={`/applications/${copilotState.application.id}`}
                    onClick={handleClose}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>View Application Details →</span>
                  </Link>
                ) : (
                  <>
                    <span className="text-[11px] text-muted-foreground">Ready to apply?</span>
                    <button
                      type="button"
                      onClick={handleTrackApplication}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      <span>Track Application</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* CARD 3: RESUME WORKSPACE */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Resume Alignment</h3>
                  </div>
                  {copilotState.selectedResume?.isPrimary && (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Primary
                    </span>
                  )}
                </div>

                {copilotState.selectedResume ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[200px]">
                        {copilotState.selectedResume.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsResumeSelectOpen(true)}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {copilotState.selectedResume.fileName} • {copilotState.selectedResume.fileType.toUpperCase()}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No resume selected. Select or upload a resume to evaluate tailored keywords.
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsTailoringOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <SparklesIcon className="h-3 w-3" />
                  <span>Tailor Resume</span>
                </button>

                {copilotState.selectedResume && (
                  <button
                    type="button"
                    onClick={() => setIsAtsOpen(true)}
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <span>ATS Check</span>
                  </button>
                )}
              </div>
            </div>

            {/* CARD 4: APPLICATION MATERIALS (COVER LETTER) */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Cover Letter</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      copilotState.hasCoverLetter
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {copilotState.hasCoverLetter ? 'Ready' : 'Not Generated'}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {copilotState.hasCoverLetter
                    ? 'A grounded, tailored cover letter draft is saved and ready to review or copy.'
                    : `Draft a personalized cover letter highlighting verified skills tailored to ${job.company}.`}
                </p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {copilotState.hasCoverLetter ? 'Draft available' : 'Optional material'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCoverLetterOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  <SparklesIcon className="h-3 w-3 text-primary" />
                  <span>{copilotState.hasCoverLetter ? 'View / Edit Letter' : 'Draft Letter'}</span>
                </button>
              </div>
            </div>

            {/* CARD 5: FOLLOW-UP ASSISTANT */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClockArrowIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Follow-up Assistant</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      copilotState.followUpState === 'overdue'
                        ? 'bg-danger/10 text-danger-fg border border-danger/30'
                        : copilotState.followUpState === 'scheduled'
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                          : copilotState.followUpState === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {copilotState.followUpState === 'overdue'
                      ? 'Overdue'
                      : copilotState.followUpState === 'scheduled'
                        ? 'Scheduled'
                        : copilotState.followUpState === 'completed'
                          ? 'Completed'
                          : 'None'}
                  </span>
                </div>

                {copilotState.activeFollowUp ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Scheduled for {copilotState.activeFollowUp.scheduledDate}{' '}
                    {copilotState.activeFollowUp.scheduledTime && `at ${copilotState.activeFollowUp.scheduledTime}`}.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {copilotState.isApplied
                      ? 'Set a reminder to check in with the hiring manager 5–7 days after applying.'
                      : 'Track the application first to schedule automated follow-up reminders.'}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {copilotState.isApplied ? 'Application linked' : 'Requires tracking'}
                </span>
                <button
                  type="button"
                  disabled={!copilotState.isApplied}
                  onClick={() => setIsFollowUpOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-40"
                >
                  <CalendarIcon className="h-3 w-3" />
                  <span>{copilotState.activeFollowUp ? 'Manage Follow-up' : 'Schedule Follow-up'}</span>
                </button>
              </div>
            </div>

            {/* CARD 6: INTERVIEW PREPARATION */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Interview Prep</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      copilotState.hasInterview
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {copilotState.hasInterview ? 'Interview Scheduled' : 'No Interview'}
                  </span>
                </div>

                {copilotState.hasInterview ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">
                      {copilotState.interviewDateFormatted}
                      {copilotState.interviewDetails?.time && ` at ${copilotState.interviewDetails.time}`}
                    </p>
                    <p className="text-[11px] mt-0.5">
                      {copilotState.interviewDetails?.format?.toUpperCase() || 'VIDEO'} •{' '}
                      {copilotState.interviewDetails?.type?.toUpperCase() || 'TECHNICAL'} ROUND
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Prepare behavioral answers, review technical questions, and practice mock responses with AI.
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">AI Prep Ready</span>
                <button
                  type="button"
                  onClick={() => setIsInterviewPrepOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <SparklesIcon className="h-3 w-3" />
                  <span>Prepare with AI</span>
                </button>
              </div>
            </div>
          </div>

          {/* WORKFLOW TIMELINE */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Application Milestones
            </h4>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {copilotState.workflowSteps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      step.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : step.status === 'current'
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {step.status === 'completed' && <CheckIcon className="h-3 w-3" />}
                    {step.status === 'current' && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                    <span>{step.label}</span>
                  </span>
                  {idx < copilotState.workflowSteps.length - 1 && (
                    <span className="text-muted-foreground/40 hidden sm:inline">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:p-5 bg-surface">
          <div className="flex items-center gap-2">
            {job.applyUrl && (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                <span>Apply on {job.source || 'Employer Site'}</span>
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-border bg-surface px-5 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            Close
          </button>
        </footer>
      </div>

      {/* SUBMODALS ORCHESTRATED BY COPILOT */}
      <ResumeTailoringModal
        isOpen={isTailoringOpen}
        onClose={() => setIsTailoringOpen(false)}
        job={job}
        existingApplication={copilotState.application || undefined}
        initialResumeId={copilotState.selectedResume?.id}
      />

      {copilotState.selectedResume && (
        <ResumeAnalysisModal
          isOpen={isAtsOpen}
          resume={copilotState.selectedResume}
          onClose={() => setIsAtsOpen(false)}
        />
      )}

      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        job={job}
        candidate={candidateContext}
        applicationId={copilotState.application?.id}
      />

      {copilotState.application && (
        <>
          <FollowUpModal
            isOpen={isFollowUpOpen}
            onClose={() => setIsFollowUpOpen(false)}
            applications={applications}
            targetApplicationId={copilotState.application.id}
            initialFollowUp={copilotState.activeFollowUp}
            onSubmit={(draft: FollowUpDraft) => {
              try {
                addFollowUp(draft)
                setFollowUps(getFollowUps())
                showToast('Follow-up scheduled!')
                return { success: true }
              } catch {
                return { success: false, error: 'Failed to create follow-up.' }
              }
            }}
          />

          <InterviewPrepModal
            isOpen={isInterviewPrepOpen}
            onClose={() => setIsInterviewPrepOpen(false)}
            application={copilotState.application}
            explicitResumeId={copilotState.selectedResume?.id}
          />
        </>
      )}

      <ResumeSelectModal
        isOpen={isResumeSelectOpen}
        onClose={() => setIsResumeSelectOpen(false)}
        resumes={resumes}
        currentResumeId={copilotState.selectedResume?.id || null}
        onSelectResume={async (resId) => {
          if (copilotState.application && resId) {
            try {
              await updateApplication({
                ...copilotState.application,
                resumeId: resId,
              })
              await refreshApps()
              showToast('Resume linked to application.')
            } catch {
              showToast('Unable to link resume.')
            }
          }
          setIsResumeSelectOpen(false)
        }}
      />
    </div>
  )
}
