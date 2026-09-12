import type {
  JobMatchAnalysis,
  JobMatchRequest,
  JobMatchResult,
  JobMatchVerdict,
} from '../types/jobMatch'

// In-memory session cache for AI / matcher results to prevent redundant calls
const matchCache = new Map<string, JobMatchAnalysis>()

export function buildMatchCacheKey(request: JobMatchRequest): string {
  const sortedSkills = (request.candidate.skills || [])
    .map((s) => s.trim().toLowerCase())
    .sort()
    .join('|')
  const resume = request.candidate.resumeId || 'none'
  return `job:${request.job.id}:skills:${sortedSkills}:resume:${resume}`
}

export function clearJobMatchCache(): void {
  matchCache.clear()
}

export function scoreToVerdict(score: number): JobMatchVerdict {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  if (clamped >= 90) return 'excellent_match'
  if (clamped >= 75) return 'strong_match'
  if (clamped >= 60) return 'moderate_match'
  if (clamped >= 40) return 'partial_match'
  return 'weak_match'
}

export function verdictToLabel(verdict: JobMatchVerdict): string {
  switch (verdict) {
    case 'excellent_match':
      return 'Excellent Match'
    case 'strong_match':
      return 'Strong Match'
    case 'moderate_match':
      return 'Moderate Match'
    case 'partial_match':
      return 'Partial Match'
    case 'weak_match':
      return 'Weak Match'
  }
}

export function verdictToColor(verdict: JobMatchVerdict): {
  badgeBg: string
  badgeText: string
  barColor: string
} {
  switch (verdict) {
    case 'excellent_match':
      return {
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        barColor: 'bg-emerald-500',
      }
    case 'strong_match':
      return {
        badgeBg: 'bg-blue-500/15 border-blue-500/30',
        badgeText: 'text-blue-700 dark:text-blue-300',
        barColor: 'bg-blue-500',
      }
    case 'moderate_match':
      return {
        badgeBg: 'bg-amber-500/15 border-amber-500/30',
        badgeText: 'text-amber-700 dark:text-amber-300',
        barColor: 'bg-amber-500',
      }
    case 'partial_match':
      return {
        badgeBg: 'bg-orange-500/15 border-orange-500/30',
        badgeText: 'text-orange-700 dark:text-orange-300',
        barColor: 'bg-orange-500',
      }
    case 'weak_match':
      return {
        badgeBg: 'bg-rose-500/15 border-rose-500/30',
        badgeText: 'text-rose-700 dark:text-rose-300',
        barColor: 'bg-rose-500',
      }
  }
}

/**
 * Validate and safely normalize an AI or server payload into strict JobMatchAnalysis.
 */
export function normalizeJobMatchResponse(
  raw: unknown,
  request: JobMatchRequest,
): JobMatchAnalysis | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const rawScore = typeof obj.score === 'number' ? obj.score : Number(obj.score)
  if (Number.isNaN(rawScore)) return null
  const score = Math.max(0, Math.min(100, Math.round(rawScore)))
  const verdict = scoreToVerdict(score)

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

  const matchedSkills = cleanStringArray(obj.matchedSkills)
  const missingSkills = cleanStringArray(obj.missingSkills)
  const requiredSkills = cleanStringArray(obj.requiredSkills)
  const strengths = cleanStringArray(obj.strengths)
  const gaps = cleanStringArray(obj.gaps)

  let recommendation =
    typeof obj.recommendation === 'string' && obj.recommendation.trim()
      ? obj.recommendation.trim()
      : 'Review the role details and tailor your application to highlight relevant project experience.'

  // Clamp recommendation text to reasonable length
  if (recommendation.length > 500) {
    recommendation = recommendation.slice(0, 497) + '...'
  }

  const confidence: 'high' | 'medium' | 'low' =
    obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low'
      ? obj.confidence
      : (request.candidate.skills?.length || 0) > 2
        ? 'high'
        : 'medium'

  return {
    score,
    verdict,
    matchedSkills,
    missingSkills,
    requiredSkills,
    strengths,
    gaps,
    recommendation,
    confidence,
    analyzedSources: {
      hasJobDescription: Boolean(request.job.description && request.job.description.trim().length > 50),
      skillsCount: request.candidate.skills?.length || 0,
      resumeName: request.candidate.resumeName,
      usedProfileSkills: (request.candidate.skills?.length || 0) > 0,
    },
    timestamp: typeof obj.timestamp === 'string' ? obj.timestamp : new Date().toISOString(),
  }
}

/**
 * Common tech skills dictionary for intelligent keyword extraction from descriptions.
 */
