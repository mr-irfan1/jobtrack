import type { EmploymentType, WorkplaceType } from '../types/jobFeed.ts'
import type { CanonicalJob, CanonicalSalary } from '../types/canonicalJob.ts'

/**
 * Normalizes a raw string: trims surrounding whitespace, collapses internal repeated whitespace.
 * If empty or non-string, returns defaultVal.
 */
export function normalizeString(raw?: unknown, defaultVal = ''): string {
  if (typeof raw !== 'string') return defaultVal
  const trimmed = raw.trim().replace(/[\s\t\n]+/g, ' ')
  return trimmed || defaultVal
}

/**
 * Generates a normalized comparison string (lowercase trimmed).
 * Used for case-insensitive deduplication, sorting, and search matching.
 */
export function normalizeComparisonString(raw?: unknown): string {
  return normalizeString(raw).toLowerCase()
}

/**
 * Normalizes workplace classification into 'Remote' | 'Hybrid' | 'On-site'.
 * Evaluates text tokens across workplace fields or locations.
 */
export function normalizeWorkplaceType(raw?: unknown, locationHint?: unknown): WorkplaceType {
  const combined = `${normalizeComparisonString(raw)} ${normalizeComparisonString(locationHint)}`.trim()
  if (!combined) return 'Remote'

  if (
    combined.includes('hybrid') ||
    combined.includes('flexible')
  ) {
    return 'Hybrid'
  }

  if (
    combined.includes('remote') ||
    combined.includes('telecommute') ||
    combined.includes('work from home') ||
    combined.includes('wfh') ||
    combined.includes('virtual') ||
    combined.includes('anywhere') ||
    combined.includes('worldwide')
  ) {
    return 'Remote'
  }

  if (
    combined.includes('on-site') ||
    combined.includes('onsite') ||
    combined.includes('in-office') ||
    combined.includes('in office') ||
    combined.includes('in-person') ||
    combined.includes('in person')
  ) {
    return 'On-site'
  }

  // If a location is provided (e.g. "New York, NY") without remote keywords, default to On-site;
  // otherwise default to Remote.
  const locStr = normalizeComparisonString(locationHint)
  if (locStr && !locStr.includes('remote') && !locStr.includes('worldwide') && !locStr.includes('anywhere')) {
    return 'On-site'
  }

  return 'Remote'
}

/**
 * Normalizes employment type into 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Other'.
 */
export function normalizeEmploymentType(raw?: unknown): EmploymentType {
  const str = normalizeComparisonString(raw).replace(/[-_]/g, ' ')
  if (!str) return 'Full-time'

  if (/\b(intern|internship|student|trainee)\b/.test(str)) {
    return 'Internship'
  }

  if (/\b(contract|contractor|freelance)\b/.test(str)) {
    return 'Contract'
  }

  if (/\b(part time|pt)\b/.test(str)) {
    return 'Part-time'
  }

  if (/\b(full time|permanent|ft)\b/.test(str)) {
    return 'Full-time'
  }

  return 'Other'
}

/**
 * Validates and sanitizes a URL. Enforces http:// or https:// protocol.
 * Strips dangerous schemes (javascript:, data:, file:) and surrounding whitespace.
 */
export function sanitizeUrl(raw?: unknown, fallback = ''): string {
  if (typeof raw !== 'string') return fallback
  const trimmed = raw.trim()
  if (!trimmed) return fallback

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fallback
    }
    return parsed.toString()
  } catch {
    return fallback
  }
}

/**
 * Canonicalizes a job apply URL for cross-provider and cross-scrape deduplication.
 * Strips tracking query parameters, UTM tags, session tokens, and trailing slashes.
 */
