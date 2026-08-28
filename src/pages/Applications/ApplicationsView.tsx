import { useState } from 'react'
import ApplicationForm from '../../components/ApplicationForm/ApplicationForm'
import ApplicationsToolbar from '../../components/ApplicationsToolbar/ApplicationsToolbar'
import JobApplicationCard from '../../components/JobApplicationCard/JobApplicationCard'
import AddApplicationOptionSelector from '../../components/JobUrlImport/AddApplicationOptionSelector'
import type { AddApplicationMode } from '../../components/JobUrlImport/AddApplicationOptionSelector'
import JobUrlImportForm from '../../components/JobUrlImport/JobUrlImportForm'
import type {
  ApplicationDraft,
  ApplicationStatus,
  JobApplication,
} from '../../types/application'
import { useApplicationsViewModel } from './useApplicationsViewModel'

function ApplicationsView() {
  const {
    applications,
    filteredApplications,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    clearFilters,
    addApplication,
    editApplication,
    removeApplication,
  } = useApplicationsViewModel()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingApplication, setEditingApplication] =
    useState<JobApplication | null>(null)
  const [addMode, setAddMode] = useState<AddApplicationMode | null>(null)

  function handleAddClick(): void {
    setEditingApplication(null)
    setAddMode(null)
    setIsFormOpen(true)
  }

  function handleEdit(application: JobApplication): void {
    setEditingApplication(application)
    setAddMode('manual')
    setIsFormOpen(true)
  }

  function handleCancel(): void {
    setIsFormOpen(false)
    setEditingApplication(null)
    setAddMode(null)
  }

  function handleSubmit(draft: ApplicationDraft): void {
    // The form is id-agnostic; re-attach the retained id when editing.
    if (editingApplication) {
      editApplication({ ...draft, id: editingApplication.id })
    } else {
      addApplication(draft)
    }
    setIsFormOpen(false)
    setEditingApplication(null)
    setAddMode(null)
  }

  // Status changes reuse the existing update flow rather than a separate path.
  function handleStatusChange(
    application: JobApplication,
    status: ApplicationStatus,
  ): void {
    editApplication({ ...application, status })
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Job Applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage your job applications.
          </p>
        </div>
        {!loading && !error && !isFormOpen ? (
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            Add application
          </button>
        ) : null}
      </header>

      {isFormOpen ? (
        editingApplication ? (
          <ApplicationForm
            key={editingApplication.id}
            initialValue={editingApplication}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        ) : addMode === 'manual' ? (
          <ApplicationForm
            key="new-manual"
            onSubmit={handleSubmit}
            onCancel={() => setAddMode(null)}
          />
        ) : addMode === 'url-import' ? (
          <JobUrlImportForm
            key="new-import"
            existingApplications={applications}
            onAddApplication={addApplication}
            onCancel={() => setAddMode(null)}
          />
        ) : (
          <AddApplicationOptionSelector
            onSelectMode={setAddMode}
            onCancel={handleCancel}
          />
        )
      ) : null}

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading applications...
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger-fg"
        >
          {error}
        </div>
      ) : applications.length === 0 ? (
        isFormOpen ? null : (
          <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
            <h2 className="text-base font-semibold text-foreground">
              No applications yet
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first job application to start tracking your job search.
            </p>
            <button
              type="button"
              onClick={handleAddClick}
              className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              Add application
            </button>
          </div>
        )
      ) : (
        <div className="space-y-6">
          <ApplicationsToolbar
            search={search}
            onSearchChange={setSearch}
            status={statusFilter}
            onStatusChange={setStatusFilter}
          />
          {filteredApplications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
              <h2 className="text-base font-semibold text-foreground">
                No matching applications
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                No applications match your current search or status filter. Try
                adjusting them, or clear to see all applications.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                Clear search & filter
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApplications.map((application) => (
                <li key={application.id}>
                  <JobApplicationCard
                    application={application}
                    onEdit={handleEdit}
                    onDelete={removeApplication}
                    onStatusChange={handleStatusChange}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

export default ApplicationsView