const KNOWN_SKILL_KEYWORDS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Golang',
  'Java', 'Kotlin', 'Swift', 'C#', 'C++', 'Ruby', 'Rails', 'PHP', 'Laravel',
  'Next.js', 'Vue', 'Angular', 'Svelte', 'Tailwind CSS', 'Tailwind', 'CSS3',
  'HTML5', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform',
  'Git', 'Figma', 'UI/UX', 'Microservices', 'Jest', 'Vite', 'Kafka',
]

/**
 * Normalizes a skill token for fuzzy synonym matching.
 */
function normalizeSkillToken(token: string): string {
  const t = token.toLowerCase().trim().replace(/[._-]/g, '')
  if (t === 'js' || t === 'javascript') return 'javascript'
  if (t === 'ts' || t === 'typescript') return 'typescript'
  if (t === 'react' || t === 'reactjs') return 'react'
  if (t === 'next' || t === 'nextjs') return 'nextjs'
  if (t === 'node' || t === 'nodejs') return 'nodejs'
  if (t === 'tailwind' || t === 'tailwindcss') return 'tailwindcss'
  if (t === 'postgres' || t === 'postgresql') return 'postgresql'
  if (t === 'rest' || t === 'restapi' || t === 'restapis') return 'restapi'
  return t
}

/**
 * Deterministic, grounded local requirement extraction and candidate match engine.
 * Ensures JobTrack works reliably without server dependency or third-party AI keys.
 */
