import type { JobApplication } from '../../types/application'

/** Short month labels for the activity axis, indexed 0 (Jan) – 11 (Dec). */
const MONTH_LABELS = [
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
] as const

export interface MonthlyActivity {
  /** Bucket key in YYYY-MM form (e.g. "2026-08"). */
  month: string
  /** Short month label for the chart axis (e.g. "Aug"). */
  label: string
  /** Number of applications whose applicationDate falls in this month. */
  count: number
}

/**
 * Applications submitted per month over the most recent `months` calendar
 * months, oldest first (left → right for a bar chart). This is a *real*
 * derivation from the existing applicationDate field — never fabricated data:
 * an empty or out-of-window month simply reports a count of 0.
 *
 * `today` is the caller's local date as a YYYY-MM-DD string (e.g.
 * new Date().toLocaleDateString('en-CA')), matching the convention used by the
 * other dashboard helpers. The window ends at today's month (inclusive) and
 * spans `months` months back. Month math is done on the absolute month index
 * (year*12 + month) using plain integers, so it is pure, deterministic and free
 * of Date/time-zone parsing — and it correctly crosses year boundaries.
 *
 * Buckets applications by the YYYY-MM prefix of applicationDate; a value outside
 * the window (or malformed) matches no bucket and is omitted rather than
 * throwing. Non-mutating: it reads the input but never sorts or edits it.
 */
export function getMonthlyActivity(
  applications: JobApplication[],
  today: string,
  months = 6,
): MonthlyActivity[] {
  if (months <= 0) return []

  // Absolute month index of "today" (0-based month within the year).
  const base = Number(today.slice(0, 4)) * 12 + (Number(today.slice(5, 7)) - 1)

  // Count applications by their YYYY-MM prefix once, then read per bucket.
  const counts = new Map<string, number>()
  for (const application of applications) {
    const key = application.applicationDate.slice(0, 7)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const result: MonthlyActivity[] = []
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const absolute = base - offset
    const year = Math.floor(absolute / 12)
    const monthIndex = absolute % 12
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    result.push({
      month: key,
      label: MONTH_LABELS[monthIndex],
      count: counts.get(key) ?? 0,
    })
  }
  return result
}
