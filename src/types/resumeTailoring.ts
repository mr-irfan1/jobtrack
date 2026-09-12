// JobTrack — Resume Tailoring & Optimization Types
// ==================================================
// Strongly-typed contracts for Step 10: AI Job-Specific Resume Tailoring

export type TailoringPriority = 'high' | 'medium' | 'low'

export interface TailoringRequirement {
  requirement: string
  evidence?: string
  importance: TailoringPriority
  action?: string
}

export interface ResumeRecommendation {
  section: string
  currentSignal: string
  recommendation: string
  rationale: string
  priority: TailoringPriority
}

export interface SectionRecommendation {
  section: string
  heading: string
  advice: string
  suggestedDirection?: string
  priority: TailoringPriority
}

export interface SuggestedEdit {
  section: string
  originalConcept: string
  suggestedDirection: string
  factualSafeguardNote: string
}

export interface KeywordSuggestions {
  technical: string[]
  professional: string[]
  domainSpecific: string[]
}

export interface ResumeTailoringAnalysis {
  matchScore: number // 0-100 alignment score
  summary: string

  matchedRequirements: TailoringRequirement[]
  missingRequirements: TailoringRequirement[]
  underEmphasizedRequirements: TailoringRequirement[]

  recommendedChanges: ResumeRecommendation[]
  sectionRecommendations: SectionRecommendation[]
  suggestedEdits?: SuggestedEdit[]

  keywordSuggestions: KeywordSuggestions

  risks: string[]
  unchangedAreas: string[]

  analyzedAt: string
  confidence: 'high' | 'medium' | 'low'
  isLocalFallback: boolean

  sourceContext: {
    jobTitle: string
    company: string
    resumeName: string
    resumeId: string
    resumeUpdatedAt: string
  }
}

export interface ResumeTailoringRequest {
  job: {
    id: string
    title: string
    company: string
    location?: string
    employmentType?: string
    workplaceType?: string
    skills?: string[]
    description?: string
  }
  resume: {
    id: string
    name: string
    fileName: string
    fileType: string
    fileData?: string
    updatedAt: string
  }
  candidate?: {
    fullName?: string
    headline?: string
    skills?: string[]
    achievements?: string[]
  }
}

export interface ResumeTailoringResult {
  success: boolean
  analysis?: ResumeTailoringAnalysis
  fromCache?: boolean
  errorCode?: string
  message?: string
}
