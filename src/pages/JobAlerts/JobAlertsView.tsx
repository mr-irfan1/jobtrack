import { useState } from 'react'
import {
  BellAlertIcon,
  InfoIcon,
  PlusIcon,
} from '../../components/icons/Icons'
import { useJobAlertsViewModel } from './useJobAlertsViewModel'
import { JobAlertCard } from './JobAlertCard'
import { JobAlertModal } from './JobAlertModal'
import { JobAlertDeleteModal } from './JobAlertDeleteModal'

function JobAlertsView() {
  const {
    alerts,
    loading,
    categories,
    activeCount,
    pausedCount,
    isModalOpen,
    editingAlert,
    deletingAlert,
    openCreateModal,
    openEditModal,
    closeModal,
    openDeleteModal,
    closeDeleteModal,
    handleSaveAlert,
    handleToggleStatus,
    handleConfirmDelete,
    getMatchCount,
  } = useJobAlertsViewModel()

  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')

  const displayedAlerts = alerts.filter((alert) => {
    if (filter === 'active') return alert.status === 'active'
    if (filter === 'paused') return alert.status === 'paused'
    return true
  })

  return (
    <div className="min-h-full py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"
              >
                <BellAlertIcon className="h-4.5 w-4.5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Job Alerts
              </h1>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              Get notified when new opportunities match what you're looking for.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Job Alert</span>
          </button>
        </div>

        {/* ARCHITECTURAL HONESTY BANNER */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground/90 shadow-2xs">
          <InfoIcon className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-foreground">How alerts work:</span>{' '}
            JobTrack checks for newly published listings matching your active alerts whenever you open or refresh the app.
          </p>
        </div>

        {/* CONTROLS ROW & FILTER PILLS */}
        {alerts.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('active')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  filter === 'active'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Active ({activeCount})
              </button>
              {pausedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setFilter('paused')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    filter === 'paused'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  Paused ({pausedCount})
                </button>
              ) : null}
            </div>

            <span className="text-xs text-muted-foreground">
              {displayedAlerts.length} alert{displayedAlerts.length === 1 ? '' : 's'} shown
            </span>
          </div>
        ) : null}

        {/* MAIN CONTENT: EMPTY OR LIST */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 rounded-2xl bg-muted/60" />
            <div className="h-32 rounded-2xl bg-muted/60" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-surface px-6 py-16 text-center shadow-xs">
            <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BellAlertIcon className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              Never miss a relevant opportunity
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Create an alert for the roles, skills, or work preferences you're watching. When new jobs match your criteria, you'll be notified automatically.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Job Alert</span>
              </button>
            </div>
          </div>
        ) : displayedAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
            No alerts match the selected filter.
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayedAlerts.map((alert) => (
              <JobAlertCard
                key={alert.id}
                alert={alert}
                matchCount={getMatchCount(alert.criteria)}
                onEdit={openEditModal}
                onToggleStatus={handleToggleStatus}
                onDelete={openDeleteModal}
              />
            ))}
          </div>
        )}

        {/* MODALS */}
        <JobAlertModal
          isOpen={isModalOpen}
          editingAlert={editingAlert}
          categories={categories}
          onClose={closeModal}
          onSave={handleSaveAlert}
          getMatchCount={getMatchCount}
        />

        <JobAlertDeleteModal
          alert={deletingAlert}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  )
}

export default JobAlertsView
