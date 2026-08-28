import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createApplication } from '../../pages/Applications/ApplicationsModel'
import {
  analyzeJobUrl,
  type ExtractedJobData,
} from '../../services/jobExtractorService'
import type { ApplicationDraft, JobApplication } from '../../types/application'

import { isValidJobUrl, validateJobUrl } from './jobUrlValidation'
import { processJobImport } from './jobUrlImportLogic'

interface JobUrlImportFormProps {
  existingApplications?: JobApplication[]
  onAddApplication?: (draft: ApplicationDraft) => Promise<JobApplication>
  onCancel: () => void
}

type ImportState = 'idle' | 'analyzing' | 'success' | 'error'

const labelClasses = 'block text-sm font-medium text-foreground'
const inputClasses =
  'mt-1 block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const invalidInputClasses = 'border-danger focus-visible:ring-danger'
const primaryButtonClasses =
  'inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButtonClasses =
  'inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'

function JobUrlImportForm({
  existingApplications = [],
  onAddApplication,
  onCancel,
}: JobUrlImportFormProps) {
  const navigate = useNavigate()

  const [jobUrl, setJobUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [status, setStatus] = useState<ImportState>('idle')
  const [extractedJob, setExtractedJob] = useState<ExtractedJobData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Creation / duplicate states
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)
  const [createdApplication, setCreatedApplication] =
    useState<JobApplication | null>(null)
  const [duplicateApp, setDuplicateApp] = useState<JobApplication | null>(null)

  const isUrlValid = isValidJobUrl(jobUrl)

  function handleChange(value: string): void {
    setJobUrl(value)
    setStatus('idle')
    setErrorMessage(null)
    setSaveSuccessMessage(null)
    setCreatedApplication(null)
    setDuplicateApp(null)
    if (validationError) {
      setValidationError(validateJobUrl(value))
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    const err = validateJobUrl(jobUrl)
    if (err) {
      setValidationError(err)
      return
    }

    setValidationError(null)
    setErrorMessage(null)
    setSaveSuccessMessage(null)
    setCreatedApplication(null)
    setDuplicateApp(null)
    setStatus('analyzing')

    try {
      const result = await analyzeJobUrl(jobUrl)
      if (result.success && result.job) {
        setExtractedJob(result.job)
        setStatus('success')
      } else {
        setErrorMessage(
          result.error ||
            'We couldn’t read this job page. The website may block automated access. You can still add the application manually.',
        )
        setStatus('error')
      }
    } catch {
      setErrorMessage(
        'We couldn’t read this job page. The website may block automated access. You can still add the application manually.',
      )
      setStatus('error')
    }
  }

  async function handleAddToTracker(): Promise<void> {
    if (!extractedJob || isSaving) return

    setIsSaving(true)
    setErrorMessage(null)
    setSaveSuccessMessage(null)

    const saveFn = onAddApplication || createApplication

    try {
      const res = await processJobImport(
        extractedJob,
        existingApplications,
        saveFn,
      )

      if (res.isDuplicate && res.duplicateApp) {
        setDuplicateApp(res.duplicateApp)
        setErrorMessage('This job is already in your tracker.')
      } else if (res.success && res.application) {
        setCreatedApplication(res.application)
        setSaveSuccessMessage('Job added to your tracker.')
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(
        'Unable to save application. Please make sure you are signed in and try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset(): void {
    setJobUrl('')
    setExtractedJob(null)
    setErrorMessage(null)
    setValidationError(null)
    setSaveSuccessMessage(null)
    setCreatedApplication(null)
    setDuplicateApp(null)
    setStatus('idle')
  }

  function handleViewApplication(app: JobApplication): void {
    navigate(`/applications/${app.id}`)
  }

  return (
    <div className="mb-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Import Job from URL
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          ✨ Auto-Tracker
        </span>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Paste a job posting URL and JobTrack will extract the job details for you.
      </p>

      {/* ERROR ALERT */}
      {errorMessage ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger-fg"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{errorMessage}</p>
            {duplicateApp ? (
              <button
                type="button"
                onClick={() => handleViewApplication(duplicateApp)}
                className="inline-flex items-center rounded bg-danger/20 px-3 py-1 text-xs font-semibold text-foreground hover:bg-danger/30"
              >
                View Application &rarr;
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* SAVE SUCCESS BANNER */}
      {saveSuccessMessage && createdApplication ? (
        <div
          role="status"
          className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ✓
              </span>
              <p className="font-medium">{saveSuccessMessage}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className={secondaryButtonClasses}
              >
                Continue Browsing
              </button>
              <button
                type="button"
                onClick={() => handleViewApplication(createdApplication)}
                className={primaryButtonClasses}
              >
                View Application &rarr;
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* SUCCESS PREVIEW CARD */}
      {status === 'success' && extractedJob ? (
        <div className="mt-5 space-y-4 rounded-lg border border-border bg-background p-4 shadow-2xs">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  {extractedJob.title || 'Untitled Position'}
                </h3>
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {extractedJob.source}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-primary">
                {extractedJob.company || 'Company not specified'}
              </p>
            </div>
            {extractedJob.location ? (
              <span className="text-xs text-muted-foreground">
                📍 {extractedJob.location}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            {extractedJob.employmentType ? (
              <div>
                <strong className="text-foreground">Type:</strong>{' '}
                {extractedJob.employmentType}
              </div>
            ) : null}
            {extractedJob.salary ? (
              <div>
                <strong className="text-foreground">Salary:</strong>{' '}
                {extractedJob.salary}
              </div>
            ) : null}
            {extractedJob.datePosted ? (
              <div>
                <strong className="text-foreground">Posted:</strong>{' '}
                {extractedJob.datePosted}
              </div>
            ) : null}
          </div>

          {extractedJob.description ? (
            <div>
              <p className="text-xs font-semibold text-foreground">Description:</p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {extractedJob.description}
              </p>
            </div>
          ) : null}

          <div className="text-xs">
            <a
              href={extractedJob.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View original job posting &rarr;
            </a>
          </div>

          {/* ADD TO TRACKER CONTROLS */}
          {!saveSuccessMessage ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleReset}
                className={secondaryButtonClasses}
              >
                Analyze another URL
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={onCancel}
                  className={secondaryButtonClasses}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleAddToTracker}
                  className={primaryButtonClasses}
                >
                  {isSaving ? 'Adding...' : 'Add to Tracker'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* FORM INPUT MODE */
        <form onSubmit={handleSubmit} noValidate className="mt-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="jobUrlInput" className={labelClasses}>
                Job posting URL
              </label>
              <input
                id="jobUrlInput"
                name="jobUrl"
                type="url"
                disabled={status === 'analyzing'}
                value={jobUrl}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="https://example.com/jobs/software-engineer"
                aria-invalid={Boolean(validationError)}
                aria-describedby={validationError ? 'job-url-error' : undefined}
                className={`${inputClasses} ${
                  validationError ? invalidInputClasses : ''
                }`}
              />
              {validationError ? (
                <p id="job-url-error" className="mt-1 text-sm text-danger-fg">
                  {validationError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={status === 'analyzing'}
              onClick={onCancel}
              className={secondaryButtonClasses}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isUrlValid || status === 'analyzing'}
              className={primaryButtonClasses}
            >
              {status === 'analyzing' ? 'Analyzing...' : 'Analyze Job'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default JobUrlImportForm
