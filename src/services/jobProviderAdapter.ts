import type { CanonicalJob } from '../types/canonicalJob.ts'
import type { RemotiveRawJob } from './jobFeedService.ts'
import { normalizeJob } from './canonicalJobNormalizer.ts'

export interface FetchJobsOptions {
  limit?: number
  forceRefresh?: boolean
  signal?: AbortSignal
  timeoutMs?: number
}

export interface JobProviderFetchResult {
  success: boolean
  jobs: CanonicalJob[]
  error?: string
  statusCode?: number
  fromCache?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Provider Adapter Contract.
 * Every job provider (Remotive, Greenhouse, Adzuna, Lever, etc.) implements this
 * contract to translate provider-specific data into the canonical schema.
 */
export interface JobProviderAdapter<TRaw = unknown> {
  readonly providerName: string
  getSourceJobId(rawJob: TRaw): string
  normalizeJob(rawJob: TRaw): CanonicalJob
  fetchJobs(options?: FetchJobsOptions): Promise<JobProviderFetchResult>
}

/**
 * Remotive Provider Adapter.
 * Normalizes Remotive API remote jobs into the CanonicalJob format.
 * Sourced via Remotive's public developer API (https://remotive.com/api/remote-jobs).
 */
export class RemotiveAdapter implements JobProviderAdapter<RemotiveRawJob> {
  readonly providerName = 'remotive'
  private readonly baseUrl: string
  private readonly cacheTtlMs: number
  private cachedJobs: CanonicalJob[] | null = null
  private cacheTimestamp = 0

  constructor(options?: { baseUrl?: string; cacheTtlMs?: number }) {
    this.baseUrl = options?.baseUrl || 'https://remotive.com/api/remote-jobs'
    this.cacheTtlMs = options?.cacheTtlMs ?? 5 * 60 * 1000 // 5 minutes default
  }

  getSourceJobId(rawJob: RemotiveRawJob): string {
    return String(rawJob.id)
  }

  normalizeJob(rawJob: RemotiveRawJob): CanonicalJob {
    const loc = rawJob.candidate_required_location?.trim()
    const displayLocation = !loc || loc.toLowerCase() === 'anywhere' || loc.toLowerCase() === 'worldwide'
      ? 'Remote (Worldwide)'
      : loc.toLowerCase().includes('remote')
        ? loc
        : `Remote (${loc})`

    return normalizeJob(
      {
        id: `remotive_${rawJob.id}`,
        source: this.providerName,
        sourceJobId: rawJob.id,
        rawSourceId: String(rawJob.id),
        sourceName: 'Remotive',
        sourceUrl: rawJob.url,
        applyUrl: rawJob.url,
        title: rawJob.title,
        company: rawJob.company_name,
        companyLogo: rawJob.company_logo,
        description: rawJob.description,
        location: displayLocation,
        workplaceType: 'Remote',
        employmentType: rawJob.job_type,
        category: rawJob.category,
        skills: rawJob.tags,
        salaryRaw: rawJob.salary,
        postedAt: rawJob.publication_date,
        sourceMetadata: {
          candidate_required_location: rawJob.candidate_required_location,
          remotive_category: rawJob.category,
        },
      },
      this.providerName,
    )
  }

  /**
   * Fetches remote listings from Remotive API.
   * Resiliently handles:
   * - Network timeouts (aborts within timeoutMs)
   * - Rate limits (HTTP 429)
   * - Server errors (HTTP 5xx)
   * - Malformed JSON / unexpected schema
   * - Empty responses
   * Never throws unhandled exceptions; returns structured result.
   */
  async fetchJobs(options?: FetchJobsOptions): Promise<JobProviderFetchResult> {
    const now = Date.now()

    // 1. Return in-memory cached results if fresh
    if (!options?.forceRefresh && this.cachedJobs && now - this.cacheTimestamp < this.cacheTtlMs) {
      return {
        success: true,
        jobs: this.cachedJobs,
        fromCache: true,
      }
    }

    const limit = options?.limit ?? 60
    const timeoutMs = options?.timeoutMs ?? 8000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    // Forward parent abort signal if provided
    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    try {
      const url = `${this.baseUrl}${this.baseUrl.includes('?') ? '&' : '?'}limit=${limit}`
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })
      clearTimeout(timeoutId)

