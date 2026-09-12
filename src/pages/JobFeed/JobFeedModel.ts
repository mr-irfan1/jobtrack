import type { JobFeedFilterState, JobListing, JobSortOption } from '../../types/jobFeed'

/**
 * Pure domain operations for Job Feed search, filtering, and sorting.
 * Holds no React dependencies and does not perform I/O, making it straightforward
 * to test in isolation.
 */

export interface ActiveFilterChip {
  id: string
  type: 'search' | 'workplace' | 'employmentType' | 'category' | 'location'
  label: string
  value: string
}

/**
 * Normalizes a user search query: trims, collapses repeated whitespace,
 * lowercases, and strips trailing punctuation.
 */
export function normalizeSearchQuery(raw?: string): string {
  if (!raw || typeof raw !== 'string') return ''
  return raw
    .toLowerCase()
    .trim()
    .replace(/[\s\t\n]+/g, ' ')
    .replace(/[.,;!?]+$/g, '')
}

/**
 * Tokenizes a search query into meaningful keywords.
 * Preserves important tech terms like 'c++', 'c#', '.net'.
 */
export function tokenizeSearchQuery(query: string): string[] {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) return []
  return normalized
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-z0-9+#.]+|[^a-z0-9+#.]+$/g, ''))
    .filter((token) => token.length >= 2 || token === 'c' || token === 'r')
}

/**
 * Checks whether a job matches a search query using multi-term matching across
 * title, company, skills, location, and description.
 */
export function matchesSearchQuery(job: JobListing, rawQuery: string): boolean {
  const normalizedQuery = normalizeSearchQuery(rawQuery)
  if (!normalizedQuery) return true

  const normTitle = job.title.toLowerCase()
  const normCompany = job.company.toLowerCase()
  const normSkills = (job.skills || []).map((s) => s.toLowerCase()).join(' ')
  const normLocation = job.location.toLowerCase()
  const normDescription = (job.description || '').toLowerCase()

  // 1. Direct phrase match in key fields
  if (
    normTitle.includes(normalizedQuery) ||
    normSkills.includes(normalizedQuery) ||
    normCompany.includes(normalizedQuery) ||
    normLocation.includes(normalizedQuery)
  ) {
    return true
  }

  // 2. Token-level multi-term matching
  const tokens = tokenizeSearchQuery(normalizedQuery)
  if (tokens.length === 0) return true

  const combinedSearchText = `${normTitle} ${normCompany} ${normSkills} ${normLocation} ${normDescription}`

  // For 1-2 tokens: ALL tokens must be present
  // For 3+ tokens: allow matching all or all-but-one for typo/wording tolerance
  const matchedTokensCount = tokens.filter((token) => combinedSearchText.includes(token)).length
  const minRequiredMatches = tokens.length <= 2 ? tokens.length : Math.max(2, tokens.length - 1)

  return matchedTokensCount >= minRequiredMatches
}

/**
 * Computes explicit query relevance score (0 to 100) based on field hierarchy:
 * Exact Title > Title Tokens > Skills > Company > Description > Location.
 */
export function calculateSearchQueryRelevance(job: JobListing, rawQuery: string): number {
  const normalizedQuery = normalizeSearchQuery(rawQuery)
  if (!normalizedQuery) return 0

  const normTitle = job.title.toLowerCase()
  const normCompany = job.company.toLowerCase()
  const skills = (job.skills || []).map((s) => s.toLowerCase())
  const normLocation = job.location.toLowerCase()
  const normDescription = (job.description || '').toLowerCase()

  let score = 0

  // 1. Exact Title vs Phrase Match
  if (normTitle === normalizedQuery) {
    score += 40
  } else if (normTitle.includes(normalizedQuery)) {
    score += 25
  }

  // 2. Token Matching
  const tokens = tokenizeSearchQuery(normalizedQuery)
  if (tokens.length > 0) {
    let titleTokenHits = 0
    let skillHits = 0
    let companyHits = 0
    let descHits = 0
    let locHits = 0

    for (const token of tokens) {
      if (normTitle.includes(token)) titleTokenHits++
      if (skills.some((s) => s.includes(token))) skillHits++
      if (normCompany.includes(token)) companyHits++
      if (normDescription.includes(token)) descHits++
      if (normLocation.includes(token)) locHits++
    }

    if (titleTokenHits === tokens.length) {
      score += 35
    } else if (titleTokenHits > 0) {
      score += 20 * (titleTokenHits / tokens.length)
    }

    if (skillHits > 0) {
      score += Math.min(25, 15 + skillHits * 5)
    }

    if (companyHits > 0) {
      score += 20
    }

    if (descHits > 0) {
      score += Math.min(10, descHits * 3)
    }

    if (locHits > 0) {
      score += 10
    }
  }

  return Math.min(100, Math.round(score))
}

