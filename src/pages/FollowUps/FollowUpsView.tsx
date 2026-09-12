import { useSearchParams } from 'react-router-dom'
import { PlusIcon } from '../../components/icons/Icons'
import type { FollowUpTabFilter } from '../../types/followUp'
import { FollowUpCard } from './components/FollowUpCard'
import { FollowUpModal } from './components/FollowUpModal'
import { FollowUpsEmptyState } from './components/FollowUpsEmptyState'
import { FollowUpsSummary } from './components/FollowUpsSummary'
import { useFollowUpsViewModel } from './useFollowUpsViewModel'

export default function FollowUpsView() {
  const [searchParams] = useSearchParams()
  const initialAppId = searchParams.get('applicationId') || undefined

  const {
    followUps,
    applications,
    loading,
    error,
    tabFilter,
    setTabFilter,
    searchQuery,
    setSearchQuery,
    totalCount,
    upcomingCount,
    overdueCount,
    completedCount,
    isModalOpen,
    editingFollowUp,
    targetApplicationId,
    openCreateModal,
    openEditModal,
    closeModal,
    createFollowUp,
    saveRescheduled,
    markCompleted,
    removeFollowUp,
  } = useFollowUpsViewModel(initialAppId)

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* HEADER SECTION */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Follow-ups
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay on top of recruiters, applications, and next steps.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Schedule Follow-up
        </button>
      </header>

      {/* ERROR BANNER */}
      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs font-semibold text-danger-fg"
        >
          {error}
        </div>
      ) : null}

      {/* TOP KPI SUMMARY CARDS */}
      <div className="mb-8">
        <FollowUpsSummary
          upcomingCount={upcomingCount}
          overdueCount={overdueCount}
          completedCount={completedCount}
          onSelectTab={(tab) => setTabFilter(tab as FollowUpTabFilter)}
          currentTab={tabFilter}
        />
      </div>

      {/* SEARCH AND TABS TOOLBAR */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        {/* TABS ROW */}
        <nav aria-label="Follow-up filters" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTabFilter('all')}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tabFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('upcoming')}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tabFilter === 'upcoming'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('overdue')}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tabFilter === 'overdue'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('completed')}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tabFilter === 'completed'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Completed ({completedCount})
          </button>
        </nav>

        {/* SEARCH INPUT */}
        <div className="w-full sm:w-64">
          <label htmlFor="followup-search" className="sr-only">
            Search follow-ups
          </label>
          <input
            id="followup-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, job, notes..."
            className="w-full rounded-xl border border-border bg-input px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* CONTENT: LOADING, EMPTY OR CARD GRID */}
      {loading && followUps.length === 0 ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
          Loading follow-ups...
        </div>
      ) : followUps.length === 0 ? (
        <FollowUpsEmptyState
          totalCount={totalCount}
          activeTab={tabFilter}
          searchQuery={searchQuery}
          onClearFilters={() => {
            setTabFilter('all')
            setSearchQuery('')
          }}
          onScheduleClick={() => openCreateModal()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {followUps.map((item) => (
            <FollowUpCard
              key={item.id}
              item={item}
              onMarkComplete={markCompleted}
              onReschedule={openEditModal}
              onDelete={removeFollowUp}
            />
          ))}
        </div>
      )}

      {/* CREATE / RESCHEDULE MODAL */}
      <FollowUpModal
        isOpen={isModalOpen}
        onClose={closeModal}
        applications={applications}
        targetApplicationId={targetApplicationId}
        initialFollowUp={editingFollowUp}
        onSubmit={createFollowUp}
        onRescheduleSubmit={saveRescheduled}
      />
    </section>
  )
}
