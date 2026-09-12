import { useState } from 'react'
import {
  ArrowDownTrayIcon,
  CheckIcon,
  DocumentTextIcon,
  ExternalLinkIcon,
  PencilIcon,
  SparklesIcon,
  TrashIcon,
} from '../../../components/icons/Icons'
import type { Resume } from '../../../types/resume'
import { formatFileSize } from '../ResumeModel'

interface ResumeCardProps {
  resume: Resume
  onSetPrimary: (id: string) => void
  onRename: (id: string, newName: string) => void
  onDelete: (id: string) => void
  onOpen: (resume: Resume) => void
  onDownload: (resume: Resume) => void
  onAnalyze?: (resume: Resume) => void
}

export function ResumeCard({
  resume,
  onSetPrimary,
  onRename,
  onDelete,
  onOpen,
  onDownload,
  onAnalyze,
}: ResumeCardProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(resume.name)
  const [renameError, setRenameError] = useState<string | null>(null)

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) {
      setRenameError('Resume name cannot be empty.')
      return
    }
    onRename(resume.id, newName.trim())
    setIsRenaming(false)
    setRenameError(null)
  }

  const formatBadges: Record<string, string> = {
    pdf: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    docx: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    doc: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    other: 'bg-muted text-muted-foreground border-border',
  }

  const formattedDate = new Date(resume.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${
        resume.isPrimary
          ? 'border-primary/40 bg-surface ring-1 ring-primary/20'
          : 'border-border bg-surface hover:border-primary/20'
      }`}
    >
      <div>
        {/* HEADER ROW: ICON, NAME, PRIMARY BADGE */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DocumentTextIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              {isRenaming ? (
                <form onSubmit={handleRenameSubmit} className="mt-0.5 space-y-1">
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-2.5 py-1 text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    autoFocus
                  />
                  {renameError ? (
                    <p className="text-[10px] text-danger-fg">{renameError}</p>
                  ) : null}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRenaming(false)
                        setNewName(resume.name)
                        setRenameError(null)
                      }}
                      className="rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-bold text-foreground">
                      {resume.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsRenaming(true)}
                      aria-label={`Rename ${resume.name}`}
                      className="text-muted-foreground/60 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="truncate text-xs font-medium text-muted-foreground mt-0.5">
                    {resume.fileName}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* PRIMARY BADGE */}
          {resume.isPrimary ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary shrink-0">
              <CheckIcon className="h-3 w-3" />
              Primary
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onSetPrimary(resume.id)}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
            >
              Set as Primary
            </button>
          )}
        </div>

        {/* METADATA CHIPS */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              formatBadges[resume.fileType] || formatBadges.other
            }`}
          >
            {resume.fileType}
          </span>
          <span className="text-muted-foreground text-[11px]">
            {formatFileSize(resume.fileSize)}
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-muted-foreground text-[11px]">
            Updated {formattedDate}
          </span>
        </div>
      </div>

      {/* ACTION FOOTER */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {resume.fileData ? (
            <>
              <button
                type="button"
                onClick={() => onOpen(resume)}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                View
                <ExternalLinkIcon className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => onDownload(resume)}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Download
              </button>
              {onAnalyze ? (
                <button
                  type="button"
                  onClick={() => onAnalyze(resume)}
                  className="inline-flex items-center gap-1 rounded-xl border border-primary/25 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  <span>ATS Check</span>
                </button>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Preview unavailable</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(resume.id)}
          aria-label={`Delete resume ${resume.name}`}
          className="inline-flex items-center rounded-xl border border-danger/30 bg-surface p-1.5 text-danger-fg shadow-xs transition-colors hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  )
}
