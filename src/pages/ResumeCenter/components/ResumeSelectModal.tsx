import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloseIcon, DocumentTextIcon } from '../../../components/icons/Icons'
import type { Resume } from '../../../types/resume'
import { formatFileSize } from '../ResumeModel'

interface ResumeSelectModalProps {
  isOpen: boolean
  onClose: () => void
  resumes: Resume[]
  currentResumeId?: string | null
  onSelectResume: (resumeId: string | null) => void
}

export function ResumeSelectModal({
  isOpen,
  onClose,
  resumes,
  currentResumeId,
  onSelectResume,
}: ResumeSelectModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentResumeId || null)

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentResumeId || null)
    }
  }, [isOpen, currentResumeId])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSave = () => {
    onSelectResume(selectedId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-resume-title"
    >
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[calc(100dvh-2rem)] flex flex-col text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <h2 id="select-resume-title" className="text-lg font-bold text-foreground">
              Attach Resume
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 overflow-y-auto flex-1 space-y-3">
          {resumes.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3">
                <DocumentTextIcon className="w-6 h-6" />
              </div>
              <p className="text-sm text-foreground font-semibold">No resumes uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Upload your resumes in the Resume Center to link them with job applications.
              </p>
              <Link
                to="/resumes"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Go to Resume Center
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Select which resume version you used for this application:
              </p>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedId === null
                    ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary/20'
                    : 'border-border bg-muted/30 hover:bg-muted text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="resume_selection"
                    checked={selectedId === null}
                    onChange={() => setSelectedId(null)}
                    className="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-sm font-medium">No resume attached</span>
                </div>
              </label>

              {resumes.map((resume) => {
                const isSelected = selectedId === resume.id
                return (
                  <label
                    key={resume.id}
                    className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-muted/30 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="radio"
                        name="resume_selection"
                        checked={isSelected}
                        onChange={() => setSelectedId(resume.id)}
                        className="text-primary focus:ring-primary h-4 w-4 mt-1"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {resume.name}
                          </span>
                          {resume.isPrimary && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {resume.fileName} • {formatFileSize(resume.fileSize)} • {resume.fileType.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </label>
                )
              })}
            </>
          )}
        </div>

        <div className="pt-4 border-t border-border flex shrink-0 flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            Cancel
          </button>
          {resumes.length > 0 && (
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Save Selection
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
