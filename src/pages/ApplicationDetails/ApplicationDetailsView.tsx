import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ApplicationForm from '../../components/ApplicationForm/ApplicationForm'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import {
  BriefcaseIcon,
  CalendarIcon,
  ExternalLinkIcon,
  PencilIcon,
  TrashIcon,
} from '../../components/icons/Icons'
import type {
  ApplicationDraft,
  ApplicationStatus,
  JobApplication,
} from '../../types/application'
import { APPLICATION_STATUSES } from '../../types/application'
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

  const application = applications.find((app) => app.id === id)

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

          {/* INTERVIEW INFORMATION CARD */}
          {application.interviewDate ? (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    Interview Details
                  </h2>
                </div>
                {application.interviewType ? (
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {application.interviewType}
                  </span>
                ) : null}
              </div>

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
            </div>
          ) : null}

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
    </section>
  )
}

export default ApplicationDetailsView
