export type AddApplicationMode = 'manual' | 'url-import'

interface AddApplicationOptionSelectorProps {
  onSelectMode: (mode: AddApplicationMode) => void
  onCancel: () => void
}

function AddApplicationOptionSelector({
  onSelectMode,
  onCancel,
}: AddApplicationOptionSelectorProps) {
  return (
    <div className="mb-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Add New Application
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose how you would like to add this job application to JobTrack.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Option 1: Manual Entry */}
        <button
          type="button"
          onClick={() => onSelectMode('manual')}
          className="group flex flex-col justify-between rounded-lg border border-border bg-background p-4 text-left transition duration-150 hover:border-primary hover:bg-surface hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                📝
              </span>
              <h3 className="font-semibold text-foreground">1. Manual Entry</h3>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Fill out company, job title, location, status, and notes manually.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center text-xs font-medium text-primary group-hover:underline">
            Start manual entry &rarr;
          </span>
        </button>

        {/* Option 2: Import from Job URL */}
        <button
          type="button"
          onClick={() => onSelectMode('url-import')}
          className="group flex flex-col justify-between rounded-lg border border-primary/40 bg-primary/5 p-4 text-left transition duration-150 hover:border-primary hover:bg-primary/10 hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                ✨
              </span>
              <h3 className="font-semibold text-foreground">
                2. Import from Job URL ✨
              </h3>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Paste a job posting URL and JobTrack will extract the job details for you.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center text-xs font-medium text-primary group-hover:underline">
            Import from link &rarr;
          </span>
        </button>
      </div>
    </div>
  )
}

export default AddApplicationOptionSelector
