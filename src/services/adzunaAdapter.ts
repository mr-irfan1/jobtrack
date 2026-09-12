import type { CanonicalJob } from '../types/canonicalJob.ts'
import type { EmploymentType, WorkplaceType } from '../types/jobFeed.ts'
import type { FetchJobsOptions, JobProviderAdapter, JobProviderFetchResult } from './jobProviderAdapter.ts'
import {
  normalizeDate,
  normalizeEmploymentType,
  normalizeJob,
  normalizeSalary,
  normalizeString,
  normalizeWorkplaceType,
  sanitizeHtmlDescription,
  sanitizeUrl,
} from './canonicalJobNormalizer.ts'

/**
 * Raw Adzuna Job listing item returned by the Adzuna Search API.
 * https://developer.adzuna.com/
 */
export interface AdzunaRawJob {
  id: string | number
  title?: string
  description?: string
  company?: {
    display_name?: string
    [key: string]: unknown
  }
  location?: {
    display_name?: string
    area?: string[]
    [key: string]: unknown
  }
  category?: {
    label?: string
    tag?: string
    [key: string]: unknown
  }
  salary_min?: number | null
  salary_max?: number | null
  salary_is_predicted?: string | number | null
  contract_time?: string | null // 'full_time' | 'part_time'
  contract_type?: string | null // 'permanent' | 'contract'
  redirect_url?: string
  created?: string
  latitude?: number | null
  longitude?: number | null
  adref?: string | null
  [key: string]: unknown
}

/**
 * Adzuna API search endpoint response envelope.
 */
export interface AdzunaSearchResponse {
  count?: number
  mean?: number
  results?: AdzunaRawJob[]
  [key: string]: unknown
}

/**
 * Search query options for Adzuna job search.
 */
export interface AdzunaSearchQuery {
  what?: string
  where?: string
  category?: string
}

/**
 * Configuration options for the Adzuna adapter.
 */
export interface AdzunaAdapterOptions {
  appId?: string
  appKey?: string
  country?: string
  searchQuery?: AdzunaSearchQuery
  resultsPerPage?: number
  maxPages?: number
  timeoutMs?: number
  cacheTtlMs?: number
  baseUrl?: string
}

/**
 * Extended fetch options allowing query overrides per run.
 */
export interface AdzunaFetchOptions extends FetchJobsOptions {
  country?: string
  searchQuery?: AdzunaSearchQuery
  resultsPerPage?: number
  maxPages?: number
}

/**
 * Known default currencies by country code.
 */
export const ADZUNA_COUNTRY_CURRENCIES: Record<string, string> = {
  us: 'USD',
  gb: 'GBP',
  uk: 'GBP',
  ca: 'CAD',
  au: 'AUD',
  de: 'EUR',
  fr: 'EUR',
  nl: 'EUR',
  it: 'EUR',
  es: 'EUR',
  at: 'EUR',
  be: 'EUR',
  in: 'INR',
  sg: 'SGD',
  br: 'BRL',
  mx: 'MXN',
  nz: 'NZD',
  pl: 'PLN',
  za: 'ZAR',
}

/**
 * Redacts Adzuna secrets from URLs and messages so credentials are never logged.
 */
export function sanitizeAdzunaUrl(rawUrl: string): string {
  return rawUrl
    .replace(/([?&]app_id=)[^&]+/gi, '$1[REDACTED]')
    .replace(/([?&]app_key=)[^&]+/gi, '$1[REDACTED]')
}

/**
 * Safely reads environment variables in Node.js environments without breaking browsers.
 */
function readServerEnv(key: string): string | undefined {
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  if (typeof g.process !== 'undefined' && g.process?.env && typeof g.process.env[key] === 'string') {
    return g.process.env[key]
  }
  return undefined
}

/**
 * Maps Adzuna contract_time and contract_type to Canonical EmploymentType.
 */
export function extractEmploymentTypeFromAdzuna(job: AdzunaRawJob): EmploymentType {
  const time = (job.contract_time || '').toLowerCase()
  const type = (job.contract_type || '').toLowerCase()

  if (time === 'part_time') return 'Part-time'
  if (type === 'contract') return 'Contract'
  if (time === 'full_time' || type === 'permanent') return 'Full-time'

  // Fall back to scanning title
  return normalizeEmploymentType(job.title)
}

