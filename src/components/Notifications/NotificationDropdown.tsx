import type { CSSProperties } from 'react'
import { BellIcon, CheckIcon } from '../icons/Icons'
import type { InterviewNotification } from './notifications'
import NotificationItem from './NotificationItem'

interface NotificationDropdownProps {
  notifications: InterviewNotification[]
  unreadCount: number
  onMarkAllRead: () => void
  onSelect: (notification: InterviewNotification) => void
  /** Viewport-anchored position (computed from the bell button's rect). */
  style: CSSProperties
}

/**
 * The notification panel. Presentational only — data + handlers come from the
 * ViewModel via NotificationBell. Fixed-positioned so it escapes the shell's
 * overflow clipping, width-capped to the viewport so it never overflows on
 * mobile, and fully theme-token driven for light/dark. Labelled as a dialog.
 */
function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAllRead,
  onSelect,
  style,
}: NotificationDropdownProps) {
  return (
    <div
      role="dialog"
      aria-label="Notifications"
      style={style}
      className="fixed z-50 w-[380px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-primary transition-colors hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-60"
        >
          <CheckIcon className="h-3.5 w-3.5" />
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <BellIcon className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-foreground">
            You're all caught up.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Scheduled interviews will appear here.
          </p>
        </div>
      ) : (
        <ul className="max-h-[min(500px,70vh)] space-y-0.5 overflow-y-auto p-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default NotificationDropdown