export function filterJobListings(
  jobs: JobListing[],
  filters: JobFeedFilterState,
): JobListing[] {
  const locFilter = (filters.location || '').trim().toLowerCase()
  const workplaceFilter = (filters.workplace || '').trim().toLowerCase()
  const empFilter = (filters.employmentType || '').trim().toLowerCase()
  const catFilter = (filters.category || '').trim().toLowerCase()

  return jobs.filter((job) => {
    // 1. Multi-term search
    if (filters.search && !matchesSearchQuery(job, filters.search)) {
      return false
    }

    // 2. Workplace filter (Remote, Hybrid, On-site)
    if (workplaceFilter && workplaceFilter !== 'all') {
      if (job.workplaceType.toLowerCase() !== workplaceFilter) {
        return false
      }
    }

    // 3. Location filter
    if (locFilter && locFilter !== 'all') {
      const jobLoc = job.location.toLowerCase()
      if (!jobLoc.includes(locFilter)) {
        return false
      }
    }

    // 4. Employment type filter
    if (empFilter && empFilter !== 'all') {
      if (job.employmentType.toLowerCase() !== empFilter) {
        return false
      }
    }

    // 5. Category filter
    if (catFilter && catFilter !== 'all') {
      const jobCat = (job.category || '').toLowerCase()
      if (!jobCat.includes(catFilter)) {
        return false
      }
    }

    return true
  })
}

export function sortJobListings(
  jobs: JobListing[],
  sortBy: JobSortOption,
  scoreMap?: Map<string, number>,
): JobListing[] {
  const copy = [...jobs]

  switch (sortBy) {
    case 'newest':
      return copy.sort((a, b) => {
        const timeA = new Date(a.postedDate).getTime() || 0
        const timeB = new Date(b.postedDate).getTime() || 0
        return timeB - timeA
      })
    case 'company':
      return copy.sort((a, b) => a.company.localeCompare(b.company))
    case 'relevant':
      if (scoreMap && scoreMap.size > 0) {
        return copy.sort((a, b) => {
          const scoreA = scoreMap.get(a.id) ?? 0
          const scoreB = scoreMap.get(b.id) ?? 0
          if (scoreB !== scoreA) {
            return scoreB - scoreA
          }
          const timeA = new Date(a.postedDate).getTime() || 0
          const timeB = new Date(b.postedDate).getTime() || 0
          return timeB - timeA
        })
      }
      return copy
    default:
      return copy
  }
}

export function getDistinctCategories(jobs: JobListing[]): string[] {
  const set = new Set<string>()
  for (const job of jobs) {
    if (job.category && job.category.trim()) {
      set.add(job.category.trim())
    }
  }
  return Array.from(set).sort()
}

export function getActiveFilterChips(filters: JobFeedFilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  const normSearch = normalizeSearchQuery(filters.search)
  if (normSearch) {
    chips.push({
      id: 'search',
      type: 'search',
      label: `"${filters.search.trim()}"`,
      value: filters.search.trim(),
    })
  }

  if (filters.workplace && filters.workplace !== 'all') {
    chips.push({
      id: 'workplace',
      type: 'workplace',
      label: filters.workplace.charAt(0).toUpperCase() + filters.workplace.slice(1),
      value: filters.workplace,
    })
  }

  if (filters.employmentType && filters.employmentType !== 'all') {
    chips.push({
      id: 'employmentType',
      type: 'employmentType',
      label: filters.employmentType.charAt(0).toUpperCase() + filters.employmentType.slice(1),
      value: filters.employmentType,
    })
  }

  if (filters.category && filters.category !== 'all') {
    chips.push({
      id: 'category',
      type: 'category',
      label: filters.category,
      value: filters.category,
    })
  }

  if (filters.location && filters.location !== 'all') {
    chips.push({
      id: 'location',
      type: 'location',
      label: `Location: ${filters.location}`,
      value: filters.location,
    })
  }

  return chips
}

export function getActiveFilterCount(filters: JobFeedFilterState): number {
  let count = 0
  if (filters.workplace && filters.workplace !== 'all') count++
  if (filters.employmentType && filters.employmentType !== 'all') count++
  if (filters.category && filters.category !== 'all') count++
  if (filters.location && filters.location !== 'all') count++
  return count
}
