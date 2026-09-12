import { useState } from 'react'
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
} from '../../components/icons/Icons'
import { ResumeAnalysisModal } from './components/ResumeAnalysisModal'
import { ResumeCard } from './components/ResumeCard'
import { ResumeCenterEmptyState } from './components/ResumeCenterEmptyState'
import { ResumeUploadModal } from './components/ResumeUploadModal'
import { formatFileSize } from './ResumeModel'
import { useResumesViewModel } from './useResumesViewModel'
import type { Resume } from '../../types/resume'

export default function ResumeCenterView() {
  const {
    resumes,
    totalCount,
    primaryResume,
    searchQuery,
    setSearchQuery,
    isUploadModalOpen,
    setIsUploadModalOpen,
    uploadResume,
    setPrimary,
    rename,
    removeResume,
    openResume,
    downloadResume,
  } = useResumesViewModel()

  const [editingPrimaryName, setEditingPrimaryName] = useState<boolean>(false)
  const [primaryDraftName, setPrimaryDraftName] = useState<string>('')
  const [analysisResume, setAnalysisResume] = useState<Resume | null>(null)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false)

  const handleOpenAnalysis = (resume: Resume) => {
    setAnalysisResume(resume)
    setIsAnalysisModalOpen(true)
  }

  const startEditPrimary = () => {
    if (!primaryResume) return
    setPrimaryDraftName(primaryResume.name)
    setEditingPrimaryName(true)
  }

  const saveEditPrimary = () => {
    if (!primaryResume) return
    const trimmed = primaryDraftName.trim()
    if (trimmed && trimmed !== primaryResume.name) {
      rename(primaryResume.id, trimmed)
    }
    setEditingPrimaryName(false)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* HEADER SECTION */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Resume Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tailored resume versions, set your primary resume, and link them to applications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Upload Resume
        </button>
      </header>

      {/* PRIMARY RESUME SPOTLIGHT SECTION */}
      {primaryResume && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <DocumentTextIcon className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Active Primary Resume
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • Default for new applications
                  </span>
                </div>

                {editingPrimaryName ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={primaryDraftName}
                      onChange={(e) => setPrimaryDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditPrimary()
                        if (e.key === 'Escape') setEditingPrimaryName(false)
                      }}
                      autoFocus
                      className="rounded-lg border border-border bg-input px-2.5 py-1 text-sm font-bold text-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={saveEditPrimary}
                      className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPrimaryName(false)}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground truncate">
                      {primaryResume.name}
                    </h2>
                    <button
                      type="button"
                      onClick={startEditPrimary}
                      className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Rename resume"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {primaryResume.fileName} • {formatFileSize(primaryResume.fileSize)} • Uploaded{' '}
                  {new Date(primaryResume.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => openResume(primaryResume)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <DocumentTextIcon className="h-3.5 w-3.5" />
                View
              </button>
              <button
                type="button"
                onClick={() => downloadResume(primaryResume)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                Download
              </button>
              <button
                type="button"
                onClick={() => handleOpenAnalysis(primaryResume)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 shadow-xs transition-colors hover:bg-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                ATS Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER TOOLBAR */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            All Resumes {totalCount > 0 && `(${totalCount})`}
          </h2>
          <p className="text-xs text-muted-foreground">
            Upload role-specific versions to customize for different positions.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <label htmlFor="resume-search" className="sr-only">
            Search resumes
          </label>
          <input
            id="resume-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or file name..."
            className="w-full rounded-xl border border-border bg-input px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* CONTENT: EMPTY OR CARD GRID */}
      {resumes.length === 0 ? (
        <ResumeCenterEmptyState
          totalCount={totalCount}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onSetPrimary={setPrimary}
              onRename={rename}
              onDelete={removeResume}
              onOpen={openResume}
              onDownload={downloadResume}
              onAnalyze={handleOpenAnalysis}
            />
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      <ResumeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={uploadResume}
        isFirstResume={totalCount === 0}
      />

      {/* RESUME ATS ANALYSIS MODAL */}
      <ResumeAnalysisModal
        isOpen={isAnalysisModalOpen}
        resume={analysisResume}
        onClose={() => {
          setIsAnalysisModalOpen(false)
          setAnalysisResume(null)
        }}
      />
    </section>
  )
}
