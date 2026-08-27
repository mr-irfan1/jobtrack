import type { JobApplication } from '../../types/application'

/**
 * The most recently applied-to applications, newest first, capped at `limit`.
 *
 * Recency uses the existing applicationDate field — a YYYY-MM-DD string, as
 * produced by the date input and the form. Those strings compare
 * lexicographically in chronological order, so a plain string comparison orders
 * them correctly without parsing dates or dealing with time zones. Pure and
 * non-mutating: it sorts a copy of the input and never reads storage. The sort
 * is stable, so applications sharing a date keep their original relative order.
 */
export function getRecentApplications(
  applications: JobApplication[],
  limit: number,
): JobApplication[] {
  return [...applications]
    .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate))
    .slice(0, limit)
}
