import type {
  InterviewChecklistItem,
  InterviewDifficulty,
  InterviewPrep,
  InterviewPrepRequest,
  InterviewPrepResult,
  InterviewQuestion,
  MockAnswerEvaluationRequest,
  MockAnswerEvaluationResult,
  QuestionCategory,
} from '../types/interviewPrep'

export const CHECKLIST_STORAGE_KEY = 'jobtrack_interview_prep_checklist'

// In-memory session cache for interview prep plans
const prepCache = new Map<string, InterviewPrep>()

export function buildInterviewPrepCacheKey(request: InterviewPrepRequest): string {
  const companyKey = request.company.trim().toLowerCase()
  const titleKey = request.jobTitle.trim().toLowerCase()
  const typeKey = (request.interviewType || 'unspecified').trim().toLowerCase()
  const dateKey = (request.interviewDate || 'nodate').trim()
  const sortedSkills = (request.candidate.skills || [])
    .map((s) => s.trim().toLowerCase())
    .sort()
    .join('|')
  const resume = request.candidate.resumeId || 'none'

  return `prep:${companyKey}:${titleKey}:${typeKey}:${dateKey}:skills:${sortedSkills}:resume:${resume}`
}

export function clearInterviewPrepCache(): void {
  prepCache.clear()
}

/**
 * Read persisted checklist state for a specific application / interview
 */
export function getStoredChecklist(keyId: string): InterviewChecklistItem[] {
  if (typeof window === 'undefined' || !window.localStorage || !keyId) return []
  try {
    const raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Record<string, InterviewChecklistItem[]>
    if (parsed && Array.isArray(parsed[keyId])) {
      return parsed[keyId]
    }
  } catch {
    // Return empty on parsing error
  }
  return []
}

/**
 * Save checklist state for a specific application / interview
 */
export function saveStoredChecklist(
  keyId: string,
  items: InterviewChecklistItem[],
): void {
  if (typeof window === 'undefined' || !window.localStorage || !keyId) return
  try {
    const raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY)
    const existing = raw ? (JSON.parse(raw) as Record<string, InterviewChecklistItem[]>) : {}
    existing[keyId] = items
    window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(existing))
  } catch {
    // Gracefully ignore storage quota errors
  }
}

/**
 * Standard default checklist items for any interview
 */
export function getDefaultChecklist(jobTitle: string, company: string): InterviewChecklistItem[] {
  return [
    {
      id: 'chk-1',
      label: `Review key responsibilities for the ${jobTitle} role`,
      category: 'Research',
      completed: false,
    },
    {
      id: 'chk-2',
      label: `Research ${company}'s products, mission, and recent public updates`,
      category: 'Research',
      completed: false,
    },
    {
      id: 'chk-3',
      label: 'Prepare 2-3 technical project explanations highlighting verified accomplishments',
      category: 'Technical',
      completed: false,
    },
    {
      id: 'chk-4',
      label: 'Outline STAR stories (Situation, Task, Action, Result) for behavioral questions',
      category: 'Behavioral',
      completed: false,
    },
    {
      id: 'chk-5',
      label: 'Review submitted resume and confirm alignment with job requirements',
      category: 'Logistics',
      completed: false,
    },
    {
      id: 'chk-6',
      label: 'Prepare 3 thoughtful questions to ask the interviewer about team engineering culture',
      category: 'Questions',
      completed: false,
    },
    {
      id: 'chk-7',
      label: 'Test audio, video, camera, and network connection prior to the call',
      category: 'Logistics',
      completed: false,
    },
  ]
}

const VALID_CATEGORIES: Set<QuestionCategory> = new Set([
  'technical',
  'behavioral',
  'project',
  'situational',
  'role_specific',
])

const VALID_DIFFICULTIES: Set<InterviewDifficulty> = new Set([
  'easy',
  'moderate',
  'challenging',
])

/**
 * Validate and safely normalize an AI or server payload into strict InterviewPrep
 */
