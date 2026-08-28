import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../../auth/useAuth'
import { MoonIcon, SunIcon } from '../../../components/icons/Icons'
import { updateUserProfile } from '../../../services/authService'
import { useTheme } from '../../../theme/useTheme'
import { APPLICATION_STATUSES } from '../../../types/application'
import type { ApplicationStatus } from '../../../types/application'
import type {
  EmploymentType,
  UserPreferences,
  WorkPreference,
} from '../../../types/userPreferences'
import {
  DEFAULT_PREFERENCES,
  EMPLOYMENT_TYPES,
  WORK_PREFERENCES,
} from '../../../types/userPreferences'

const labelClasses = 'block text-sm font-medium text-foreground'
const inputClasses =
  'mt-1 block w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function PreferencesSettingsSection() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const metaPrefs = (user?.user_metadata?.preferences as UserPreferences) || {}

  const [emailNotifications, setEmailNotifications] = useState<boolean>(
    metaPrefs.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications,
  )
  const [interviewReminders, setInterviewReminders] = useState<boolean>(
    metaPrefs.interviewReminders ?? DEFAULT_PREFERENCES.interviewReminders,
  )
  const [applicationUpdates, setApplicationUpdates] = useState<boolean>(
    metaPrefs.applicationUpdates ?? DEFAULT_PREFERENCES.applicationUpdates,
  )
  const [weeklySummary, setWeeklySummary] = useState<boolean>(
    metaPrefs.weeklySummary ?? DEFAULT_PREFERENCES.weeklySummary,
  )

  const [preferredJobTitle, setPreferredJobTitle] = useState<string>(
    metaPrefs.preferredJobTitle ?? DEFAULT_PREFERENCES.preferredJobTitle,
  )
  const [preferredLocation, setPreferredLocation] = useState<string>(
    metaPrefs.preferredLocation ?? DEFAULT_PREFERENCES.preferredLocation,
  )
  const [workPreference, setWorkPreference] = useState<WorkPreference>(
    metaPrefs.workPreference ?? DEFAULT_PREFERENCES.workPreference,
  )
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    metaPrefs.employmentType ?? DEFAULT_PREFERENCES.employmentType,
  )

  const [defaultApplicationStatus, setDefaultApplicationStatus] =
    useState<ApplicationStatus>(
      metaPrefs.defaultApplicationStatus ??
        DEFAULT_PREFERENCES.defaultApplicationStatus,
    )

  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false)

  const metaPrefsKey = JSON.stringify(metaPrefs)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setEmailNotifications(
      metaPrefs.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications,
    )
    // oxlint-disable-next-line react/set-state-in-effect
    setInterviewReminders(
      metaPrefs.interviewReminders ?? DEFAULT_PREFERENCES.interviewReminders,
    )
    // oxlint-disable-next-line react/set-state-in-effect
    setApplicationUpdates(
      metaPrefs.applicationUpdates ?? DEFAULT_PREFERENCES.applicationUpdates,
    )
    // oxlint-disable-next-line react/set-state-in-effect
    setWeeklySummary(
      metaPrefs.weeklySummary ?? DEFAULT_PREFERENCES.weeklySummary,
    )
    // oxlint-disable-next-line react/set-state-in-effect
    setPreferredJobTitle(
      metaPrefs.preferredJobTitle ?? DEFAULT_PREFERENCES.preferredJobTitle,
    )
    // oxlint-disable-next-line react/set-state-in-effect
    setPreferredLocation(
      metaPrefs.preferredLocation ?? DEFAULT_PREFERENCES.preferredLocation,
    )
    // oxlint-disable-next-line react/set-state-in-effect
    setWorkPreference(
      metaPrefs.workPreference ?? DEFAULT_PREFERENCES.workPreference,
    )
    // oxlint-disable-next-line react/set-state-in-effect
    setEmploymentType(
      metaPrefs.employmentType ?? DEFAULT_PREFERENCES.employmentType,
    )
    // oxlint-disable-next-line react/set-state-in-effect
    setDefaultApplicationStatus(
      metaPrefs.defaultApplicationStatus ??
        DEFAULT_PREFERENCES.defaultApplicationStatus,
    )
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [metaPrefsKey])

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    const updatedPrefs: Required<UserPreferences> = {
      emailNotifications,
      interviewReminders,
      applicationUpdates,
      weeklySummary,
      preferredJobTitle: preferredJobTitle.trim(),
      preferredLocation: preferredLocation.trim(),
      workPreference,
      employmentType,
      defaultApplicationStatus,
    }

    try {
      const { error: updateError } = await updateUserProfile({
        preferences: updatedPrefs,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to save preferences.')
      } else {
        setSuccess('Preferences saved successfully!')
      }
    } catch {
      setError('An unexpected error occurred while saving preferences.')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmReset(): Promise<void> {
    setIsResetModalOpen(false)
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const { error: updateError } = await updateUserProfile({
        preferences: DEFAULT_PREFERENCES,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to reset preferences.')
      } else {
        setEmailNotifications(DEFAULT_PREFERENCES.emailNotifications)
        setInterviewReminders(DEFAULT_PREFERENCES.interviewReminders)
        setApplicationUpdates(DEFAULT_PREFERENCES.applicationUpdates)
        setWeeklySummary(DEFAULT_PREFERENCES.weeklySummary)
        setPreferredJobTitle(DEFAULT_PREFERENCES.preferredJobTitle)
        setPreferredLocation(DEFAULT_PREFERENCES.preferredLocation)
        setWorkPreference(DEFAULT_PREFERENCES.workPreference)
        setEmploymentType(DEFAULT_PREFERENCES.employmentType)
        setDefaultApplicationStatus(DEFAULT_PREFERENCES.defaultApplicationStatus)
        setSuccess('Preferences reset to defaults!')
      }
    } catch {
      setError('An unexpected error occurred while resetting preferences.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER & RESET BUTTON CARD */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Preferences</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Customize your app theme, notification alerts, and job search preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          disabled={saving}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          Reset to defaults
        </button>
      </div>

      {/* FEEDBACK BANNERS */}
      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-semibold text-danger-fg">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-semibold text-success-fg">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. APPEARANCE */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Appearance</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choose how JobTrack looks on your device.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                theme === 'light'
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <SunIcon className="h-4 w-4" />
              Light Theme
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <MoonIcon className="h-4 w-4" />
              Dark Theme
            </button>
          </div>
        </div>

        {/* 2. NOTIFICATIONS */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Notification Preferences
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Control what notifications and reminders you receive.
            </p>
          </div>

          <div className="divide-y divide-border pt-1">
            {/* EMAIL NOTIFICATIONS */}
            <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Email Notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive important account alerts and updates via email.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailNotifications}
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  emailNotifications ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow-xs ring-0 transition duration-200 ease-in-out ${
                    emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* INTERVIEW REMINDERS */}
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Interview Reminders
                </p>
                <p className="text-xs text-muted-foreground">
                  Get reminders about upcoming scheduled interviews.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={interviewReminders}
                onClick={() => setInterviewReminders(!interviewReminders)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  interviewReminders ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow-xs ring-0 transition duration-200 ease-in-out ${
                    interviewReminders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* APPLICATION UPDATES */}
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Application Updates
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive notifications when application statuses change.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={applicationUpdates}
                onClick={() => setApplicationUpdates(!applicationUpdates)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  applicationUpdates ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow-xs ring-0 transition duration-200 ease-in-out ${
                    applicationUpdates ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* WEEKLY SUMMARY */}
            <div className="flex items-center justify-between gap-4 py-3.5 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Weekly Job Search Summary
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive a weekly progress summary of your applications.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={weeklySummary}
                onClick={() => setWeeklySummary(!weeklySummary)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  weeklySummary ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow-xs ring-0 transition duration-200 ease-in-out ${
                    weeklySummary ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 3. JOB SEARCH PREFERENCES */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Job Search Preferences
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Set target job titles, locations, and employment options.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prefJobTitle" className={labelClasses}>
                Preferred Job Title
              </label>
              <input
                id="prefJobTitle"
                type="text"
                value={preferredJobTitle}
                onChange={(e) => setPreferredJobTitle(e.target.value)}
                placeholder="e.g. Frontend Engineer, Fullstack Developer"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="prefLocation" className={labelClasses}>
                Preferred Location
              </label>
              <input
                id="prefLocation"
                type="text"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                placeholder="e.g. Remote, India, San Francisco"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prefWorkMode" className={labelClasses}>
                Work Preference
              </label>
              <select
                id="prefWorkMode"
                value={workPreference}
                onChange={(e) =>
                  setWorkPreference(e.target.value as WorkPreference)
                }
                className={inputClasses}
              >
                {WORK_PREFERENCES.map((wp) => (
                  <option key={wp} value={wp}>
                    {wp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prefEmploymentType" className={labelClasses}>
                Employment Type
              </label>
              <select
                id="prefEmploymentType"
                value={employmentType}
                onChange={(e) =>
                  setEmploymentType(e.target.value as EmploymentType)
                }
                className={inputClasses}
              >
                {EMPLOYMENT_TYPES.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. APPLICATION PREFERENCES */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Application Preferences
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Configure default settings when logging new job applications.
            </p>
          </div>

          <div>
            <label htmlFor="prefDefaultStatus" className={labelClasses}>
              Default Application Status
            </label>
            <select
              id="prefDefaultStatus"
              value={defaultApplicationStatus}
              onChange={(e) =>
                setDefaultApplicationStatus(e.target.value as ApplicationStatus)
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
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {saving ? 'Saving changes...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* RESET CONFIRMATION MODAL */}
      {isResetModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Reset preferences?
            </h3>
            <p className="text-xs text-muted-foreground">
              This will restore your default JobTrack preferences. Your profile, skills, achievements, and social links will remain unchanged.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-danger-fg shadow-sm hover:bg-danger/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PreferencesSettingsSection
