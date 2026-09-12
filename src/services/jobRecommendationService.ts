import type { JobListing } from '../types/jobFeed'
import type { JobApplication } from '../types/application'

export type RecommendationReasonType =
  | 'skill_match'
  | 'title_match'
  | 'preference_match'
  | 'saved_similarity'
  | 'freshness'
  | 'query_match'
  | 'status_info'

export interface RecommendationReason {
  type: RecommendationReasonType
  label: string
  weight: number
}

export interface JobRelevance {
  score: number // 0 to 100
  reasons: RecommendationReason[]
  isRecommended: boolean
  isApplied: boolean
  applicationStatus?: string
  isSaved: boolean
}

export interface ScoredJobListing {
  job: JobListing
  relevance: JobRelevance
}

export interface CandidateSignals {
  skills?: string[]
  preferredJobTitle?: string
  headline?: string
  preferredLocation?: string
  workPreference?: string
  employmentType?: string
  savedJobs?: JobListing[]
  applications?: JobApplication[]
  searchQuery?: string
}

/**
 * Normalizes job apply URLs by stripping tracking parameters, UTM tags,
 * trailing slashes, and lowercase domain names.
 */
export function normalizeJobUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''

  try {
    const parsed = new URL(trimmed)
    // Strip standard analytics/tracking query params
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'source',
      'fbclid',
      'gclid',
      'mc_cid',
      'mc_eid',
    ]
    for (const param of trackingParams) {
      parsed.searchParams.delete(param)
    }

    let pathname = parsed.pathname
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }

    const searchStr = parsed.searchParams.toString()
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname}${searchStr ? `?${searchStr}` : ''}`
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, '')
  }
}

/**
 * Deduplicates job listings in-memory based on stable ID and canonical content signature
 * (normalized URL or company + title).
 */
export function deduplicateJobListings(jobs: JobListing[]): JobListing[] {
  const seenIds = new Set<string>()
  const seenSignatures = new Set<string>()
  const result: JobListing[] = []

  for (const job of jobs) {
    if (!job || !job.id) continue

    const idKey = String(job.id).trim().toLowerCase()
    if (seenIds.has(idKey)) continue

    const normalizedUrl = normalizeJobUrl(job.applyUrl)
    const normCompany = (job.company || '').trim().toLowerCase()
    const normTitle = (job.title || '').trim().toLowerCase()
    const contentKey = normalizedUrl
      ? `url:${normalizedUrl}`
      : `comp:${normCompany}::title:${normTitle}`

    if (seenSignatures.has(contentKey)) continue

    seenIds.add(idKey)
    seenSignatures.add(contentKey)
    result.push(job)
  }

  return result
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1)
}

function calculateDateFreshnessDays(isoDate: string): number {
  try {
    const timestamp = new Date(isoDate).getTime()
    if (isNaN(timestamp)) return 999
    const diff = Math.max(0, Date.now() - timestamp)
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  } catch {
    return 999
  }
}

/**
 * Pure deterministic relevance scoring for a single job against candidate signals.
 * Zero AI invocations; fast, explainable, and transparent.
 */
export function scoreJobListing(
  job: JobListing,
  signals: CandidateSignals,
): JobRelevance {
  let score = 0
  const reasons: RecommendationReason[] = []

  const rawSkills = Array.isArray(signals.skills) ? signals.skills : []
  const userSkills = rawSkills
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  // 1. SKILL OVERLAP (up to 40 pts)
  if (userSkills.length > 0) {
    const jobSkills = (job.skills || []).map((s) => s.toLowerCase().trim())
    const jobText = `${job.title} ${job.description || ''}`.toLowerCase()

    const matchedSkills: string[] = []
    for (const skill of userSkills) {
      const lowerSkill = skill.toLowerCase()
      const inSkills = jobSkills.some(
        (js) => js === lowerSkill || js.includes(lowerSkill) || lowerSkill.includes(js),
      )
      if (inSkills || jobText.includes(lowerSkill)) {
        matchedSkills.push(skill)
      }
    }

    if (matchedSkills.length > 0) {
      // Scale: 1 match = 20 pts, 2 = 30 pts, 3+ = 40 pts
      const skillWeight = Math.min(40, 15 + matchedSkills.length * 10)
      score += skillWeight

      const displaySkills = matchedSkills.slice(0, 3).join(', ')
      const extraCount = matchedSkills.length > 3 ? ` +${matchedSkills.length - 3} more` : ''
      reasons.push({
        type: 'skill_match',
        label: `Matches ${displaySkills}${extraCount}`,
        weight: skillWeight,
      })
    }
  }

  // 2. ROLE / TITLE ALIGNMENT (up to 25 pts)
  const titleCandidates = [
    signals.preferredJobTitle,
    signals.headline,
  ]
    .filter((t): t is string => Boolean(t && t.trim()))
    .map((t) => t.trim())

  let titleMatched = false
  if (titleCandidates.length > 0) {
    const jobTitleTokens = tokenize(job.title)
    for (const candidateTitle of titleCandidates) {
      const candTokens = tokenize(candidateTitle)
      const common = candTokens.filter((t) => jobTitleTokens.includes(t))
      if (common.length >= 1) {
        // High overlap (e.g. Frontend + Engineer) vs single token
        const weight = common.length >= 2 ? 25 : 15
        score += weight
        reasons.push({
          type: 'title_match',
          label: `Matches your preferred role (${candidateTitle})`,
          weight,
        })
        titleMatched = true
        break
      }
    }
  }

  // 3. WORKPLACE & EMPLOYMENT TYPE PREFERENCE (up to 15 pts)
  const workPref = signals.workPreference?.trim()
  if (workPref && workPref !== 'Any') {
    if (job.workplaceType.toLowerCase() === workPref.toLowerCase()) {
      score += 10
      reasons.push({
        type: 'preference_match',
        label: `${job.workplaceType} matches your workplace preference`,
        weight: 10,
      })
    }
  }

  const empPref = signals.employmentType?.trim()
  if (empPref && empPref !== 'Any') {
    if (job.employmentType.toLowerCase() === empPref.toLowerCase()) {
      score += 5
      reasons.push({
        type: 'preference_match',
        label: `${job.employmentType} matches employment type preference`,
        weight: 5,
      })
    }
  }

  // 4. FRESHNESS (up to 10 pts)
  const ageDays = calculateDateFreshnessDays(job.postedDate)
  if (ageDays <= 3) {
    score += 10
    reasons.push({
      type: 'freshness',
      label: ageDays <= 0 ? 'Posted today' : `Posted ${ageDays}d ago`,
      weight: 10,
    })
  } else if (ageDays <= 7) {
    score += 7
    reasons.push({
      type: 'freshness',
      label: `Posted ${ageDays}d ago`,
      weight: 7,
    })
  } else if (ageDays <= 14) {
    score += 4
  }

  // 5. SAVED JOBS SIMILARITY (up to 10 pts)
  const savedJobs = Array.isArray(signals.savedJobs) ? signals.savedJobs : []
  const isSaved = savedJobs.some(
    (s) => s.id === job.id || (s.applyUrl && s.applyUrl === job.applyUrl),
  )

  if (isSaved) {
    reasons.push({
      type: 'status_info',
      label: 'In your Saved Jobs',
      weight: 5,
    })
  } else if (savedJobs.length > 0 && !titleMatched) {
    // Check similarity with saved roles
    const savedCategories = new Set(savedJobs.map((s) => s.category?.toLowerCase()).filter(Boolean))
    if (job.category && savedCategories.has(job.category.toLowerCase())) {
      score += 8
      reasons.push({
        type: 'saved_similarity',
        label: 'Similar to roles you have saved',
        weight: 8,
      })
    }
  }

  // 6. APPLICATION STATUS AWARENESS
  const applications = Array.isArray(signals.applications) ? signals.applications : []
  const normJobUrl = normalizeJobUrl(job.applyUrl)
  const jobComp = (job.company || '').trim().toLowerCase()
  const jobTit = (job.title || '').trim().toLowerCase()

  const matchedApp = applications.find((app) => {
    if (app.jobUrl && normJobUrl && normalizeJobUrl(app.jobUrl) === normJobUrl) {
      return true
    }
    return (
      app.company.trim().toLowerCase() === jobComp &&
      app.jobTitle.trim().toLowerCase() === jobTit
    )
  })

  const isApplied = Boolean(matchedApp)
  if (isApplied) {
    // Deprioritize already-applied jobs so user discovers new openings first,
    // but keep it clear and revisit-friendly.
    score = Math.max(0, score - 25)
    reasons.unshift({
      type: 'status_info',
      label: `In Applications (${matchedApp?.status || 'Active'})`,
      weight: -25,
    })
  }

  // 7. EXPLICIT SEARCH QUERY MUST WIN (up to 50 pts boost)
  const query = signals.searchQuery?.trim().toLowerCase()
  if (query) {
    const qTokens = tokenize(query)
    const titleTokens = tokenize(job.title)
    const companyTokens = tokenize(job.company)
    const skillsTokens = (job.skills || []).flatMap(tokenize)

    const titleHits = qTokens.filter((t) => titleTokens.includes(t))
    const companyHits = qTokens.filter((t) => companyTokens.includes(t))
    const skillHits = qTokens.filter((t) => skillsTokens.includes(t))

    if (titleHits.length > 0 || skillHits.length > 0 || companyHits.length > 0) {
      const searchWeight = titleHits.length > 0 ? 50 : 35
      score += searchWeight
      reasons.unshift({
        type: 'query_match',
        label: `Matches your search for "${signals.searchQuery?.trim()}"`,
        weight: searchWeight,
      })
    } else {
      // Query exists but this job doesn't match it: strongly deprioritize
      score = Math.max(0, score - 60)
    }
  }

  // COLD START / NO PROFILE SIGNALS
  // If user has zero skills, zero preferences, and no query:
  if (userSkills.length === 0 && titleCandidates.length === 0 && !query) {
    if (ageDays <= 3) {
      reasons.push({
        type: 'freshness',
        label: 'Recently posted opportunity',
        weight: 10,
      })
    }
  }

  // Clamp final score to 0..100
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)))
  const isRecommended = clampedScore >= 50 && !isApplied

  return {
    score: clampedScore,
    reasons,
    isRecommended,
    isApplied,
    applicationStatus: matchedApp?.status,
    isSaved,
  }
}

/**
 * Takes a list of JobListings and candidate signals, deduplicates them,
 * computes deterministic relevance scores, and sorts them.
 */
export function rankJobListings(
  jobs: JobListing[],
  signals: CandidateSignals,
): ScoredJobListing[] {
  const uniqueJobs = deduplicateJobListings(jobs)

  const scored: ScoredJobListing[] = uniqueJobs.map((job) => ({
    job,
    relevance: scoreJobListing(job, signals),
  }))

  // Sort deterministically:
  // 1. Relevance score desc
  // 2. Freshness desc (newest postedDate first)
  // 3. Company name asc
  return scored.sort((a, b) => {
    if (b.relevance.score !== a.relevance.score) {
      return b.relevance.score - a.relevance.score
    }
    const timeA = new Date(a.job.postedDate).getTime() || 0
    const timeB = new Date(b.job.postedDate).getTime() || 0
    if (timeB !== timeA) {
      return timeB - timeA
    }
    return a.job.company.localeCompare(b.job.company)
  })
}

/**
 * Returns top curated recommendations (score >= 60, not already applied).
 * Capped to limit (default 4).
 */
export function getRecommendedJobs(
  scoredJobs: ScoredJobListing[],
  limit = 4,
): ScoredJobListing[] {
  return scoredJobs
    .filter((item) => item.relevance.isRecommended)
    .slice(0, limit)
}
