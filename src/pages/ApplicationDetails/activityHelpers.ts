import type { JobApplication } from '../../types/application'

export interface TimelineEvent {
  id: string
  title: string
  dateISO: string
  formattedDate: string
  description: string
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Formats YYYY-MM-DD to "Aug 20, 2026" */
function formatDate(dateISO?: string): string {
  if (!dateISO) return ''
  const parts = dateISO.split('-')
  if (parts.length !== 3) return dateISO
  const year = parts[0]
  const month = parseInt(parts[1] || '1', 10) - 1
  const day = parseInt(parts[2] || '1', 10)
  return `${MONTHS[month] ?? ''} ${day}, ${year}`
}

/** Formats 24h HH:mm to 12h AM/PM */
function formatTime12(timeStr?: string): string {
  if (!timeStr) return ''
  const [hh = '0', mm = '00'] = timeStr.split(':')
  const hours = Number(hh)
  const period = hours < 12 ? 'AM' : 'PM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${mm} ${period}`
}

/**
 * Derive chronological timeline events from an application's existing data fields.
 */
export function deriveTimelineEvents(app: JobApplication): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // 1. Application created event
  if (app.applicationDate) {
    events.push({
      id: `${app.id}-created`,
      title: 'Application created',
      dateISO: app.applicationDate,
      formattedDate: formatDate(app.applicationDate),
      description: `Application for ${app.jobTitle} at ${app.company} recorded in JobTrack.`,
    })
  }

  // 2. Status stage event
  if (app.status && app.status !== 'Wishlist' && app.applicationDate) {
    events.push({
      id: `${app.id}-status-${app.status}`,
      title: `Status changed to ${app.status}`,
      dateISO: app.applicationDate,
      formattedDate: formatDate(app.applicationDate),
      description: `Application stage marked as ${app.status}.`,
    })
  }

  // 3. Interview event
  if (app.interviewDate) {
    const timeStr = app.interviewTime ? ` at ${formatTime12(app.interviewTime)}` : ''
    const typeStr = app.interviewType ? ` (${app.interviewType})` : ''
    events.push({
      id: `${app.id}-interview`,
      title: 'Interview scheduled',
      dateISO: app.interviewDate,
      formattedDate: formatDate(app.interviewDate),
      description: `Interview with ${app.company}${typeStr} scheduled for ${formatDate(app.interviewDate)}${timeStr}.`,
    })
  }

  // Sort events chronologically (newest first for timeline presentation)
  return events.sort((a, b) => b.dateISO.localeCompare(a.dateISO))
}
