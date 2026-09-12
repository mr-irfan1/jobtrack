import type { FollowUp, FollowUpTabFilter, FollowUpWithApplication } from '../../types/followUp'

function formatTime12(time?: string): string {
  if (!time) return ''
  const [hh = '0', mm = '00'] = time.split(':')
  const hours = Number(hh)
  const period = hours < 12 ? 'AM' : 'PM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${mm} ${period}`
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Parses the local Date representation of a follow-up.
 * If time is omitted, defaults to 09:00:00 local time.
 */
export function parseFollowUpDate(followUp: { scheduledDate: string; scheduledTime?: string }): Date {
  const parts = followUp.scheduledDate.split('-').map(Number)
  const year = parts[0] ?? 1970
  const month = (parts[1] ?? 1) - 1
  const day = parts[2] ?? 1

  let hours = 9
  let minutes = 0
  if (followUp.scheduledTime) {
    const timeParts = followUp.scheduledTime.split(':').map(Number)
    hours = timeParts[0] ?? 9
    minutes = timeParts[1] ?? 0
  }

  return new Date(year, month, day, hours, minutes, 0, 0)
}

/** Local today as YYYY-MM-DD */
export function toLocalDateISO(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

/**
 * A pending follow-up is overdue when its scheduled date/time is in the past.
 */
export function isOverdue(followUp: FollowUp, now: Date = new Date()): boolean {
  if (followUp.status !== 'pending') return false
  return parseFollowUpDate(followUp).getTime() < now.getTime()
}

/**
 * A pending follow-up is upcoming when its scheduled date/time is in the future (or right now).
 */
export function isUpcoming(followUp: FollowUp, now: Date = new Date()): boolean {
  if (followUp.status !== 'pending') return false
  return parseFollowUpDate(followUp).getTime() >= now.getTime()
}

export function isCompleted(followUp: FollowUp): boolean {
  return followUp.status === 'completed'
}

export function isCancelled(followUp: FollowUp): boolean {
  return followUp.status === 'cancelled'
}

export type RelativeTone = 'danger' | 'warning' | 'primary' | 'muted' | 'success'

export interface RelativeStatusInfo {
  label: string
  tone: RelativeTone
}

/**
 * Derives human-friendly relative status (e.g. "Overdue by 2 days", "Due today", "Tomorrow", "In 3 days").
 */
export function getRelativeStatus(
  followUp: FollowUp,
  now: Date = new Date(),
): RelativeStatusInfo {
  if (followUp.status === 'completed') {
    return { label: 'Completed', tone: 'success' }
  }
  if (followUp.status === 'cancelled') {
    return { label: 'Cancelled', tone: 'muted' }
  }

  const todayISO = toLocalDateISO(now)
  const scheduledDateISO = followUp.scheduledDate

  // Calculate day difference by midnight comparison
  const [sYear, sMonth, sDay] = scheduledDateISO.split('-').map(Number)
  const [tYear, tMonth, tDay] = todayISO.split('-').map(Number)
  const schedMidnight = new Date(sYear, sMonth - 1, sDay).getTime()
  const todayMidnight = new Date(tYear, tMonth - 1, tDay).getTime()
  const dayDiff = Math.round((schedMidnight - todayMidnight) / (1000 * 60 * 60 * 24))

  if (isOverdue(followUp, now)) {
    if (dayDiff === 0) {
      return { label: 'Overdue today', tone: 'danger' }
    }
    const absDays = Math.abs(dayDiff)
    return {
      label: absDays === 1 ? 'Overdue by 1 day' : `Overdue by ${absDays} days`,
      tone: 'danger',
    }
  }

  // Pending and in future or today
  if (dayDiff === 0) {
    return { label: 'Due today', tone: 'warning' }
  }
  if (dayDiff === 1) {
    return { label: 'Tomorrow', tone: 'primary' }
  }
  return { label: `In ${dayDiff} days`, tone: 'primary' }
}

/**
 * Formats a follow-up's date and optional time into a clean string, e.g. "Sep 15, 2026 at 2:30 PM".
 */
export function formatFollowUpDateDisplay(followUp: { scheduledDate: string; scheduledTime?: string }): string {
  const parts = followUp.scheduledDate.split('-').map(Number)
  const month = MONTH_NAMES[(parts[1] ?? 1) - 1] ?? ''
  const day = parts[2] ?? 1
  const year = parts[0] ?? ''

  const datePart = `${month} ${day}, ${year}`
  if (!followUp.scheduledTime) return datePart

  const timePart = formatTime12(followUp.scheduledTime)
  return timePart ? `${datePart} at ${timePart}` : datePart
}

/**
 * Filters follow-ups by tab category and case-insensitive text search.
 */
export function filterFollowUps(
  list: FollowUpWithApplication[],
  tab: FollowUpTabFilter,
  searchQuery: string,
  now: Date = new Date(),
): FollowUpWithApplication[] {
  const trimmed = searchQuery.trim().toLowerCase()

  return list.filter((item) => {
    // Tab filter
    if (tab === 'upcoming' && !isUpcoming(item, now)) return false
    if (tab === 'overdue' && !isOverdue(item, now)) return false
    if (tab === 'completed' && !isCompleted(item)) return false

    // Search filter: matches company, jobTitle, or note
    if (trimmed) {
      const company = item.application?.company?.toLowerCase() || ''
      const jobTitle = item.application?.jobTitle?.toLowerCase() || ''
      const note = item.note?.toLowerCase() || ''
      const matches =
        company.includes(trimmed) ||
        jobTitle.includes(trimmed) ||
        note.includes(trimmed)
      if (!matches) return false
    }

    return true
  })
}

/**
 * Sorts follow-ups logically:
 * 1. Overdue first (oldest scheduled date first, so most urgent is at top)
 * 2. Upcoming next (earliest scheduled date first)
 * 3. Completed / Cancelled last (most recently created / completed first)
 */
export function sortFollowUps(
  list: FollowUpWithApplication[],
  now: Date = new Date(),
): FollowUpWithApplication[] {
  return [...list].sort((a, b) => {
    const aOverdue = isOverdue(a, now)
    const bOverdue = isOverdue(b, now)

    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    const aUpcoming = isUpcoming(a, now)
    const bUpcoming = isUpcoming(b, now)

    if (aUpcoming && !bUpcoming) return -1
    if (!aUpcoming && bUpcoming) return 1

    // If both overdue or both upcoming: sort chronologically (earliest first)
    if ((aOverdue && bOverdue) || (aUpcoming && bUpcoming)) {
      return parseFollowUpDate(a).getTime() - parseFollowUpDate(b).getTime()
    }

    // For completed / cancelled: newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
