import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ApplicationsIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  ExternalLinkIcon,
} from '../../components/icons/Icons'
import type { JobTrackNotification } from '../../components/Notifications/notifications'
import { useNotifications } from '../../components/Notifications/useNotifications'

type FilterCategory = 'all' | 'unread' | 'application' | 'interview' | 'system'

function NotificationsView() {
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    markUnread,
    dismissNotification,
  } = useNotifications()
  const [filter, setFilter] = useState<FilterCategory>('all')

  const applicationCount = notifications.filter(
    (n) => n.type === 'application',
  ).length
  const interviewCount = notifications.filter(
    (n) => n.type === 'interview',
  ).length
  const systemCount = notifications.filter((n) => n.type === 'system').length

  const displayedNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'application') return n.type === 'application'
    if (filter === 'interview') return n.type === 'interview'
    if (filter === 'system') return n.type === 'system'
    return true
  })

  function handleToggleRead(notification: JobTrackNotification): void {
    if (notification.read) {
      markUnread(notification.id)
    } else {
      markRead(notification.id)
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* HEADER SECTION */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated with your job applications and interviews.
          </p>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CheckIcon className="h-3.5 w-3.5 text-primary" />
            Mark all as read
          </button>
        ) : null}
      </header>

      {/* FILTER TABS ROW */}
      <nav
        aria-label="Notification categories"
        className="mb-6 flex items-center gap-1.5 overflow-x-auto border-b border-border pb-4 scrollbar-none"
      >
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            filter === 'unread'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('application')}
          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            filter === 'application'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Applications ({applicationCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('interview')}
          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            filter === 'interview'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Interviews ({interviewCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('system')}
          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            filter === 'system'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          System ({systemCount})
        </button>
      </nav>

      {/* NOTIFICATIONS LIST OR EMPTY STATE */}
      {displayedNotifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-xs">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BellIcon className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            No notifications yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Updates about your applications and interviews will appear here.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/applications"
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View Applications
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Notifications list">
          {displayedNotifications.map((notification) => {
            const Icon =
              notification.type === 'application'
                ? ApplicationsIcon
                : notification.category === 'TODAY_INTERVIEW'
                  ? ClockIcon
                  : notification.category === 'UPCOMING_INTERVIEW'
                    ? CalendarIcon
                    : BellIcon

            return (
              <li key={notification.id}>
                <article
                  className={`relative flex flex-col justify-between rounded-xl border p-4 shadow-xs transition-all sm:flex-row sm:items-start sm:gap-4 ${
                    notification.read
                      ? 'border-border bg-surface text-muted-foreground'
                      : 'border-primary/30 bg-primary/5 text-foreground ring-1 ring-primary/10'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        notification.read
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          className={`truncate text-sm ${
                            notification.read
                              ? 'font-medium text-foreground/80'
                              : 'font-bold text-foreground'
                          }`}
                        >
                          {notification.title}
                        </h2>

                        {!notification.read ? (
                          <span className="inline-flex items-center gap-1">
                            <span
                              aria-hidden="true"
                              className="h-2 w-2 rounded-full bg-primary"
                            />
                            <span className="sr-only">Unread</span>
                          </span>
                        ) : null}

                        {notification.company ? (
                          <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {notification.company}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                        {notification.description || notification.meta}
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {notification.meta}
                      </p>

                      {notification.meetingLink ? (
                        <div className="mt-2.5">
                          <a
                            href={notification.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                            Join interview
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/50 pt-3 sm:mt-0 sm:border-0 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleToggleRead(notification)}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {notification.read ? 'Mark as unread' : 'Mark as read'}
                    </button>

                    <button
                      type="button"
                      onClick={() => dismissNotification(notification.id)}
                      aria-label="Delete notification"
                      title="Delete notification"
                      className="rounded-lg border border-border bg-surface p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default NotificationsView
