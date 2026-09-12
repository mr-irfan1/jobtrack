import type { Resume } from '../types/resume'
import type {
  ContactSignalCheck,
  ResumeAnalysis,
  ResumeAnalysisResult,
  ResumeAtsVerdict,
  ResumeSectionCheck,
} from '../types/resumeAnalysis'

const analysisCache = new Map<string, ResumeAnalysis>()

export function buildResumeAnalysisCacheKey(resume: Resume): string {
  return `${resume.id}:${resume.updatedAt}`
}

export function clearResumeAnalysisCache(): void {
  analysisCache.clear()
}

export function scoreToAtsVerdict(score: number): ResumeAtsVerdict {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  if (clamped >= 90) return 'excellent'
  if (clamped >= 75) return 'strong'
  if (clamped >= 60) return 'needs_improvement'
  return 'weak'
}

export function verdictToLabel(verdict: ResumeAtsVerdict): string {
  switch (verdict) {
    case 'excellent':
      return 'Excellent ATS Readiness'
    case 'strong':
      return 'Strong ATS Readiness'
    case 'needs_improvement':
      return 'Moderate / Needs Improvement'
    case 'weak':
      return 'High ATS Risk'
  }
}

export function verdictToColor(verdict: ResumeAtsVerdict): {
  badgeBg: string
  badgeText: string
  barColor: string
} {
  switch (verdict) {
    case 'excellent':
      return {
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        barColor: 'bg-emerald-500',
      }
    case 'strong':
      return {
        badgeBg: 'bg-blue-500/15 border-blue-500/30',
        badgeText: 'text-blue-700 dark:text-blue-300',
        barColor: 'bg-blue-500',
      }
    case 'needs_improvement':
      return {
        badgeBg: 'bg-amber-500/15 border-amber-500/30',
        badgeText: 'text-amber-700 dark:text-amber-300',
        barColor: 'bg-amber-500',
      }
    case 'weak':
      return {
        badgeBg: 'bg-rose-500/15 border-rose-500/30',
        badgeText: 'text-rose-700 dark:text-rose-300',
        barColor: 'bg-rose-500',
      }
  }
}

/**
 * Standard candidate sections to evaluate.
 */
export const STANDARD_RESUME_SECTIONS: Array<{
  name: string
  regex: RegExp
  importance: 'critical' | 'recommended' | 'optional'
}> = [
  {
    name: 'Contact Information',
    regex: /(contact|email|phone|address|linkedin|github)/i,
    importance: 'critical',
  },
  {
    name: 'Work Experience',
    regex: /(experience|employment|work\s+history|professional\s+experience|career\s+history)/i,
    importance: 'critical',
  },
  {
    name: 'Technical Skills',
    regex: /(skills|technical\s+skills|core\s+competencies|technologies|proficiencies)/i,
    importance: 'critical',
  },
  {
    name: 'Education',
    regex: /(education|academic|university|degree|college)/i,
    importance: 'critical',
  },
  {
    name: 'Projects',
    regex: /(projects|portfolio|personal\s+projects|open\s+source)/i,
    importance: 'recommended',
  },
  {
    name: 'Professional Summary',
    regex: /(summary|objective|professional\s+summary|profile|about\s+me)/i,
    importance: 'recommended',
  },
  {
    name: 'Certifications',
    regex: /(certifications?|licenses?|credentials?|courses?)/i,
    importance: 'optional',
  },
  {
    name: 'Achievements',
    regex: /(achievements?|awards?|honors?|publications?)/i,
    importance: 'optional',
  },
]

const COMMON_TECH_KEYWORDS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'SQL',
  'PostgreSQL', 'HTML5', 'CSS3', 'Tailwind', 'Git', 'AWS', 'Docker',
  'REST', 'GraphQL', 'Next.js', 'Vite', 'CI/CD', 'Linux',
]

const COMMON_PROFESSIONAL_KEYWORDS = [
  'Leadership', 'Collaboration', 'Problem Solving', 'Agile', 'Communication',
  'Architecture', 'Performance', 'Testing', 'Scalability', 'Cross-functional',
]

