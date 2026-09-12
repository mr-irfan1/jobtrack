import type { IngestionDatabaseClient, IngestionRunRow, IngestionWorkerRunResult } from './jobIngestionWorker.ts'
import { JobIngestionWorker } from './jobIngestionWorker.ts'
import { defaultRemotiveAdapter, defaultGreenhouseAdapter, defaultAdzunaAdapter } from './jobProviderAdapter.ts'

/**
 * Standard production cron expression for JobTrack ingestion:
 * Runs at minute 0 past every 6th hour (00:00, 06:00, 12:00, 18:00 UTC) = 4 times daily.
 */
export const DEFAULT_INGESTION_CRON = '0 */6 * * *'

/**
 * Default interval in minutes between runs (matches job_sources.fetch_interval_minutes).
 */
export const DEFAULT_FETCH_INTERVAL_MINUTES = 360

/**
 * Stale run threshold in minutes. If an ingestion run has been marked 'started'
 * longer than this, it is considered crashed/abandoned and will not block subsequent runs.
 */
export const DEFAULT_STALE_LOCK_MINUTES = 15

/**
 * Supported job providers.
 */
export const DEFAULT_PROVIDERS = ['remotive', 'greenhouse', 'adzuna'] as const
export type SupportedProvider = typeof DEFAULT_PROVIDERS[number]

/**
 * Ingestion trigger options.
 */
export interface IngestionTriggerOptions {
  providers?: string[]
  supabaseUrl?: string
  serviceRoleKey?: string
  ingestionSecret?: string
  force?: boolean
  timeoutMs?: number
  staleLockThresholdMinutes?: number
  customFetch?: typeof fetch
  databaseClient?: IngestionDatabaseClient
}

/**
 * Detailed per-provider summary in trigger result.
 */
