/**
 * Client-side read-state for notifications.
 *
 * Because this step intentionally adds no notifications table, the read/unread
 * experience is UI-only state persisted under a dedicated localStorage key. It
 * stores notification IDENTIFIERS only (the stable ids from notifications.ts) —
 * never application data. It never reads or writes the application data key
 * (jobtrack_applications) and performs no migration. All access is defensive:
 * malformed or unavailable storage degrades to "nothing read".
 */

/** Dedicated key for read notification ids — NOT the application data key. */
export const READ_STORAGE_KEY = 'jobtrack_read_notifications'
/** Dedicated key for dismissed notification ids. */
export const DISMISSED_STORAGE_KEY = 'jobtrack_dismissed_notifications'

/** Parse a raw stored value into a list of ids; [] for anything malformed. */
export function parseReadIds(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

/** The set of read notification ids from storage (empty when unavailable). */
export function getReadIds(): Set<string> {
  try {
    return new Set(parseReadIds(localStorage.getItem(READ_STORAGE_KEY)))
  } catch {
    return new Set()
  }
}

/** Persist the read notification ids (best-effort; ignores storage errors). */
export function saveReadIds(ids: Iterable<string>): void {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // UI-only state — a full/unavailable store must not break the app.
  }
}

/** The set of dismissed notification ids from storage. */
export function getDismissedIds(): Set<string> {
  try {
    return new Set(parseReadIds(localStorage.getItem(DISMISSED_STORAGE_KEY)))
  } catch {
    return new Set()
  }
}

/** Persist the dismissed notification ids. */
export function saveDismissedIds(ids: Iterable<string>): void {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // UI-only state
  }
}

