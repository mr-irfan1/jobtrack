import { useState } from 'react'
import type { FormEvent } from 'react'
import { APPLICATION_STATUSES } from '../../types/application'
import type {
  ApplicationDraft,
  ApplicationStatus,
  JobApplication,
} from '../../types/application'

interface ApplicationFormProps {
  /**
   * When present, the form is in edit mode and pre-fills from this value. The
   * id is retained by the caller (the form is id-agnostic and emits a draft).
   * Absent means add mode.
   */
  initialValue?: JobApplication
  onSubmit: (draft: ApplicationDraft) => void
  onCancel: () => void
}

interface FieldErrors {
  company?: string
  jobTitle?: string
}

const labelClasses = 'block text-sm font-medium text-foreground'
const inputClasses =
  'mt-1 block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const invalidInputClasses = 'border-danger focus-visible:ring-danger'
const primaryButtonClasses =
  'inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
const secondaryButtonClasses =
  'inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'

/** Editable fields of a brand-new application, with sensible defaults. */
function emptyDraft(): ApplicationDraft {
  return {
    company: '',
    jobTitle: '',
    location: '',
    jobUrl: '',
    // Local YYYY-MM-DD (en-CA formats this way) — avoids the UTC off-by-one of
    // toISOString().slice(0, 10) for users west of GMT late in the day.
    applicationDate: new Date().toLocaleDateString('en-CA'),
    status: 'Applied',
    notes: '',
  }
}

/** Strip the id so an existing application can seed the form. */
function toDraft(application: JobApplication): ApplicationDraft {
  return {
    company: application.company,
    jobTitle: application.jobTitle,
    location: application.location,
    jobUrl: application.jobUrl,
    applicationDate: application.applicationDate,
    status: application.status,
    notes: application.notes,
    // Optional interview fields are carried through so editing an application
    // preserves any interview information it already has.
    interviewDate: application.interviewDate,
    interviewTime: application.interviewTime,
    interviewType: application.interviewType,
    meetingLink: application.meetingLink,
  }
}

/**
 * Presentational add/edit form for a job application. Holds only local field
 * state and validation; it never touches storage or the ViewModel. On a valid
 * submit it emits an ApplicationDraft (id-agnostic), leaving persistence and id
 * assignment to its parent.
 */
function ApplicationForm({
  initialValue,
  onSubmit,
  onCancel,
}: ApplicationFormProps) {
  const isEditing = initialValue !== undefined
  const [draft, setDraft] = useState<ApplicationDraft>(() =>
    initialValue ? toDraft(initialValue) : emptyDraft(),
  )
  const [errors, setErrors] = useState<FieldErrors>({})

  function updateField<K extends keyof ApplicationDraft>(
    key: K,
    value: ApplicationDraft[K],
  ): void {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const company = draft.company.trim()
    const jobTitle = draft.jobTitle.trim()

    const nextErrors: FieldErrors = {}
    if (!company) nextErrors.company = 'Company is required.'
    if (!jobTitle) nextErrors.jobTitle = 'Job title is required.'
    setErrors(nextErrors)
    if (nextErrors.company || nextErrors.jobTitle) return

    onSubmit({ ...draft, company, jobTitle })
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mb-6 rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold text-foreground">
        {isEditing ? 'Edit application' : 'Add application'}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className={labelClasses}>
            Company
          </label>
          <input
            id="company"
            type="text"
            value={draft.company}
            onChange={(event) => updateField('company', event.target.value)}
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={errors.company ? 'company-error' : undefined}
            className={`${inputClasses} ${errors.company ? invalidInputClasses : ''}`}
          />
          {errors.company ? (
            <p id="company-error" className="mt-1 text-sm text-danger-fg">
              {errors.company}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="jobTitle" className={labelClasses}>
            Job title
          </label>
          <input
            id="jobTitle"
            type="text"
            value={draft.jobTitle}
            onChange={(event) => updateField('jobTitle', event.target.value)}
            aria-invalid={errors.jobTitle ? true : undefined}
            aria-describedby={errors.jobTitle ? 'jobTitle-error' : undefined}
            className={`${inputClasses} ${errors.jobTitle ? invalidInputClasses : ''}`}
          />
          {errors.jobTitle ? (
            <p id="jobTitle-error" className="mt-1 text-sm text-danger-fg">
              {errors.jobTitle}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="location" className={labelClasses}>
            Location
          </label>
          <input
            id="location"
            type="text"
            value={draft.location}
            onChange={(event) => updateField('location', event.target.value)}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="jobUrl" className={labelClasses}>
            Job URL
          </label>
          <input
            id="jobUrl"
            type="url"
            value={draft.jobUrl}
            onChange={(event) => updateField('jobUrl', event.target.value)}
            placeholder="https://"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="applicationDate" className={labelClasses}>
            Application date
          </label>
          <input
            id="applicationDate"
            type="date"
            value={draft.applicationDate}
            onChange={(event) =>
              updateField('applicationDate', event.target.value)
            }
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="status" className={labelClasses}>
            Status
          </label>
          <select
            id="status"
            value={draft.status}
            onChange={(event) =>
              updateField('status', event.target.value as ApplicationStatus)
            }
            className={inputClasses}
          >
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">
            Interview{' '}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </h3>
        </div>

        <div>
          <label htmlFor="interviewDate" className={labelClasses}>
            Interview date
          </label>
          <input
            id="interviewDate"
            type="date"
            value={draft.interviewDate ?? ''}
            onChange={(event) =>
              updateField('interviewDate', event.target.value)
            }
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
            value={draft.interviewTime ?? ''}
            onChange={(event) =>
              updateField('interviewTime', event.target.value)
            }
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="interviewType" className={labelClasses}>
            Interview type
          </label>
          <input
            id="interviewType"
            type="text"
            value={draft.interviewType ?? ''}
            onChange={(event) =>
              updateField('interviewType', event.target.value)
            }
            placeholder="e.g. Technical Interview"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="meetingLink" className={labelClasses}>
            Meeting link
          </label>
          <input
            id="meetingLink"
            type="url"
            value={draft.meetingLink ?? ''}
            onChange={(event) => updateField('meetingLink', event.target.value)}
            placeholder="https://"
            className={inputClasses}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className={labelClasses}>
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={draft.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={secondaryButtonClasses}
        >
          Cancel
        </button>
        <button type="submit" className={primaryButtonClasses}>
          {isEditing ? 'Save changes' : 'Add application'}
        </button>
      </div>
    </form>
  )
}

export default ApplicationForm