export interface ProviderTriggerResult {
  provider: string
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
 * Result returned by triggerIngestion().
 */
export interface IngestionTriggerResult {
  success: boolean
  skipped?: boolean
  skipReason?: string
  runId?: string
  totalDurationMs?: number
  executionMode: 'edge-function' | 'in-process-worker' | 'skipped'
  totals: {
    fetched: number
    valid: number
    deduplicated: number
    failed: number
    inserted: number
    updated: number
  }
  providers: Record<string, ProviderTriggerResult>
  error?: string
}

/**
 * Source status detail returned by getIngestionStatus().
 */
export interface JobSourceStatus {
  id: string
  name: string
  isEnabled: boolean
  fetchIntervalMinutes: number
  lastRunAt: string | null
  lastSuccessAt: string | null
  lastError: string | null
}

/**
 * Aggregated health status report.
 */
export interface IngestionStatusReport {
  overallHealth: 'healthy' | 'degraded' | 'failing' | 'idle' | 'running'
  isActiveRunInProgress: boolean
  activeRun?: {
    id: string
    source: string
    startedAt: string
  }
  sources: JobSourceStatus[]
  recentRuns: Array<{
    id: string
    source: string
    status: string
    startedAt: string
    completedAt?: string | null
    fetchedCount: number
    insertedCount: number
    updatedCount: number
    failedCount: number
    errorMessage?: string | null
  }>
  nextRecommendedRunAt?: string
}

// ---------------------------------------------------------------------------
// In-Memory Process Lock State (Guards against overlapping runs in same runtime)
// ---------------------------------------------------------------------------
let processLockActive = false
let processLockRunId: string | null = null
let processLockStartedAt: number | null = null

export function isProcessLockActive(staleMinutes = DEFAULT_STALE_LOCK_MINUTES): boolean {
  if (!processLockActive) return false
  if (processLockStartedAt && Date.now() - processLockStartedAt > staleMinutes * 60 * 1000) {
    // Lock has gone stale
    processLockActive = false
    processLockRunId = null
    processLockStartedAt = null
    return false
  }
  return true
}

export function acquireProcessLock(runId: string): boolean {
  if (isProcessLockActive()) return false
  processLockActive = true
  processLockRunId = runId
  processLockStartedAt = Date.now()
  return true
}

export function releaseProcessLock(): void {
  processLockActive = false
  processLockRunId = null
  processLockStartedAt = null
}

// ---------------------------------------------------------------------------
// Overlap Prevention Helper
// ---------------------------------------------------------------------------
export async function checkActiveIngestionRun(
  databaseClient?: IngestionDatabaseClient,
  staleMinutes = DEFAULT_STALE_LOCK_MINUTES,
): Promise<{ inProgress: boolean; activeRun?: { id: string; source: string; startedAt: string } }> {
  // 1. First check in-memory process lock
  if (isProcessLockActive(staleMinutes)) {
    return {
      inProgress: true,
      activeRun: {
        id: processLockRunId || 'in-process-run',
        source: 'all',
        startedAt: processLockStartedAt ? new Date(processLockStartedAt).toISOString() : new Date().toISOString(),
      },
    }
  }

  // 2. If database client is available, check recent 'started' runs in storage
  if (databaseClient && 'ingestionRuns' in databaseClient) {
    const mockClient = databaseClient as { ingestionRuns: IngestionRunRow[] }
    const now = Date.now()
    const active = mockClient.ingestionRuns.find((r) => {
      if (r.status !== 'started') return false
      const started = new Date(r.started_at).getTime()
      return now - started <= staleMinutes * 60 * 1000
    })

    if (active) {
      return {
        inProgress: true,
        activeRun: {
          id: active.id,
          source: active.source,
          startedAt: active.started_at,
        },
      }
    }
  }

  return { inProgress: false }
}

// ---------------------------------------------------------------------------
// Core Trigger Implementation
// ---------------------------------------------------------------------------
/**
 * Triggers a JobTrack ingestion run.
 *
 * Capabilities:
 * 1. Checks and prevents overlapping runs (configurable stale threshold).
 * 2. Invokes the Supabase Edge Function (`/functions/v1/ingest-jobs`) if credentials provided.
 * 3. Falls back to in-process `JobIngestionWorker` when database client is supplied.
 * 4. Fault isolated: captures per-provider completion/failure details.
 * 5. Records metrics and returns structured result.
 */
function readServerEnv(key: string): string | undefined {
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  if (typeof g.process !== 'undefined' && g.process?.env && typeof g.process.env[key] === 'string') {
    return g.process.env[key]
  }
  return undefined
}

export async function triggerIngestion(options?: IngestionTriggerOptions): Promise<IngestionTriggerResult> {
  const staleMinutes = options?.staleLockThresholdMinutes ?? DEFAULT_STALE_LOCK_MINUTES
  const force = Boolean(options?.force)
  const providers = options?.providers && options.providers.length > 0
    ? options.providers
    : [...DEFAULT_PROVIDERS]

  // 1. Prevent Overlapping Runs
  if (!force) {
    const overlapCheck = await checkActiveIngestionRun(options?.databaseClient, staleMinutes)
    if (overlapCheck.inProgress && overlapCheck.activeRun) {
      return {
        success: false,
        skipped: true,
        skipReason: `An ingestion run (${overlapCheck.activeRun.id}) started at ${overlapCheck.activeRun.startedAt} is already in progress. Use force=true to override.`,
        executionMode: 'skipped',
        totals: { fetched: 0, valid: 0, deduplicated: 0, failed: 0, inserted: 0, updated: 0 },
        providers: {},
      }
    }
  }

  const runId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `sched_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  acquireProcessLock(runId)

  try {
    const supabaseUrl = options?.supabaseUrl || readServerEnv('SUPABASE_URL') || readServerEnv('VITE_SUPABASE_URL')
    const serviceRoleKey = options?.serviceRoleKey || readServerEnv('SUPABASE_SERVICE_ROLE_KEY')
    const ingestionSecret = options?.ingestionSecret || readServerEnv('INGESTION_SECRET')
    const fetchImpl = options?.customFetch || globalThis.fetch

    // Mode A: Invoke Supabase Edge Function if URL + Auth Key/Secret are available
    if (supabaseUrl && (serviceRoleKey || ingestionSecret) && !options?.databaseClient) {
      const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/ingest-jobs`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (serviceRoleKey) {
        headers['Authorization'] = `Bearer ${serviceRoleKey}`
      }
      if (ingestionSecret) {
        headers['x-ingestion-secret'] = ingestionSecret
      }

      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          providers,
          timeoutMs: options?.timeoutMs,
        }),
      })

      const rawText = await response.text()
      let payload: any = {}
      try {
        payload = rawText ? JSON.parse(rawText) : {}
      } catch {
        payload = { error: `Invalid non-JSON response: ${rawText}` }
      }

      if (!response.ok) {
        return {
          success: false,
          runId,
          executionMode: 'edge-function',
          totals: payload.totals || { fetched: 0, valid: 0, deduplicated: 0, failed: 0, inserted: 0, updated: 0 },
          providers: payload.providers || {},
          error: payload.error || `Edge Function returned HTTP ${response.status}`,
        }
      }

      return {
        success: Boolean(payload.success),
        runId: payload.runId || runId,
        totalDurationMs: payload.totalDurationMs,
        executionMode: 'edge-function',
        totals: payload.totals || { fetched: 0, valid: 0, deduplicated: 0, failed: 0, inserted: 0, updated: 0 },
        providers: payload.providers || {},
      }
    }

    // Mode B: In-Process JobIngestionWorker (Local / Test / Database Client provided)
    const allAdapters = [defaultRemotiveAdapter, defaultGreenhouseAdapter, defaultAdzunaAdapter]
    const activeAdapters = allAdapters.filter((a) => providers.includes(a.providerName.toLowerCase()))

    const worker = new JobIngestionWorker({
      providers: activeAdapters.length > 0 ? activeAdapters : allAdapters,
      databaseClient: options?.databaseClient,
      timeoutMs: options?.timeoutMs,
    })

    const result: IngestionWorkerRunResult = await worker.runAll()
    const allFailed = Object.values(result.providers).every((p) => p.status === 'failed')

    const providerMap: Record<string, ProviderTriggerResult> = {}
    for (const [key, p] of Object.entries(result.providers)) {
      providerMap[key] = {
        provider: p.provider,
        status: p.status,
        durationMs: p.durationMs,
        fetchedCount: p.fetchedCount,
        validCount: p.validCount,
        deduplicatedCount: p.deduplicatedCount,
        failedCount: p.failedCount,
        insertedCount: p.insertedCount,
        updatedCount: p.updatedCount,
        errorMessage: p.errorMessage,
      }
    }

    return {
      success: !allFailed,
      runId: result.runId,
      totalDurationMs: result.totalDurationMs,
      executionMode: 'in-process-worker',
      totals: result.totals,
      providers: providerMap,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      runId,
      executionMode: options?.databaseClient ? 'in-process-worker' : 'edge-function',
      totals: { fetched: 0, valid: 0, deduplicated: 0, failed: 0, inserted: 0, updated: 0 },
      providers: {},
      error: errorMsg,
    }
  } finally {
    releaseProcessLock()
  }
}

