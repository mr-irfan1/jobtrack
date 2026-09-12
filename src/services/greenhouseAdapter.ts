import type { CanonicalJob } from '../types/canonicalJob.ts'
import type { EmploymentType, WorkplaceType } from '../types/jobFeed.ts'
import type { FetchJobsOptions, JobProviderAdapter, JobProviderFetchResult } from './jobProviderAdapter.ts'
import {
  normalizeEmploymentType,
  normalizeJob,
  normalizeWorkplaceType,
} from './canonicalJobNormalizer.ts'

export interface GreenhouseMetadataItem {
  id?: number | string
  name: string
  value_type?: string
  value?: unknown
}

export interface GreenhouseDepartment {
  id?: number | string
  name: string
}

export interface GreenhouseOffice {
  id?: number | string
  name: string
  location?: string
}

export interface GreenhouseRawJob {
  id: number | string
  internal_job_id?: number | string
  title: string
  updated_at?: string
  requisition_id?: string | null
  absolute_url: string
  location?: {
    name?: string
  }
  metadata?: GreenhouseMetadataItem[]
  departments?: GreenhouseDepartment[]
  offices?: GreenhouseOffice[]
  content?: string
}

export interface GreenhouseBoardConfig {
  /** Identifier used on boards-api.greenhouse.io/{boardToken}/jobs, e.g. 'figma' */
  boardToken: string
  /** Human-readable company display name */
  companyName: string
  /** Optional company logo URL */
  companyLogo?: string | null
  /** Optional fallback category */
  defaultCategory?: string | null
  /** Whether this board is currently active for ingestion */
  isEnabled?: boolean
}

export interface GreenhouseAdapterOptions {
  baseUrl?: string
  boards?: GreenhouseBoardConfig[]
  cacheTtlMs?: number
}

/**
 * Curated initial allowlist of reputable tech companies using public Greenhouse job boards.
 * Configurable dynamically at runtime or via environment.
 */
export const DEFAULT_GREENHOUSE_BOARDS: GreenhouseBoardConfig[] = [
  {
    boardToken: 'figma',
    companyName: 'Figma',
    companyLogo: 'https://cdn.brandfetch.io/id5Mo_z_N8/theme/dark/logo.svg',
    defaultCategory: 'Design & Engineering',
    isEnabled: true,
  },
  {
    boardToken: 'vercel',
    companyName: 'Vercel',
    companyLogo: 'https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico',
    defaultCategory: 'Software Engineering',
    isEnabled: true,
  },
  {
    boardToken: 'automattic',
    companyName: 'Automattic',
    companyLogo: 'https://automattic.com/wp-content/themes/a8c/images/favicons/favicon.ico',
    defaultCategory: 'Software Engineering',
    isEnabled: true,
  },
  {
    boardToken: 'gitlab',
    companyName: 'GitLab',
    companyLogo: 'https://about.gitlab.com/ico/favicon.ico',
    defaultCategory: 'Engineering',
    isEnabled: true,
  },
]

/**
 * Extracts workplace type from Greenhouse job metadata or location hints.
 */
export function extractWorkplaceTypeFromGreenhouse(job: GreenhouseRawJob): WorkplaceType {
  // 1. Inspect custom Greenhouse metadata fields
  if (Array.isArray(job.metadata)) {
    for (const item of job.metadata) {
      const name = (item.name || '').toLowerCase()
      if (name.includes('workplace') || name.includes('work location') || name.includes('remote status')) {
        const val = typeof item.value === 'string' ? item.value : ''
        if (val) return normalizeWorkplaceType(val, job.location?.name)
      }
    }
  }

  // 2. Fall back to location string inspection
  return normalizeWorkplaceType(undefined, job.location?.name)
}

/**
 * Extracts employment type from Greenhouse job metadata.
 */
export function extractEmploymentTypeFromGreenhouse(job: GreenhouseRawJob): EmploymentType {
  if (Array.isArray(job.metadata)) {
    for (const item of job.metadata) {
      const name = (item.name || '').toLowerCase()
      const isEmploymentKey =
        name.includes('employment') ||
        name.includes('commitment') ||
        (name.includes('type') && !name.includes('workplace') && !name.includes('location'))
      if (isEmploymentKey) {
        const val = typeof item.value === 'string' ? item.value : ''
        if (val) return normalizeEmploymentType(val)
      }
    }
  }

  return normalizeEmploymentType(undefined)
}

