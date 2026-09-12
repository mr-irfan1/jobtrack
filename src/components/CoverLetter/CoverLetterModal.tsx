// JobTrack — Cover Letter Modal Component
// ========================================
// Modal dialog allowing candidate to generate, review, edit, and copy
// a grounded cover letter for a specific position.

import { useEffect, useState } from 'react'
import {
  CheckIcon,
  CloseIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '../icons/Icons'
import {
  generateCoverLetter,
  getCoverLetterForJob,
  saveCoverLetter,
} from '../../services/coverLetterService'
import type { CoverLetterDraft } from '../../types/coverLetter'

interface CoverLetterModalProps {
  isOpen: boolean
  onClose: () => void
  job: {
    id?: string
    title: string
    company: string
    location?: string
    employmentType?: string
    workplaceType?: string
    skills?: string[]
    description?: string
  }
  candidate: {
    fullName?: string
    headline?: string
    skills?: string[]
    achievements?: string[]
    resumeName?: string
  }
  applicationId?: string
}

export function CoverLetterModal({
  isOpen,
  onClose,
  job,
  candidate,
  applicationId,
}: CoverLetterModalProps) {
  const [content, setContent] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Load existing letter on open or reset
  useEffect(() => {
    if (isOpen) {
      const existing = getCoverLetterForJob(job.id, applicationId)
      if (existing) {
        setContent(existing.content)
      } else {
        setContent('')
      }
      setIsCopied(false)
      setIsSavedNotice(false)
      setErrorMessage(null)
    }
  }, [isOpen, job.id, applicationId])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleGenerate() {
    if (isGenerating) return
    setIsGenerating(true)
    setErrorMessage(null)
    try {
      const res = await generateCoverLetter({
        job,
        candidate,
        applicationId,
      })
      if (res.success && res.draft) {
        setContent(res.draft.content)
        setIsSavedNotice(true)
        setTimeout(() => setIsSavedNotice(false), 2500)
      } else {
        setErrorMessage(res.message || 'Unable to generate cover letter.')
      }
    } catch {
      setErrorMessage('A network error occurred while generating cover letter.')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleSave() {
    if (!content.trim()) return
    const draft: CoverLetterDraft = {
      id: `cl-${job.id || 'job'}-${Date.now()}`,
      jobId: job.id,
      applicationId,
      jobTitle: job.title,
      company: job.company,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveCoverLetter(draft)
    setIsSavedNotice(true)
    setTimeout(() => setIsSavedNotice(false), 2500)
  }

  function handleCopy() {
    if (!content.trim()) return
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2500)
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-letter-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* MODAL WINDOW */}
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] w-full max-w-2xl flex-col rounded-3xl border border-border bg-surface shadow-2xl text-foreground overflow-hidden">
        {/* HEADER */}
        <header className="flex shrink-0 items-start justify-between border-b border-border p-5 sm:p-6">
          <div className="flex items-start gap-3.5 min-w-0 pr-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Application Materials
              </span>
              <h1
                id="cover-letter-modal-title"
                className="mt-0.5 text-lg font-bold tracking-tight text-foreground sm:text-xl truncate"
              >
                Cover Letter — {job.title}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {job.company} • {job.location || 'Remote'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* NOTICE BANNER */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong>Grounded Draft:</strong> Generates a tailored letter highlighting your verified skills ({candidate.skills?.slice(0, 3).join(', ') || 'software development'}) without inventing fake metrics or roles. Review and tweak before sending.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger-fg">
              {errorMessage}
            </div>
          )}

          {/* TEXTAREA OR EMPTY STATE */}
          {content ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <label htmlFor="cover-letter-textarea">Draft Letter (Editable)</label>
                <span>{content.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea
                id="cover-letter-textarea"
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-2xl border border-border bg-input p-4 text-xs sm:text-sm text-foreground leading-relaxed placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-xs font-sans"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 rounded-2xl border border-dashed border-border bg-muted/10 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">No Cover Letter Drafted Yet</h2>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Generate a tailored draft tailored to {job.company}'s requirements using your verified skills and background.
                </p>
              </div>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
              >
                <SparklesIcon className="h-4 w-4" />
                <span>{isGenerating ? 'Generating Letter...' : 'Generate Cover Letter'}</span>
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:p-5 bg-surface">
          <div className="flex flex-wrap items-center gap-2">
            {content && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  <span>{isCopied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  <span>{isSavedNotice ? 'Saved!' : 'Save Draft'}</span>
                </button>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  <span>{isGenerating ? 'Regenerating...' : 'Regenerate'}</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
