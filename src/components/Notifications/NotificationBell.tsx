import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellIcon } from '../icons/Icons'
import type { InterviewNotification } from './notifications'
import NotificationDropdown from './NotificationDropdown'
import { useNotifications } from './useNotifications'

// Quiet header control, matching ThemeToggle so the top bar reads as one set.
// `relative` anchors the unread badge to the bell.
const bellClasses =
  'relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Notification bell for the navbar: a button with an unread badge that opens a
 * popover panel. Owns only local popover state (open + anchored position); all
 * notification data and read-state come from useNotifications. Closes on outside
 * click and Escape (returning focus to the bell). Selecting a notification marks
 * it read and navigates to the existing /applications route (no route invented;
 * there is no per-application detail route). Refreshes data when opened — no
 * polling, no realtime.
 */
function NotificationBell() {
  const { notifications, unreadCount, badge, refresh, markAllRead, markRead } =
    useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const computePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition({
      top: rect.bottom + 8,
      right: Math.max(12, window.innerWidth - rect.right),
    })
  }, [])

  function handleToggle() {
    if (open) {
      setOpen(false)
      return
    }
    refresh() // event-driven refresh on open (not polling)
    computePosition()
    setOpen(true)
  }

  // While open: close on outside pointerdown or Escape, and keep the panel
  // anchored on resize. Listeners are attached only while open.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      const container = containerRef.current
      if (container && !container.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', computePosition)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', computePosition)
    }
  }, [open, computePosition])

  const handleSelect = useCallback(
    (notification: InterviewNotification) => {
      markRead(notification.id)
      setOpen(false)
      navigate('/applications')
    },
    [markRead, navigate],
  )

  const label =
    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'

  return (
    <div ref={containerRef} className="flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-label={label}
        title="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={bellClasses}
      >
        <BellIcon className="h-5 w-5" />
        {badge ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-surface"
          >
            {badge}
          </span>
        ) : null}
      </button>
      {open ? (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={markAllRead}
          onSelect={handleSelect}
          style={{ top: position.top, right: position.right }}
        />
      ) : null}
    </div>
  )
}

export default NotificationBell
