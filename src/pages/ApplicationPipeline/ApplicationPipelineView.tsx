import { useState } from 'react'
import type { DragEvent } from 'react'
import { Link } from 'react-router-dom'
import ApplicationForm from '../../components/ApplicationForm/ApplicationForm'
import { APPLICATION_STATUSES } from '../../types/application'
import type {
  ApplicationDraft,
  ApplicationStatus,
  JobApplication,
} from '../../types/application'
import { useApplicationsViewModel } from '../Applications/useApplicationsViewModel'

interface StageColumnConfig {
  key: string
  title: string
  targetStatus: ApplicationStatus
  dotClass: string
}

const STAGE_COLUMNS: StageColumnConfig[] = [
  {
    key: 'saved',
    title: 'Saved',
    targetStatus: 'Wishlist',
    dotClass: 'bg-slate-400 dark:bg-slate-500',
  },
  {
    key: 'applied',
    title: 'Applied',
    targetStatus: 'Applied',
    dotClass: 'bg-blue-500',
  },
  {
    key: 'screening',
    title: 'Screening',
    targetStatus: 'Applied', // Falls under applied/screening pipeline stage
    dotClass: 'bg-purple-500',
  },
  {
    key: 'interview',
    title: 'Interview',
    targetStatus: 'Interview',
    dotClass: 'bg-amber-500',
  },
  {
    key: 'offer',
    title: 'Offer',
    targetStatus: 'Offer',
    dotClass: 'bg-emerald-500',
  },
  {
    key: 'rejected',
    title: 'Rejected',
    targetStatus: 'Rejected',
    dotClass: 'bg-red-500',
  },
]

