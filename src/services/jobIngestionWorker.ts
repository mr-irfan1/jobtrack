import type { SupabaseClient } from '@supabase/supabase-js'
import type { CanonicalJob } from '../types/canonicalJob.ts'
import type { JobProviderAdapter } from './jobProviderAdapter.ts'
import { defaultRemotiveAdapter, defaultGreenhouseAdapter, defaultAdzunaAdapter } from './jobProviderAdapter.ts'
import { sanitizeAdzunaUrl } from './adzunaAdapter.ts'
import { canonicalizeUrl } from './canonicalJobNormalizer.ts'

/**
 * Database representation of a row in the public.jobs table.
 */
export interface JobDatabaseRow {
  id: string
  source: string
  source_job_id: string
  raw_source_id: string | null
  source_name: string
  source_url: string | null
  apply_url: string
  canonical_url: string
  title: string
  company: string
  company_logo: string | null
  description: string
  location: string
  workplace_type: 'Remote' | 'Hybrid' | 'On-site'
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Other'
  category: string | null
  skills: string[]
  salary_raw: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  normalized_title: string
  normalized_company: string
  normalized_location: string
  source_metadata: Record<string, unknown>
  is_active: boolean
  posted_at: string
  discovered_at: string
  last_seen_at: string
  expires_at: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Database representation of a row in public.ingestion_runs.
 */
export interface IngestionRunRow {
  id: string
  source: string
  status: 'started' | 'completed' | 'failed' | 'partial'
  started_at: string
  completed_at?: string | null
  fetched_count: number
  inserted_count: number
  updated_count: number
  deduplicated_count: number
  failed_count: number
  error_message?: string | null
  metadata: Record<string, unknown>
}

/**
 * Database client contract for persisting normalized jobs and ingestion metrics.
 * Allows deterministic mocking in test suites and serverless execution.
 */
export interface IngestionDatabaseClient {
  findExistingJobs(source: string, sourceJobIds: string[]): Promise<Array<{
    id: string
    source: string
    source_job_id: string
    canonical_url: string
    posted_at: string
    discovered_at: string
  }>>
  upsertJobs(jobs: JobDatabaseRow[]): Promise<{ inserted: number; updated: number }>
  createIngestionRun(run: IngestionRunRow): Promise<void>
  updateIngestionRun(runId: string, update: Partial<IngestionRunRow>): Promise<void>
  updateJobSource(sourceId: string, update: {
    last_run_at: string
    last_success_at?: string
    last_error?: string | null
  }): Promise<void>
}

/**
 * Sanitizes any log or error string to guarantee secrets or tokens are never exposed.
 */
export function sanitizeLogString(raw: string): string {
  return sanitizeAdzunaUrl(raw)
    .replace(/(app_id=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/(app_key=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/(bearer\s+)[a-zA-Z0-9_\-\.]+/gi, '$1[REDACTED]')
    .replace(/(key=)[a-zA-Z0-9_\-]+/gi, '$1[REDACTED]')
    .replace(/(token=)[a-zA-Z0-9_\-]+/gi, '$1[REDACTED]')
    .replace(/(password=)[^&\s]+/gi, '$1[REDACTED]')
}

/**
 * Structured log entry emitted during ingestion runs.
 */
export interface IngestionLogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  provider?: string
  runId?: string
  counts?: {
    fetched?: number
    inserted?: number
    updated?: number
    deduplicated?: number
    failed?: number
  }
  durationMs?: number
  error?: string
  timestamp: string
}

export type IngestionLogger = (entry: IngestionLogEntry) => void

/**
 * Default logger that safely writes sanitized structured JSON to console.
 */
export const defaultIngestionLogger: IngestionLogger = (entry: IngestionLogEntry) => {
  const sanitizedEntry = {
    ...entry,
    message: sanitizeLogString(entry.message),
    error: entry.error ? sanitizeLogString(entry.error) : undefined,
  }
  if (entry.level === 'error') {
    console.error(JSON.stringify(sanitizedEntry))
  } else if (entry.level === 'warn') {
    console.warn(JSON.stringify(sanitizedEntry))
  } else {
    console.log(JSON.stringify(sanitizedEntry))
  }
}

/**
 * Validation result for a single canonical job record.
 */
export interface JobValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validates that a canonical job contains all essential non-empty fields.
 * Rejects records that lack title, company, valid apply URL, source, or sourceJobId.
 * Never fabricates values.
 */
export function validateCanonicalJob(job: CanonicalJob): JobValidationResult {
  if (!job) {
    return { valid: false, reason: 'Job object is null or undefined' }
  }
  if (!job.title || typeof job.title !== 'string' || !job.title.trim()) {
    return { valid: false, reason: 'Missing or empty title' }
  }
  if (!job.company || typeof job.company !== 'string' || !job.company.trim()) {
    return { valid: false, reason: 'Missing or empty company' }
  }
  if (!job.applyUrl || typeof job.applyUrl !== 'string' || !job.applyUrl.trim()) {
    return { valid: false, reason: 'Missing or empty applyUrl' }
  }
  if (!/^https?:\/\//i.test(job.applyUrl.trim())) {
    return { valid: false, reason: 'Invalid applyUrl protocol (must be http:// or https://)' }
  }
  if (!job.sourceJobId || typeof job.sourceJobId !== 'string' || !job.sourceJobId.trim()) {
    return { valid: false, reason: 'Missing or empty sourceJobId' }
  }
  if (!job.source || typeof job.source !== 'string' || !job.source.trim()) {
    return { valid: false, reason: 'Missing or empty source' }
  }
  return { valid: true }
}

/**
 * Deduplication result for a batch of jobs.
 */
export interface DeduplicationResult {
  uniqueJobs: CanonicalJob[]
  deduplicatedCount: number
}

/**
 * Deduplicates a list of canonical jobs:
 * Primary dedupe key: (source, source_job_id)
 * Secondary safety dedupe key: canonical_url (strips tracking query parameters)
 *
 * Does NOT merge legitimately different jobs (e.g. distinct roles or different locations).
 */
export function deduplicateCanonicalJobs(jobs: CanonicalJob[]): DeduplicationResult {
  const primaryKeys = new Set<string>()
  const canonicalUrls = new Set<string>()
  const uniqueJobs: CanonicalJob[] = []
  let deduplicatedCount = 0

  for (const job of jobs) {
    const primaryKey = `${job.source}::${job.sourceJobId}`
    if (primaryKeys.has(primaryKey)) {
      deduplicatedCount++
      continue
    }

    // Secondary safety dedupe by normalized canonical URL
    if (job.canonicalUrl && job.canonicalUrl.startsWith('http')) {
      const normUrl = canonicalizeUrl(job.canonicalUrl)
      if (canonicalUrls.has(normUrl)) {
        deduplicatedCount++
        continue
      }
      canonicalUrls.add(normUrl)
    }

    primaryKeys.add(primaryKey)
    uniqueJobs.push(job)
  }

  return { uniqueJobs, deduplicatedCount }
}

/**
 * Options for configuring the Ingestion Worker.
 */
export interface IngestionWorkerOptions {
  providers?: JobProviderAdapter[]
  databaseClient?: IngestionDatabaseClient
  logger?: IngestionLogger
  timeoutMs?: number // Default: 15,000ms
  maxRetries?: number // Default: 1 for transient failures
  retryDelayMs?: number // Default: 300ms
  batchSize?: number // Default: 50
}

/**
 * Detailed execution summary of an ingestion run for a single provider.
 */
export interface ProviderRunSummary {
  provider: string
  runId: string
  status: 'completed' | 'failed' | 'partial'
  durationMs: number
  fetchedCount: number
  validCount: number
  deduplicatedCount: number
  failedCount: number
  insertedCount: number
  updatedCount: number
  errorMessage?: string
}

/**
 * Aggregated summary of the entire worker run across all providers.
 */
export interface IngestionWorkerRunResult {
  runId: string
  startedAt: string
  completedAt: string
  totalDurationMs: number
  providers: Record<string, ProviderRunSummary>
  totals: {
    fetched: number
    valid: number
    deduplicated: number
    failed: number
    inserted: number
    updated: number
  }
}

/**
 * Determines whether an error is transient and safe to retry once.
 * Never retries authentication errors (401, 403), not found (404), or client bad requests (400).
 */
function isSafeTransientError(err: unknown): boolean {
  if (!err) return false
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
  if (msg.includes('401') || msg.includes('403') || msg.includes('auth') || msg.includes('credential')) {
    return false
  }
  if (msg.includes('404') || msg.includes('not found')) {
    return false
  }
  if (msg.includes('400') || msg.includes('bad request')) {
    return false
  }
  return (
    msg.includes('timeout') ||
    msg.includes('abort') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('502') ||
    msg.includes('econnreset') ||
    msg.includes('network')
  )
}

/**
 * In-memory Mock Database Client for deterministic unit testing and local verification.
 */
export class MockIngestionDatabaseClient implements IngestionDatabaseClient {
  public jobs: Map<string, JobDatabaseRow> = new Map()
  public ingestionRuns: IngestionRunRow[] = []
  public jobSources: Map<string, { last_run_at: string; last_success_at?: string; last_error?: string | null }> = new Map()

  async findExistingJobs(source: string, sourceJobIds: string[]) {
    const results: Array<{
      id: string
      source: string
      source_job_id: string
      canonical_url: string
      posted_at: string
      discovered_at: string
    }> = []

    for (const id of sourceJobIds) {
      const key = `${source}::${id}`
      const existing = this.jobs.get(key)
      if (existing) {
        results.push({
          id: existing.id,
          source: existing.source,
          source_job_id: existing.source_job_id,
          canonical_url: existing.canonical_url,
          posted_at: existing.posted_at,
          discovered_at: existing.discovered_at,
        })
      }
    }
    return results
  }

  async upsertJobs(jobs: JobDatabaseRow[]) {
    let inserted = 0
    let updated = 0

    for (const job of jobs) {
      const key = `${job.source}::${job.source_job_id}`
      if (this.jobs.has(key)) {
        const prev = this.jobs.get(key)!
        // Preserve original posted_at and discovered_at
        this.jobs.set(key, {
          ...job,
          id: prev.id,
          posted_at: prev.posted_at,
          discovered_at: prev.discovered_at,
          last_seen_at: job.last_seen_at,
          updated_at: new Date().toISOString(),
        })
        updated++
      } else {
        this.jobs.set(key, { ...job })
        inserted++
      }
    }

    return { inserted, updated }
  }

  async createIngestionRun(run: IngestionRunRow) {
    this.ingestionRuns.push({ ...run })
  }

  async updateIngestionRun(runId: string, update: Partial<IngestionRunRow>) {
    const idx = this.ingestionRuns.findIndex((r) => r.id === runId)
    if (idx !== -1) {
      this.ingestionRuns[idx] = { ...this.ingestionRuns[idx], ...update }
    }
  }

  async updateJobSource(
    sourceId: string,
    update: { last_run_at: string; last_success_at?: string; last_error?: string | null },
  ) {
    this.jobSources.set(sourceId, { ...update })
  }
}

/**
 * Production Supabase Database Client for server-side ingestion.
 */
export class SupabaseIngestionDatabaseClient implements IngestionDatabaseClient {
  private readonly supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async findExistingJobs(source: string, sourceJobIds: string[]) {
    if (sourceJobIds.length === 0) return []

    const { data, error } = await this.supabase
      .from('jobs')
      .select('id, source, source_job_id, canonical_url, posted_at, discovered_at')
      .eq('source', source)
      .in('source_job_id', sourceJobIds)

    if (error) {
      throw new Error(`Failed to query existing jobs: ${error.message}`)
    }

    return (data || []) as Array<{
      id: string
      source: string
      source_job_id: string
      canonical_url: string
      posted_at: string
      discovered_at: string
    }>
  }

  async upsertJobs(jobs: JobDatabaseRow[]) {
    if (jobs.length === 0) return { inserted: 0, updated: 0 }

    // Map rows for public.jobs schema
    const rows = jobs.map((job) => ({
      id: job.id,
      source: job.source,
      source_job_id: job.source_job_id,
      raw_source_id: job.raw_source_id,
      source_name: job.source_name,
      source_url: job.source_url,
      apply_url: job.apply_url,
      canonical_url: job.canonical_url,
      title: job.title,
      company: job.company,
      company_logo: job.company_logo,
      description: job.description,
      location: job.location,
      workplace_type: job.workplace_type,
      employment_type: job.employment_type,
      category: job.category,
      skills: job.skills,
      salary_raw: job.salary_raw,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      normalized_title: job.normalized_title,
      normalized_company: job.normalized_company,
      normalized_location: job.normalized_location,
      source_metadata: job.source_metadata,
      is_active: job.is_active,
      posted_at: job.posted_at,
      discovered_at: job.discovered_at,
      last_seen_at: job.last_seen_at,
      expires_at: job.expires_at,
    }))

    const { error } = await this.supabase
      .from('jobs')
      .upsert(rows, { onConflict: 'source,source_job_id', ignoreDuplicates: false })

    if (error) {
      throw new Error(`Failed to upsert jobs into database: ${error.message}`)
    }

    // Counts are determined by finding existing jobs beforehand
    return { inserted: jobs.length, updated: 0 }
  }

  async createIngestionRun(run: IngestionRunRow) {
    const { error } = await this.supabase.from('ingestion_runs').insert({
      id: run.id,
      source: run.source,
      status: run.status,
      started_at: run.started_at,
      fetched_count: run.fetched_count,
      inserted_count: run.inserted_count,
      updated_count: run.updated_count,
      deduplicated_count: run.deduplicated_count,
      failed_count: run.failed_count,
      error_message: run.error_message,
      metadata: run.metadata,
    })

    if (error) {
      console.error(`[IngestionWorker] Failed to create ingestion_runs record: ${error.message}`)
    }
  }

  async updateIngestionRun(runId: string, update: Partial<IngestionRunRow>) {
    const { error } = await this.supabase
      .from('ingestion_runs')
      .update(update)
      .eq('id', runId)

    if (error) {
      console.error(`[IngestionWorker] Failed to update ingestion_runs record ${runId}: ${error.message}`)
    }
  }

  async updateJobSource(
    sourceId: string,
    update: { last_run_at: string; last_success_at?: string; last_error?: string | null },
  ) {
    const { error } = await this.supabase
      .from('job_sources')
      .update(update)
      .eq('id', sourceId)

    if (error) {
      console.error(`[IngestionWorker] Failed to update job_sources for ${sourceId}: ${error.message}`)
    }
  }
}

/**
 * Server-Side Central Job Ingestion Worker.
 * Periodically orchestrates multi-provider ingestion (Remotive, Greenhouse, Adzuna).
 * Providers execute and fail independently.
 */
export class JobIngestionWorker {
  private readonly providers: JobProviderAdapter[]
  private readonly databaseClient?: IngestionDatabaseClient
  private readonly logger: IngestionLogger
  private readonly timeoutMs: number
  private readonly maxRetries: number
  private readonly retryDelayMs: number
  private readonly batchSize: number

  constructor(options?: IngestionWorkerOptions) {
    this.providers = options?.providers || [
      defaultRemotiveAdapter,
      defaultGreenhouseAdapter,
      defaultAdzunaAdapter,
    ]
    this.databaseClient = options?.databaseClient
    this.logger = options?.logger || defaultIngestionLogger
    this.timeoutMs = options?.timeoutMs ?? 15000
    this.maxRetries = options?.maxRetries ?? 1
    this.retryDelayMs = options?.retryDelayMs ?? 300
    this.batchSize = options?.batchSize ?? 50
  }

  private log(entry: IngestionLogEntry): void {
    this.logger({
      ...entry,
      message: sanitizeLogString(entry.message),
      error: entry.error ? sanitizeLogString(entry.error) : undefined,
    })
  }

  /**
   * Executes a single provider with safe retry and isolated error handling.
   */
  private async executeProviderWithRetry(
    provider: JobProviderAdapter,
    runId: string,
  ): Promise<{ success: boolean; jobs: CanonicalJob[]; error?: string }> {
    let attempts = 0
    let lastError: string | undefined

    while (attempts <= this.maxRetries) {
      attempts++
      try {
        const result = await provider.fetchJobs({
          timeoutMs: this.timeoutMs,
          forceRefresh: true,
        })

        if (result.success) {
          return { success: true, jobs: result.jobs }
        }

        lastError = sanitizeLogString(result.error || 'Provider fetch returned failure status')

        // Check if error is safe to retry
        if (attempts <= this.maxRetries && isSafeTransientError(lastError)) {
          this.log({
            level: 'warn',
            message: `Transient error from ${provider.providerName}, retrying attempt ${attempts}...`,
            provider: provider.providerName,
            runId,
            error: lastError,
            timestamp: new Date().toISOString(),
          })
          await new Promise((res) => setTimeout(res, this.retryDelayMs))
          continue
        }

        return { success: false, jobs: result.jobs || [], error: lastError }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)

        if (attempts <= this.maxRetries && isSafeTransientError(err)) {
          this.log({
            level: 'warn',
            message: `Transient exception from ${provider.providerName}, retrying attempt ${attempts}...`,
            provider: provider.providerName,
            runId,
            error: lastError,
            timestamp: new Date().toISOString(),
          })
          await new Promise((res) => setTimeout(res, this.retryDelayMs))
          continue
        }

        return { success: false, jobs: [], error: lastError }
      }
    }

    return { success: false, jobs: [], error: lastError || 'Exhausted retry attempts' }
  }

  /**
   * Runs the ingestion pipeline for a single provider.
   */
  async runProvider(provider: JobProviderAdapter): Promise<ProviderRunSummary> {
    const startTime = Date.now()
    const runId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const nowIso = new Date().toISOString()

    this.log({
      level: 'info',
      message: `Starting ingestion run for provider: ${provider.providerName}`,
      provider: provider.providerName,
      runId,
      timestamp: nowIso,
    })

    // Record started status in database if client is configured
    if (this.databaseClient) {
      try {
        await this.databaseClient.createIngestionRun({
          id: runId,
          source: provider.providerName,
          status: 'started',
          started_at: nowIso,
          fetched_count: 0,
          inserted_count: 0,
          updated_count: 0,
          deduplicated_count: 0,
          failed_count: 0,
          metadata: { initialAttemptAt: nowIso },
        })
      } catch (e) {
        this.log({
          level: 'warn',
          message: `Failed to write initial ingestion_run record for ${provider.providerName}`,
          provider: provider.providerName,
          runId,
          error: e instanceof Error ? e.message : String(e),
          timestamp: new Date().toISOString(),
        })
      }
    }

    // 1. Fetch raw jobs through adapter with retry
    const fetchResult = await this.executeProviderWithRetry(provider, runId)
    const rawJobs = fetchResult.jobs || []
    const fetchedCount = rawJobs.length

    // 2. Validate jobs (reject records missing essential fields)
    const validJobs: CanonicalJob[] = []
    let failedCount = 0

    for (const job of rawJobs) {
      const validation = validateCanonicalJob(job)
      if (validation.valid) {
        validJobs.push(job)
      } else {
        failedCount++
      }
    }

    // 3. Deduplicate
    const { uniqueJobs, deduplicatedCount } = deduplicateCanonicalJobs(validJobs)

    // 4. Persist / Upsert into database
    let insertedCount = 0
    let updatedCount = 0

    if (this.databaseClient && uniqueJobs.length > 0) {
      try {
        // Chunk upserts by batchSize
        for (let i = 0; i < uniqueJobs.length; i += this.batchSize) {
          const chunk = uniqueJobs.slice(i, i + this.batchSize)
          const sourceJobIds = chunk.map((j) => j.sourceJobId)

          // Check existing records to preserve posted_at and calculate exact insert/update metrics
          const existing = await this.databaseClient.findExistingJobs(provider.providerName, sourceJobIds)
          const existingMap = new Map(existing.map((e) => [e.source_job_id, e]))

          const dbRows: JobDatabaseRow[] = chunk.map((j) => {
            const prev = existingMap.get(j.sourceJobId)
            const isUpdate = Boolean(prev)

            if (isUpdate) {
              updatedCount++
            } else {
              insertedCount++
            }

            return {
              id: prev ? prev.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : j.id),
              source: j.source,
              source_job_id: j.sourceJobId,
              raw_source_id: j.rawSourceId ? String(j.rawSourceId) : null,
              source_name: j.sourceName || provider.providerName,
              source_url: j.sourceUrl || null,
              apply_url: j.applyUrl,
              canonical_url: j.canonicalUrl || j.applyUrl,
              title: j.title,
              company: j.company,
              company_logo: j.companyLogo || null,
              description: j.description || '',
              location: j.location || '',
              workplace_type: j.workplaceType,
              employment_type: j.employmentType,
              category: j.category || null,
              skills: j.skills || [],
              salary_raw: j.salary?.raw || null,
              salary_min: j.salary?.min ?? null,
              salary_max: j.salary?.max ?? null,
              salary_currency: j.salary?.currency || 'USD',
              normalized_title: j.normalizedTitle,
              normalized_company: j.normalizedCompany,
              normalized_location: j.normalizedLocation,
              source_metadata: j.sourceMetadata || {},
              is_active: true,
              // Never overwrite original posted_at if previously recorded
              posted_at: prev ? prev.posted_at : j.postedAt,
              discovered_at: prev ? prev.discovered_at : j.discoveredAt || nowIso,
              last_seen_at: nowIso,
              expires_at: j.expiresAt || null,
            }
          })

          await this.databaseClient.upsertJobs(dbRows)
        }
      } catch (err) {
        const upsertError = err instanceof Error ? err.message : String(err)
        this.log({
          level: 'error',
          message: `Database upsert failed for provider ${provider.providerName}`,
          provider: provider.providerName,
          runId,
          error: upsertError,
          timestamp: new Date().toISOString(),
        })
        fetchResult.error = upsertError
      }
    } else {
      // In offline/test mode without DB client, simulate insert counts
      insertedCount = uniqueJobs.length
    }

    const durationMs = Date.now() - startTime
    const completedAt = new Date().toISOString()

    // Determine final provider run status
    let status: 'completed' | 'failed' | 'partial' = 'completed'
    if (!fetchResult.success && uniqueJobs.length === 0) {
      status = 'failed'
    } else if (!fetchResult.success && uniqueJobs.length > 0) {
      status = 'partial'
    } else if (failedCount > 0 && uniqueJobs.length === 0) {
      status = 'failed'
    }

    const sanitizedError = fetchResult.error ? sanitizeLogString(fetchResult.error) : undefined

    const summary: ProviderRunSummary = {
      provider: provider.providerName,
      runId,
      status,
      durationMs,
      fetchedCount,
      validCount: uniqueJobs.length,
      deduplicatedCount,
      failedCount,
      insertedCount,
      updatedCount,
      errorMessage: sanitizedError,
    }

    // Update ingestion_runs and job_sources in database
    if (this.databaseClient) {
      try {
        await this.databaseClient.updateIngestionRun(runId, {
          status,
          completed_at: completedAt,
          fetched_count: fetchedCount,
          inserted_count: insertedCount,
          updated_count: updatedCount,
          deduplicated_count: deduplicatedCount,
          failed_count: failedCount,
          error_message: sanitizedError || null,
          metadata: {
            durationMs,
            validCount: uniqueJobs.length,
          },
        })

        await this.databaseClient.updateJobSource(provider.providerName, {
          last_run_at: completedAt,
          last_success_at: status !== 'failed' ? completedAt : undefined,
          last_error: sanitizedError || null,
        })
      } catch (e) {
        this.log({
          level: 'warn',
          message: `Failed to update final ingestion metrics for ${provider.providerName}`,
          provider: provider.providerName,
          runId,
          error: e instanceof Error ? e.message : String(e),
          timestamp: completedAt,
        })
      }
    }

    this.log({
      level: status === 'failed' ? 'error' : status === 'partial' ? 'warn' : 'info',
      message: `Completed ingestion run for ${provider.providerName} with status: ${status}`,
      provider: provider.providerName,
      runId,
      counts: {
        fetched: fetchedCount,
        inserted: insertedCount,
        updated: updatedCount,
        deduplicated: deduplicatedCount,
        failed: failedCount,
      },
      durationMs,
      error: fetchResult.error,
      timestamp: completedAt,
    })

    return summary
  }

