// JobTrack — Cover Letter Types
// ===============================
// Strongly-typed contracts for grounded AI Cover Letter generation

export interface CoverLetterDraft {
  id: string
  jobId?: string
  applicationId?: string
  jobTitle: string
  company: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface CoverLetterRequest {
  job: {
    id?: string
    title: string
    company: string
    location?: string
    employmentType?: string
    workplaceType?: string
    skills?: string[]
    description?: string
  }
  candidate: {
    fullName?: string
    headline?: string
    skills?: string[]
    achievements?: string[]
    resumeName?: string
    resumeText?: string
  }
  applicationId?: string
}

export interface CoverLetterResult {
  success: boolean
  draft?: CoverLetterDraft
  errorCode?: string
  message?: string
  fromCache?: boolean
}
