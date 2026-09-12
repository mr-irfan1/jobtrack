import { DocumentTextIcon } from '../../../components/icons/Icons'

interface ResumeCenterEmptyStateProps {
  totalCount: number
  searchQuery: string
  onClearSearch: () => void
  onUploadClick: () => void
}

export function ResumeCenterEmptyState({
  totalCount,
  searchQuery,
  onClearSearch,
  onUploadClick,
}: ResumeCenterEmptyStateProps) {
  if (totalCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <DocumentTextIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-base font-bold text-foreground">
          No resumes uploaded yet
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
          Upload and organize multiple resume versions (PDF, DOC, DOCX up to 3MB) for different job roles, designate a primary resume, and link them directly to your job applications.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={onUploadClick}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Upload Resume
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-xs">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <DocumentTextIcon className="h-5 w-5" />
      </div>
      <h2 className="mt-3 text-base font-bold text-foreground">No matching resumes</h2>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {searchQuery ? `No resumes match "${searchQuery}".` : 'Try clearing your search query to see all resumes.'}
      </p>
      {searchQuery && (
        <div className="mt-5 flex items-center justify-center">
          <button
            type="button"
            onClick={onClearSearch}
            className="rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  )
}