  /**
   * Executes ingestion across all configured providers concurrently.
   * Ensures complete fault isolation: if one provider fails, others still run.
   */
  async runAll(): Promise<IngestionWorkerRunResult> {
    const runId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `worker_${Date.now()}`
    const startedAt = new Date().toISOString()
    const startTime = Date.now()

    this.log({
      level: 'info',
      message: `Starting central ingestion sweep across ${this.providers.length} providers`,
      runId,
      timestamp: startedAt,
    })

    // Run each provider independently via Promise.allSettled
    const results = await Promise.allSettled(
      this.providers.map((provider) => this.runProvider(provider)),
    )

    const providerSummaries: Record<string, ProviderRunSummary> = {}
    const totals = {
      fetched: 0,
      valid: 0,
      deduplicated: 0,
      failed: 0,
      inserted: 0,
      updated: 0,
    }

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i]
      const res = results[i]

      if (res.status === 'fulfilled') {
        const summary = res.value
        providerSummaries[provider.providerName] = summary
        totals.fetched += summary.fetchedCount
        totals.valid += summary.validCount
        totals.deduplicated += summary.deduplicatedCount
        totals.failed += summary.failedCount
        totals.inserted += summary.insertedCount
        totals.updated += summary.updatedCount
      } else {
        // Severe unhandled exception from provider runner
        const errorMsg = res.reason instanceof Error ? res.reason.message : String(res.reason)
        providerSummaries[provider.providerName] = {
          provider: provider.providerName,
          runId: `err_${Date.now()}`,
          status: 'failed',
          durationMs: 0,
          fetchedCount: 0,
          validCount: 0,
          deduplicatedCount: 0,
          failedCount: 0,
          insertedCount: 0,
          updatedCount: 0,
          errorMessage: sanitizeLogString(errorMsg),
        }
      }
    }

    const completedAt = new Date().toISOString()
    const totalDurationMs = Date.now() - startTime

    this.log({
      level: 'info',
      message: `Central ingestion sweep completed in ${totalDurationMs}ms`,
      runId,
      counts: totals,
      durationMs: totalDurationMs,
      timestamp: completedAt,
    })

    return {
      runId,
      startedAt,
      completedAt,
      totalDurationMs,
      providers: providerSummaries,
      totals,
    }
  }
}