export function calculateLocalJobMatch(request: JobMatchRequest): JobMatchAnalysis {
  const { job, candidate } = request
  const candidateSkills = (candidate.skills || []).map((s) => s.trim()).filter(Boolean)
  const candidateNormMap = new Map<string, string>()
  candidateSkills.forEach((s) => {
    candidateNormMap.set(normalizeSkillToken(s), s)
  })

  // 1. Gather Job Required Skills from tags + description parsing
  const jobDeclaredSkills = Array.isArray(job.skills) ? job.skills : []
  const descText = `${job.title} ${job.description || ''}`
  const foundInDesc: string[] = []

  for (const kw of KNOWN_SKILL_KEYWORDS) {
    // Word boundary check
    const regex = new RegExp(`\\b${kw.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (regex.test(descText)) {
      foundInDesc.push(kw)
    }
  }

  // Combine and deduplicate job skills
  const jobSkillsMap = new Map<string, string>()
  for (const s of [...jobDeclaredSkills, ...foundInDesc]) {
    const norm = normalizeSkillToken(s)
    if (!jobSkillsMap.has(norm)) {
      jobSkillsMap.set(norm, s)
    }
  }

  const allJobSkills = Array.from(jobSkillsMap.values())
  const effectiveJobSkills = allJobSkills.length > 0
    ? allJobSkills
    : ['Communication', 'Problem Solving', 'Teamwork'] // Fallback generic requirements if zero technical terms found

  // 2. Identify Matched vs Missing
  const matchedList: string[] = []
  const missingList: string[] = []

  for (const [normKey, originalSkill] of jobSkillsMap.entries()) {
    if (candidateNormMap.has(normKey)) {
      matchedList.push(candidateNormMap.get(normKey) || originalSkill)
    } else {
      missingList.push(originalSkill)
    }
  }

  // 3. Score Calculation (Grounded & transparent dimensions)
  let score = 0
  const hasDesc = Boolean(job.description && job.description.trim().length > 40)
  const hasUserSkills = candidateSkills.length > 0

  if (!hasUserSkills) {
    // If user has zero skills on profile, score cannot exceed 25% and must signal gap
    score = candidate.headline ? 20 : 10
  } else {
    // Dimension A: Skills Overlap (Weight: 65%)
    const skillRatio = effectiveJobSkills.length > 0
      ? matchedList.length / effectiveJobSkills.length
      : 0
    const skillPoints = Math.min(65, Math.round(skillRatio * 65))

    // Dimension B: Role Title & Headline Alignment (Weight: 20%)
    let rolePoints = 0
    const titleWords = job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    const profileHeadline = (candidate.headline || '').toLowerCase()
    const matchingTitleWords = titleWords.filter((w) => profileHeadline.includes(w))
    if (matchingTitleWords.length > 0) {
      rolePoints = Math.min(20, matchingTitleWords.length * 10)
    } else if (profileHeadline) {
      rolePoints = 8 // Partial credit for having an active engineering headline
    }

    // Dimension C: Location & Workplace (Weight: 10%)
    let locPoints = 5
    if (job.workplaceType === 'Remote' || job.location.toLowerCase().includes('remote')) {
      locPoints = 10
    }

    // Dimension D: Resume / Achievements Completeness (Weight: 5%)
    const completenessPoints = candidate.resumeName || (candidate.achievements && candidate.achievements.length > 0) ? 5 : 2

    score = Math.min(100, Math.max(10, skillPoints + rolePoints + locPoints + completenessPoints))
  }

  const verdict = scoreToVerdict(score)

  // 4. Strengths Generation (grounded only in matched data)
  const strengths: string[] = []
  if (matchedList.length > 0) {
    strengths.push(`Direct skill alignment in ${matchedList.slice(0, 3).join(', ')}.`)
  }
  if (candidate.headline && job.title.toLowerCase().includes(candidate.headline.toLowerCase())) {
    strengths.push(`Your headline explicitly targets "${job.title}".`)
  }
  if (candidate.resumeName) {
    strengths.push(`Attached resume "${candidate.resumeName}" supports this role focus.`)
  }
  if (strengths.length === 0) {
    strengths.push('General software development foundation.')
  }

  // 5. Gaps Generation (grounded only in missing data)
  const gaps: string[] = []
  if (!hasUserSkills) {
    gaps.push('No skills recorded in your user profile. Add your technical stack in Settings.')
  } else if (missingList.length > 0) {
    gaps.push(`Missing role requirements: ${missingList.slice(0, 3).join(', ')}.`)
  } else {
    gaps.push('Ensure project portfolio highlights real-world production scale.')
  }

  // 6. Recommendation
  let recommendation = ''
  if (!hasUserSkills) {
    recommendation =
      'Add your core technical skills in Account Settings to get an accurate, personalized match score for this role.'
  } else if (score >= 75) {
    recommendation = `Strong fit. Your proficiency in ${matchedList.slice(0, 2).join(' and ') || 'the primary stack'} aligns well. Apply with tailored project highlights.`
  } else if (score >= 50) {
    recommendation = `Moderate alignment. Review the missing requirements (${missingList.slice(0, 2).join(', ') || 'infrastructure'}) and highlight transferable experience.`
  } else {
    recommendation = `Lower match with current profile skills. Consider upskilling in ${missingList.slice(0, 2).join(', ') || 'the listed stack'} or checking alternative roles.`
  }

  const confidence: 'high' | 'medium' | 'low' =
    !hasUserSkills || !hasDesc ? 'low' : candidateSkills.length >= 3 ? 'high' : 'medium'

  return {
    score,
    verdict,
    matchedSkills: matchedList,
    missingSkills: missingList,
    requiredSkills: effectiveJobSkills,
    strengths,
    gaps,
    recommendation,
    confidence,
    analyzedSources: {
      hasJobDescription: hasDesc,
      skillsCount: candidateSkills.length,
      resumeName: candidate.resumeName,
      usedProfileSkills: hasUserSkills,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Main Service Entrypoint:
 * - Checks session cache
 * - Attempts Supabase Edge Function invocation
 * - Falls back cleanly to local deterministic matcher
 * - Returns standardized JobMatchResult
 */
export async function analyzeJobMatch(
  request: JobMatchRequest,
  options?: { bypassCache?: boolean },
): Promise<JobMatchResult> {
  const cacheKey = buildMatchCacheKey(request)

  if (!options?.bypassCache && matchCache.has(cacheKey)) {
    const cached = matchCache.get(cacheKey)!
    return {
      success: true,
      analysis: cached,
      fromCache: true,
    }
  }

  // Check validation edge cases
  if (!request.job) {
    return {
      success: false,
      errorCode: 'NO_JOB_DESCRIPTION',
      message: 'Job listing information is missing.',
    }
  }

  // Attempt Supabase Edge Function
  try {
    const { supabase } = await import('./supabaseClient')
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 12000),
    )

    const invokePromise = supabase.functions.invoke('analyze-job-match', {
      body: {
        job: {
          id: request.job.id,
          title: request.job.title,
          company: request.job.company,
          location: request.job.location,
          employmentType: request.job.employmentType,
          workplaceType: request.job.workplaceType,
          skills: request.job.skills,
          description: request.job.description,
        },
        candidate: {
          fullName: request.candidate.fullName,
          headline: request.candidate.headline,
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
      const normalized = normalizeJobMatchResponse(response.data, request)
      if (normalized) {
        matchCache.set(cacheKey, normalized)
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

  // Deterministic local matching fallback
  try {
    const localAnalysis = calculateLocalJobMatch(request)
    matchCache.set(cacheKey, localAnalysis)
    return {
      success: true,
      analysis: localAnalysis,
      fromCache: false,
    }
  } catch (err) {
    return {
      success: false,
      errorCode: 'UNKNOWN',
      message: err instanceof Error ? err.message : 'Unable to complete match analysis.',
    }
  }
}