/** Formats ISO date 'YYYY-MM-DD' into short readable format like 'Aug 28' */
function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  const date = new Date(year, month, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ApplicationPipelineView() {
  const { applications, loading, error, addApplication, editApplication } =
    useApplicationsViewModel()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingApplication, setEditingApplication] =
    useState<JobApplication | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  function handleAddClick(): void {
    setEditingApplication(null)
    setIsFormOpen(true)
  }

  function handleEdit(application: JobApplication): void {
    setEditingApplication(application)
    setIsFormOpen(true)
  }

  function handleCancel(): void {
    setIsFormOpen(false)
    setEditingApplication(null)
  }

  function handleSubmit(draft: ApplicationDraft): void {
    if (editingApplication) {
      editApplication({ ...draft, id: editingApplication.id })
    } else {
      addApplication(draft)
    }
    setIsFormOpen(false)
    setEditingApplication(null)
  }

  function handleStatusChange(
    application: JobApplication,
    status: ApplicationStatus,
  ): void {
    editApplication({ ...application, status })
  }

  // Filter applications by search query and top status filter
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      searchQuery === '' ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.location &&
        app.location.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus =
      statusFilter === 'ALL' || app.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Statistics calculation
  const totalCount = applications.length
  const activeCount = applications.filter(
    (app) => app.status !== 'Rejected',
  ).length
  const interviewsCount = applications.filter(
    (app) => app.status === 'Interview',
  ).length
  const offersCount = applications.filter(
    (app) => app.status === 'Offer',
  ).length

  // Drag and Drop handlers
  function handleDragStart(e: DragEvent<HTMLElement>, id: string): void {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(id)
  }

  function handleDragEnd(): void {
    setDraggingId(null)
    setDragOverColumn(null)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, colKey: string): void {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== colKey) {
      setDragOverColumn(colKey)
    }
  }

  function handleDragLeave(colKey: string): void {
    if (dragOverColumn === colKey) {
      setDragOverColumn(null)
    }
  }

  function handleDrop(
    e: DragEvent<HTMLDivElement>,
    targetStatus: ApplicationStatus,
  ): void {
    e.preventDefault()
    setDragOverColumn(null)
    const appId = e.dataTransfer.getData('text/plain') || draggingId
    if (!appId) return

    const appToMove = applications.find((a) => a.id === appId)
    if (appToMove && appToMove.status !== targetStatus) {
      handleStatusChange(appToMove, targetStatus)
    }
  }

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* HEADER SECTION */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Application Pipeline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track every opportunity from discovery to offer.
          </p>
        </div>
        {!loading && !error && !isFormOpen ? (
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            Add application
          </button>
        ) : null}
      </header>

      {/* EDIT / ADD FORM MODAL OVERLAY */}
      {isFormOpen ? (
        <ApplicationForm
          key={editingApplication?.id ?? 'new'}
          initialValue={editingApplication ?? undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      ) : null}

      {!loading && !error ? (
        <>
          {/* STATS SUMMARY BAR */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold">{totalCount}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm">
              <span className="text-muted-foreground">Active:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {activeCount}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm">
              <span className="text-muted-foreground">Interviews:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {interviewsCount}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm">
              <span className="text-muted-foreground">Offers:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {offersCount}
              </span>
            </div>
          </div>

          {/* TOP TOOLBAR: SEARCH & FILTER */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applications..."
                  aria-label="Search applications in pipeline"
                  className="w-full rounded-lg border border-border bg-input px-3.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter applications by status"
                className="rounded-lg border border-border bg-input px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {searchQuery || statusFilter !== 'ALL' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('ALL')
                  }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {/* LOADING & ERROR STATES */}
      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          <p>Loading application pipeline...</p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger-fg"
        >
          {error}
        </div>
      ) : applications.length === 0 && !isFormOpen ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <h2 className="text-base font-semibold text-foreground">
            No applications in pipeline
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first job application to visualize and track your job search.
          </p>
          <button
            type="button"
            onClick={handleAddClick}
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            Add application
          </button>
        </div>
      ) : (
        /* KANBAN BOARD CONTAINER (HORIZONTAL SCROLLABLE RAIL) */
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 no-scrollbar">
          {STAGE_COLUMNS.map((column) => {
            const columnApps = filteredApps.filter((app) =>
              column.key === 'screening'
                ? false // Screening is an empty stage column unless matched
                : app.status === column.targetStatus,
            )

            const isOver = dragOverColumn === column.key

            return (
              <div
                key={column.key}
                onDragOver={(e) => handleDragOver(e, column.key)}
                onDragLeave={() => handleDragLeave(column.key)}
                onDrop={(e) => handleDrop(e, column.targetStatus)}
                className={`flex w-72 shrink-0 flex-col rounded-2xl border transition-all sm:w-80 ${
                  isOver
                    ? 'border-primary/60 bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border bg-muted/30'
                } p-3.5`}
              >
                {/* COLUMN HEADER */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${column.dotClass}`}
                    />
                    <h2 className="text-sm font-bold text-foreground">
                      {column.title}
                    </h2>
                  </div>
                  <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                    {columnApps.length}
                  </span>
                </div>

                {/* COLUMN CARD LIST */}
                <div className="flex flex-1 flex-col space-y-3 overflow-y-auto min-h-[360px] max-h-[calc(100vh-320px)] pr-0.5 no-scrollbar">
                  {columnApps.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/80 bg-surface/40 p-6 text-center text-xs font-medium text-muted-foreground/70">
                      No applications
                    </div>
                  ) : (
                    columnApps.map((app) => (
                      <article
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleEdit(app)}
                        className={`group relative flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md cursor-grab active:cursor-grabbing ${
                          draggingId === app.id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* COMPANY AVATAR */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                            {app.company.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="truncate text-sm font-semibold text-foreground transition-colors hover:text-primary">
                                <Link to={`/applications/${app.id}`}>
                                  {app.company}
                                </Link>
                              </h3>

                              {/* QUICK MOVE STATUS CONTROL */}
                              <select
                                value={app.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(
                                    app,
                                    e.target.value as ApplicationStatus,
                                  )
                                }}
                                aria-label={`Change status for ${app.company}`}
                                className="h-6 rounded border border-border bg-muted/60 px-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              >
                                {APPLICATION_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <p className="truncate text-xs text-muted-foreground mt-0.5">
                              <Link
                                to={`/applications/${app.id}`}
                                className="hover:text-primary hover:underline"
                              >
                                {app.jobTitle}
                              </Link>
                            </p>
                          </div>
                        </div>

                        {/* CARD FOOTER INFO */}
                        <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[120px]">
                            {app.location || 'Remote / Unspecified'}
                          </span>
                          <span className="font-medium">
                            Applied {formatShortDate(app.applicationDate)}
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ApplicationPipelineView
