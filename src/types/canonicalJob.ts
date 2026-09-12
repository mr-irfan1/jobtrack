import type { EmploymentType, JobListing, WorkplaceType } from './jobFeed.ts'

export type JobStatus = 'active' | 'expired' | 'archived' | 'delisted'

export interface CanonicalSalary {
  raw: string | null
  min: number | null
  max: number | null
  currency: string
  period?: 'yearly' | 'monthly' | 'hourly' | null
}

/**
 * Provider-independent Canonical Job model representing the centralized jobs catalog.
 * Mirrors public.jobs in PostgreSQL while remaining 100% convertible to JobListing.
 */
export interface CanonicalJob {
  /** Internal unique identifier (UUID or deterministic ID) */
  id: string

  /** Provider identifier, e.g. 'remotive', 'greenhouse', 'adzuna' */
  source: string
  /** Provider's primary external ID, e.g. "1001" */
  sourceJobId: string
  /** Raw source ID if distinct from sourceJobId */
  rawSourceId?: string | null
  /** Human-readable source name, e.g. "Remotive", "Company ATS" */
  sourceName: string
  /** Link back to the provider job posting or attribution page */
  sourceUrl?: string | null

  /** Primary job title */
  title: string
  /** Company name */
  company: string
  /** Company logo URL */
  companyLogo: string | null
  /** Clean, sanitized job description (plaintext/markdown, no raw script/style tags) */
  description: string
  /** Location string */
  location: string
  /** Normalized workplace classification */
  workplaceType: WorkplaceType
  /** Normalized employment classification */
  employmentType: EmploymentType
  /** Job category / department */
  category: string | null
  /** Extracted or provider-tagged skills */
  skills: string[]

  /** Structured compensation */
  salary: CanonicalSalary

  /** Direct apply URL */
  applyUrl: string
  /** Canonical URL without UTM and tracking parameters, for deduplication */
  canonicalUrl: string

  /** Lowercased, trimmed strings for high-performance normalized search & deduplication */
  normalizedTitle: string
  normalizedCompany: string
  normalizedLocation: string

  /** Provider-specific extra attributes (e.g. department, requisitionId) */
  sourceMetadata: Record<string, unknown>

  /** Lifecycle flags & ISO 8601 timestamps */
  isActive: boolean
  postedAt: string
  discoveredAt: string
  lastSeenAt: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Converts a CanonicalJob to the classic frontend JobListing representation.
 * Preserves 100% backward compatibility across JobFeed, SavedJobs, Alerts, Copilot, etc.
 */
export function canonicalJobToJobListing(job: CanonicalJob): JobListing {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    companyLogo: job.companyLogo,
    location: job.location,
    workplaceType: job.workplaceType,
    employmentType: job.employmentType,
    category: job.category,
    salary: job.salary.raw,
    description: job.description,
    skills: job.skills,
    postedDate: job.postedAt,
    source: job.sourceName || job.source,
    applyUrl: job.applyUrl,
  }
}
