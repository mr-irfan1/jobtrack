import type { JobApplication } from '../../types/application'

/**
 * Notification domain for JobTrack.
 *
 * Pure, framework-free derivation of interview notifications from the existing
 * JobApplication model — no new data source, no Supabase table, no fabricated
 * data. Notifications are derived strictly from the applications passed in (which
 * the caller has already scoped to the signed-in user via the data layer), so
 * this module can never surface another user's data. It is deliberately UI- and
 * storage-agnostic so every rule below is unit-testable in isolation.
 *
 * Dates follow the app-wide convention: interviewDate is a local YYYY-MM-DD
 * string and comparisons are lexicographic (fixed-width big-endian == chronological),
 * matching getUpcomingInterviews and avoiding any timezone/UTC drift.
 */

export type NotificationCategory =
  | 'TODAY_INTERVIEW'
  | 'UPCOMING_INTERVIEW'
  | 'PAST_INTERVIEW'
  | 'APPLICATION_ADDED'
  | 'STATUS_CHANGED'
  | 'SYSTEM'

export type NotificationType = 'application' | 'interview' | 'system'

export interface InterviewNotification {
  /** Stable, deterministic id: applicationId + interviewDate + interviewTime. */
  id: string
  applicationId?: string
  type?: NotificationType
  category: NotificationCategory
  /** Primary line, e.g. "Interview scheduled with Google". */
  title: string
  /** Company, retained for the Join action's accessible label. */
  company?: string
  jobTitle?: string
  description?: string
  /** Secondary line, e.g. "Software Engineer • Aug 30 • 10:00 AM • Video". */
  meta: string
  /** Present only when a safe, joinable http(s) meeting link exists. */
  meetingLink?: string
  read: boolean
}

export type JobTrackNotification = InterviewNotification

export interface NotificationContext {
  /** Local today as YYYY-MM-DD (en-CA), matching the app's date convention. */
  todayISO: string
  /** Local tomorrow as YYYY-MM-DD, for the "Tomorrow" relative label. */
  tomorrowISO: string
  /** Current local year, so same-year dates can omit the year. */
  currentYear: number
  /** Ids the user has already marked read (from the read-state store). */
  readIds: ReadonlySet<string>
}

/** Matches a YYYY-MM-DD local date string. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
/** Matches a 24-hour HH:mm time string. */
const ISO_TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/** Primary-line verb per category; company is appended, e.g. "… with Google". */
const TITLE_VERBS: Record<string, string> = {
  TODAY_INTERVIEW: 'Interview today with',
  UPCOMING_INTERVIEW: 'Interview scheduled with',
  PAST_INTERVIEW: 'Past interview with',
}

/** Category ordering: today first, then upcoming, then past. */
const CATEGORY_ORDER: Record<string, number> = {
  TODAY_INTERVIEW: 0,
  UPCOMING_INTERVIEW: 1,
  PAST_INTERVIEW: 2,
}

type WithInterviewDate = JobApplication & { interviewDate: string }

function hasInterviewDate(
  application: JobApplication,
): application is WithInterviewDate {
  return (
    typeof application.interviewDate === 'string' &&
    ISO_DATE.test(application.interviewDate)
  )
}

/**
 * A meeting link is actionable only when it is an absolute http(s) URL — keeps
 * the "Join interview" action from rendering for a blank field or an unsafe
 * value (e.g. a javascript: URL). Mirrors the guard in UpcomingInterviews.
 */
export function isJoinableMeetingLink(link: string | undefined): link is string {
  return (
    typeof link === 'string' &&
    (link.startsWith('https://') || link.startsWith('http://'))
  )
}

/** Stable id so a notification's read-state survives re-renders and reloads. */
export function notificationId(application: JobApplication): string {
  return `${application.id}::${application.interviewDate ?? ''}::${application.interviewTime ?? ''}`
}

/** Classify an interview date relative to today (date-only, no timezone math). */
export function categorize(
  interviewDate: string,
  todayISO: string,
): NotificationCategory {
  if (interviewDate === todayISO) return 'TODAY_INTERVIEW'
  return interviewDate > todayISO ? 'UPCOMING_INTERVIEW' : 'PAST_INTERVIEW'
}

/** Format a 24-hour HH:mm string as 12-hour "h:mm AM/PM"; '' when absent/invalid. */
export function formatTime12(time: string | undefined): string {
  if (typeof time !== 'string' || !ISO_TIME.test(time)) return ''
  const [hh = '0', mm = '00'] = time.split(':')
  const hours = Number(hh)
  const period = hours < 12 ? 'AM' : 'PM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${mm} ${period}`
}

/** Relative day label: "Today" / "Tomorrow" / "Aug 30" / "Aug 30, 2027". */
export function formatRelativeDay(
  dateISO: string,
  context: NotificationContext,
): string {
  if (dateISO === context.todayISO) return 'Today'
  if (dateISO === context.tomorrowISO) return 'Tomorrow'
  const [year = '', month = '', day = ''] = dateISO.split('-')
  const monthLabel = MONTHS[Number(month) - 1] ?? ''
  const dayNumber = Number(day)
  const yearNumber = Number(year)
  return yearNumber === context.currentYear
    ? `${monthLabel} ${dayNumber}`
    : `${monthLabel} ${dayNumber}, ${yearNumber}`
}