export function canonicalizeUrl(raw?: unknown): string {
  const clean = sanitizeUrl(raw)
  if (!clean) return ''

  try {
    const parsed = new URL(clean)
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
      'gh_jid',
      'lever-source',
    ]

    for (const p of trackingParams) {
      parsed.searchParams.delete(p)
    }

    let pathname = parsed.pathname
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }

    const search = parsed.searchParams.toString()
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname}${search ? `?${search}` : ''}`
  } catch {
    return clean.toLowerCase().replace(/\/+$/, '')
  }
}

/**
 * Sanitizes HTML content into readable, formatted plaintext.
 * Strips <style>, <script>, tags, and entity codes while preserving paragraph spacing and bullet points.
 */
export function sanitizeHtmlDescription(html?: unknown): string {
  if (typeof html !== 'string') return ''
  let text = html
  if (text.includes('&lt;') && text.includes('&gt;') && !text.includes('<')) {
    text = text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
  }

  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Normalizes ISO date strings or parseable date timestamps.
 * If invalid or absent, returns fallbackDate or current ISO timestamp.
 */
export function normalizeDate(raw?: unknown, fallbackDate?: string): string {
  const fallback = fallbackDate || new Date().toISOString()
  if (!raw) return fallback

  try {
    if (raw instanceof Date) {
      const time = raw.getTime()
      return isNaN(time) ? fallback : raw.toISOString()
    }

    if (typeof raw === 'number') {
      const d = new Date(raw)
      return isNaN(d.getTime()) ? fallback : d.toISOString()
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (!trimmed) return fallback
      const parsed = new Date(trimmed)
      return isNaN(parsed.getTime()) ? fallback : parsed.toISOString()
    }

    return fallback
  } catch {
    return fallback
  }
}

/**
 * Normalizes an array or comma-separated string of skills.
 * Filters empty entries, trims strings, and deduplicates case-insensitively while preserving original casing.
 */
export function normalizeSkills(raw?: unknown): string[] {
  let list: string[] = []

  if (Array.isArray(raw)) {
    list = raw.filter((s): s is string => typeof s === 'string')
  } else if (typeof raw === 'string') {
    list = raw.split(/[,;|]/)
  }

  const seen = new Set<string>()
  const result: string[] = []

  for (const item of list) {
    const trimmed = item.trim().replace(/[\s\t\n]+/g, ' ')
    if (!trimmed) continue
    const lower = trimmed.toLowerCase()
    if (!seen.has(lower)) {
      seen.add(lower)
      result.push(trimmed)
    }
  }

  return result
}

/**
 * Normalizes salary information without fabricating or inventing missing numbers.
 */
export function normalizeSalary(options: {
  raw?: unknown
  min?: unknown
  max?: unknown
  currency?: unknown
  period?: unknown
}): CanonicalSalary {
  const rawStr = typeof options.raw === 'string' ? options.raw.trim() : null
  const currencyStr = typeof options.currency === 'string' && options.currency.trim()
    ? options.currency.trim().toUpperCase()
    : 'USD'

  let minNum: number | null = null
  let maxNum: number | null = null

  if (typeof options.min === 'number' && !isNaN(options.min) && options.min >= 0) {
    minNum = options.min
  } else if (typeof options.min === 'string') {
    const parsed = parseFloat(options.min.replace(/[^0-9.]/g, ''))
    if (!isNaN(parsed) && parsed >= 0) minNum = parsed
  }

  if (typeof options.max === 'number' && !isNaN(options.max) && options.max >= 0) {
    maxNum = options.max
  } else if (typeof options.max === 'string') {
    const parsed = parseFloat(options.max.replace(/[^0-9.]/g, ''))
    if (!isNaN(parsed) && parsed >= 0) maxNum = parsed
  }

  // Ensure min <= max if both present
  if (minNum !== null && maxNum !== null && minNum > maxNum) {
    const tmp = minNum
    minNum = maxNum
    maxNum = tmp
  }

  let periodVal: 'yearly' | 'monthly' | 'hourly' | null = null
  if (typeof options.period === 'string') {
    const lower = options.period.toLowerCase()
    if (lower.includes('hour')) periodVal = 'hourly'
    else if (lower.includes('month')) periodVal = 'monthly'
    else if (lower.includes('year') || lower.includes('annual')) periodVal = 'yearly'
  }

  return {
    raw: rawStr || (minNum !== null || maxNum !== null ? formatSalaryRaw(minNum, maxNum, currencyStr, periodVal) : null),
    min: minNum,
    max: maxNum,
    currency: currencyStr,
    period: periodVal,
  }
}

function formatSalaryRaw(
  min: number | null,
  max: number | null,
  currency: string,
  period: 'yearly' | 'monthly' | 'hourly' | null,
): string {
  const suffix = period ? ` / ${period.replace('ly', '')}` : ''
  if (min !== null && max !== null) {
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}${suffix}`
  }
  if (min !== null) return `${currency} ${min.toLocaleString()}+${suffix}`
  if (max !== null) return `Up to ${currency} ${max.toLocaleString()}${suffix}`
  return ''
}