/**
 * Extracts printable text tokens from base64 data URLs without crashing on binary formats.
 */
export function extractTextFromDataUrl(dataUrl?: string): string {
  if (!dataUrl || typeof dataUrl !== 'string') return ''

  try {
    const base64Index = dataUrl.indexOf(';base64,')
    const rawBase64 = base64Index !== -1 ? dataUrl.slice(base64Index + 8) : dataUrl

    // Decode base64 bytes safely in browser/Node
    let binary = ''
    if (typeof atob === 'function') {
      binary = atob(rawBase64)
    } else {
      const g = globalThis as unknown as {
        Buffer?: { from(s: string, e: string): { toString(e: string): string } }
      }
      if (g.Buffer) {
        binary = g.Buffer.from(rawBase64, 'base64').toString('binary')
      }
    }

    // Filter printable ASCII/UTF-8 streams
    const printableMatches = binary.match(/[\x20-\x7E\n\r\t]{4,}/g)
    return printableMatches ? printableMatches.join(' ') : ''
  } catch {
    return ''
  }
}

/**
 * Validates and safely normalizes an AI or server payload into strict ResumeAnalysis.
 */
export function normalizeResumeAnalysis(
  raw: unknown,
  resume: Resume,
): ResumeAnalysis | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const rawAts = typeof obj.atsScore === 'number' ? obj.atsScore : Number(obj.atsScore)
  if (Number.isNaN(rawAts)) return null
  const atsScore = Math.max(0, Math.min(100, Math.round(rawAts)))

  const rawQuality = typeof obj.qualityScore === 'number' ? obj.qualityScore : Number(obj.qualityScore)
  const qualityScore = Number.isNaN(rawQuality) ? atsScore : Math.max(0, Math.min(100, Math.round(rawQuality)))

  const verdict = scoreToAtsVerdict(atsScore)

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

  const detectedSections = cleanStringArray(obj.detectedSections)
  const missingSections = cleanStringArray(obj.missingSections)
  const strengths = cleanStringArray(obj.strengths)
  const weaknesses = cleanStringArray(obj.weaknesses)
  const recommendations = cleanStringArray(obj.recommendations)

  // Normalize sections
  const sections: ResumeSectionCheck[] = STANDARD_RESUME_SECTIONS.map((sec) => ({
    name: sec.name,
    importance: sec.importance,
    detected: detectedSections.some((d) => d.toLowerCase().includes(sec.name.toLowerCase())),
  }))

  // Normalize keyword signals
  const rawKeywords = (obj.keywordSignals as Record<string, unknown>) || {}
  const keywordSignals = {
    technical: cleanStringArray(rawKeywords.technical),
    professional: cleanStringArray(rawKeywords.professional),
  }

  // Normalize contact signals
  const rawContacts = Array.isArray(obj.contactSignals) ? obj.contactSignals : []
  const defaultSignals: ContactSignalCheck[] = [
    { type: 'email', label: 'Email Address', detected: false },
    { type: 'phone', label: 'Phone Number', detected: false },
    { type: 'linkedin', label: 'LinkedIn Profile', detected: false },
    { type: 'github', label: 'GitHub Profile', detected: false },
    { type: 'portfolio', label: 'Online Portfolio', detected: false },
  ]
  const contactSignals: ContactSignalCheck[] = defaultSignals.map((c) => {
    const found = rawContacts.find(
      (rc: unknown) =>
        rc && typeof rc === 'object' && 'type' in rc && (rc as { type: string }).type === c.type,
    )
    return {
      ...c,
      detected: found ? Boolean((found as { detected?: boolean }).detected) : false,
    }
  })

  let summary =
    typeof obj.summary === 'string' && obj.summary.trim()
      ? obj.summary.trim()
      : `Resume "${resume.name}" has an estimated ATS readiness score of ${atsScore}%.`

  if (summary.length > 500) {
    summary = summary.slice(0, 497) + '...'
  }

  return {
    resumeId: resume.id,
    resumeName: resume.name,
    fileName: resume.fileName,
    fileType: resume.fileType,
    atsScore,
    qualityScore,
    verdict,
    detectedSections,
    missingSections,
    sections,
    contactSignals,
    strengths: strengths.length > 0 ? strengths : ['Standard document format.'],
    weaknesses,
    keywordSignals,
    recommendations: recommendations.length > 0 ? recommendations : ['Ensure all headings use standard conventions.'],
    summary,
    analyzedAt: typeof obj.analyzedAt === 'string' ? obj.analyzedAt : new Date().toISOString(),
    confidence: obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low'
      ? obj.confidence
      : 'high',
    isLocalFallback: Boolean(obj.isLocalFallback),
  }
}