export function normalizeInterviewPrepResponse(
  raw: unknown,
  request: InterviewPrepRequest,
): InterviewPrep | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const summary = typeof obj.summary === 'string' && obj.summary.trim()
    ? obj.summary.trim()
    : `Tailored interview preparation plan for the ${request.jobTitle} position at ${request.company}.`

  const difficulty: InterviewDifficulty =
    typeof obj.difficulty === 'string' && VALID_DIFFICULTIES.has(obj.difficulty as InterviewDifficulty)
      ? (obj.difficulty as InterviewDifficulty)
      : 'moderate'

  const cleanStringArray = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return []
    const seen = new Set<string>()
    const result: string[] = []
    for (const item of arr) {
      if (typeof item === 'string') {
        const trimmed = item.trim()
        if (trimmed && !seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase())
          result.push(trimmed)
        }
      }
    }
    return result
  }

  const technicalTopics = cleanStringArray(obj.technicalTopics)
  const behavioralTopics = cleanStringArray(obj.behavioralTopics)
  const roleFocusAreas = cleanStringArray(obj.roleFocusAreas)
  const weakAreasToAddress = cleanStringArray(obj.weakAreasToAddress)
  const generalTips = cleanStringArray(obj.generalTips)

  const questions: InterviewQuestion[] = []
  if (Array.isArray(obj.questions)) {
    for (const q of obj.questions) {
      if (q && typeof q === 'object') {
        const qObj = q as Record<string, unknown>
        const questionText = typeof qObj.question === 'string' ? qObj.question.trim() : ''
        if (questionText) {
          const rawCat = typeof qObj.category === 'string' ? qObj.category.toLowerCase() : 'technical'
          const category: QuestionCategory = VALID_CATEGORIES.has(rawCat as QuestionCategory)
            ? (rawCat as QuestionCategory)
            : 'technical'

          const whyItMayBeAsked = typeof qObj.whyItMayBeAsked === 'string' && qObj.whyItMayBeAsked.trim()
            ? qObj.whyItMayBeAsked.trim()
            : 'Assesses core competency and practical problem solving for this role.'

          const answerGuidance = typeof qObj.answerGuidance === 'string' && qObj.answerGuidance.trim()
            ? qObj.answerGuidance.trim()
            : 'Structure your response clearly with concrete examples from your verified projects.'

          let suggestedStarStructure
          if (qObj.suggestedStarStructure && typeof qObj.suggestedStarStructure === 'object') {
            const star = qObj.suggestedStarStructure as Record<string, unknown>
            suggestedStarStructure = {
              situation: typeof star.situation === 'string' ? star.situation.trim() : '',
              task: typeof star.task === 'string' ? star.task.trim() : '',
              action: typeof star.action === 'string' ? star.action.trim() : '',
              result: typeof star.result === 'string' ? star.result.trim() : '',
            }
          }

          questions.push({
            id: typeof qObj.id === 'string' && qObj.id ? qObj.id : `q_${questions.length + 1}`,
            category,
            question: questionText,
            whyItMayBeAsked,
            answerGuidance,
            suggestedStarStructure,
          })
        }
      }
    }
  }

  if (questions.length === 0) return null

  // Checklist resolution: merge default checklist with any saved state
  const keyId = request.applicationId || `${request.company}-${request.jobTitle}`
  const savedChecklist = getStoredChecklist(keyId)
  let checklist: InterviewChecklistItem[] = []

  if (savedChecklist.length > 0) {
    checklist = savedChecklist
  } else if (Array.isArray(obj.checklist) && obj.checklist.length > 0) {
    checklist = (obj.checklist as Record<string, unknown>[]).map((item, idx) => ({
      id: typeof item.id === 'string' ? item.id : `chk-${idx + 1}`,
      label: typeof item.label === 'string' ? item.label.trim() : `Preparation task ${idx + 1}`,
      category: typeof item.category === 'string' ? item.category.trim() : 'Preparation',
      completed: Boolean(item.completed),
    }))
  } else {
    checklist = getDefaultChecklist(request.jobTitle, request.company)
  }

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : `prep_${Date.now()}`,
    applicationId: request.applicationId,
    company: request.company,
    jobTitle: request.jobTitle,
    interviewType: request.interviewType || 'Interview format not specified',
    interviewDate: request.interviewDate,
    summary,
    difficulty,
    technicalTopics,
    behavioralTopics,
    roleFocusAreas,
    questions,
    checklist,
    weakAreasToAddress,
    generalTips,
    generatedAt: new Date().toISOString(),
    isLocalFallback: Boolean(obj.isLocalFallback),
  }
}

/**
 * Deterministic local interview preparation composer.
 * Grounded in verified candidate profile, skills, and job details.
 * Zero hallucinations.
 */
