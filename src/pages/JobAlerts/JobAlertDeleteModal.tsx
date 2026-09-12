import { useEffect, useId } from 'react'
import { CloseIcon, TrashIcon } from '../../components/icons/Icons'
import type { JobAlert } from '../../types/jobAlert'

interface JobAlertDeleteModalProps {
  alert: JobAlert | null
  onClose: () => void
  onConfirm: () => void
}

export function JobAlertDeleteModal({
  alert,
  onClose,
  onConfirm,
}: JobAlertDeleteModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!alert) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [alert, onClose])

  if (!alert) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger-fg">
            <TrashIcon className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <h2 id={titleId} className="text-base font-bold text-foreground">
            Delete "{alert.name}"?
          </h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete this job alert? You will no longer receive notifications for matching opportunities.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80">
            Note: Your saved jobs, applications, and past notifications will remain completely unaffected.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-danger-fg hover:bg-danger/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Delete Alert
          </button>
        </div>
      </div>
    </div>
  )
}