/**
 * Maps Adzuna location fields to Canonical WorkplaceType.
 */
export function extractWorkplaceTypeFromAdzuna(job: AdzunaRawJob): WorkplaceType {
  const locDisplay = job.location?.display_name || ''
  const areas = Array.isArray(job.location?.area) ? job.location.area.join(' ') : ''
  const combined = `${locDisplay} ${areas} ${job.title || ''}`
  return normalizeWorkplaceType(undefined, combined)
}

/**
 * Adzuna Provider Adapter.
 * Server-side job provider integrating the Adzuna Job Search API.
 * Credentials (app_id, app_key) are strictly loaded from server-side environment or constructor,
 * and are NEVER logged or exposed to the client bundle.
 */
export class AdzunaAdapter implements JobProviderAdapter<AdzunaRawJob> {
  readonly providerName = 'adzuna'

  private appId?: string
  private appKey?: string
  private country: string
  private searchQuery: AdzunaSearchQuery
  private resultsPerPage: number
  private maxPages: number
  private readonly timeoutMs: number
  private readonly cacheTtlMs: number
  private readonly baseUrl: string

  private cachedJobs: CanonicalJob[] | null = null
  private cacheTimestamp = 0

  constructor(options?: AdzunaAdapterOptions) {
    // Read credentials from options or server-side environment variables
    this.appId = options?.appId || readServerEnv('ADZUNA_APP_ID')
    this.appKey = options?.appKey || readServerEnv('ADZUNA_APP_KEY')
    this.country = (options?.country || 'us').toLowerCase()
    this.searchQuery = {
      what: options?.searchQuery?.what ?? 'software engineer',
      where: options?.searchQuery?.where,
      category: options?.searchQuery?.category,
    }
    this.resultsPerPage = Math.min(Math.max(options?.resultsPerPage ?? 20, 1), 50)
    this.maxPages = Math.max(options?.maxPages ?? 1, 1)
    this.timeoutMs = options?.timeoutMs ?? 8000
    this.cacheTtlMs = options?.cacheTtlMs ?? 5 * 60 * 1000 // 5 minutes
    this.baseUrl = options?.baseUrl || 'https://api.adzuna.com/v1/api/jobs'
  }

  /**
   * Updates credentials securely at runtime (server-side only).
   */
  setCredentials(appId?: string, appKey?: string): void {
    this.appId = appId || readServerEnv('ADZUNA_APP_ID')
    this.appKey = appKey || readServerEnv('ADZUNA_APP_KEY')
    this.clearCache()
  }

  /**
   * Checks whether credentials are configured without revealing their values.
   */
  hasCredentials(): boolean {
    return Boolean(this.appId && this.appKey)
  }

  getCountry(): string {
    return this.country
  }

  setCountry(country: string): void {
    this.country = (country || 'us').toLowerCase()
    this.clearCache()
  }

  getSearchQuery(): AdzunaSearchQuery {
    return { ...this.searchQuery }
  }

  setSearchQuery(query: AdzunaSearchQuery): void {
    this.searchQuery = { ...query }
    this.clearCache()
  }

  getResultsPerPage(): number {
    return this.resultsPerPage
  }

  setResultsPerPage(count: number): void {
    this.resultsPerPage = Math.min(Math.max(count, 1), 50)
    this.clearCache()
  }

  getMaxPages(): number {
    return this.maxPages
  }

  setMaxPages(pages: number): void {
    this.maxPages = Math.max(pages, 1)
    this.clearCache()
  }

  getSourceJobId(rawJob: AdzunaRawJob): string {
    return String(rawJob.id || '')
  }