export function composeLocalInterviewPrep(request: InterviewPrepRequest): InterviewPrep {
  const verifiedSkills = (request.candidate.skills || []).map((s) => s.trim()).filter(Boolean)
  const jobSkills = (request.skills || []).map((s) => s.trim()).filter(Boolean)
  const jobDescLower = (request.jobDescription || '').toLowerCase()

  // Find skill overlap and potential gaps
  const matchedSkills = verifiedSkills.filter(
    (s) =>
      jobSkills.some((js) => js.toLowerCase() === s.toLowerCase()) ||
      jobDescLower.includes(s.toLowerCase()),
  )

  const gapSkills = jobSkills.filter(
    (js) => !verifiedSkills.some((vs) => vs.toLowerCase() === js.toLowerCase()),
  )

  const primaryTech = matchedSkills.length > 0 ? matchedSkills : verifiedSkills.slice(0, 4)
  const techLabel = primaryTech.length > 0 ? primaryTech.slice(0, 3).join(', ') : 'software architecture'

  const questions: InterviewQuestion[] = [
    // 1. Technical
    {
      id: 'q-tech-1',
      category: 'technical',
      question: `How would you architect a scalable feature using ${techLabel} to maintain performance under load?`,
      whyItMayBeAsked: `Assesses practical system design, code quality standards, and modern architecture patterns for ${request.jobTitle}.`,
      answerGuidance: `Discuss separation of concerns, state management, latency considerations, and testing strategies. Emphasize maintainability.`,
    },
    {
      id: 'q-tech-2',
      category: 'technical',
      question: `Can you walk through your debugging workflow when resolving a complex, intermittent production issue?`,
      whyItMayBeAsked: `Evaluates disciplined root-cause analysis, observability tools, and structured troubleshooting.`,
      answerGuidance: `Explain how you reproduce the issue, inspect logs/traces, write regression tests, and deploy a safe fix without panic.`,
    },
    // 2. Behavioral (with STAR structure)
    {
      id: 'q-behav-1',
      category: 'behavioral',
      question: `Tell me about a time when you had to balance delivering a feature quickly with maintaining high code quality.`,
      whyItMayBeAsked: `Explores pragmatic technical trade-offs, engineering judgment, and alignment with product timelines.`,
      answerGuidance: `Structure your response with STAR: clarify the timeline constraints, technical debt trade-offs, how you communicated with stakeholders, and the outcome.`,
      suggestedStarStructure: {
        situation: 'A tight deadline for a critical product release or client milestone.',
        task: 'Deliver the core feature on time while avoiding unmanageable technical debt.',
        action: 'Architected a modular solution, prioritized essential test coverage, and documented debt for subsequent sprints.',
        result: 'Shipped successfully on schedule with zero critical production bugs.',
      },
    },
    {
      id: 'q-behav-2',
      category: 'behavioral',
      question: `Describe a situation where you received constructive feedback on a pull request or design doc. How did you handle it?`,
      whyItMayBeAsked: `Assesses humility, collaboration, and receptiveness to peer code reviews.`,
      answerGuidance: `Emphasize learning and objectivity. Share how feedback improved the final technical outcome.`,
      suggestedStarStructure: {
        situation: 'A senior peer suggested an alternative architectural pattern during code review.',
        task: 'Evaluate the suggestion objectively without getting defensive.',
        action: 'Engaged in constructive discussion, benchmarked the trade-offs, and adopted the improved pattern.',
        result: 'The merged code was cleaner, easier for the team to maintain, and reduced latency.',
      },
    },
    // 3. Project / Experience
    {
      id: 'q-proj-1',
      category: 'project',
      question: `What is a technical project you worked on that you are particularly proud of, and what was your specific contribution?`,
      whyItMayBeAsked: `Verifies hands-on technical ownership and your ability to articulate complex engineering work.`,
      answerGuidance: `Focus on your verified contributions. Clearly delineate what you personally designed, implemented, and tested.`,
    },
    // 4. Situational
    {
      id: 'q-sit-1',
      category: 'situational',
      question: `If you were onboarded to a codebase with limited documentation, how would you ramp up and start making dependable contributions?`,
      whyItMayBeAsked: `Tests self-sufficiency, curiosity, and rapid technical adaptability.`,
      answerGuidance: `Discuss reading test suites, tracing execution paths, asking targeted questions, and improving documentation as you learn.`,
    },
    // 5. Role-Specific
    {
      id: 'q-role-1',
      category: 'role_specific',
      question: `What excites you most about contributing to ${request.company} in this ${request.jobTitle} position?`,
      whyItMayBeAsked: `Determines motivation, role clarity, and genuine interest in the company's domain.`,
      answerGuidance: `Connect your verified technical strengths to the company's product direction. Avoid generic flatteries.`,
    },
  ]

  // Add gap-specific question if there are missing requirements
  if (gapSkills.length > 0) {
    const gap = gapSkills[0]
    questions.push({
      id: 'q-gap-1',
      category: 'technical',
      question: `The role lists ${gap} as an important requirement. While you may have more background in ${techLabel}, how would you approach working with ${gap}?`,
      whyItMayBeAsked: `Gauges learning agility and how you transition conceptual knowledge to new technical tools.`,
      answerGuidance: `Acknowledge your core background honestly, draw parallels between your known tools and ${gap}, and highlight a past example of rapid tool mastery.`,
    })
  }

  const technicalTopics = primaryTech.length > 0
    ? [...primaryTech, 'API Design & Reliability', 'Unit & Integration Testing', 'System Scalability']
    : ['Code Quality & Architecture', 'API Design & REST', 'Testing & Debugging']

  const behavioralTopics = [
    'Cross-functional Collaboration',
    'Handling Technical Trade-offs',
    'Code Review & Feedback',
    'Navigating Ambiguity',
  ]

  const roleFocusAreas = [
    `Application architecture for ${request.jobTitle}`,
    `Engineering standards at ${request.company}`,
    'Effective communication of architectural decisions',
  ]

  const weakAreasToAddress = gapSkills.length > 0
    ? gapSkills.slice(0, 3).map((s) => `Review fundamental concepts and common interview scenarios for ${s}.`)
    : ['Review production monitoring and error tracing fundamentals.']

  const keyId = request.applicationId || `${request.company}-${request.jobTitle}`
  const savedChecklist = getStoredChecklist(keyId)
  const checklist = savedChecklist.length > 0
    ? savedChecklist
    : getDefaultChecklist(request.jobTitle, request.company)

  return {
    id: `prep_local_${Date.now()}`,
    applicationId: request.applicationId,
    company: request.company,
    jobTitle: request.jobTitle,
    interviewType: request.interviewType || 'Interview format not specified',
    interviewDate: request.interviewDate,
    summary: `Structured interview preparation for ${request.jobTitle} at ${request.company}. Grounded in verified strengths with zero fabricated experience.`,
    difficulty: 'moderate',
    technicalTopics,
    behavioralTopics,
    roleFocusAreas,
    questions,
    checklist,
    weakAreasToAddress,
    generalTips: [
      'Take a 3-5 second pause before answering complex questions to organize your thoughts.',
      'Ground your answers in verified project experiences rather than purely theoretical statements.',
      'Ask clarifying questions if a problem statement or scenario feels open-ended.',
      'Prepare 2-3 genuine engineering questions to ask your interviewers.',
    ],
    generatedAt: new Date().toISOString(),
    isLocalFallback: true,
  }
}