/** "Software Engineer • Today • 3:00 PM • Video" — omits any part that is absent. */
function formatMeta(
  application: WithInterviewDate,
  context: NotificationContext,
): string {
  const day = formatRelativeDay(application.interviewDate, context)
  const time = formatTime12(application.interviewTime)
  const type = application.interviewType?.trim()
  return [application.jobTitle, day, time, type].filter(Boolean).join(' • ')
}

/** Chronological sort key; interviews with no time sort to the start of the day. */
function sortKey(application: WithInterviewDate): string {
  const time =
    application.interviewTime && ISO_TIME.test(application.interviewTime)
      ? application.interviewTime
      : '00:00'
  return `${application.interviewDate}T${time}`
}

/**
 * Build the sorted notification list from applications.
 */
export function buildNotifications(
  applications: JobApplication[],
  context: NotificationContext,
): InterviewNotification[] {
  const withDate = applications.filter(hasInterviewDate)
  const sorted = [...withDate].sort((a, b) => {
    const categoryA = categorize(a.interviewDate, context.todayISO)
    const categoryB = categorize(b.interviewDate, context.todayISO)
    if (categoryA !== categoryB) {
      return (CATEGORY_ORDER[categoryA] ?? 0) - (CATEGORY_ORDER[categoryB] ?? 0)
    }
    const keyA = sortKey(a)
    const keyB = sortKey(b)
    return categoryA === 'PAST_INTERVIEW'
      ? keyB.localeCompare(keyA)
      : keyA.localeCompare(keyB)
  })
  return sorted.map((application) => {
    const category = categorize(application.interviewDate, context.todayISO)
    const id = notificationId(application)
    return {
      id,
      applicationId: application.id,
      type: 'interview' as const,
      category,
      title: `${TITLE_VERBS[category]} ${application.company}`,
      company: application.company,
      jobTitle: application.jobTitle,
      description: `Your interview with ${application.company} for ${application.jobTitle} is scheduled for ${formatRelativeDay(application.interviewDate, context)}${application.interviewTime ? ` at ${formatTime12(application.interviewTime)}` : ''}.`,
      meta: formatMeta(application, context),
      meetingLink: isJoinableMeetingLink(application.meetingLink)
        ? application.meetingLink
        : undefined,
      read: context.readIds.has(id),
    }
  })
}

/**
 * Build comprehensive notification list including applications, interviews, and system notifications.
 */
export function buildComprehensiveNotifications(
  applications: JobApplication[],
  context: NotificationContext,
): JobTrackNotification[] {
  const list: JobTrackNotification[] = []

  // 1. System Welcome Notification
  const welcomeId = 'sys::welcome'
  list.push({
    id: welcomeId,
    type: 'system',
    category: 'SYSTEM',
    title: 'Welcome to JobTrack',
    description: 'Your JobTrack account is ready. Start tracking your applications.',
    meta: 'System • Welcome',
    read: context.readIds.has(welcomeId),
  })

  // 2. Application Notifications
  for (const app of applications) {
    const addedId = `${app.id}::added`
    list.push({
      id: addedId,
      type: 'application',
      applicationId: app.id,
      category: 'APPLICATION_ADDED',
      title: 'Application submitted',
      company: app.company,
      jobTitle: app.jobTitle,
      description: `Your application for ${app.jobTitle} at ${app.company} was successfully added.`,
      meta: `${app.company} • ${app.jobTitle}`,
      read: context.readIds.has(addedId),
    })

    if (app.status && app.status !== 'Wishlist') {
      const statusId = `${app.id}::status::${app.status}`
      list.push({
        id: statusId,
        type: 'application',
        applicationId: app.id,
        category: 'STATUS_CHANGED',
        title: 'Application status updated',
        company: app.company,
        jobTitle: app.jobTitle,
        description: `Your application at ${app.company} moved to ${app.status}.`,
        meta: `${app.company} • Status: ${app.status}`,
        read: context.readIds.has(statusId),
      })
    }
  }

  // 3. Interview Notifications
  const interviewNotifications = buildNotifications(applications, context)
  list.push(...interviewNotifications)

  return list
}

/** Number of unread notifications in a built list. */
export function countUnread(notifications: InterviewNotification[]): number {
  return notifications.reduce((total, n) => (n.read ? total : total + 1), 0)
}

/**
 * Badge text: exact count up to 99, "99+" beyond, and '' (hidden) at zero.
 */
export function formatBadgeCount(count: number): string {
  if (count <= 0) return ''
  return count > 99 ? '99+' : String(count)
}

/** Read-set with one more id marked read (pure; returns a new Set). */
export function readIdsWith(
  current: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(current)
  next.add(id)
  return next
}

/** Read-set with one id marked unread (pure; returns a new Set). */
export function readIdsWithout(
  current: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(current)
  next.delete(id)
  return next
}

/** Read-set with every currently-shown notification marked read (pure). */
export function readIdsWithAll(
  current: ReadonlySet<string>,
  notifications: InterviewNotification[],
): Set<string> {
  const next = new Set(current)
  for (const n of notifications) next.add(n.id)
  return next
}