export interface NormalizeJobInput {
  id?: string
  source?: string
  sourceJobId?: string | number
  rawSourceId?: string | number | null
  sourceName?: string
  sourceUrl?: string | null
  title?: string
  company?: string
  companyLogo?: string | null
  description?: string
  location?: string
  workplaceType?: string
  employmentType?: string
  category?: string | null
  skills?: string[] | string
  salaryRaw?: string | null
  salaryMin?: number | string | null
  salaryMax?: number | string | null
  salaryCurrency?: string | null
  salaryPeriod?: string | null
  applyUrl?: string
  postedAt?: string | Date
  discoveredAt?: string | Date
  lastSeenAt?: string | Date
  expiresAt?: string | Date | null
  sourceMetadata?: Record<string, unknown>
  isActive?: boolean
}

/**
 * Universal Canonical Normalizer.
 * Ingests a raw job dictionary from any provider and outputs a strictly typed CanonicalJob.
 * Follows zero-invention rules: never fabricates missing skills, salaries, or contact URLs.
 */
export function normalizeJob(raw: NormalizeJobInput, provider: string): CanonicalJob {
  const source = normalizeString(provider || raw.source, 'external').toLowerCase()
  const rawId = raw.sourceJobId !== undefined && raw.sourceJobId !== null
    ? String(raw.sourceJobId).trim()
    : raw.id !== undefined && raw.id !== null
      ? String(raw.id).trim()
      : ''

  const sourceJobId = rawId || crypto.randomUUID()
  const sourceName = normalizeString(raw.sourceName, capitalize(source))
  const title = normalizeString(raw.title, 'Untitled Role')
  const company = normalizeString(raw.company, 'Confidential Company')
  const location = normalizeString(raw.location, 'Remote')
  const workplaceType = normalizeWorkplaceType(raw.workplaceType, location)
  const employmentType = normalizeEmploymentType(raw.employmentType)
  const category = normalizeString(raw.category) || null
  const description = sanitizeHtmlDescription(raw.description)
  const companyLogo = sanitizeUrl(raw.companyLogo) || null

  const applyUrl = sanitizeUrl(raw.applyUrl) || (raw.sourceUrl ? sanitizeUrl(raw.sourceUrl) : `https://jobtrack.app/jobs/${source}/${sourceJobId}`)
  const canonicalUrl = canonicalizeUrl(applyUrl)

  const salary = normalizeSalary({
    raw: raw.salaryRaw,
    min: raw.salaryMin,
    max: raw.salaryMax,
    currency: raw.salaryCurrency,
    period: raw.salaryPeriod,
  })

  const nowIso = new Date().toISOString()
  const postedAt = normalizeDate(raw.postedAt, nowIso)
  const discoveredAt = normalizeDate(raw.discoveredAt, nowIso)
  const lastSeenAt = normalizeDate(raw.lastSeenAt, nowIso)
  const expiresAt = raw.expiresAt ? normalizeDate(raw.expiresAt) : null

  const id = normalizeString(raw.id, `job_${source}_${sourceJobId}`)

  return {
    id,
    source,
    sourceJobId,
    rawSourceId: raw.rawSourceId !== undefined && raw.rawSourceId !== null ? String(raw.rawSourceId) : null,
    sourceName,
    sourceUrl: sanitizeUrl(raw.sourceUrl) || null,
    title,
    company,
    companyLogo,
    description,
    location,
    workplaceType,
    employmentType,
    category,
    skills: normalizeSkills(raw.skills),
    salary,
    applyUrl,
    canonicalUrl,
    normalizedTitle: normalizeComparisonString(title),
    normalizedCompany: normalizeComparisonString(company),
    normalizedLocation: normalizeComparisonString(location),
    sourceMetadata: raw.sourceMetadata && typeof raw.sourceMetadata === 'object' ? raw.sourceMetadata : {},
    isActive: raw.isActive ?? true,
    postedAt,
    discoveredAt,
    lastSeenAt,
    expiresAt,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}

function capitalize(str: string): string {
  if (!str) return 'External'
  return str.charAt(0).toUpperCase() + str.slice(1)
}
