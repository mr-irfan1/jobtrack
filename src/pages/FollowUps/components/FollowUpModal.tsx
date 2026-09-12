import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CloseIcon } from '../../../components/icons/Icons'
import type { JobApplication } from '../../../types/application'
import type { FollowUp, FollowUpDraft } from '../../../types/followUp'
import { toLocalDateISO } from '../FollowUpModel'

interface FollowUpModalProps {
  isOpen: boolean
  onClose: () => void
  applications: JobApplication[]
  targetApplicationId?: string
  initialFollowUp?: FollowUp | null
  onSubmit: (draft: FollowUpDraft) => { success: boolean; error?: string }
  onRescheduleSubmit?: (id: string, date: string, time?: string, note?: string) => { success: boolean; error?: string }
}

/**
 * Returns local YYYY-MM-DD for a date days in the future.
 */
function getDefaultFutureDate(daysAhead = 3): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return toLocalDateISO(d)
}

export function FollowUpModal({
  isOpen,
  onClose,
  applications,
  targetApplicationId,
  initialFollowUp,
  onSubmit,
  onRescheduleSubmit,
}: FollowUpModalProps) {
  const isEditing = Boolean(initialFollowUp)

  const [appId, setAppId] = useState<string>(() => {
    return initialFollowUp?.applicationId || targetApplicationId || (applications[0]?.id ?? '')
  })
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    return initialFollowUp?.scheduledDate || getDefaultFutureDate(3)
  })
  const [scheduledTime, setScheduledTime] = useState<string>(() => {
    return initialFollowUp?.scheduledTime || '10:00'
  })
  const [note, setNote] = useState<string>(() => {
    return initialFollowUp?.note || ''
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Sync state when props change
  useEffect(() => {
    if (initialFollowUp) {
      setAppId(initialFollowUp.applicationId)
      setScheduledDate(initialFollowUp.scheduledDate)
      setScheduledTime(initialFollowUp.scheduledTime || '')
      setNote(initialFollowUp.note || '')
    } else {
      setAppId(targetApplicationId || (applications[0]?.id ?? ''))
      setScheduledDate(getDefaultFutureDate(3))
      setScheduledTime('10:00')
      setNote('')
    }
    setFormError(null)
  }, [initialFollowUp, targetApplicationId, applications, isOpen])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const selectedApp = applications.find((a) => a.id === appId)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)

    if (!appId) {
      setFormError('Please select an application.')
      return
    }
    if (!scheduledDate) {
      setFormError('Please choose a follow-up date.')
      return
    }

    if (isEditing && initialFollowUp && onRescheduleSubmit) {
      const result = onRescheduleSubmit(
        initialFollowUp.id,
        scheduledDate,
        scheduledTime || undefined,
        note,
      )
      if (!result.success) {
        setFormError(result.error || 'Failed to update follow-up.')
      }
    } else {
      const result = onSubmit({
        applicationId: appId,
        scheduledDate,
        scheduledTime: scheduledTime || undefined,
        note,
      })
      if (!result.success) {
        setFormError(result.error || 'Failed to schedule follow-up.')
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="followup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div
        className="relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-2xl transition-all overflow-hidden text-foreground"
      >
        {/* MODAL HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-border pb-4">
          <div>
            <h2
              id="followup-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {isEditing ? 'Reschedule Follow-up' : 'Schedule Follow-up'}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isEditing
                ? 'Update your follow-up date, time, and reminder notes.'
                : 'Set a reminder to reach out, send an email, or check in.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {formError ? (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger-fg shrink-0"
          >
            {formError}
          </div>
        ) : null}

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* APPLICATION SELECTOR OR DISPLAY */}
            <div>
              <label
                htmlFor="followup-app-select"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Job Application
              </label>

              {isEditing || (targetApplicationId && selectedApp) ? (
              <div className="mt-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm">
                <span className="font-bold text-foreground">
                  {selectedApp?.company || 'Selected Application'}
                </span>
                <span className="text-muted-foreground ml-1.5">
                  • {selectedApp?.jobTitle || ''}
                </span>
              </div>
            ) : applications.length === 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                No active applications found. Please create an application first.
              </p>
            ) : (
              <select
                id="followup-app-select"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.company} — {app.jobTitle} ({app.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* DATE & TIME GRID */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="followup-date"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Date <span className="text-danger-fg">*</span>
              </label>
              <input
                id="followup-date"
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="followup-time"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Time (Optional)
              </label>
              <input
                id="followup-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* NOTE FIELD */}
          <div>
            <label
              htmlFor="followup-note"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Note / Objective
            </label>
            <textarea
              id="followup-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Email recruiter regarding timeline, or send follow-up note after 1st round..."
              className="mt-1.5 block w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-4 flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applications.length === 0 && !targetApplicationId}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {isEditing ? 'Save Changes' : 'Schedule Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
