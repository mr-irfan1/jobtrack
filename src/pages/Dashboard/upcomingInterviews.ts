import type { JobApplication } from '../../types/application'

/** Matches a YYYY-MM-DD local date string, the convention used across JobTrack. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * An application whose interviewDate is present and well-formed. Filtering with
 * this type guard also narrows the array so the sort can compare interviewDate
 * as a plain string.
 */
function hasInterviewDate(
  application: JobApplication,
): application is JobApplication & { interviewDate: string } {
  return (
    typeof application.interviewDate === 'string' &&
    ISO_DATE.test(application.interviewDate)
  )
}

/**
 * The soonest upcoming interviews, nearest first, capped at `limit` (default 5).
 *
 * An application counts as an upcoming interview when it carries a valid
 * interviewDate — a YYYY-MM-DD string, as produced by the form's date input.
 * Applications with no interview date (or a malformed one) are excluded; the
 * existing Application is the only data model, so nothing is duplicated.
 *
 * Date comparison rule: `today` is the caller's local date as a YYYY-MM-DD
 * string (e.g. new Date().toLocaleDateString('en-CA')). An interview is
 * upcoming when `interviewDate >= today`, so one scheduled for today is
 * INCLUDED and only strictly earlier dates are treated as past and dropped.
 * Because YYYY-MM-DD is fixed-width and big-endian, lexicographic string
 * comparison matches chronological order — no Date parsing, and immune to the
 * time-zone/UTC off-by-one drift of toISOString().
 *
 * Pure and non-mutating: it filters and sorts copies of the input and never
 * reads storage. The sort is stable, so interviews sharing a date keep their
 * original relative order.
 */
export function getUpcomingInterviews(
  applications: JobApplication[],
  today: string,
  limit = 5,
): JobApplication[] {
  return applications
    .filter(hasInterviewDate)
    .filter((application) => application.interviewDate >= today)
    .sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))
    .slice(0, limit)
}
