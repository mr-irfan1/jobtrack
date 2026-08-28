import { useState } from 'react'
import type { FormEvent } from 'react'
import { CloseIcon } from '../../../components/icons/Icons'
import type { JobApplication } from '../../../types/application'

interface InterviewFormModalProps {
  applications: JobApplication[]
  initialValue?: JobApplication | null
  defaultDate?: string
  onSubmit: (updatedApplication: JobApplication) => void
  onCancel: () => void
}

const INTERVIEW_TYPES = [
  'Phone Screen',
  'Video Interview',
  'Technical Interview',
  'HR Interview',
  'On-site Interview',
  'Other',
]

const labelClasses = 'block text-sm font-medium text-foreground'
const inputClasses =
  'mt-1 block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const primaryButtonClasses =
  'inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
const secondaryButtonClasses =
  'inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'

function InterviewFormModal({
  applications,
  initialValue,
  defaultDate,
  onSubmit,
  onCancel,
}: InterviewFormModalProps) {
  const isEditing = initialValue !== undefined && initialValue !== null

  const [selectedAppId, setSelectedAppId] = useState<string>(
    initialValue?.id ?? (applications[0]?.id || ''),
  )
  const [interviewDate, setInterviewDate] = useState<string>(
    initialValue?.interviewDate ?? defaultDate ?? new Date().toLocaleDateString('en-CA'),
  )
  const [interviewTime, setInterviewTime] = useState<string>(
    initialValue?.interviewTime ?? '',
  )
  const [interviewType, setInterviewType] = useState<string>(
    initialValue?.interviewType ?? INTERVIEW_TYPES[0],
  )
  const [meetingLink, setMeetingLink] = useState<string>(
    initialValue?.meetingLink ?? '',
  )
  const [notes, setNotes] = useState<string>(initialValue?.notes ?? '')

  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    const targetApp = isEditing
      ? initialValue
      : applications.find((app) => app.id === selectedAppId)

    if (!targetApp) {
      setError('Please select an application.')
      return
    }

    if (!interviewDate) {
      setError('Interview date is required.')
      return
    }

    // Auto-update status to Interview if currently Wishlist or Applied
    const nextStatus =
      targetApp.status === 'Wishlist' || targetApp.status === 'Applied'
        ? 'Interview'
        : targetApp.status

    const updated: JobApplication = {
      ...targetApp,
      status: nextStatus,
      interviewDate: interviewDate.trim(),
      interviewTime: interviewTime.trim() || undefined,
      interviewType: interviewType.trim() || undefined,
      meetingLink: meetingLink.trim() || undefined,
      notes: notes.trim(),
    }

    onSubmit(updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {isEditing ? 'Edit interview' : 'Schedule interview'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error ? (
            <p className="rounded-md bg-danger/10 p-2.5 text-xs text-danger-fg">
              {error}
            </p>
          ) : null}

          {!isEditing ? (
            <div>
              <label htmlFor="applicationSelect" className={labelClasses}>
                Job application
              </label>
              <select
                id="applicationSelect"
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className={inputClasses}
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.company} — {app.jobTitle}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <span className={labelClasses}>Job application</span>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {initialValue.company} — {initialValue.jobTitle}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="interviewDate" className={labelClasses}>
                Interview date
              </label>
              <input
                id="interviewDate"
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="interviewTime" className={labelClasses}>
                Interview time
              </label>
              <input
                id="interviewTime"
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label htmlFor="interviewType" className={labelClasses}>
              Interview type
            </label>
            <input
              id="interviewType"
              type="text"
              list="interview-type-suggestions"
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              placeholder="e.g. Technical Interview"
              className={inputClasses}
            />
            <datalist id="interview-type-suggestions">
              {INTERVIEW_TYPES.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="meetingLink" className={labelClasses}>
              Meeting link / Location
            </label>
            <input
              id="meetingLink"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://"
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="interviewNotes" className={labelClasses}>
              Notes
            </label>
            <textarea
              id="interviewNotes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preparation notes, questions to ask..."
              className={inputClasses}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className={secondaryButtonClasses}
            >
              Cancel
            </button>
            <button type="submit" className={primaryButtonClasses}>
              {isEditing ? 'Save changes' : 'Schedule interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InterviewFormModal