  /**
   * Normalizes an Adzuna raw job record into the Canonical Job format.
   */
  normalizeJob(rawJob: AdzunaRawJob): CanonicalJob {
    const rawId = this.getSourceJobId(rawJob)
    const company = normalizeString(rawJob.company?.display_name, 'Adzuna Employer')
    const location = normalizeString(rawJob.location?.display_name, 'Remote')
    const rawTitleClean = sanitizeHtmlDescription(rawJob.title)
    const title = normalizeString(rawTitleClean || rawJob.title, 'Job Opportunity')
    const cleanDesc = sanitizeHtmlDescription(rawJob.description)

    const currency = ADZUNA_COUNTRY_CURRENCIES[this.country] || 'USD'
    const salary = normalizeSalary({
      min: rawJob.salary_min ?? undefined,
      max: rawJob.salary_max ?? undefined,
      currency,
      period: 'yearly',
    })

    const workplaceType = extractWorkplaceTypeFromAdzuna(rawJob)
    const employmentType = extractEmploymentTypeFromAdzuna(rawJob)
    const applyUrl = sanitizeUrl(rawJob.redirect_url)
    const postedAt = normalizeDate(rawJob.created)

    return normalizeJob({
      source: this.providerName,
      sourceJobId: rawId,
      rawSourceId: rawJob.id,
      sourceName: 'Adzuna',
      sourceUrl: applyUrl,
      title,
      company,
      description: cleanDesc,
      location,
      workplaceType,
      employmentType,
      category: rawJob.category?.label || 'General',
      salaryRaw: salary.raw,
      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryCurrency: salary.currency,
      salaryPeriod: salary.period,
      applyUrl,
      postedAt,
      sourceMetadata: {
        adref: rawJob.adref || null,
        salaryIsPredicted: String(rawJob.salary_is_predicted) === '1',
        contractTime: rawJob.contract_time || null,
        contractType: rawJob.contract_type || null,
        categoryTag: rawJob.category?.tag || null,
        latitude: rawJob.latitude ?? null,
        longitude: rawJob.longitude ?? null,
        area: Array.isArray(rawJob.location?.area) ? rawJob.location.area : [],
        country: this.country,
      },
    }, this.providerName)
  }

  /**
   * Builds the parameterized search URL for a given page.
   */
  private buildSearchUrl(page: number, options?: AdzunaFetchOptions): string {
    const country = (options?.country || this.country).toLowerCase()
    const what = options?.searchQuery?.what ?? this.searchQuery.what
    const where = options?.searchQuery?.where ?? this.searchQuery.where
    const category = options?.searchQuery?.category ?? this.searchQuery.category
    const resultsPerPage = options?.resultsPerPage ?? this.resultsPerPage

    const params = new URLSearchParams({
      app_id: this.appId || '',
      app_key: this.appKey || '',
      results_per_page: String(resultsPerPage),
      'content-type': 'application/json',
    })

    if (what) params.set('what', what)
    if (where) params.set('where', where)
    if (category) params.set('category', category)

    return `${this.baseUrl}/${country}/search/${page}?${params.toString()}`
  }

  /**
   * Fetches a single page of results from Adzuna.
   */
  async fetchPage(
    page = 1,
    options?: AdzunaFetchOptions,
  ): Promise<{ success: boolean; jobs: CanonicalJob[]; error?: string; statusCode?: number; count?: number }> {
    if (!this.hasCredentials()) {
      return {
        success: false,
        jobs: [],
        error: 'Adzuna credentials missing: ADZUNA_APP_ID and ADZUNA_APP_KEY must be configured in server environment',
      }
    }

    const timeoutMs = options?.timeoutMs ?? this.timeoutMs
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const url = this.buildSearchUrl(page, options)

    try {
      const res = await fetch(url, {
        signal: options?.signal || controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })
      clearTimeout(timeoutId)

      // Handle Authentication Failure
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          statusCode: res.status,
          jobs: [],
          error: 'Adzuna authentication failed: invalid app_id or app_key',
        }
      }

      // Handle Rate Limiting
      if (res.status === 429) {
        return {
          success: false,
          statusCode: 429,
          jobs: [],
          error: 'Adzuna API rate limit reached (HTTP 429). Please back off before retrying.',
        }
      }

      // Handle other non-OK HTTP errors
      if (!res.ok) {
        return {
          success: false,
          statusCode: res.status,
          jobs: [],
          error: `Adzuna API responded with HTTP status ${res.status}`,
        }
      }

      // Parse JSON safely
      let data: AdzunaSearchResponse
      try {
        data = (await res.json()) as AdzunaSearchResponse
      } catch {
        return {
          success: false,
          statusCode: res.status,
          jobs: [],
          error: 'Malformed response received from Adzuna API',
        }
      }

