export type QuestionCategory =
  | 'technical'
  | 'behavioral'
  | 'project'
  | 'situational'
  | 'role_specific'

export type InterviewDifficulty = 'easy' | 'moderate' | 'challenging'

export interface SuggestedStarStructure {
  situation: string
  task: string
  action: string
  result: string
}

export interface InterviewQuestion {
  id: string
  category: QuestionCategory
  question: string
  whyItMayBeAsked: string
  answerGuidance: string
  suggestedStarStructure?: SuggestedStarStructure
}

export interface InterviewChecklistItem {
  id: string
  label: string
  category?: string
  completed: boolean
}

export interface InterviewPrep {
  id: string
  applicationId?: string
  company: string
  jobTitle: string
  interviewType?: string
  interviewDate?: string
  summary: string
  difficulty: InterviewDifficulty
  technicalTopics: string[]
  behavioralTopics: string[]
  roleFocusAreas: string[]
  questions: InterviewQuestion[]
  checklist: InterviewChecklistItem[]
  weakAreasToAddress: string[]
  generalTips: string[]
  generatedAt: string
  isLocalFallback?: boolean
}

export interface InterviewCandidateContext {
  fullName?: string
  headline?: string
  bio?: string
  skills: string[]
  achievements?: string[]
  resumeId?: string
  resumeName?: string
}

export interface InterviewPrepRequest {
  applicationId?: string
  jobTitle: string
  company: string
  location?: string
  jobDescription?: string
  skills?: string[]
  interviewType?: string
  interviewDate?: string
  interviewTime?: string
  candidate: InterviewCandidateContext
}

export type InterviewPrepErrorCode =
  | 'MISSING_INTERVIEW_CONTEXT'
  | 'AI_UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'MALFORMED_OUTPUT'
  | 'UNKNOWN'

export interface InterviewPrepResult {
  success: boolean
  prep?: InterviewPrep
  errorCode?: InterviewPrepErrorCode
  message?: string
  fromCache?: boolean
}

export interface MockAnswerEvaluationRequest {
  question: string
  category: QuestionCategory
  userAnswer: string
  jobTitle: string
  company: string
}

export interface MockAnswerEvaluation {
  clarity: string
  relevance: string
  structureFeedback: string
  strengths: string[]
  improvementSuggestion: string
}

export interface MockAnswerEvaluationResult {
  success: boolean
  evaluation?: MockAnswerEvaluation
  message?: string
}
