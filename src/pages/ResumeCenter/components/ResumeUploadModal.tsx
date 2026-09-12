import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { CloseIcon, DocumentTextIcon } from '../../../components/icons/Icons'
import {
  cleanDefaultResumeTitle,
  formatFileSize,
  validateResumeFile,
} from '../ResumeModel'

interface ResumeUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (
    name: string,
    file: File,
    isPrimary?: boolean,
  ) => Promise<{ success: boolean; error?: string }>
  isFirstResume?: boolean
}

export function ResumeUploadModal({
  isOpen,
  onClose,
  onUpload,
  isFirstResume = false,
}: ResumeUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [resumeName, setResumeName] = useState<string>('')
  const [isPrimary, setIsPrimary] = useState<boolean>(isFirstResume)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
      setResumeName('')
      setIsPrimary(isFirstResume)
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, isFirstResume])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleFileSelected(file: File) {
    setError(null)
    const validation = validateResumeFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    if (!resumeName.trim()) {
      setResumeName(cleanDefaultResumeTitle(file.name))
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFile) {
      setError('Please select a resume file to upload.')
      return
    }
    if (!resumeName.trim()) {
      setError('Please enter a name for this resume version.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await onUpload(resumeName.trim(), selectedFile, isPrimary)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Upload failed.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-upload-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div
        className="relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] w-full max-w-md flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-2xl transition-all overflow-hidden text-foreground"
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-border pb-4">
          <div>
            <h2
              id="resume-upload-title"
              className="text-lg font-bold text-foreground"
            >
              Upload Resume
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Supports PDF, DOC, or DOCX up to 3MB.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ERROR DISPLAY */}
        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger-fg shrink-0"
          >
            {error}
          </div>
        ) : null}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* DRAG AND DROP ZONE */}
            <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2.5">
              <DocumentTextIcon className="h-5 w-5" />
            </div>

            {selectedFile ? (
              <div>
                <p className="text-xs font-bold text-foreground truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatFileSize(selectedFile.size)} • Click to choose another
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-foreground">
                  <span className="text-primary font-bold">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  PDF, DOCX, or DOC (max 3MB)
                </p>
              </div>
            )}
          </div>

          {/* RESUME DISPLAY NAME */}
          <div>
            <label
              htmlFor="resume-name-input"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Resume Title <span className="text-danger-fg">*</span>
            </label>
            <input
              id="resume-name-input"
              type="text"
              required
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              placeholder="e.g. Software Engineer Resume, Frontend Developer"
              className="mt-1.5 block w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* PRIMARY RESUME CHECKBOX */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="resume-primary-check"
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label
              htmlFor="resume-primary-check"
              className="text-xs font-medium text-foreground cursor-pointer select-none"
            >
              Set as primary resume (recommended for default applications)
            </label>
          </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-4 flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading...' : 'Save Resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
