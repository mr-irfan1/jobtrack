import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentMeta } from '../../seo/useDocumentMeta'
import { CloseIcon } from '../../components/icons/Icons'
import { findDuplicateApplication } from '../../components/JobUrlImport/jobUrlImportLogic'
import { getPrimaryResume } from '../../services/resumeStore'
import type { ApplicationDraft, JobApplication } from '../../types/application'
import type { JobListing } from '../../types/jobFeed'
import { useApplicationsViewModel } from '../Applications/useApplicationsViewModel'
import { JobCard } from './components/JobCard'
import { JobDetailsModal } from './components/JobDetailsModal'
import { JobFeedEmptyState } from './components/JobFeedEmptyState'
import { JobFeedSkeleton } from './components/JobFeedSkeleton'
import { JobFeedToolbar } from './components/JobFeedToolbar'
import { JobFeedActiveChips } from './components/JobFeedActiveChips'
import { JobFeedMobileFilterDrawer } from './components/JobFeedMobileFilterDrawer'
import { RecommendedJobsSection } from './components/RecommendedJobsSection'
import { useJobFeedViewModel } from './useJobFeedViewModel'

function JobFeedView() {
  useDocumentMeta({
    title: 'Job Feed — Find Your Next Opportunity | JobTrack',
    description:
      'Discover curated remote and tech jobs, internships, and opportunities verified through public developer APIs.',
    canonical: 'https://www.jobtrack.co.in/jobs',
    robots: 'noindex, nofollow',
  })

  const {
    filteredJobs,
    paginatedJobs,
    loading,
    error,
    filters,
    setSearch,
    setWorkplace,
    setLocation,
    setEmploymentType,
    setCategory,
    setSortBy,
    removeFilter,
    resetFilters,
    activeFilterChips,
    activeFilterCount,
    page,
    totalPages,
    setPage,
    categories,
    selectedJob,
    setSelectedJob,
    toggleSaveJob,
    isSaved,
    refresh,
    recommendedJobs,
    hasProfileSignals,
    getJobRelevance,
  } = useJobFeedViewModel()

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false)
  const { applications, addApplication } = useApplicationsViewModel()
  const [addingAppId, setAddingAppId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ text: string; appId?: string } | null>(null)

  const selectedJobApplication = useMemo<JobApplication | undefined>(() => {
    if (!selectedJob) return undefined
    const byUrl = findDuplicateApplication(selectedJob.applyUrl, applications)
    if (byUrl) return byUrl
    const targetComp = selectedJob.company.trim().toLowerCase()
    const targetTitle = selectedJob.title.trim().toLowerCase()
    return applications.find(
      (a) =>
        a.company.trim().toLowerCase() === targetComp &&
        a.jobTitle.trim().toLowerCase() === targetTitle,
    )
  }, [selectedJob, applications])

  const handleAddToApplications = async (job: JobListing) => {
    setAddingAppId(job.id)
    try {
      const primaryResume = getPrimaryResume()
      const draft: ApplicationDraft = {
        company: job.company.trim(),
        jobTitle: job.title.trim(),
        location: job.location.trim(),
        jobUrl: job.applyUrl.trim(),
        applicationDate: new Date().toLocaleDateString('en-CA'),
        status: 'Wishlist',
        notes: job.description
          ? `Sourced via ${job.source}\n\n${job.description.slice(0, 600)}`
          : `Sourced via ${job.source}`,
        resumeId: primaryResume?.id,
      }
      const created = await addApplication(draft)
      setFeedback({
        text: `Added "${job.title}" to applications under Wishlist${primaryResume ? ' with primary resume' : ''}.`,
        appId: created.id,
      })
    } catch {
      setFeedback({ text: 'Unable to add to applications. Please try again.' })
    } finally {
      setAddingAppId(null)
    }
  }

  const isFiltered =
    Boolean(filters.search) ||
    filters.employmentType !== 'all' ||
    filters.category !== 'all' ||
    filters.sortBy !== 'newest'

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* PAGE HEADER */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Find your next opportunity
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover jobs and internships that match your search.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refresh()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <svg
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <span>Refresh</span>
        </button>
      </header>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-200"
        >
          <div className="flex items-center gap-2">
            <span>{feedback.text}</span>
            {feedback.appId && (
              <Link
                to={`/applications/${feedback.appId}`}
                className="font-bold underline hover:opacity-80"
              >
                View Application →
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="rounded p-1 hover:bg-emerald-500/20"
            aria-label="Dismiss message"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* RECOMMENDED FOR YOU SECTION (WHEN NO ACTIVE SEARCH KEYWORD) */}
      {!filters.search && (
        <RecommendedJobsSection
          recommendedJobs={recommendedJobs}
          hasProfileSignals={hasProfileSignals}
          isSaved={isSaved}
          onToggleSave={toggleSaveJob}
          onSelect={setSelectedJob}
        />
      )}

      {/* SEARCH + FILTERS */}
      <div className="mb-6 space-y-2">
        <JobFeedToolbar
          filters={filters}
          categories={categories}
          onSearchChange={setSearch}
          onWorkplaceChange={setWorkplace}
          onEmploymentTypeChange={setEmploymentType}
          onCategoryChange={setCategory}
          onSortChange={setSortBy}
          onReset={resetFilters}
          activeFilterCount={activeFilterCount}
          onOpenMobileFilters={() => setIsMobileDrawerOpen(true)}
          totalCount={filteredJobs.length}
        />

        {/* ACTIVE FILTER CHIPS */}
        <JobFeedActiveChips
          chips={activeFilterChips}
          onRemove={removeFilter}
          onClearAll={resetFilters}
        />
      </div>

      {/* CONTENT REGION */}
      {loading && paginatedJobs.length === 0 ? (
        <JobFeedSkeleton />
      ) : error && paginatedJobs.length === 0 ? (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center text-sm text-danger-fg"
        >
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 inline-flex items-center rounded-lg bg-surface border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Try again
          </button>
        </div>
      ) : paginatedJobs.length === 0 ? (
        <JobFeedEmptyState
          isFiltered={isFiltered}
          filters={filters}
          onResetFilters={resetFilters}
          onClearSearch={() => removeFilter('search')}
        />
      ) : (
        <div className="space-y-8">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedJobs.map((job) => (
              <li key={job.id}>
                <JobCard
                  job={job}
                  isSaved={isSaved(job.id)}
                  relevance={getJobRelevance(job.id)}
                  onToggleSave={toggleSaveJob}
                  onSelect={setSelectedJob}
                />
              </li>
            ))}
          </ul>

          {/* PAGINATION */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* JOB DETAILS MODAL */}
      <JobDetailsModal
        job={selectedJob}
        isSaved={selectedJob ? isSaved(selectedJob.id) : false}
        relevance={selectedJob ? getJobRelevance(selectedJob.id) : undefined}
        existingApplication={selectedJobApplication}
        onToggleSave={toggleSaveJob}
        onAddToApplications={handleAddToApplications}
        isAddingApp={addingAppId === selectedJob?.id}
        onClose={() => setSelectedJob(null)}
      />

      {/* MOBILE FILTERS DRAWER */}
      <JobFeedMobileFilterDrawer
        isOpen={isMobileDrawerOpen}
        filters={filters}
        categories={categories}
        onWorkplaceChange={setWorkplace}
        onEmploymentTypeChange={setEmploymentType}
        onCategoryChange={setCategory}
        onLocationChange={setLocation}
        onSortChange={setSortBy}
        onReset={resetFilters}
        onClose={() => setIsMobileDrawerOpen(false)}
        totalCount={filteredJobs.length}
      />
    </section>
  )
}

export default JobFeedView
