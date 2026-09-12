import type { JobListing } from '../types/jobFeed.ts'
import type { JobAlertCriteria, JobAlertDraft } from '../types/jobAlert.ts'
import { matchesSearchQuery } from '../pages/JobFeed/JobFeedModel.ts'

/**
 * Pure domain logic for Job Alerts:
 * - Deterministic name generation
 * - Criteria normalization & canonical duplicate signature
 * - Validation
 * - Match evaluation
 * - Filter URL generation
 */

export function normalizeCriterion(value?: string): string {
  if (!value || typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (trimmed.toLowerCase() === 'all') return ''
  return trimmed
}

export function canonicalCriteriaSignature(criteria: JobAlertCriteria): string {
  const q = normalizeCriterion(criteria.query).toLowerCase()
  const wp = normalizeCriterion(criteria.workplace).toLowerCase()
  const emp = normalizeCriterion(criteria.employmentType).toLowerCase()
  const cat = normalizeCriterion(criteria.category).toLowerCase()
  const loc = normalizeCriterion(criteria.location).toLowerCase()

  return `q:${q}|wp:${wp}|emp:${emp}|cat:${cat}|loc:${loc}`
}

export function generateAlertName(criteria: JobAlertCriteria): string {
  const parts: string[] = []

  const q = normalizeCriterion(criteria.query)
  const wp = normalizeCriterion(criteria.workplace)
  const emp = normalizeCriterion(criteria.employmentType)
  const cat = normalizeCriterion(criteria.category)
  const loc = normalizeCriterion(criteria.location)

  if (q) parts.push(q)
  if (wp && wp.toLowerCase() !== 'all') parts.push(wp)
  if (emp && emp.toLowerCase() !== 'all') parts.push(emp)
  if (cat && cat.toLowerCase() !== 'all' && !q.toLowerCase().includes(cat.toLowerCase())) {
    parts.push(cat)
  }
  if (loc && loc.toLowerCase() !== 'all') parts.push(loc)

  if (parts.length === 0) {
    return 'General Job Alert'
  }

  return parts.join(' • ')
}

export function formatCriteriaSummary(criteria: JobAlertCriteria): string {
  const parts: string[] = []

  const q = normalizeCriterion(criteria.query)
  const wp = normalizeCriterion(criteria.workplace)
  const emp = normalizeCriterion(criteria.employmentType)
  const cat = normalizeCriterion(criteria.category)
  const loc = normalizeCriterion(criteria.location)

  if (q) parts.push(`Keywords: "${q}"`)
  if (wp) parts.push(wp)
  if (emp) parts.push(emp)
  if (cat) parts.push(cat)
  if (loc) parts.push(loc)

  return parts.join(' · ') || 'All Opportunities'
}

export function validateAlertDraft(draft: JobAlertDraft): {
  valid: boolean
  error?: string
} {
  if (!draft || typeof draft !== 'object') {
    return { valid: false, error: 'Invalid alert data provided.' }
  }

  const { criteria, frequency } = draft

  if (!criteria || typeof criteria !== 'object') {
    return { valid: false, error: 'Alert criteria are required.' }
  }

  const hasAtLeastOneCriterion = Boolean(
    normalizeCriterion(criteria.query) ||
      normalizeCriterion(criteria.workplace) ||
      normalizeCriterion(criteria.employmentType) ||
      normalizeCriterion(criteria.category) ||
      normalizeCriterion(criteria.location),
  )

  if (!hasAtLeastOneCriterion) {
    return {
      valid: false,
      error: 'Please specify at least one search criterion (keyword, workplace, type, category, or location).',
    }
  }

  if (frequency && frequency !== 'daily' && frequency !== 'weekly') {
    return {
      valid: false,
      error: 'Frequency must be either Daily or Weekly.',
    }
  }

  return { valid: true }
}

export function matchesAlertCriteria(
  job: JobListing,
  criteria: JobAlertCriteria,
): boolean {
  if (!job) return false

  // 1. Keyword / query match
  const q = normalizeCriterion(criteria.query)
  if (q && !matchesSearchQuery(job, q)) {
    return false
  }

  // 2. Workplace filter
  const wp = normalizeCriterion(criteria.workplace).toLowerCase()
  if (wp && job.workplaceType.toLowerCase() !== wp) {
    return false
  }

  // 3. Employment type filter
  const emp = normalizeCriterion(criteria.employmentType).toLowerCase()
  if (emp && job.employmentType.toLowerCase() !== emp) {
    return false
  }

  // 4. Category filter
  const cat = normalizeCriterion(criteria.category).toLowerCase()
  if (cat && !(job.category || '').toLowerCase().includes(cat)) {
    return false
  }

  // 5. Location filter
  const loc = normalizeCriterion(criteria.location).toLowerCase()
  if (loc && !job.location.toLowerCase().includes(loc)) {
    return false
  }

  return true
}

export function buildJobFeedUrlFromCriteria(criteria: JobAlertCriteria): string {
  const params = new URLSearchParams()

  const q = normalizeCriterion(criteria.query)
  if (q) params.set('q', q)

  const wp = normalizeCriterion(criteria.workplace)
  if (wp) params.set('workplace', wp)

  const emp = normalizeCriterion(criteria.employmentType)
  if (emp) params.set('type', emp)

  const cat = normalizeCriterion(criteria.category)
  if (cat) params.set('category', cat)

  const loc = normalizeCriterion(criteria.location)
  if (loc) params.set('location', loc)

  const queryStr = params.toString()
  return queryStr ? `/jobs?${queryStr}` : '/jobs'
}