/**
 * Deterministic local ATS rule engine.
 * Ensures JobTrack works reliably without server dependency or third-party AI keys.
 */
export function calculateLocalResumeAnalysis(resume: Resume): ResumeAnalysis {
  const extractedText = extractTextFromDataUrl(resume.fileData)
  const isMinimalText = extractedText.length < 50

  // 1. Detect Sections
  const sectionChecks: ResumeSectionCheck[] = STANDARD_RESUME_SECTIONS.map((sec) => {
    const isDetected = !isMinimalText && sec.regex.test(extractedText)
    return {
      name: sec.name,
      importance: sec.importance,
      detected: isDetected,
    }
  })

  const detectedSections = sectionChecks.filter((s) => s.detected).map((s) => s.name)
  const missingSections = sectionChecks.filter((s) => !s.detected).map((s) => s.name)

  // 2. Detect Contact Signals
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(extractedText)
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(extractedText)
  const hasLinkedIn = /linkedin\.com/i.test(extractedText)
  const hasGitHub = /github\.com/i.test(extractedText)
  const hasPortfolio = /(portfolio|https?:\/\/[^\s]+)/i.test(extractedText)

  const contactSignals: ContactSignalCheck[] = [
    { type: 'email', label: 'Email Address', detected: hasEmail },
    { type: 'phone', label: 'Phone Number', detected: hasPhone },
    { type: 'linkedin', label: 'LinkedIn Profile', detected: hasLinkedIn },
    { type: 'github', label: 'GitHub Profile', detected: hasGitHub },
    { type: 'portfolio', label: 'Online Portfolio', detected: hasPortfolio },
  ]

  // 3. Keyword Detection
  const techFound: string[] = []
  for (const kw of COMMON_TECH_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (regex.test(extractedText)) {
      techFound.push(kw)
    }
  }

  const profFound: string[] = []
  for (const kw of COMMON_PROFESSIONAL_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (regex.test(extractedText)) {
      profFound.push(kw)
    }
  }

  // 4. Calculate ATS & Quality Scores
  let atsScore = 0
  let qualityScore = 0

  if (isMinimalText) {
    // If the file is a scanned image or empty binary without extractable text streams
    atsScore = 25
    qualityScore = 20
  } else {
    // Critical sections: Contact, Experience, Skills, Education (15 pts each = 60 pts)
    const criticalDetected = sectionChecks.filter((s) => s.importance === 'critical' && s.detected).length
    const criticalScore = criticalDetected * 15

    // Recommended sections: Projects, Summary (10 pts each = 20 pts)
    const recDetected = sectionChecks.filter((s) => s.importance === 'recommended' && s.detected).length
    const recScore = recDetected * 10

    // Contact details score (10 pts)
    const contactCount = contactSignals.filter((c) => c.detected).length
    const contactScore = Math.min(10, contactCount * 2.5)

    // Keyword density score (10 pts)
    const kwScore = Math.min(10, (techFound.length + profFound.length) * 1.5)

    atsScore = Math.min(100, Math.max(20, Math.round(criticalScore + recScore + contactScore + kwScore)))
    qualityScore = Math.min(100, Math.max(20, Math.round(atsScore * 0.95 + (hasLinkedIn || hasGitHub ? 5 : 0))))
  }

  const verdict = scoreToAtsVerdict(atsScore)

  // 5. Build Strengths & Weaknesses
  const strengths: string[] = []
  const weaknesses: string[] = []
  const recommendations: string[] = []

  if (isMinimalText) {
    weaknesses.push('Scanned or image-based document: text stream could not be extracted by ATS parser.')
    recommendations.push('Re-export your resume directly as a text-based PDF or DOCX rather than an image scan.')
  } else {
    if (detectedSections.includes('Work Experience') && detectedSections.includes('Technical Skills')) {
      strengths.push('Standard core structure with clearly identifiable Work Experience and Skills sections.')
    }
    if (hasEmail && (hasLinkedIn || hasGitHub)) {
      strengths.push('Complete professional contact information and online profile links detected.')
    }
    if (techFound.length >= 4) {
      strengths.push(`Rich technical keyword density including ${techFound.slice(0, 3).join(', ')}.`)
    }

    if (!hasEmail) {
      weaknesses.push('Missing explicit email address in standard text format.')
      recommendations.push('Add your professional email address prominently in the header.')
    }
    if (!hasLinkedIn) {
      weaknesses.push('No LinkedIn profile URL detected.')
      recommendations.push('Include a customized LinkedIn profile link for recruiter reference.')
    }
    if (missingSections.includes('Projects')) {
      weaknesses.push('No dedicated Projects section identified.')
      recommendations.push('Add a Projects section to showcase hands-on impact and production code.')
    }
  }

  if (strengths.length === 0) {
    strengths.push('Standard file format compatible with modern operating systems.')
  }
  if (recommendations.length === 0) {
    recommendations.push('Continue tailoring keyword alignment to specific role descriptions before submitting.')
  }

  return {
    resumeId: resume.id,
    resumeName: resume.name,
    fileName: resume.fileName,
    fileType: resume.fileType,
    atsScore,
    qualityScore,
    verdict,
    detectedSections,
    missingSections,
    sections: sectionChecks,
    contactSignals,
    strengths,
    weaknesses,
    keywordSignals: {
      technical: techFound,
      professional: profFound,
    },
    recommendations,
    summary: isMinimalText
      ? 'This document appears to contain scanned images or non-standard encoding which hampers automated ATS text extraction.'
      : `Resume demonstrates ${verdictToLabel(verdict).toLowerCase()} with ${detectedSections.length} detected sections and verified contact signals.`,
    analyzedAt: new Date().toISOString(),
    confidence: isMinimalText ? 'low' : 'medium',
    isLocalFallback: true,
  }
}