/**
 * Greenhouse Provider Adapter.
 * Integrates public Greenhouse Job Board APIs (boards-api.greenhouse.io).
 * Read-only; no API keys required for public boards.
 */
export class GreenhouseAdapter implements JobProviderAdapter<GreenhouseRawJob> {
  readonly providerName = 'greenhouse'
  private readonly baseUrl: string
  private readonly cacheTtlMs: number
  private boards: Map<string, GreenhouseBoardConfig>
  private cachedJobs: CanonicalJob[] | null = null
  private cacheTimestamp = 0

  constructor(options?: GreenhouseAdapterOptions) {
    this.baseUrl = (options?.baseUrl || 'https://boards-api.greenhouse.io/v1/boards').replace(/\/+$/, '')
    this.cacheTtlMs = options?.cacheTtlMs ?? 5 * 60 * 1000

    this.boards = new Map()
    const initialBoards = options?.boards || DEFAULT_GREENHOUSE_BOARDS
    for (const b of initialBoards) {
      this.boards.set(b.boardToken.toLowerCase(), { ...b, isEnabled: b.isEnabled ?? true })
    }
  }

  getSourceJobId(rawJob: GreenhouseRawJob): string {
    return String(rawJob.id)
  }

  /**
   * Configures or updates a company board in the allowlist.
   */
  setBoard(config: GreenhouseBoardConfig): void {
    this.boards.set(config.boardToken.toLowerCase(), {
      ...config,
      isEnabled: config.isEnabled ?? true,
    })
    this.clearCache()
  }

  /**
   * Retrieves all currently configured company boards.
   */
  getBoards(): GreenhouseBoardConfig[] {
    return Array.from(this.boards.values())
  }

  /**
   * Removes a board token from the allowlist.
   */
  removeBoard(boardToken: string): void {
    this.boards.delete(boardToken.toLowerCase())
    this.clearCache()
  }

  /**
   * Normalizes a single Greenhouse raw job into the CanonicalJob format.
   */
  normalizeJob(rawJob: GreenhouseRawJob, boardConfig?: GreenhouseBoardConfig): CanonicalJob {
    const company = boardConfig?.companyName || 'Greenhouse Partner'
    const location = rawJob.location?.name?.trim() || 'Remote'
    const workplaceType = extractWorkplaceTypeFromGreenhouse(rawJob)
    const employmentType = extractEmploymentTypeFromGreenhouse(rawJob)
    const category = rawJob.departments?.[0]?.name?.trim() || boardConfig?.defaultCategory || null

    return normalizeJob(
      {
        id: `greenhouse_${rawJob.id}`,
        source: this.providerName,
        sourceJobId: rawJob.id,
        rawSourceId: rawJob.internal_job_id ? String(rawJob.internal_job_id) : String(rawJob.id),
        sourceName: `${company} (Greenhouse)`,
        sourceUrl: rawJob.absolute_url,
        applyUrl: rawJob.absolute_url,
        title: rawJob.title,
        company,
        companyLogo: boardConfig?.companyLogo || null,
        description: rawJob.content,
        location,
        workplaceType,
        employmentType,
        category,
        postedAt: rawJob.updated_at,
        sourceMetadata: {
          board_token: boardConfig?.boardToken,
          requisition_id: rawJob.requisition_id,
          internal_job_id: rawJob.internal_job_id,
          departments: rawJob.departments,
          offices: rawJob.offices,
        },
      },
      this.providerName,
    )
  }

  /**
   * Fetches job listings for a single Greenhouse company board.
   */
  async fetchBoardJobs(
    board: GreenhouseBoardConfig,
    options?: FetchJobsOptions,
  ): Promise<{ success: boolean; jobs: CanonicalJob[]; error?: string; statusCode?: number }> {
    const timeoutMs = options?.timeoutMs ?? 8000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    try {
      const url = `${this.baseUrl}/${encodeURIComponent(board.boardToken)}/jobs?content=true`
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })
      clearTimeout(timeoutId)

