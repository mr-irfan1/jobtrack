// JobTrack — Resume Tailoring & Optimization Service
// ===================================================
// Orchestrates job-specific resume analysis, requirement comparison,
// under-emphasized skill detection, and grounded tailoring guidance.
// Strictly non-destructive: Never mutates original document bytes.

import { extractTextFromDataUrl } from './resumeAnalysisService.ts'
import type {
  KeywordSuggestions,
  ResumeRecommendation,
  ResumeTailoringAnalysis,
  ResumeTailoringRequest,
  ResumeTailoringResult,
  SectionRecommendation,
  SuggestedEdit,
  TailoringPriority,
  TailoringRequirement,
} from '../types/resumeTailoring'

const tailoringCache = new Map<string, ResumeTailoringAnalysis>()

export function buildTailoringCacheKey(request: ResumeTailoringRequest): string {
  const sortedCandidateSkills = (request.candidate?.skills || [])
    .map((s) => s.trim().toLowerCase())
    .sort()
    .join('|')
  return `job:${request.job.id}:resume:${request.resume.id}:${request.resume.updatedAt}:skills:${sortedCandidateSkills}`
}

export function clearResumeTailoringCache(): void {
  tailoringCache.clear()
}

export function scoreToTailoringLabel(score: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  if (clamped >= 85) return 'Strong Alignment'
  if (clamped >= 70) return 'Good Alignment'
  if (clamped >= 50) return 'Moderate Alignment'
  if (clamped >= 30) return 'Partial Alignment'
  return 'Early Stage Alignment'
}

export function scoreToTailoringColor(score: number): {
  badgeBg: string
  badgeText: string
  barColor: string
} {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  if (clamped >= 85) {
    return {
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      barColor: 'bg-emerald-500',
    }
  }
  if (clamped >= 70) {
    return {
      badgeBg: 'bg-blue-500/15 border-blue-500/30',
      badgeText: 'text-blue-700 dark:text-blue-300',
      barColor: 'bg-blue-500',
    }
  }
  if (clamped >= 50) {
    return {
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
      badgeText: 'text-amber-700 dark:text-amber-300',
      barColor: 'bg-amber-500',
    }
  }
  if (clamped >= 30) {
    return {
      badgeBg: 'bg-orange-500/15 border-orange-500/30',
      badgeText: 'text-orange-700 dark:text-orange-300',
      barColor: 'bg-orange-500',
    }
  }
  return {
    badgeBg: 'bg-rose-500/15 border-rose-500/30',
    badgeText: 'text-rose-700 dark:text-rose-300',
    barColor: 'bg-rose-500',
  }
}

/**
 * Validates and safely normalizes an AI or server payload into strict ResumeTailoringAnalysis.
 */