/**
 * Main Service Entrypoint:
 * - Checks session cache
 * - Attempts Supabase Edge Function invocation
 * - Falls back to local deterministic engine
 */
export async function analyzeResume(
  resume: Resume,
  options?: { bypassCache?: boolean },
): Promise<ResumeAnalysisResult> {
  const cacheKey = buildResumeAnalysisCacheKey(resume)

  if (!options?.bypassCache && analysisCache.has(cacheKey)) {
    return {
      success: true,
      analysis: analysisCache.get(cacheKey)!,
      fromCache: true,
    }
  }

  // Attempt Supabase Edge Function
  try {
    const { supabase } = await import('./supabaseClient')
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 15000),
    )

    const invokePromise = supabase.functions.invoke('analyze-resume', {
      body: {
        resumeId: resume.id,
        name: resume.name,
        fileName: resume.fileName,
        fileType: resume.fileType,
        fileData: resume.fileData,
      },
    })

    const response = (await Promise.race([invokePromise, timeoutPromise])) as {
      data: unknown
      error: unknown
    }

    if (!response.error && response.data) {
      const normalized = normalizeResumeAnalysis(response.data, resume)
      if (normalized) {
        analysisCache.set(cacheKey, normalized)
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

  // Fallback to local rule-based analysis
  try {
    const fallbackAnalysis = calculateLocalResumeAnalysis(resume)
    analysisCache.set(cacheKey, fallbackAnalysis)
    return {
      success: true,
      analysis: fallbackAnalysis,
      fromCache: false,
    }
  } catch (err) {
    return {
      success: false,
      errorCode: 'UNKNOWN',
      message: err instanceof Error ? err.message : 'Unable to complete resume analysis.',
    }
  }
}