      if (res.status === 404) {
        return {
          success: false,
          jobs: [],
          error: `Greenhouse board "${board.boardToken}" was not found (HTTP 404)`,
          statusCode: 404,
        }
      }

      if (res.status === 429) {
        return {
          success: false,
          jobs: [],
          error: `Rate limited by Greenhouse API for board "${board.boardToken}" (HTTP 429)`,
          statusCode: 429,
        }
      }

      if (!res.ok) {
        return {
          success: false,
          jobs: [],
          error: `Greenhouse API returned HTTP ${res.status} for board "${board.boardToken}"`,
          statusCode: res.status,
        }
      }

      let data: unknown
      try {
        data = await res.json()
      } catch {
        return {
          success: false,
          jobs: [],
          error: `Received malformed non-JSON response from Greenhouse board "${board.boardToken}"`,
        }
      }

      if (!data || typeof data !== 'object' || !('jobs' in data) || !Array.isArray((data as { jobs: unknown }).jobs)) {
        return {
          success: false,
          jobs: [],
          error: `Unexpected schema from Greenhouse board "${board.boardToken}": missing "jobs" array`,
        }
      }

      const rawJobs = (data as { jobs: GreenhouseRawJob[] }).jobs
      const canonicalJobs: CanonicalJob[] = []

      for (const raw of rawJobs) {
        if (!raw || typeof raw !== 'object') continue
        try {
          canonicalJobs.push(this.normalizeJob(raw, board))
        } catch {
          // Skip individually corrupted items without failing the entire board
        }
      }

      return {
        success: true,
        jobs: canonicalJobs,
      }
    } catch (err) {
      clearTimeout(timeoutId)
      const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'))
      const errorMsg = isTimeout
        ? `Greenhouse request for board "${board.boardToken}" timed out after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : `Network error querying Greenhouse board "${board.boardToken}"`

      return {
        success: false,
        jobs: [],
        error: errorMsg,
      }
    }
  }

  /**
   * Fetches and aggregates jobs across all configured, enabled Greenhouse boards.
   * Resilient to partial board failures: if one board is unavailable, results from
   * remaining boards are successfully returned.
   */
  async fetchJobs(options?: FetchJobsOptions): Promise<JobProviderFetchResult> {
    const now = Date.now()

    if (!options?.forceRefresh && this.cachedJobs && now - this.cacheTimestamp < this.cacheTtlMs) {
      return {
        success: true,
        jobs: this.cachedJobs,
        fromCache: true,
      }
    }

    const enabledBoards = Array.from(this.boards.values()).filter((b) => b.isEnabled)
    if (enabledBoards.length === 0) {
      return {
        success: true,
        jobs: [],
        fromCache: false,
      }
    }

    const boardResults = await Promise.allSettled(
      enabledBoards.map((board) => this.fetchBoardJobs(board, options)),
    )

    const aggregatedJobs: CanonicalJob[] = []
    const boardErrors: Record<string, string> = {}
    let successfulBoards = 0

    boardResults.forEach((result, idx) => {
      const board = enabledBoards[idx]
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          aggregatedJobs.push(...result.value.jobs)
          successfulBoards++
        } else if (result.value.error) {
          boardErrors[board.boardToken] = result.value.error
        }
      } else {
        boardErrors[board.boardToken] = result.reason instanceof Error ? result.reason.message : 'Unknown rejection'
      }
    })

    // If all boards failed, report failure with details
    if (successfulBoards === 0 && Object.keys(boardErrors).length > 0) {
      return {
        success: false,
        jobs: this.cachedJobs || [],
        error: `All Greenhouse boards failed: ${Object.values(boardErrors).join('; ')}`,
        fromCache: Boolean(this.cachedJobs),
        metadata: { boardErrors },
      }
    }

    // Deduplicate cross-board listings by canonicalUrl and id
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

    // Cache results
    this.cachedJobs = deduplicated
    this.cacheTimestamp = now

    return {
      success: true,
      jobs: deduplicated,
      fromCache: false,
      metadata: {
        totalBoards: enabledBoards.length,
        successfulBoards,
        boardErrors,
      },
    }
  }

  clearCache(): void {
    this.cachedJobs = null
    this.cacheTimestamp = 0
  }
}
