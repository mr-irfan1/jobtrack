import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/useAuth'
import { ExternalLinkIcon, PencilIcon, TrashIcon } from '../../../components/icons/Icons'
import { updateUserProfile } from '../../../services/authService'
import type {
  SocialLinks,
  SocialPlatformConfig,
  SocialPlatformKey,
} from '../../../types/socialLinks'
import { SOCIAL_PLATFORMS } from '../../../types/socialLinks'

const inputClasses =
  'block w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function SocialLinksSettingsSection() {
  const { user } = useAuth()

  const metaSocialLinks = (user?.user_metadata?.social_links as SocialLinks) || {}

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(metaSocialLinks)
  const [editingPlatform, setEditingPlatform] =
    useState<SocialPlatformKey | null>(null)
  const [editingUrl, setEditingUrl] = useState<string>('')

  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const metaLinksKey = JSON.stringify(metaSocialLinks)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setSocialLinks(metaSocialLinks)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [metaLinksKey])

  async function persistSocialLinks(nextLinks: SocialLinks): Promise<boolean> {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await updateUserProfile({
        social_links: nextLinks,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to save social links.')
        return false
      }

      setSocialLinks(nextLinks)
      setSuccess('Social links updated successfully!')
      return true
    } catch {
      setError('An unexpected error occurred while saving social links.')
      return false
    } finally {
      setSaving(false)
    }
  }

  function handleStartEdit(platform: SocialPlatformConfig): void {
    setEditingPlatform(platform.key)
    setEditingUrl(socialLinks[platform.key] || '')
    setError(null)
    setSuccess(null)
  }

  function handleCancelEdit(): void {
    setEditingPlatform(null)
    setEditingUrl('')
    setError(null)
  }

  function handleSaveLink(platform: SocialPlatformConfig): void {
    const trimmed = editingUrl.trim()

    if (!trimmed) {
      handleRemoveLink(platform.key)
      setEditingPlatform(null)
      return
    }

    const validationError = platform.validate(trimmed)
    if (validationError) {
      setError(validationError)
      return
    }

    const nextLinks: SocialLinks = {
      ...socialLinks,
      [platform.key]: trimmed,
    }

    setEditingPlatform(null)
    persistSocialLinks(nextLinks)
  }

  function handleRemoveLink(platformKey: SocialPlatformKey): void {
    const nextLinks: SocialLinks = { ...socialLinks }
    delete nextLinks[platformKey]
    persistSocialLinks(nextLinks)
  }

  const connectedCount = Object.values(socialLinks).filter(
    (val): val is string => typeof val === 'string' && val.trim().length > 0,
  ).length

  return (
    <div className="space-y-6">
      {/* HEADER & COUNTER CARD */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Social Links</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Connect your professional profiles so recruiters can learn more about your experience and work.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-bold text-muted-foreground">
          {connectedCount} connected
        </span>
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

      {/* EMPTY STATE */}
      {connectedCount === 0 && editingPlatform === null ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-xs">
          <span aria-hidden="true" className="mx-auto mb-2 text-3xl block">
            🔗
          </span>
          <h3 className="text-base font-bold text-foreground">
            No professional links added
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Connect LinkedIn, GitHub, or your portfolio to make your profile more useful to recruiters.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {SOCIAL_PLATFORMS.slice(0, 3).map((platform) => (
              <button
                key={platform.key}
                type="button"
                onClick={() => handleStartEdit(platform)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>{platform.icon}</span>
                <span>Add {platform.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* PLATFORMS CARDS LIST */}
      <div className="space-y-4">
        {SOCIAL_PLATFORMS.map((platform) => {
          const isEditing = editingPlatform === platform.key
          const savedUrl = socialLinks[platform.key]
          const isConnected =
            typeof savedUrl === 'string' && savedUrl.trim().length > 0

          return (
            <div
              key={platform.key}
              className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-md space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="text-xl">
                    {platform.icon}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    {platform.label}
                  </h3>
                </div>

                {isConnected ? (
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success-fg">
                    ✓ Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Optional
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3 pt-1">
                  <input
                    type="url"
                    autoFocus
                    value={editingUrl}
                    onChange={(e) => setEditingUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveLink(platform)
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    placeholder={platform.placeholder}
                    className={inputClasses}
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveLink(platform)}
                      disabled={saving}
                      className="rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {isConnected ? (
                      <p className="truncate text-xs font-mono text-foreground">
                        {savedUrl}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Not connected
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected ? (
                      <a
                        href={savedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${platform.label} profile (opens in a new tab)`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span>Open</span>
                        <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleStartEdit(platform)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      {isConnected ? 'Edit' : 'Add'}
                    </button>

                    {isConnected ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(platform.key)}
                        disabled={saving}
                        aria-label={`Remove ${platform.label} link`}
                        className="inline-flex items-center gap-1 rounded-lg border border-danger/30 bg-surface px-2.5 py-1.5 text-xs font-semibold text-danger-fg transition-all hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SocialLinksSettingsSection
