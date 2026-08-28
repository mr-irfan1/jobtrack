import { useState } from 'react'
import type { FormEvent } from 'react'
import { CloseIcon } from '../../../components/icons/Icons'
import type { Achievement, AchievementType } from '../../../types/achievement'
import { ACHIEVEMENT_TYPES } from '../../../types/achievement'

interface AchievementFormModalProps {
  initialValue?: Achievement | null
  onSubmit: (draft: Omit<Achievement, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

function isValidHttpUrl(url: string): boolean {
  if (!url) return true
  const trimmed = url.trim()
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
}

const labelClasses = 'block text-sm font-medium text-foreground'
const inputClasses =
  'mt-1 block w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function AchievementFormModal({
  initialValue,
  onSubmit,
  onCancel,
}: AchievementFormModalProps) {
  const [title, setTitle] = useState<string>(initialValue?.title ?? '')
  const [issuer, setIssuer] = useState<string>(initialValue?.issuer ?? '')
  const [type, setType] = useState<AchievementType>(
    initialValue?.type ?? 'Certification',
  )
  const [date, setDate] = useState<string>(initialValue?.date ?? '')
  const [description, setDescription] = useState<string>(
    initialValue?.description ?? '',
  )
  const [credentialUrl, setCredentialUrl] = useState<string>(
    initialValue?.credentialUrl ?? '',
  )
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    const trimmedIssuer = issuer.trim()

    if (!trimmedTitle) {
      setError('Title is required.')
      return
    }

    if (!trimmedIssuer) {
      setError('Issuer / Organization is required.')
      return
    }

    const trimmedUrl = credentialUrl.trim()
    if (trimmedUrl && !isValidHttpUrl(trimmedUrl)) {
      setError('Credential URL must start with http:// or https://')
      return
    }

    onSubmit({
      title: trimmedTitle,
      issuer: trimmedIssuer,
      type,
      date: date.trim() || undefined,
      description: description.trim() || undefined,
      credentialUrl: trimmedUrl || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold text-foreground">
            {initialValue ? 'Edit Achievement' : 'Add Achievement'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close modal"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger-fg">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TITLE */}
          <div>
            <label htmlFor="achievementTitle" className={labelClasses}>
              Achievement Title <span className="text-danger-fg">*</span>
            </label>
            <input
              id="achievementTitle"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Google AI Essentials, AWS Solutions Architect"
              className={inputClasses}
            />
          </div>

          {/* ISSUER */}
          <div>
            <label htmlFor="achievementIssuer" className={labelClasses}>
              Issuer / Organization <span className="text-danger-fg">*</span>
            </label>
            <input
              id="achievementIssuer"
              type="text"
              required
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="e.g. Google, Amazon Web Services, Meta"
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* TYPE */}
            <div>
              <label htmlFor="achievementType" className={labelClasses}>
                Type <span className="text-danger-fg">*</span>
              </label>
              <select
                id="achievementType"
                value={type}
                onChange={(e) => setType(e.target.value as AchievementType)}
                className={inputClasses}
              >
                {ACHIEVEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE */}
            <div>
              <label htmlFor="achievementDate" className={labelClasses}>
                Date
              </label>
              <input
                id="achievementDate"
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. August 2026 or 2026-08"
                className={inputClasses}
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label htmlFor="achievementDescription" className={labelClasses}>
              Description
            </label>
            <textarea
              id="achievementDescription"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the achievement or skills covered..."
              className={inputClasses}
            />
          </div>

          {/* CREDENTIAL URL */}
          <div>
            <label htmlFor="achievementCredentialUrl" className={labelClasses}>
              Credential URL
            </label>
            <input
              id="achievementCredentialUrl"
              type="url"
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
              placeholder="https://coursera.org/verify/..."
              className={inputClasses}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {initialValue ? 'Update Achievement' : 'Save Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AchievementFormModal