      // Handle Rate Limiting (HTTP 429)
      if (res.status === 429) {
        return {
          success: false,
          jobs: this.cachedJobs || [],
          error: 'Remotive API rate limit reached (HTTP 429)',
          statusCode: 429,
          fromCache: Boolean(this.cachedJobs),
        }
      }

      // Handle other non-200 HTTP statuses
      if (!res.ok) {
        return {
          success: false,
          jobs: this.cachedJobs || [],
          error: `Remotive API returned HTTP ${res.status}: ${res.statusText}`,
          statusCode: res.status,
          fromCache: Boolean(this.cachedJobs),
        }
      }

      // Parse JSON safely
      let data: unknown
      try {
        data = await res.json()
      } catch {
        return {
          success: false,
          jobs: this.cachedJobs || [],
          error: 'Received malformed non-JSON response from Remotive API',
          fromCache: Boolean(this.cachedJobs),
        }
      }

      // Validate schema
      if (!data || typeof data !== 'object' || !('jobs' in data) || !Array.isArray((data as { jobs: unknown }).jobs)) {
        return {
          success: false,
          jobs: this.cachedJobs || [],
          error: 'Unexpected Remotive API response schema: missing "jobs" array',
          fromCache: Boolean(this.cachedJobs),
        }
      }

      const rawJobs = (data as { jobs: RemotiveRawJob[] }).jobs

      if (rawJobs.length === 0) {
        return {
          success: true,
          jobs: [],
          fromCache: false,
        }
      }

      // Normalize each job into CanonicalJob
      const canonicalJobs: CanonicalJob[] = []
      for (const raw of rawJobs) {
        if (!raw || typeof raw !== 'object') continue
        try {
          canonicalJobs.push(this.normalizeJob(raw))
        } catch {
          // If a single record is malformed, skip it without failing the whole batch
        }
      }

      this.cachedJobs = canonicalJobs
      this.cacheTimestamp = now

      return {
        success: true,
        jobs: canonicalJobs,
        fromCache: false,
      }
    } catch (err) {
      clearTimeout(timeoutId)
      const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'))
      const errorMsg = isTimeout
        ? `Remotive API request timed out after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : 'Network failure fetching Remotive jobs'

      return {
        success: false,
        jobs: this.cachedJobs || [],
        error: errorMsg,
        fromCache: Boolean(this.cachedJobs),
      }
    }
  }

  clearCache(): void {
    this.cachedJobs = null
    this.cacheTimestamp = 0
  }
}

import { GreenhouseAdapter } from './greenhouseAdapter.ts'
import { AdzunaAdapter } from './adzunaAdapter.ts'
export { GreenhouseAdapter, AdzunaAdapter }

// Global Adapter Registry
const adapterRegistry = new Map<string, JobProviderAdapter>()

// Pre-register default Remotive, Greenhouse, and Adzuna adapters
export const defaultRemotiveAdapter = new RemotiveAdapter()
export const defaultGreenhouseAdapter = new GreenhouseAdapter()
export const defaultAdzunaAdapter = new AdzunaAdapter()

adapterRegistry.set(defaultRemotiveAdapter.providerName, defaultRemotiveAdapter)
adapterRegistry.set(defaultGreenhouseAdapter.providerName, defaultGreenhouseAdapter)
adapterRegistry.set(defaultAdzunaAdapter.providerName, defaultAdzunaAdapter)

export function registerProviderAdapter(adapter: JobProviderAdapter): void {
  adapterRegistry.set(adapter.providerName.toLowerCase(), adapter)
}

export function getProviderAdapter(providerName: string): JobProviderAdapter | undefined {
  return adapterRegistry.get(providerName.toLowerCase())
}

export function getAllProviderAdapters(): JobProviderAdapter[] {
  return Array.from(adapterRegistry.values())
}
