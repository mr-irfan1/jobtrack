export type ResumeAtsVerdict =
  | 'excellent'
  | 'strong'
  | 'needs_improvement'
  | 'weak'

export interface ResumeSectionCheck {
  name: string
  detected: boolean
  importance: 'critical' | 'recommended' | 'optional'
}

export interface ContactSignalCheck {
  type: 'email' | 'phone' | 'linkedin' | 'github' | 'portfolio' | 'location'
  label: string
  detected: boolean
}

export interface ResumeAnalysis {
  resumeId: string
  resumeName: string
  fileName: string
  fileType: string
  /** Bounded 0–100 ATS Readiness Score */
  atsScore: number
  /** Bounded 0–100 Resume Quality & Content Score */
  qualityScore: number
  /** Verbal category verdict */
  verdict: ResumeAtsVerdict
  /** List of detected standard section names */
  detectedSections: string[]
  /** List of missing or weak section names */
  missingSections: string[]
  /** Detailed section checklist */
  sections: ResumeSectionCheck[]
  /** Detected contact and profile signals */
  contactSignals: ContactSignalCheck[]
  /** Key strengths observed in resume */
  strengths: string[]
  /** Potential weaknesses, gaps, or ATS risks */
  weaknesses: string[]
  /** Keywords identified in the document */
  keywordSignals: {
    technical: string[]
    professional: string[]
  }
  /** Actionable improvements */
  recommendations: string[]
  /** Executive summary paragraph */
  summary: string
  /** ISO timestamp of analysis */
  analyzedAt: string
  /** Confidence rating */
  confidence: 'high' | 'medium' | 'low'
  /** Flag if local rule-based fallback was used */
  isLocalFallback?: boolean
}

export type ResumeAnalysisErrorCode =
  | 'NO_FILE_DATA'
  | 'EXTRACTION_FAILED'
  | 'AI_UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'UNKNOWN'

export interface ResumeAnalysisResult {
  success: boolean
  analysis?: ResumeAnalysis
  errorCode?: ResumeAnalysisErrorCode
  message?: string
  fromCache?: boolean
}
