import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentMeta } from '../../seo/useDocumentMeta'
import { CloseIcon } from '../../components/icons/Icons'
import { JobDetailsModal } from '../JobFeed/components/JobDetailsModal'
import { ApplicationCopilotModal } from '../../components/Copilot/ApplicationCopilotModal'
import type { JobListing } from '../../types/jobFeed'
import { SavedJobCard } from './components/SavedJobCard'
import { SavedJobsEmptyState } from './components/SavedJobsEmptyState'
import { SavedJobsToolbar } from './components/SavedJobsToolbar'
import { useSavedJobsViewModel } from './useSavedJobsViewModel'

function SavedJobsView() {
  useDocumentMeta({
    title: 'Saved Jobs | JobTrack',
    description: 'Keep track of opportunities you want to explore later.',
    canonical: 'https://www.jobtrack.co.in/saved-jobs',
    robots: 'noindex, nofollow',
  })

  const {
    savedJobs,
    filteredJobs,
    filters,
    setSearch,
    setWorkplaceType,
    setEmploymentType,
    setSortBy,
    resetFilters,
    selectedJob,
    setSelectedJob,
    removeSaved,
    addingAppId,
    addToApplications,
    getExistingApplication,
    feedbackMessage,
    clearFeedback,
  } = useSavedJobsViewModel()

  const [copilotJob, setCopilotJob] = useState<JobListing | null>(null)

  const isFiltered =
    Boolean(filters.search) ||
    filters.workplaceType !== 'all' ||
    filters.employmentType !== 'all' ||
    filters.sortBy !== 'recently_saved'

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* PAGE HEADER */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Saved Jobs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep track of opportunities you want to explore later.
          </p>
        </div>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>Explore Job Feed →</span>
        </Link>
      </header>

      {/* FEEDBACK NOTIFICATION BANNER */}
      {feedbackMessage ? (
        <div
          role="status"
          className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm transition-all ${
            feedbackMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : feedbackMessage.type === 'info'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-danger/30 bg-danger/10 text-danger-fg'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedbackMessage.text}</span>
            {feedbackMessage.appId ? (
              <Link
                to={`/applications/${feedbackMessage.appId}`}
                className="font-bold underline hover:opacity-80"
              >
                View Application
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            onClick={clearFeedback}
            aria-label="Dismiss message"
            className="p-1 hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* SEARCH + FILTERS (Only when there are saved jobs to filter) */}
      {savedJobs.length > 0 ? (
        <div className="mb-6">
          <SavedJobsToolbar
            filters={filters}
            onSearchChange={setSearch}
            onWorkplaceTypeChange={setWorkplaceType}
            onEmploymentTypeChange={setEmploymentType}
            onSortChange={setSortBy}
            onReset={resetFilters}
            totalCount={filteredJobs.length}
          />
        </div>
      ) : null}

      {/* CONTENT AREA */}
      {filteredJobs.length === 0 ? (
        <SavedJobsEmptyState isFiltered={isFiltered} onResetFilters={resetFilters} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((item) => {
            const existingApp = item.job ? getExistingApplication(item.job) : undefined
            return (
              <li key={item.id}>
                <SavedJobCard
                  id={item.id}
                  savedAt={item.savedAt}
                  job={item.job}
                  existingApplication={existingApp}
                  onRemove={removeSaved}
                  onSelect={setSelectedJob}
                  onAddApplication={addToApplications}
                  onOpenCopilot={setCopilotJob}
                  addingApp={addingAppId === item.id}
                />
              </li>
            )
          })}
        </ul>
      )}

      {/* JOB DETAILS MODAL */}
      <JobDetailsModal
        job={selectedJob}
        isSaved={true}
        onToggleSave={(job) => {
          removeSaved(job.id)
          setSelectedJob(null)
        }}
        onClose={() => setSelectedJob(null)}
      />

      {/* APPLICATION COPILOT MODAL */}
      <ApplicationCopilotModal
        isOpen={Boolean(copilotJob)}
        onClose={() => setCopilotJob(null)}
        job={copilotJob}
        existingApplication={copilotJob ? getExistingApplication(copilotJob) : undefined}
      />
    </section>
  )
}

export default SavedJobsView