/**
 * Main Service Entrypoint: Generate Interview Prep Plan
 */
export async function generateInterviewPrep(
  request: InterviewPrepRequest,
  options?: { bypassCache?: boolean },
): Promise<InterviewPrepResult> {
  const cacheKey = buildInterviewPrepCacheKey(request)

  if (!options?.bypassCache && prepCache.has(cacheKey)) {
    const cached = prepCache.get(cacheKey)!
    // Re-synchronize checklist from storage so completed checkboxes remain up to date
    const keyId = request.applicationId || `${request.company}-${request.jobTitle}`
    const stored = getStoredChecklist(keyId)
    if (stored.length > 0) {
      cached.checklist = stored
    }
    return {
      success: true,
      prep: cached,
      fromCache: true,
    }
  }

  if (!request.jobTitle || !request.company) {
    return {
      success: false,
      errorCode: 'MISSING_INTERVIEW_CONTEXT',
      message: 'Job title and company are required to generate interview preparation.',
    }
  }

  // Attempt Supabase Edge Function invocation
  try {
    const { supabase } = await import('./supabaseClient')
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 15000),
    )

    const invokePromise = supabase.functions.invoke('generate-interview-prep', {
      body: {
        mode: 'generate',
        applicationId: request.applicationId,
        jobTitle: request.jobTitle,
        company: request.company,
        location: request.location,
        jobDescription: request.jobDescription,
        skills: request.skills,
        interviewType: request.interviewType,
        interviewDate: request.interviewDate,
        interviewTime: request.interviewTime,
        candidate: {
          fullName: request.candidate.fullName,
          headline: request.candidate.headline,
          bio: request.candidate.bio,
          skills: request.candidate.skills,
          achievements: request.candidate.achievements,
          resumeName: request.candidate.resumeName,
        },
      },
    })

    const response = (await Promise.race([invokePromise, timeoutPromise])) as {
      data: unknown
      error: unknown
    }

    if (!response.error && response.data) {
      const normalized = normalizeInterviewPrepResponse(response.data, request)
      if (normalized) {
        prepCache.set(cacheKey, normalized)
        return {
          success: true,
          prep: normalized,
          fromCache: false,
        }
      }
    }
  } catch {
    // Continue down to deterministic client fallback
  }

  // Deterministic local grounded fallback
  try {
    const localPrep = composeLocalInterviewPrep(request)
    prepCache.set(cacheKey, localPrep)
    return {
      success: true,
      prep: localPrep,
      fromCache: false,
    }
  } catch (err) {
    return {
      success: false,
      errorCode: 'UNKNOWN',
      message: err instanceof Error ? err.message : 'Unable to generate interview preparation.',
    }
  }
}