export function normalizeTailoringResponse(
  raw: unknown,
  request: ResumeTailoringRequest,
): ResumeTailoringAnalysis | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const rawScore = typeof obj.matchScore === 'number' ? obj.matchScore : Number(obj.matchScore)
  if (Number.isNaN(rawScore)) return null
  const matchScore = Math.max(0, Math.min(100, Math.round(rawScore)))

  const cleanString = (val: unknown, fallback: string): string => {
    return typeof val === 'string' && val.trim() ? val.trim() : fallback
  }

  const cleanPriority = (val: unknown): TailoringPriority => {
    if (val === 'high' || val === 'medium' || val === 'low') return val
    return 'medium'
  }

  const cleanRequirementList = (arr: unknown): TailoringRequirement[] => {
    if (!Array.isArray(arr)) return []
    const results: TailoringRequirement[] = []
    for (const item of arr) {
      if (item && typeof item === 'object') {
        const reqObj = item as Record<string, unknown>
        const requirement = cleanString(reqObj.requirement, '')
        if (requirement) {
          results.push({
            requirement,
            evidence: typeof reqObj.evidence === 'string' && reqObj.evidence.trim() ? reqObj.evidence.trim() : undefined,
            importance: cleanPriority(reqObj.importance),
            action: typeof reqObj.action === 'string' && reqObj.action.trim() ? reqObj.action.trim() : undefined,
          })
        }
      }
    }
    return results
  }

  const cleanRecommendationList = (arr: unknown): ResumeRecommendation[] => {
    if (!Array.isArray(arr)) return []
    const results: ResumeRecommendation[] = []
    for (const item of arr) {
      if (item && typeof item === 'object') {
        const recObj = item as Record<string, unknown>
        const recommendation = cleanString(recObj.recommendation, '')
        if (recommendation) {
          results.push({
            section: cleanString(recObj.section, 'General'),
            currentSignal: cleanString(recObj.currentSignal, 'Existing phrasing'),
            recommendation,
            rationale: cleanString(recObj.rationale, 'Strengthens alignment with job requirements.'),
            priority: cleanPriority(recObj.priority),
          })
        }
      }
    }
    return results
  }

  const cleanSectionRecommendationList = (arr: unknown): SectionRecommendation[] => {
    if (!Array.isArray(arr)) return []
    const results: SectionRecommendation[] = []
    for (const item of arr) {
      if (item && typeof item === 'object') {
        const secObj = item as Record<string, unknown>
        const advice = cleanString(secObj.advice, '')
        if (advice) {
          results.push({
            section: cleanString(secObj.section, 'General'),
            heading: cleanString(secObj.heading, 'Section Guidance'),
            advice,
            suggestedDirection: typeof secObj.suggestedDirection === 'string' && secObj.suggestedDirection.trim() ? secObj.suggestedDirection.trim() : undefined,
            priority: cleanPriority(secObj.priority),
          })
        }
      }
    }
    return results
  }

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

  const rawKeywords = (obj.keywordSuggestions as Record<string, unknown>) || {}
  const keywordSuggestions: KeywordSuggestions = {
    technical: cleanStringArray(rawKeywords.technical),
    professional: cleanStringArray(rawKeywords.professional),
    domainSpecific: cleanStringArray(rawKeywords.domainSpecific),
  }

  const cleanSuggestedEdits = (arr: unknown): SuggestedEdit[] => {
    if (!Array.isArray(arr)) return []
    const results: SuggestedEdit[] = []
    for (const item of arr) {
      if (item && typeof item === 'object') {
        const eObj = item as Record<string, unknown>
        const direction = cleanString(eObj.suggestedDirection, '')
        if (direction) {
          results.push({
            section: cleanString(eObj.section, 'Experience'),
            originalConcept: cleanString(eObj.originalConcept, 'Existing bullet focus'),
            suggestedDirection: direction,
            factualSafeguardNote: cleanString(
              eObj.factualSafeguardNote,
              'Verify all facts and never add unverified metrics.',
            ),
          })
        }
      }
    }
    return results
  }

  const summary = cleanString(
    obj.summary,
    `Resume demonstrates ${matchScore}% alignment with ${request.job.title} at ${request.job.company}.`,
  )

  return {
    matchScore,
    summary,
    matchedRequirements: cleanRequirementList(obj.matchedRequirements),
    missingRequirements: cleanRequirementList(obj.missingRequirements),
    underEmphasizedRequirements: cleanRequirementList(obj.underEmphasizedRequirements),
    recommendedChanges: cleanRecommendationList(obj.recommendedChanges),
    sectionRecommendations: cleanSectionRecommendationList(obj.sectionRecommendations),
    suggestedEdits: cleanSuggestedEdits(obj.suggestedEdits),
    keywordSuggestions,
    risks: cleanStringArray(obj.risks),
    unchangedAreas: cleanStringArray(obj.unchangedAreas),
    analyzedAt: typeof obj.analyzedAt === 'string' ? obj.analyzedAt : new Date().toISOString(),
    confidence: obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low'
      ? obj.confidence
      : 'high',
    isLocalFallback: Boolean(obj.isLocalFallback),
    sourceContext: {
      jobTitle: request.job.title,
      company: request.job.company,
      resumeName: request.resume.name,
      resumeId: request.resume.id,
      resumeUpdatedAt: request.resume.updatedAt,
    },
  }
}

