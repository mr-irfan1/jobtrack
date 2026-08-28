import { Link } from 'react-router-dom'
import { APPLICATION_STATUSES } from '../../types/application'
import type { ApplicationStatus, JobApplication } from '../../types/application'
import StatusBadge from '../StatusBadge/StatusBadge'
import { ExternalLinkIcon } from '../icons/Icons'

const buttonBase =
  'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

interface JobApplicationCardProps {
  application: JobApplication
  onEdit: (application: JobApplication) => void
  onDelete: (id: string) => void
  onStatusChange: (application: JobApplication, status: ApplicationStatus) => void
}

/**
 * A job URL is a real, openable link only when it's an absolute http(s) URL.
 * Mirrors the dashboard's meeting-link guard: keeps the header from linking a
 * blank field or an unsafe/scheme-less value.
 */
function isOpenableUrl(url: string | undefined): url is string {
  return (
    typeof url === 'string' &&
    (url.startsWith('https://') || url.startsWith('http://'))
  )
}

/**
 * Presentational card for a single job application. Holds no business logic and
 * never touches storage — all actions are delegated to props supplied by the
 * parent (the Applications view / ViewModel).
 */
function JobApplicationCard({
  application,
  onEdit,
  onDelete,
  onStatusChange,
}: JobApplicationCardProps) {
  const { id, company, jobTitle, location, applicationDate, status, notes } =
    application

  return (
    <article className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">
            <Link
              to={`/applications/${id}`}
              className="hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {company}
            </Link>
            {isOpenableUrl(application.jobUrl) ? (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open job posting for ${company} (opens in a new tab)`}
                className="ml-1.5 inline-flex items-center gap-1.5 rounded-sm hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              </a>
            ) : null}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            <Link
              to={`/applications/${id}`}
              className="hover:text-primary hover:underline"
            >
              {jobTitle}
            </Link>
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-muted-foreground">Location</dt>
          <dd className="text-foreground">{location}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-muted-foreground">Applied</dt>
          <dd className="text-foreground">{applicationDate}</dd>
        </div>
      </dl>

      {notes ? (
        // Clamp to 3 lines (display-only, via CSS) so a long note can't
        // stretch the card. The full note is preserved and shown when editing.
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{notes}</p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(application, event.target.value as ApplicationStatus)
          }
          aria-label={`Change status for ${company}`}
          className="rounded-md border border-border bg-input px-2 py-1.5 text-sm font-medium text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {APPLICATION_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(application)}
            aria-label={`Edit application for ${company}`}
            className={`${buttonBase} border border-border bg-surface text-foreground hover:bg-muted focus-visible:ring-ring`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(id)}
            aria-label={`Delete application for ${company}`}
            className={`${buttonBase} border border-danger/30 bg-surface text-danger-fg hover:bg-danger/10 focus-visible:ring-danger`}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default JobApplicationCard
