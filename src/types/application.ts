export type ApplicationStatus =
  | 'Wishlist'
  | 'Applied'
  | 'Interview'
  | 'Offer'
  | 'Rejected'

export interface JobApplication {
  id: string
  company: string
  jobTitle: string
  location: string
  jobUrl: string
  applicationDate: string
  status: ApplicationStatus
  notes: string
  /**
   * Optional details of this application's scheduled interview (one per
   * application). All optional, so applications created before this feature
   * remain valid with no migration and simply carry no interview data. Company,
   * job title and status are NOT duplicated here — the application itself stays
   * the source of truth for those; only interview-specific data lives on these
   * fields.
   *
   * - interviewDate: local YYYY-MM-DD (same convention as applicationDate)
   * - interviewTime: local 24-hour HH:mm (from an <input type="time">)
   * - interviewType: free-text round/type label, e.g. "Technical Interview"
   * - meetingLink: URL to join the interview, when one is available
   */
  interviewDate?: string
  interviewTime?: string
  interviewType?: string
  meetingLink?: string
}

/**
 * A job application before it has been persisted: every field except the id,
 * which is minted by the data layer (see applicationFactory.buildApplication).
 */
export type ApplicationDraft = Omit<JobApplication, 'id'>

/**
 * Runtime list of statuses for iteration (e.g. a <select>). The `satisfies`
 * clause keeps it in lock-step with the ApplicationStatus union: adding a
 * status to the union without listing it here is a compile error.
 */
export const APPLICATION_STATUSES = [
  'Wishlist',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
] as const satisfies readonly ApplicationStatus[]