/**
 * Deterministic local rule engine for job-specific resume tailoring.
 * Guarantees zero reliance on third-party APIs while enforcing strict factuality.
 */
export function calculateLocalResumeTailoring(
  request: ResumeTailoringRequest,
): ResumeTailoringAnalysis {
  const resumeText = extractTextFromDataUrl(request.resume.fileData)
  const resumeTextLower = resumeText.toLowerCase()

  // Collect candidate verified skills
  const candidateSkills = (request.candidate?.skills || []).map((s) => s.trim())
  const candidateSkillsLower = new Set(candidateSkills.map((s) => s.toLowerCase()))

  // Job requirements normalization: combine listed skills and keywords found in title/description
  const jobListedSkills = (request.job.skills || []).map((s) => s.trim()).filter(Boolean)
  const jobDescription = request.job.description || ''
  const jobDescriptionLower = jobDescription.toLowerCase()

  // Common keywords to detect if present in description
  const STANDARD_EVALUATION_SKILLS = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Java',
    'SQL', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'CI/CD', 'Git', 'GraphQL', 'REST APIs', 'Tailwind', 'Next.js', 'Vite',
    'Microservices', 'System Design', 'Agile', 'Testing', 'Unit Testing',
  ]

  const targetRequirementsSet = new Set<string>()
  for (const s of jobListedSkills) {
    targetRequirementsSet.add(s)
  }

  // Scan description for prominent technology keywords if job skills are sparse
  if (targetRequirementsSet.size < 5) {
    for (const kw of STANDARD_EVALUATION_SKILLS) {
      const regex = new RegExp(`\\b${kw.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (regex.test(jobDescriptionLower)) {
        targetRequirementsSet.add(kw)
      }
    }
  }

  const allTargetRequirements = Array.from(targetRequirementsSet)

  const matchedRequirements: TailoringRequirement[] = []
  const missingRequirements: TailoringRequirement[] = []
  const underEmphasizedRequirements: TailoringRequirement[] = []

  for (const req of allTargetRequirements) {
    const reqLower = req.toLowerCase()
    const regex = new RegExp(`\\b${req.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const matches = resumeTextLower.match(regex)
    const matchCount = matches ? matches.length : 0
    const inProfile = candidateSkillsLower.has(reqLower)

    if (matchCount > 0 || inProfile) {
      // It exists in resume or profile
      if (matchCount === 1) {
        // Appears only once: under-emphasized!
        underEmphasizedRequirements.push({
          requirement: req,
          evidence: `Appears once in provided resume text.`,
          importance: 'high',
          action: `Consider highlighting your practical use of ${req} in your primary project or experience bullets where factual.`,
        })
      } else {
        matchedRequirements.push({
          requirement: req,
          evidence: matchCount > 1
            ? `Mentioned ${matchCount} times across resume content.`
            : `Present in verified technical skills profile.`,
          importance: 'high',
          action: `Keep prominently featured in your technical skills and role summary.`,
        })
      }
    } else {
      // Not found in resume: carefully phrased gap
      missingRequirements.push({
        requirement: req,
        importance: jobListedSkills.some((s) => s.toLowerCase() === reqLower) ? 'high' : 'medium',
        action: `Not found in provided resume. If you have experience with ${req}, consider adding it to your skills or relevant experience.`,
      })
    }
  }

  // Scoring convention aligned with Step 6
  let matchScore = 50
  if (allTargetRequirements.length > 0) {
    const totalFound = matchedRequirements.length + underEmphasizedRequirements.length
    const ratio = totalFound / allTargetRequirements.length
    matchScore = Math.min(100, Math.max(15, Math.round(ratio * 90 + (matchedRequirements.length > 0 ? 10 : 0))))
  }

  // Section Recommendations
  const sectionRecommendations: SectionRecommendation[] = [
    {
      section: 'Summary',
      heading: 'Align Role Summary with Job Title',
      advice: `Tailor your professional summary opening to echo the role "${request.job.title}". Emphasize your key strengths in ${matchedRequirements.slice(0, 3).map((m) => m.requirement).join(', ') || 'core development technologies'}.`,
      priority: 'high',
    },
    {
      section: 'Technical Skills',
      heading: 'Reorder High-Priority Keywords',
      advice: matchedRequirements.length > 0
        ? `Move ${matchedRequirements.slice(0, 3).map((m) => m.requirement).join(' and ')} closer to the top of your Technical Skills section to catch ATS and recruiter screening first.`
        : 'Organize technical competencies by domain (Frontend, Backend, Tools) to improve scan speed.',
      priority: 'high',
    },
    {
      section: 'Work Experience',
      heading: 'Strengthen Context for Key Technologies',
      advice: underEmphasizedRequirements.length > 0
        ? `Ensure your experience bullets describe how you applied ${underEmphasizedRequirements.slice(0, 2).map((u) => u.requirement).join(' and ')} in production, rather than listing them in isolation.`
        : 'Ensure each position highlights production impact, architecture decisions, and cross-functional teamwork.',
      priority: 'medium',
    },
    {
      section: 'Projects',
      heading: 'Spotlight Most Relevant Deliverables',
      advice: `Prioritize projects that demonstrate capabilities required by ${request.job.company} (e.g. scalable architectures, modern framework usage).`,
      priority: 'medium',
    },
  ]

  // Suggested Edits (Preserving factual truth)
  const suggestedEdits: SuggestedEdit[] = []
  if (underEmphasizedRequirements.length > 0) {
    const targetSkill = underEmphasizedRequirements[0].requirement
    suggestedEdits.push({
      section: 'Experience / Projects',
      originalConcept: `Generic bullet mentioning ${targetSkill} as a tooling detail.`,
      suggestedDirection: `Describe the concrete feature or architectural component you delivered using ${targetSkill}, and note the technical outcome where factual.`,
      factualSafeguardNote: 'Only include measurable outcomes or scope that actually occurred. Do not fabricate percentages or metrics.',
    })
  } else if (matchedRequirements.length > 0) {
    const topSkill = matchedRequirements[0].requirement
    suggestedEdits.push({
      section: 'Work Experience',
      originalConcept: `Built user interfaces using ${topSkill}.`,
      suggestedDirection: `Developed accessible, responsive interfaces using ${topSkill}, maintaining reusable component libraries and clean state architecture.`,
      factualSafeguardNote: 'Preserve your actual role scope and avoid claiming responsibilities handled by others.',
    })
  }

  // Categorized Keyword Suggestions
  const keywordSuggestions: KeywordSuggestions = {
    technical: allTargetRequirements.filter((r) =>
      ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'SQL', 'PostgreSQL', 'Docker', 'AWS', 'CI/CD', 'Git', 'GraphQL', 'REST APIs', 'Tailwind', 'Next.js'].some(
        (t) => t.toLowerCase() === r.toLowerCase(),
      ),
    ),
    professional: ['System Architecture', 'Code Review', 'Cross-Functional Collaboration', 'Agile Delivery', 'Performance Optimization'],
    domainSpecific: [
      request.job.title,
      request.job.employmentType || 'Full-time',
      request.job.workplaceType || 'Remote',
    ].filter(Boolean),
  }

  const recommendedChanges: ResumeRecommendation[] = [
    {
      section: 'Technical Skills',
      currentSignal: 'General skills listing',
      recommendation: `Elevate verified job skills (${matchedRequirements.slice(0, 3).map((m) => m.requirement).join(', ') || 'core stack'}) to prominent initial positions.`,
      rationale: 'ATS parsers and human recruiters scan top skills first within the first 6 seconds.',
      priority: 'high',
    },
  ]

  if (underEmphasizedRequirements.length > 0) {
    recommendedChanges.push({
      section: 'Work Experience',
      currentSignal: 'Single mention of key required technology',
      recommendation: `Elaborate on your practical use of ${underEmphasizedRequirements.map((u) => u.requirement).join(', ')} in your project or experience bullets.`,
      rationale: 'Demonstrating application in real workflows is more credible than a standalone skills list.',
      priority: 'high',
    })
  }

  const risks: string[] = []
  if (missingRequirements.length > 3) {
    risks.push(
      `Several listed requirements (${missingRequirements.slice(0, 3).map((m) => m.requirement).join(', ')}) were not found in the provided resume. If you have relevant exposure, consider highlighting transferable competencies.`,
    )
  }
  if (resumeText.length < 150) {
    risks.push(
      'The provided resume file has limited extractable text stream. Ensure your resume is saved as a searchable PDF or Word document rather than an image scan.',
    )
  }

  const unchangedAreas: string[] = [
    'Education and academic degrees should remain factual and unmodified.',
    'Verified contact links (LinkedIn, GitHub, Email) are in standard order and need no changes.',
  ]

  return {
    matchScore,
    summary: `Resume "${request.resume.name}" demonstrates ${scoreToTailoringLabel(matchScore).toLowerCase()} (${matchScore}%) with the requirements for ${request.job.title} at ${request.job.company}.`,
    matchedRequirements,
    missingRequirements,
    underEmphasizedRequirements,
    recommendedChanges,
    sectionRecommendations,
    suggestedEdits,
    keywordSuggestions,
    risks,
    unchangedAreas,
    analyzedAt: new Date().toISOString(),
    confidence: resumeText.length > 150 ? 'medium' : 'low',
    isLocalFallback: true,
    sourceContext: {
      jobTitle: request.job.title,
      company: request.job.company,
      resumeName: request.resume.name,
      resumeId: request.resume.id,
      resumeUpdatedAt: request.resume.updatedAt,
    },
  }
}

/**
 * Main Service Entrypoint for Resume Tailoring:
 * - Checks session cache
 * - Attempts Supabase Edge Function invocation
 * - Falls back to local deterministic rule engine
 * - Enforces zero resume mutation
 */
export async function analyzeResumeTailoring(
  request: ResumeTailoringRequest,
  options?: { bypassCache?: boolean },
): Promise<ResumeTailoringResult> {
  const cacheKey = buildTailoringCacheKey(request)

  if (!options?.bypassCache && tailoringCache.has(cacheKey)) {
    return {
      success: true,
      analysis: tailoringCache.get(cacheKey)!,
      fromCache: true,
    }
  }

  // Attempt Supabase Edge Function
  try {
    const { supabase } = await import('./supabaseClient')
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 15000),
    )

    const invokePromise = supabase.functions.invoke('analyze-resume-tailoring', {
      body: {
        job: request.job,
        resume: {
          id: request.resume.id,
          name: request.resume.name,
          fileName: request.resume.fileName,
          fileType: request.resume.fileType,
          fileData: request.resume.fileData,
          updatedAt: request.resume.updatedAt,
        },
        candidate: request.candidate,
      },
    })

    const response = (await Promise.race([invokePromise, timeoutPromise])) as {
      data: unknown
      error: unknown
    }

    if (!response.error && response.data) {
      const normalized = normalizeTailoringResponse(response.data, request)
      if (normalized) {
        tailoringCache.set(cacheKey, normalized)
        return {
          success: true,
          analysis: normalized,
          fromCache: false,
        }
      }
    }
  } catch {
    // Continue down to deterministic client fallback
  }

  // Fallback to local rule-based tailoring engine
  try {
    const fallbackAnalysis = calculateLocalResumeTailoring(request)
    tailoringCache.set(cacheKey, fallbackAnalysis)
    return {
      success: true,
      analysis: fallbackAnalysis,
      fromCache: false,
    }
  } catch (err) {
    return {
      success: false,
      errorCode: 'UNKNOWN',
      message: err instanceof Error ? err.message : 'Unable to complete resume tailoring analysis.',
    }
  }
}
