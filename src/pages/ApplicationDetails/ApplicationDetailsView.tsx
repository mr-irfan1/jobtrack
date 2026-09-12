import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ApplicationForm from '../../components/ApplicationForm/ApplicationForm'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import {
  ArrowDownTrayIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockArrowIcon,
  DocumentTextIcon,
  ExternalLinkIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '../../components/icons/Icons'
import { ResumeAnalysisModal } from '../ResumeCenter/components/ResumeAnalysisModal'
import { ResumeTailoringModal } from '../ResumeCenter/components/ResumeTailoringModal'
import { InterviewPrepModal } from '../Interviews/components/InterviewPrepModal'
import { ApplicationCopilotModal } from '../../components/Copilot/ApplicationCopilotModal'
import type {
  ApplicationDraft,
  ApplicationStatus,
  JobApplication,
} from '../../types/application'
import { APPLICATION_STATUSES } from '../../types/application'
import type { FollowUp, FollowUpDraft } from '../../types/followUp'
import type { Resume } from '../../types/resume'
import {
  addFollowUp,
  completeFollowUp,
  deleteFollowUp,
  getFollowUps,
  rescheduleFollowUp,
  subscribeFollowUps,
} from '../../services/followUpStore'
import {
  getApplicationResumeId,
  getResumes,
  setApplicationResume,
  subscribeResumes,
} from '../../services/resumeStore'
import {
  formatFollowUpDateDisplay,
  getRelativeStatus,
} from '../FollowUps/FollowUpModel'
import { FollowUpModal } from '../FollowUps/components/FollowUpModal'
import { formatFileSize } from '../ResumeCenter/ResumeModel'
import { ResumeSelectModal } from '../ResumeCenter/components/ResumeSelectModal'
import { useApplicationsViewModel } from '../Applications/useApplicationsViewModel'
import { deriveTimelineEvents } from './activityHelpers'

function isOpenableUrl(url: string | undefined): url is string {
  return (
    typeof url === 'string' &&
    (url.startsWith('https://') || url.startsWith('http://'))
  )
}

function formatTime12(timeStr?: string): string {
  if (!timeStr) return ''
  const [hh = '0', mm = '00'] = timeStr.split(':')
  const hours = Number(hh)
  const period = hours < 12 ? 'AM' : 'PM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${mm} ${period}`
}

function ApplicationDetailsView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { applications, loading, error, editApplication, removeApplication } =
    useApplicationsViewModel()

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => getFollowUps())
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState<boolean>(false)
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)
  const [resumes, setResumes] = useState<Resume[]>(() => getResumes())
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false)
  const [isAtsModalOpen, setIsAtsModalOpen] = useState<boolean>(false)
  const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState<boolean>(false)
  const [isTailoringModalOpen, setIsTailoringModalOpen] = useState<boolean>(false)
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false)

  useEffect(() => {
    const unsub = subscribeFollowUps(() => {
      setFollowUps(getFollowUps())
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = subscribeResumes(() => {
      setResumes(getResumes())
    })
    return unsub
  }, [])

  const application = applications.find((app) => app.id === id)
  const appFollowUps = followUps.filter((f) => f.applicationId === id)

  const linkedResumeId =
    (application ? getApplicationResumeId(application.id) : null) ||
    application?.resumeId ||
    null
  const attachedResume = resumes.find((r) => r.id === linkedResumeId) || null
  const isOrphanedResume = Boolean(linkedResumeId && !attachedResume)

  function handleSelectResume(resumeId: string | null) {
    if (!application) return
    setApplicationResume(application.id, resumeId)
    if (application.resumeId !== (resumeId || undefined)) {
      editApplication({
        ...application,
        resumeId: resumeId || undefined,
      })
    }
  }

  function openResume(resume: Resume) {
    if (!resume.fileData) return
    const isPdfData = resume.fileData.startsWith('data:application/pdf;base64,')
    const isDocData =
      resume.fileData.startsWith('data:application/msword;base64,') ||
      resume.fileData.startsWith(
        'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,',
      )

    if (!isPdfData && !isDocData) return

    try {
      const commaIdx = resume.fileData.indexOf(',')
      if (commaIdx === -1) return
      const b64 = resume.fileData.slice(commaIdx + 1)
      const binary = atob(b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const mime = isPdfData ? 'application/pdf' : 'application/octet-stream'
      const blob = new Blob([bytes], { type: mime })
      const blobUrl = URL.createObjectURL(blob)

      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch {
      // Graceful fallback
    }
  }

  function downloadResume(resume: Resume) {
    if (!resume.fileData) return
    const isPdfData = resume.fileData.startsWith('data:application/pdf;base64,')
    const isDocData =
      resume.fileData.startsWith('data:application/msword;base64,') ||
      resume.fileData.startsWith(
        'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,',
      )

    if (!isPdfData && !isDocData) return

    const link = document.createElement('a')
    link.href = resume.fileData
    link.download = resume.fileName.replace(/[<>:"/\\|?*]/g, '_')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleStatusChange(
    newStatus: ApplicationStatus,
  ): Promise<void> {
    if (!application) return
    const updated: JobApplication = {
      ...application,
      status: newStatus,
    }
    await editApplication(updated)
  }

  async function handleFormSubmit(
    draft: ApplicationDraft,
  ): Promise<void> {
    if (!application) return
    const updated: JobApplication = {
      ...application,
      ...draft,
    }
    await editApplication(updated)
    setIsEditing(false)
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!application) return
    setIsDeleting(true)
    try {
      await removeApplication(application.id)
      navigate('/applications')
    } catch {
      setIsDeleting(false)
    }
  }

  if (loading && !application) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Loading application details...
        </p>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-xs">
          <BriefcaseIcon className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <h1 className="mt-3 text-lg font-bold text-foreground">
            Application not found
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The requested job application could not be found.
          </p>
          <div className="mt-6">
            <Link
              to="/applications"
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              &larr; Back to Applications
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const timelineEvents = deriveTimelineEvents(application)

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* NAVIGATION BACK LINK */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          &larr; Back to Applications
        </Link>
      </nav>

      {/* HEADER SECTION */}
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {application.company}
            </h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="mt-1 truncate text-lg font-medium text-muted-foreground">
            {application.jobTitle}
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            value={application.status}
            onChange={(e) =>
              handleStatusChange(e.target.value as ApplicationStatus)
            }
            aria-label={`Change status for ${application.company}`}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:from-primary/90 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            AI Copilot
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingFollowUp(null)
              setIsFollowUpModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary shadow-xs transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ClockArrowIcon className="h-3.5 w-3.5" />
            Schedule Follow-up
          </button>

          {(application.status === 'Interview' || application.interviewDate) && (
            <button
              type="button"
              onClick={() => setIsInterviewPrepOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary shadow-xs transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              Interview Prep
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Edit
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDeleteConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-surface px-3.5 py-2 text-xs font-semibold text-danger-fg shadow-xs transition-colors hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </header>

      {/* ERROR BANNER */}
      {error ? (
        <div className="mb-6 rounded-xl bg-danger/10 p-4 text-sm text-danger-fg">
          {error}
        </div>
      ) : null}

      {/* TWO COLUMN RESPONSIVE WORKSPACE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: OVERVIEW, INTERVIEW & NOTES */}
        <div className="space-y-6 lg:col-span-7">
          {/* OVERVIEW CARD */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-bold text-foreground">
              Application Overview
            </h2>

            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Company
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {application.company}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Job Title
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {application.jobTitle}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Location
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {application.location}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Applied Date
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {application.applicationDate}
                </dd>
              </div>
            </dl>

            {isOpenableUrl(application.jobUrl) ? (
              <div className="mt-6 border-t border-border pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Job Posting
                </span>
                <div className="mt-1.5">
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open job posting for ${application.company} (opens in a new tab)`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Open Job Posting
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          {/* RESUME USED CARD */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  Resume Used
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsResumeModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                {attachedResume ? 'Change' : 'Attach'}
              </button>
            </div>

            {attachedResume ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-muted/20 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {attachedResume.name}
                    </span>
                    {attachedResume.isPrimary && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {attachedResume.fileName} • {formatFileSize(attachedResume.fileSize)} • {attachedResume.fileType.toUpperCase()}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openResume(attachedResume)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                  >
                    <DocumentTextIcon className="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadResume(attachedResume)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAtsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary shadow-xs hover:bg-primary/20"
                  >
                    <SparklesIcon className="h-3.5 w-3.5" />
                    ATS Analysis
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTailoringModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary shadow-xs hover:bg-primary/20"
                  >
                    <SparklesIcon className="h-3.5 w-3.5" />
                    Tailor Resume
                  </button>
                </div>
              </div>
            ) : isOrphanedResume ? (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold">Linked resume no longer available</p>
                <p className="mt-0.5">The resume file previously associated with this application was deleted from Resume Center.</p>
                <button
                  type="button"
                  onClick={() => setIsResumeModalOpen(true)}
                  className="mt-2 text-xs font-semibold underline hover:no-underline"
                >
                  Choose a different resume
                </button>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  No specific resume version linked to this application.
                </p>
                <button
                  type="button"
                  onClick={() => setIsResumeModalOpen(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Attach Resume
                </button>
              </div>
            )}
          </div>

          {/* INTERVIEW INFORMATION CARD */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  Interview Details
                </h2>
              </div>
              {application.interviewDate ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInterviewPrepOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
                  >
                    <SparklesIcon className="h-3 w-3" />
                    AI Prep
                  </button>
                  <Link
                    to="/interviews"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Calendar →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
                  >
                    <PencilIcon className="h-3 w-3" />
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Schedule Interview
                </button>
              )}
            </div>

            {application.interviewDate ? (
              <>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Date
                    </dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {application.interviewDate}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Time
                    </dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {formatTime12(application.interviewTime) || 'Not specified'}
                    </dd>
                  </div>
                </dl>

                {isOpenableUrl(application.meetingLink) ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <a
                      href={application.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Join interview for ${application.company} (opens in a new tab)`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                      Join Interview
                    </a>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  No interview scheduled for this application yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Add Date & Time
                </button>
              </div>
            )}
          </div>

          {/* FOLLOW-UPS CARD */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ClockArrowIcon className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  Follow-ups
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/follow-ups?applicationId=${application.id}`}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                >
                  View All ({appFollowUps.length}) →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFollowUp(null)
                    setIsFollowUpModalOpen(true)
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Follow-up
                </button>
              </div>
            </div>

            {appFollowUps.length === 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">
                No follow-ups scheduled for this application yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {appFollowUps.map((fu) => {
                  const rel = getRelativeStatus(fu)
                  const toneBadgeClasses: Record<string, string> = {
                    danger: 'bg-danger/10 text-danger-fg border-danger/20',
                    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    primary: 'bg-primary/10 text-primary border-primary/20',
                    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    muted: 'bg-muted text-muted-foreground border-border',
                  }

                  return (
                    <div
                      key={fu.id}
                      className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{formatFollowUpDateDisplay(fu)}</span>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneBadgeClasses[rel.tone] || toneBadgeClasses.muted
                            }`}
                        >
                          {rel.label}
                        </span>
                      </div>

                      {fu.note ? (
                        <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                          {fu.note}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
                        {fu.status !== 'completed' && fu.status !== 'cancelled' ? (
                          <button
                            type="button"
                            onClick={() => completeFollowUp(fu.id)}
                            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                          >
                            Mark Complete
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFollowUp(fu)
                            setIsFollowUpModalOpen(true)
                          }}
                          className="font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFollowUp(fu.id)}
                          className="font-semibold text-danger-fg hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* NOTES CARD */}
          {application.notes ? (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <h2 className="text-base font-bold text-foreground">Notes</h2>
              <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {application.notes}
              </p>
            </div>
          ) : null}
        </div>

        {/* RIGHT COLUMN: ACTIVITY TIMELINE */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-bold text-foreground mb-4">
              Activity Timeline
            </h2>

            {timelineEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No activity recorded yet.
              </p>
            ) : (
              <div className="relative ml-2 border-l-2 border-border pl-5 space-y-6">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="relative">
                    {/* TIMELINE BULLET NODE */}
                    <span
                      aria-hidden="true"
                      className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-primary ring-2 ring-primary/20"
                    />

                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {event.title}
                      </h3>
                      <time className="block mt-0.5 text-xs font-medium text-muted-foreground">
                        {event.formattedDate}
                      </time>
                      <p className="mt-1 text-xs text-foreground/80">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT APPLICATION MODAL */}
      {isEditing ? (
        <ApplicationForm
          initialValue={application}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsEditing(false)}
        />
      ) : null}

      {/* FOLLOW-UP MODAL */}
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false)
          setEditingFollowUp(null)
        }}
        applications={applications}
        targetApplicationId={application.id}
        initialFollowUp={editingFollowUp}
        onSubmit={(draft: FollowUpDraft) => {
          const res = addFollowUp(draft)
          if (res.success) {
            setIsFollowUpModalOpen(false)
            setEditingFollowUp(null)
          }
          return res
        }}
        onRescheduleSubmit={(fId, d, t, n) => {
          const res = rescheduleFollowUp(fId, d, t, n)
          if (res.success) {
            setIsFollowUpModalOpen(false)
            setEditingFollowUp(null)
          }
          return res
        }}
      />

      {/* RESUME SELECT MODAL */}
      <ResumeSelectModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        resumes={resumes}
        currentResumeId={linkedResumeId}
        onSelectResume={handleSelectResume}
      />

      {/* RESUME ATS ANALYSIS MODAL */}
      {attachedResume && (
        <ResumeAnalysisModal
          isOpen={isAtsModalOpen}
          resume={attachedResume}
          onClose={() => setIsAtsModalOpen(false)}
        />
      )}

      {/* AI INTERVIEW PREP MODAL */}
      {application && (
        <InterviewPrepModal
          isOpen={isInterviewPrepOpen}
          onClose={() => setIsInterviewPrepOpen(false)}
          application={application}
          explicitResumeId={linkedResumeId || undefined}
        />
      )}

      {/* AI RESUME TAILORING MODAL */}
      {application && (
        <ResumeTailoringModal
          isOpen={isTailoringModalOpen}
          onClose={() => setIsTailoringModalOpen(false)}
          job={{
            id: application.id,
            title: application.jobTitle,
            company: application.company,
            location: application.location,
            description: application.notes,
          }}
          existingApplication={application}
          initialResumeId={linkedResumeId || undefined}
        />
      )}

      {/* AI APPLICATION COPILOT MODAL */}
      {application && (
        <ApplicationCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          existingApplication={application}
          job={{
            id: application.id,
            title: application.jobTitle,
            company: application.company,
            location: application.location,
            description: application.notes,
          }}
        />
      )}
    </section>
  )
}

export default ApplicationDetailsView
