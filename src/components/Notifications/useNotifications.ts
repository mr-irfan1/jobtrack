import { useCallback, useEffect, useMemo, useState } from 'react'
import type { JobApplication } from '../../types/application'
import type { InterviewNotification } from './notifications'
import {
  buildNotifications,
  countUnread,
  formatBadgeCount,
  readIdsWith,
  readIdsWithAll,
} from './notifications'
import { getApplications } from './notificationsModel'
import { getReadIds, saveReadIds } from './readNotificationsStore'

export interface NotificationsViewModel {
  notifications: InterviewNotification[]
  unreadCount: number
  /** Badge text ('' when there is nothing unread — hide the badge). */
  badge: string
  /** Re-read applications + read-state from the source of truth. */
  refresh: () => void
  markAllRead: () => void
  markRead: (id: string) => void
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
 * ViewModel for the notification bell. Owns UI state (the loaded applications
 * and the read-id set) and talks only to the notifications Model + read-state
 * store — never to Supabase or localStorage application data directly. It loads
 * from the same source the Dashboard reads, so it reflects the current user's
 * applications and refreshes whenever that data is re-read (e.g. on open). No
 * polling and no realtime: refresh() is event-driven.
 */
export function useNotifications(): NotificationsViewModel {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )

  const refresh = useCallback(async () => {
    try {
      setApplications(await getApplications())
    } catch {
      setApplications([])
    }
    setReadIds(getReadIds())
  }, [])

  // Initial load. Reading storage is external-system synchronization (the same
  // rationale the Dashboard ViewModel documents), so this is intentional.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    refresh()
  }, [refresh])

  const notifications = useMemo(() => {
    const now = new Date()
    return buildNotifications(applications, {
      todayISO: localDateISO(now),
      tomorrowISO: localTomorrowISO(now),
      currentYear: now.getFullYear(),
      readIds,
    })
  }, [applications, readIds])

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

  return { notifications, unreadCount, badge, refresh, markAllRead, markRead }
}