// ---------------------------------------------------------------------------
// Status & Health Inspector Helper
// ---------------------------------------------------------------------------
/**
 * Inspects the current state of job sources and historical ingestion runs.
 */
export async function getIngestionStatus(
  databaseClient?: IngestionDatabaseClient,
): Promise<IngestionStatusReport> {
  const sources: JobSourceStatus[] = []
  const recentRuns: IngestionStatusReport['recentRuns'] = []
  let isActiveRunInProgress = false
  let activeRunInfo: IngestionStatusReport['activeRun'] | undefined

  if (databaseClient && 'jobSources' in databaseClient && 'ingestionRuns' in databaseClient) {
    const mock = databaseClient as {
      jobSources: Map<string, { last_run_at: string; last_success_at?: string; last_error?: string | null }>
      ingestionRuns: IngestionRunRow[]
    }

    for (const p of DEFAULT_PROVIDERS) {
      const state = mock.jobSources.get(p)
      sources.push({
        id: p,
        name: p.charAt(0).toUpperCase() + p.slice(1),
        isEnabled: true,
        fetchIntervalMinutes: DEFAULT_FETCH_INTERVAL_MINUTES,
        lastRunAt: state?.last_run_at || null,
        lastSuccessAt: state?.last_success_at || null,
        lastError: state?.last_error || null,
      })
    }

    const sortedRuns = [...mock.ingestionRuns].reverse()
    for (const r of sortedRuns.slice(0, 10)) {
      recentRuns.push({
        id: r.id,
        source: r.source,
        status: r.status,
        startedAt: r.started_at,
        completedAt: r.completed_at,
        fetchedCount: r.fetched_count,
        insertedCount: r.inserted_count,
        updatedCount: r.updated_count,
        failedCount: r.failed_count,
        errorMessage: r.error_message,
      })

      if (r.status === 'started' && !isActiveRunInProgress) {
        isActiveRunInProgress = true
        activeRunInfo = {
          id: r.id,
          source: r.source,
          startedAt: r.started_at,
        }
      }
    }
  } else {
    // Default fallback status if no mock/direct client provided
    for (const p of DEFAULT_PROVIDERS) {
      sources.push({
        id: p,
        name: p.charAt(0).toUpperCase() + p.slice(1),
        isEnabled: true,
        fetchIntervalMinutes: DEFAULT_FETCH_INTERVAL_MINUTES,
        lastRunAt: null,
        lastSuccessAt: null,
        lastError: null,
      })
    }
  }

  // Determine overall system health
  let overallHealth: IngestionStatusReport['overallHealth'] = 'idle'
  if (isActiveRunInProgress || isProcessLockActive()) {
    overallHealth = 'running'
  } else if (sources.some((s) => s.lastError)) {
    const allHaveError = sources.every((s) => s.lastError)
    overallHealth = allHaveError ? 'failing' : 'degraded'
  } else if (sources.some((s) => s.lastSuccessAt)) {
    overallHealth = 'healthy'
  }

  return {
    overallHealth,
    isActiveRunInProgress: isActiveRunInProgress || isProcessLockActive(),
    activeRun: activeRunInfo,
    sources,
    recentRuns,
  }
}

/**
 * Returns a human-friendly explanation of a cron schedule expression.
 */
export function explainCronCadence(cronExp: string): string {
  if (cronExp === '0 */6 * * *') {
    return 'Every 6 hours at minute 0 (00:00, 06:00, 12:00, 18:00 UTC) — 4 times daily'
  }
  if (cronExp === '0 */4 * * *') {
    return 'Every 4 hours at minute 0 (6 times daily)'
  }
  if (cronExp === '0 */12 * * *') {
    return 'Every 12 hours (twice daily)'
  }
  if (cronExp === '0 0 * * *') {
    return 'Once daily at midnight UTC'
  }
  return `Custom cron expression: "${cronExp}"`
}
