import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../../auth/useAuth'
import { displayName, initials } from '../../../components/Sidebar/userProfile'
import { updateUserProfile } from '../../../services/authService'

const labelClasses = 'block text-sm font-medium text-foreground'
const inputClasses =
  'mt-1 block w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const readOnlyInputClasses =
  'mt-1 block w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground cursor-not-allowed'

function ProfileSettingsSection() {
  const { user } = useAuth()

  const metaName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : ''
  const metaHeadline = typeof user?.user_metadata?.headline === 'string' ? user.user_metadata.headline : ''
  const metaLocation = typeof user?.user_metadata?.location === 'string' ? user.user_metadata.location : ''
  const metaBio = typeof user?.user_metadata?.bio === 'string' ? user.user_metadata.bio : ''

  const [fullName, setFullName] = useState<string>(metaName)
  const [headline, setHeadline] = useState<string>(metaHeadline)
  const [location, setLocation] = useState<string>(metaLocation)
  const [bio, setBio] = useState<string>(metaBio)

  const [saving, setSaving] = useState<boolean>(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sync form state if user metadata changes externally
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setFullName(metaName)
    // oxlint-disable-next-line react/set-state-in-effect
    setHeadline(metaHeadline)
    // oxlint-disable-next-line react/set-state-in-effect
    setLocation(metaLocation)
    // oxlint-disable-next-line react/set-state-in-effect
    setBio(metaBio)
  }, [metaName, metaHeadline, metaLocation, metaBio])

  const currentEmail = user?.email || ''
  const nameLabel = displayName(fullName || metaName, currentEmail)
  const avatarInitials = initials(fullName || metaName, currentEmail)

  const userSkills = Array.isArray(user?.user_metadata?.skills)
    ? (user.user_metadata.skills.filter(
        (s): s is string => typeof s === 'string',
      ) as string[])
    : []

  const userAchievements = Array.isArray(user?.user_metadata?.achievements)
    ? (user.user_metadata.achievements as unknown[])
    : []

  const userSocial = (user?.user_metadata?.social_links as Record<string, string>) || {}

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSuccess(null)
    setError(null)

    const trimmedName = fullName.trim()
    if (!trimmedName) {
      setError('Full name is required.')
      return
    }

    setSaving(true)

    try {
      const { error: updateError } = await updateUserProfile({
        full_name: trimmedName,
        headline: headline.trim(),
        location: location.trim(),
        bio: bio.trim(),
      })

      if (updateError) {
        setError(updateError.message || 'Failed to update profile.')
      } else {
        setSuccess('Profile updated successfully!')
      }
    } catch {
      setError('An unexpected error occurred while saving your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* PROFILE SUMMARY CARD */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xs sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-primary/20">
          {avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-foreground">
            {nameLabel}
          </h2>
          {headline ? (
            <p className="truncate text-sm font-medium text-muted-foreground">
              {headline}
            </p>
          ) : null}
          <p className="truncate text-xs text-muted-foreground mt-0.5">
            {currentEmail}
          </p>
          {userSkills.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className="text-foreground">Skills:</span>
              {userSkills.slice(0, 5).join(' · ')}
              {userSkills.length > 5 ? ` +${userSkills.length - 5} more` : ''}
            </div>
          ) : null}
          {userAchievements.length > 0 ? (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                🏆 {userAchievements.length}{' '}
                {userAchievements.length === 1 ? 'achievement' : 'achievements'}
              </span>
            </div>
          ) : null}
          {userSocial.linkedin || userSocial.github || userSocial.portfolio ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-primary">
              {userSocial.linkedin ? (
                <a
                  href={userSocial.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View LinkedIn profile (opens in a new tab)"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  LinkedIn ↗
                </a>
              ) : null}
              {userSocial.github ? (
                <a
                  href={userSocial.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View GitHub profile (opens in a new tab)"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  GitHub ↗
                </a>
              ) : null}
              {userSocial.portfolio ? (
                <a
                  href={userSocial.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Portfolio website (opens in a new tab)"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  Portfolio ↗
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* EDIT PROFILE FORM */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-foreground">Profile Details</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Update your personal details and how you appear across JobTrack.
          </p>
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* FULL NAME */}
          <div>
            <label htmlFor="profileFullName" className={labelClasses}>
              Full Name <span className="text-danger-fg">*</span>
            </label>
            <input
              id="profileFullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Mohammad Irfan"
              className={inputClasses}
            />
          </div>

          {/* PROFESSIONAL HEADLINE */}
          <div>
            <label htmlFor="profileHeadline" className={labelClasses}>
              Professional Headline
            </label>
            <input
              id="profileHeadline"
              type="text"
              maxLength={100}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Frontend Developer | React Developer"
              className={inputClasses}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* EMAIL (READ ONLY) */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="profileEmail" className={labelClasses}>
                Email Address
              </label>
              <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                Read-only
              </span>
            </div>
            <input
              id="profileEmail"
              type="email"
              readOnly
              disabled
              value={currentEmail}
              className={readOnlyInputClasses}
            />
          </div>

          {/* LOCATION */}
          <div>
            <label htmlFor="profileLocation" className={labelClasses}>
              Location
            </label>
            <input
              id="profileLocation"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. India"
              className={inputClasses}
            />
          </div>
        </div>

        {/* BIO / ABOUT */}
        <div>
          <label htmlFor="profileBio" className={labelClasses}>
            Bio / About
          </label>
          <textarea
            id="profileBio"
            rows={4}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell recruiters and team members a little about yourself..."
            className={inputClasses}
          />
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
    </div>
  )
}

export default ProfileSettingsSection
