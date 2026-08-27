import {
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
} from '../icons/Icons'
import type { InterviewNotification } from './notifications'

interface NotificationItemProps {
  notification: InterviewNotification
  /** Select the notification (marks it read + navigates to Applications). */
  onSelect: (notification: InterviewNotification) => void
}

/**
 * A single notification row. Presentational only. Unread items get stronger
 * styling AND a non-color cue (a dot plus an sr-only "Unread" label), so read
 * state is never communicated by color alone. A "Join interview" link is shown
 * only when a safe meeting link exists and opens in a new tab.
 */
function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const { read, title, company, meta, meetingLink, category } = notification
  const Icon = category === 'TODAY_INTERVIEW' ? ClockIcon : CalendarIcon

  return (
    <li>
      <div className="rounded-lg transition-colors hover:bg-muted">
        <button
          type="button"
          onClick={() => onSelect(notification)}
          className="flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              read
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span
                className={`truncate text-sm ${
                  read
                    ? 'font-medium text-muted-foreground'
                    : 'font-semibold text-foreground'
                }`}
              >
                {title}
              </span>
              {read ? null : (
                <>
                  <span
                    aria-hidden="true"
                    className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary"
                  />
                  <span className="sr-only">Unread</span>
                </>
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {meta}
            </span>
          </span>
        </button>
        {meetingLink ? (
          <div className="pb-3 pl-13">
            <a
              href={meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Join interview for ${company} (opens in a new tab)`}
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary transition-colors hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Join interview
            </a>
          </div>
        ) : null}
      </div>
    </li>
  )
}

export default NotificationItem