      if (!data || typeof data !== 'object' || !Array.isArray(data.results)) {
        return {
          success: false,
          statusCode: res.status,
          jobs: [],
          error: 'Malformed response received from Adzuna API: results array missing',
        }
      }

      const canonicalList: CanonicalJob[] = []
      for (const raw of data.results) {
        if (!raw || typeof raw !== 'object') continue
        try {
          canonicalList.push(this.normalizeJob(raw))
        } catch {
          // Skip individual corrupted records without failing the batch
        }
      }

      return {
        success: true,
        jobs: canonicalList,
        count: typeof data.count === 'number' ? data.count : canonicalList.length,
      }
    } catch (err) {
      clearTimeout(timeoutId)
      const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'))
      const rawErrorMsg = isTimeout
        ? `Adzuna API request timed out after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : 'Network failure communicating with Adzuna API'

      // Always sanitize any error message to guarantee credentials are never revealed
      return {
        success: false,
        jobs: [],
        error: sanitizeAdzunaUrl(rawErrorMsg),
      }
    }
  }

  /**
   * Fetches Adzuna jobs across configured pages with in-memory caching and deduplication.
   */
  async fetchJobs(options?: AdzunaFetchOptions): Promise<JobProviderFetchResult> {
    const now = Date.now()

    // 1. Return cache if still fresh and not force-refreshed
    if (!options?.forceRefresh && this.cachedJobs && now - this.cacheTimestamp < this.cacheTtlMs) {
      return {
        success: true,
        jobs: this.cachedJobs,
        fromCache: true,
      }
    }

    // 2. Validate credentials
    if (!this.hasCredentials()) {
      return {
        success: false,
        jobs: this.cachedJobs || [],
        error: 'Adzuna credentials missing: ADZUNA_APP_ID and ADZUNA_APP_KEY must be configured in server environment',
        fromCache: Boolean(this.cachedJobs),
      }
    }

    const maxPages = options?.maxPages ?? this.maxPages
    const aggregatedJobs: CanonicalJob[] = []
    let lastError: string | undefined
    let lastStatusCode: number | undefined
    let totalPagesFetched = 0

    for (let page = 1; page <= maxPages; page++) {
      const pageResult = await this.fetchPage(page, options)
      totalPagesFetched++

      if (!pageResult.success) {
        lastError = pageResult.error
        lastStatusCode = pageResult.statusCode
        // If first page fails due to auth or rate limit, break immediately
        if (page === 1) break
        // Otherwise keep partial results from earlier pages
        break
      }

      aggregatedJobs.push(...pageResult.jobs)

      // Stop paging if returned jobs are fewer than requested results per page
      const rpp = options?.resultsPerPage ?? this.resultsPerPage
      if (pageResult.jobs.length < rpp) {
        break
      }
    }

    // If completely failed with zero aggregated jobs
    if (aggregatedJobs.length === 0 && lastError) {
      return {
        success: false,
        jobs: this.cachedJobs || [],
        statusCode: lastStatusCode,
        error: lastError,
        fromCache: Boolean(this.cachedJobs),
      }
    }

    // Deduplicate across pages by canonicalUrl and id
    const seenUrls = new Set<string>()
    const seenIds = new Set<string>()
    const deduplicated: CanonicalJob[] = []

    for (const job of aggregatedJobs) {
      if (seenIds.has(job.id)) continue
      if (job.canonicalUrl && seenUrls.has(job.canonicalUrl)) continue

      seenIds.add(job.id)
      if (job.canonicalUrl) seenUrls.add(job.canonicalUrl)
      deduplicated.push(job)
    }

    // Cache successful batch
    this.cachedJobs = deduplicated
    this.cacheTimestamp = now

    return {
      success: true,
      jobs: deduplicated,
      fromCache: false,
      metadata: {
        country: options?.country || this.country,
        totalPagesFetched,
        rawResultCount: aggregatedJobs.length,
        deduplicatedCount: deduplicated.length,
      },
    }
  }

  clearCache(): void {
    this.cachedJobs = null
    this.cacheTimestamp = 0
  }
}
