export type WorkplaceType = 'Remote' | 'Hybrid' | 'On-site'

export type EmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Internship'
  | 'Other'

export type JobSortOption = 'newest' | 'company' | 'relevant'

export interface JobListing {
  id: string
  title: string
  company: string
  companyLogo?: string | null
  location: string
  workplaceType: WorkplaceType
  employmentType: EmploymentType
  category?: string | null
  salary?: string | null
  description: string
  skills: string[]
  postedDate: string // ISO date or formatted date
  source: string
  applyUrl: string
  sourceJobId?: string
  canonicalUrl?: string
  sourceMetadata?: Record<string, unknown>
  rawSourceId?: string | null
  isActive?: boolean
  expiresAt?: string | null
}

export interface JobFeedFilterState {
  search: string
  location: string
  workplace: string
  employmentType: string
  category: string
  sortBy: JobSortOption
}

export const INITIAL_JOB_FEED_FILTERS: JobFeedFilterState = {
  search: '',
  location: 'all',
  workplace: 'all',
  employmentType: 'all',
  category: 'all',
  sortBy: 'relevant',
}
