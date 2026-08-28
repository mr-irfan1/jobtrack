import { useCallback, useEffect, useMemo, useState } from 'react'
import type { JobApplication } from '../../types/application'
import type { JobTrackNotification } from './notifications'
import {
  buildComprehensiveNotifications,
  countUnread,
  formatBadgeCount,
  readIdsWith,
  readIdsWithAll,
  readIdsWithout,
} from './notifications'
import { getApplications } from './notificationsModel'
import {
  getDismissedIds,
  getReadIds,
  saveDismissedIds,
  saveReadIds,
} from './readNotificationsStore'

export interface NotificationsViewModel {
  notifications: JobTrackNotification[]
  unreadCount: number
  /** Badge text ('' when there is nothing unread — hide the badge). */
  badge: string
  /** Re-read applications + read-state from the source of truth. */
  refresh: () => void
  markAllRead: () => void
  markRead: (id: string) => void
  markUnread: (id: string) => void
  dismissNotification: (id: string) => void
}

/** Local today as YYYY-MM-DD (en-CA) — the app-wide date convention. */
function localDateISO(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

/** Local tomorrow as YYYY-MM-DD, derived from the same "now". */
function localTomorrowISO(now: Date): string {
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return localDateISO(tomorrow)
}

/**
 * ViewModel for the notification bell and page. Owns UI state (the loaded applications
 * and the read-id set) and talks only to the notifications Model + read-state
 * store — never to Supabase or localStorage application data directly.
 */
export function useNotifications(): NotificationsViewModel {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )

  const refresh = useCallback(async () => {
    try {
      setApplications(await getApplications())
    } catch {
      setApplications([])
    }
    setReadIds(getReadIds())
    setDismissedIds(getDismissedIds())
  }, [])

  // Initial load. Reading storage is external-system synchronization.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    refresh()
  }, [refresh])

  const rawNotifications = useMemo(() => {
    const now = new Date()
    return buildComprehensiveNotifications(applications, {
      todayISO: localDateISO(now),
      tomorrowISO: localTomorrowISO(now),
      currentYear: now.getFullYear(),
      readIds,
    })
  }, [applications, readIds])

  // Exclude dismissed notifications
  const notifications = useMemo(() => {
    return rawNotifications.filter((n) => !dismissedIds.has(n.id))
  }, [rawNotifications, dismissedIds])

  const unreadCount = useMemo(() => countUnread(notifications), [notifications])
  const badge = formatBadgeCount(unreadCount)

  const markAllRead = useCallback(() => {
    const next = readIdsWithAll(readIds, notifications)
    saveReadIds(next)
    setReadIds(next)
  }, [readIds, notifications])

  const markRead = useCallback(
    (id: string) => {
      const next = readIdsWith(readIds, id)
      saveReadIds(next)
      setReadIds(next)
    },
    [readIds],
  )

  const markUnread = useCallback(
    (id: string) => {
      const next = readIdsWithout(readIds, id)
      saveReadIds(next)
      setReadIds(next)
    },
    [readIds],
  )

  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((current) => {
      const next = new Set(current)
      next.add(id)
      saveDismissedIds(next)
      return next
    })
  }, [])

  return {
    notifications,
    unreadCount,
    badge,
    refresh,
    markAllRead,
    markRead,
    markUnread,
    dismissNotification,
  }
}
