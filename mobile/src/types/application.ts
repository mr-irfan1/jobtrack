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
  interviewDate?: string
  interviewTime?: string
  interviewType?: string
  meetingLink?: string
}

export type ApplicationDraft = Omit<JobApplication, 'id'>

export const APPLICATION_STATUSES = [
  'Wishlist',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
] as const satisfies readonly ApplicationStatus[]
