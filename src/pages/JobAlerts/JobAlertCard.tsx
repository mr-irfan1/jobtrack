import { Link } from 'react-router-dom'
import {
  BellAlertIcon,
  BriefcaseIcon,
  ClockIcon,
  EditIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
} from '../../components/icons/Icons'
import type { JobAlert } from '../../types/jobAlert'
import { buildJobFeedUrlFromCriteria } from '../../services/jobAlertsModel'

interface JobAlertCardProps {
  alert: JobAlert
  matchCount: number
  onEdit: (alert: JobAlert) => void
  onToggleStatus: (id: string) => void
  onDelete: (alert: JobAlert) => void
}

export function JobAlertCard({
  alert,
  matchCount,
  onEdit,
  onToggleStatus,
  onDelete,
}: JobAlertCardProps) {
  const isPaused = alert.status === 'paused'
  const feedUrl = buildJobFeedUrlFromCriteria(alert.criteria)

  return (
    <article
      className={`relative rounded-2xl border p-5 transition-all shadow-xs ${
        isPaused
          ? 'border-border/60 bg-muted/20 opacity-80'
          : 'border-border bg-surface hover:border-border/90'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* MAIN INFO */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* HEADER ROW: ICON, NAME, STATUS, FREQUENCY */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                isPaused
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              <BellAlertIcon className="h-4 w-4" />
            </span>

            <h3 className="truncate text-base font-bold text-foreground">
              {alert.name}
            </h3>

            {/* STATUS BADGE */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isPaused
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPaused ? 'bg-muted-foreground' : 'bg-emerald-500'
                }`}
                aria-hidden="true"
              />
              <span>{isPaused ? 'Paused' : 'Active'}</span>
            </span>

            {/* FREQUENCY BADGE */}
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <ClockIcon className="h-3 w-3" />
              <span className="capitalize">{alert.frequency}</span>
            </span>
          </div>

          {/* CRITERIA PILLS */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {alert.criteria.query ? (
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                "{alert.criteria.query}"
              </span>
            ) : null}

            {alert.criteria.workplace && alert.criteria.workplace !== 'all' ? (
              <span className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground/80">
                {alert.criteria.workplace}
              </span>
            ) : null}

            {alert.criteria.employmentType &&
            alert.criteria.employmentType !== 'all' ? (
              <span className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground/80">
                {alert.criteria.employmentType}
              </span>
            ) : null}

            {alert.criteria.category && alert.criteria.category !== 'all' ? (
              <span className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground/80">
                {alert.criteria.category}
              </span>
            ) : null}

            {alert.criteria.location && alert.criteria.location !== 'all' ? (
              <span className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground/80">
                📍 {alert.criteria.location}
              </span>
            ) : null}
          </div>
        </div>

        {/* MATCH COUNT BADGE & LINK */}
        <div className="shrink-0 flex items-center sm:flex-col sm:items-end gap-2">
          <Link
            to={feedUrl}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BriefcaseIcon className="h-3.5 w-3.5" />
            <span>{matchCount} match{matchCount === 1 ? '' : 'es'}</span>
          </Link>
        </div>
      </div>

      {/* FOOTER ACTIONS ROW */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3.5">
        <Link
          to={feedUrl}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View matching jobs in feed →
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleStatus(alert.id)}
            aria-label={isPaused ? `Resume alert ${alert.name}` : `Pause alert ${alert.name}`}
            title={isPaused ? 'Resume alert' : 'Pause alert'}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isPaused ? (
              <>
                <PlayIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <PauseIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onEdit(alert)}
            aria-label={`Edit alert ${alert.name}`}
            title="Edit alert"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <EditIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(alert)}
            aria-label={`Delete alert ${alert.name}`}
            title="Delete alert"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