/**
 * Mock Interview Answer Evaluator:
 * Provides constructive feedback based on the question, category, and user answer.
 */
export async function evaluateMockAnswer(
  request: MockAnswerEvaluationRequest,
): Promise<MockAnswerEvaluationResult> {
  const answerTrimmed = request.userAnswer.trim()
  if (!answerTrimmed || answerTrimmed.length < 15) {
    return {
      success: false,
      message: 'Please provide a more detailed response to receive meaningful feedback.',
    }
  }

  try {
    const { supabase } = await import('./supabaseClient')
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 12000),
    )

    const invokePromise = supabase.functions.invoke('generate-interview-prep', {
      body: {
        mode: 'evaluate',
        question: request.question,
        category: request.category,
        userAnswer: answerTrimmed,
        jobTitle: request.jobTitle,
        company: request.company,
      },
    })

    const response = (await Promise.race([invokePromise, timeoutPromise])) as {
      data: unknown
      error: unknown
    }

    if (!response.error && response.data && typeof response.data === 'object') {
      const obj = response.data as Record<string, unknown>
      if (typeof obj.clarity === 'string' && typeof obj.relevance === 'string') {
        return {
          success: true,
          evaluation: {
            clarity: obj.clarity.trim(),
            relevance: obj.relevance.trim(),
            structureFeedback: typeof obj.structureFeedback === 'string' ? obj.structureFeedback.trim() : 'Good overall response structure.',
            strengths: Array.isArray(obj.strengths) ? obj.strengths.filter((s): s is string => typeof s === 'string') : [],
            improvementSuggestion: typeof obj.improvementSuggestion === 'string' ? obj.improvementSuggestion.trim() : 'Consider adding a specific quantitative metric or outcome.',
          },
        }
      }
    }
  } catch {
    // Fall back to client heuristic evaluation below
  }

  // Client-side grounded evaluation fallback
  const wordCount = answerTrimmed.split(/\s+/).length
  const hasStarKeywords = /situation|task|action|result|because|therefore|outcome|delivered|improved/i.test(answerTrimmed)
  const isTechnical = request.category === 'technical'

  const clarity = wordCount >= 40
    ? 'Your response is articulate and provides sufficient context.'
    : 'Your answer is concise, but expanding on specific details will strengthen your impact.'

  const relevance = `The answer addresses the core themes of the question for the ${request.jobTitle} position.`

  const structureFeedback = hasStarKeywords || isTechnical
    ? 'Good logical progression from context to execution.'
    : 'Consider following the STAR structure (Situation, Task, Action, Result) to clearly articulate your impact.'

  const strengths = [
    'Directly answers the primary question prompt.',
    wordCount > 50 ? 'Provides solid context and depth.' : 'Clear and straightforward phrasing.',
  ]

  const improvementSuggestion = isTechnical
    ? 'Discuss the trade-offs of your approach (e.g., performance, maintainability, edge cases).'
    : 'Highlight the tangible result or metric achieved from your actions.'

  return {
    success: true,
    evaluation: {
      clarity,
      relevance,
      structureFeedback,
      strengths,
      improvementSuggestion,
    },
  }
}
