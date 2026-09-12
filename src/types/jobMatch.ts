import type { JobListing } from './jobFeed'

export type JobMatchVerdict =
  | 'excellent_match'
  | 'strong_match'
  | 'moderate_match'
  | 'partial_match'
  | 'weak_match'

export interface JobMatchAnalysis {
  /** Numerical score bounded 0–100 */
  score: number
  /** Verbal match category */
  verdict: JobMatchVerdict
  /** Skills present in both job requirements and user profile/resume */
  matchedSkills: string[]
  /** Skills required or preferred by the job that are missing from candidate profile */
  missingSkills: string[]
  /** Key identified skills extracted from job */
  requiredSkills: string[]
  /** Specific strong points of candidate's profile relative to the job */
  strengths: string[]
  /** Potential gaps or development areas */
  gaps: string[]
  /** Actionable advice for the candidate */
  recommendation: string
  /** Confidence rating in the evaluation */
  confidence: 'high' | 'medium' | 'low'
  /** Transparency metadata detailing what data was evaluated */
  analyzedSources: {
    hasJobDescription: boolean
    skillsCount: number
    resumeName?: string
    usedProfileSkills: boolean
  }
  /** ISO timestamp of analysis */
  timestamp: string
}

export interface CandidateProfileContext {
  fullName?: string
  headline?: string
  bio?: string
  skills: string[]
  achievements?: string[]
  resumeId?: string
  resumeName?: string
}

export interface JobMatchRequest {
  job: JobListing
  candidate: CandidateProfileContext
}

export type JobMatchErrorCode =
  | 'NO_JOB_DESCRIPTION'
  | 'NO_PROFILE_SKILLS'
  | 'AI_UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'PARSER_ERROR'
  | 'UNKNOWN'

export interface JobMatchResult {
  success: boolean
  analysis?: JobMatchAnalysis
  errorCode?: JobMatchErrorCode
  message?: string
  fromCache?: boolean
}
