import { Link } from 'react-router-dom'
import StatusBadge from '../../../components/StatusBadge/StatusBadge'
import {
  CalendarIcon,
  CheckIcon,
  ExternalLinkIcon,
  PencilIcon,
  TrashIcon,
} from '../../../components/icons/Icons'
import type { FollowUpWithApplication } from '../../../types/followUp'
import {
  formatFollowUpDateDisplay,
  getRelativeStatus,
} from '../FollowUpModel'

interface FollowUpCardProps {
  item: FollowUpWithApplication
  onMarkComplete: (id: string) => void
  onReschedule: (item: FollowUpWithApplication) => void
  onDelete: (id: string) => void
}

export function FollowUpCard({
  item,
  onMarkComplete,
  onReschedule,
  onDelete,
}: FollowUpCardProps) {
  const application = item.application
  const company = application?.company || 'Unknown Company'
  const jobTitle = application?.jobTitle || 'Application'
  const relative = getRelativeStatus(item)
  const isCompleted = item.status === 'completed'
  const isCancelled = item.status === 'cancelled'

  const toneClasses: Record<string, string> = {
    danger: 'bg-danger/10 text-danger-fg border-danger/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    muted: 'bg-muted text-muted-foreground border-border',
  }

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-primary/30 hover:shadow-md">
      <div>
        {/* TOP ROW: COMPANY, JOB TITLE, STATUS & RELATIVE BADGE */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-foreground">
              {application ? (
                <Link
                  to={`/applications/${application.id}`}
                  className="hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {company}
                </Link>
              ) : (
                company
              )}
            </h3>
            <p className="truncate text-sm font-medium text-muted-foreground mt-0.5">
              {application ? (
                <Link
                  to={`/applications/${application.id}`}
                  className="hover:text-primary hover:underline rounded-sm"
                >
                  {jobTitle}
                </Link>
              ) : (
                jobTitle
              )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {application?.status ? (
              <StatusBadge status={application.status} />
            ) : null}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
                toneClasses[relative.tone] || toneClasses.muted
              }`}
            >
              {relative.label}
            </span>
          </div>
        </div>

        {/* SCHEDULED DATE & TIME */}
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-foreground/80">
          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
          <span>{formatFollowUpDateDisplay(item)}</span>
        </div>

        {/* NOTE */}
        {item.note ? (
          <div className="mt-3 rounded-xl bg-muted/40 p-3 text-xs text-foreground/85 leading-relaxed border border-border/50">
            <p className="whitespace-pre-wrap line-clamp-3">{item.note}</p>
          </div>
        ) : null}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3.5">
        <div className="flex items-center gap-2">
          {application ? (
            <Link
              to={`/applications/${application.id}`}
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open Application
              <ExternalLinkIcon className="h-3 w-3" />
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {!isCompleted && !isCancelled ? (
            <button
              type="button"
              onClick={() => onMarkComplete(item.id)}
              aria-label={`Mark follow-up complete for ${company}`}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Complete
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onReschedule(item)}
            aria-label={`Reschedule follow-up for ${company}`}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PencilIcon className="h-3 w-3 text-muted-foreground" />
            Reschedule
          </button>

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label={`Delete follow-up for ${company}`}
            className="inline-flex items-center rounded-xl border border-danger/30 bg-surface p-1.5 text-danger-fg shadow-xs transition-colors hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
