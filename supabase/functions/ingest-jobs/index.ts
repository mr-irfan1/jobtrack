// JobTrack — "ingest-jobs" Supabase Edge Function
// ==================================================
// Server-side job ingestion worker. Orchestrates multi-provider ingestion
// (Remotive, Greenhouse, Adzuna), validates canonical job schema, deduplicates
// across providers, upserts into `public.jobs`, and records `ingestion_runs` metrics.
//
// Security:
//   - Internal backend worker only. Blocked from unauthorized public invocation.
//   - Requires Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> OR
//     x-ingestion-secret: <INGESTION_SECRET>.
//   - Provider secrets (e.g. ADZUNA_APP_ID, ADZUNA_APP_KEY) are read strictly
//     from server environment variables (Deno.env) and NEVER logged or leaked.
//   - Non-destructive: Transient network or provider failures never delete existing jobs.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { requireServerAuth } from '../_shared/serverAuth.ts'
import {
  type CanonicalJob,
  getEnv,
  sanitizeLog,
  validateCanonicalJob,
  deduplicateCanonicalJobs,
  fetchRemotiveJobs,
  fetchGreenhouseJobs,
  fetchAdzunaJobs,
} from './worker.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-ingestion-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Database Operations (Service-Role Client)
// ---------------------------------------------------------------------------
async function persistIngestionRunStart(supabase: SupabaseClient, source: string, runId: string): Promise<void> {
  const { error } = await supabase.from('ingestion_runs').insert({
    id: runId,
    source,
    status: 'started',
    started_at: new Date().toISOString(),
    fetched_count: 0,
    inserted_count: 0,
    updated_count: 0,
    deduplicated_count: 0,
    failed_count: 0,
    metadata: { environment: 'edge-function' },
  })

  if (error) {
    console.error(`[ingest-jobs] Failed to insert initial ingestion_run for ${source}:`, error.message)
  }
}

async function persistIngestionRunComplete(
  supabase: SupabaseClient,
  source: string,
  runId: string,
  summary: {
    status: 'completed' | 'failed' | 'partial'
    durationMs: number
    fetchedCount: number
    insertedCount: number
    updatedCount: number
    deduplicatedCount: number
    failedCount: number
    errorMessage?: string
  },
): Promise<void> {
  const completedAt = new Date().toISOString()

  const { error } = await supabase.from('ingestion_runs').update({
    status: summary.status,
    completed_at: completedAt,
    fetched_count: summary.fetchedCount,
    inserted_count: summary.insertedCount,
    updated_count: summary.updatedCount,
    deduplicated_count: summary.deduplicatedCount,
    failed_count: summary.failedCount,
    error_message: summary.errorMessage || null,
    metadata: { durationMs: summary.durationMs },
  }).eq('id', runId)

  if (error) {
    console.error(`[ingest-jobs] Failed to update ingestion_run ${runId}:`, error.message)
  }

  // Update public.job_sources
  const { error: sourceError } = await supabase.from('job_sources').update({
    last_run_at: completedAt,
    last_success_at: summary.status !== 'failed' ? completedAt : undefined,
    last_error: summary.errorMessage || null,
  }).eq('id', source)

  if (sourceError) {
    console.error(`[ingest-jobs] Failed to update job_sources for ${source}:`, sourceError.message)
  }
}

async function upsertCanonicalJobs(
  supabase: SupabaseClient,
  source: string,
  jobs: CanonicalJob[],
): Promise<{ inserted: number; updated: number }> {
  if (jobs.length === 0) return { inserted: 0, updated: 0 }

  const sourceJobIds = jobs.map((j) => j.sourceJobId)

  // Query existing jobs for this provider to preserve original posted_at and calculate exact metrics
  const { data: existingData, error: queryErr } = await supabase
    .from('jobs')
    .select('id, source_job_id, posted_at, discovered_at')
    .eq('source', source)
    .in('source_job_id', sourceJobIds)

  if (queryErr) {
    throw new Error(`Failed to query existing jobs: ${queryErr.message}`)
  }

  const existingMap = new Map<string, { id: string; posted_at: string; discovered_at: string }>(
    (existingData || []).map((row: any) => [row.source_job_id, row]),
  )

  let inserted = 0
  let updated = 0
  const nowIso = new Date().toISOString()

  const rows = jobs.map((j) => {
    const prev = existingMap.get(j.sourceJobId)
    if (prev) {
      updated++
    } else {
      inserted++
    }

    return {
      source: j.source,
      source_job_id: j.sourceJobId,
      raw_source_id: j.rawSourceId ? String(j.rawSourceId) : null,
      source_name: j.sourceName,
      source_url: j.sourceUrl || null,
      apply_url: j.applyUrl,
      canonical_url: j.canonicalUrl,
      title: j.title,
      company: j.company,
      company_logo: j.companyLogo || null,
      description: j.description,
      location: j.location,
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
      source_metadata: j.sourceMetadata,
      is_active: true,
      // Critical: never reset historical posted_at on existing jobs
      posted_at: prev ? prev.posted_at : j.postedAt,
      discovered_at: prev ? prev.discovered_at : nowIso,
      last_seen_at: nowIso,
      expires_at: j.expiresAt,
    }
  })

  // Upsert in chunks of 50
  const CHUNK_SIZE = 50
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    const { error: upsertErr } = await supabase
      .from('jobs')
      .upsert(chunk, { onConflict: 'source,source_job_id', ignoreDuplicates: false })

    if (upsertErr) {
      throw new Error(`Failed to upsert jobs chunk: ${upsertErr.message}`)
    }
  }

  return { inserted, updated }
}

// ---------------------------------------------------------------------------
// Main Edge Function Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // 1. Authenticate / Authorize internal backend worker
  const auth = requireServerAuth(req, corsHeaders)
  if (!auth.authorized) {
    return auth.errorResponse || jsonResponse({ error: 'Unauthorized' }, 401)
  }

  // 2. Parse optional request parameters
  let body: {
    providers?: string[]
    timeoutMs?: number
    country?: string
    maxPages?: number
  } = {}

  try {
    const text = await req.text()
    if (text && text.trim()) {
      body = JSON.parse(text)
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON request payload' }, 400)
  }

  // 3. Initialize Supabase Service Role Client
  const supabaseUrl = getEnv('SUPABASE_URL')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[ingest-jobs] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
    return jsonResponse({ error: 'Internal configuration error: Supabase service credentials missing' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 4. Determine providers to run
  const requestedProviders = Array.isArray(body.providers) && body.providers.length > 0
    ? body.providers.map((p) => p.toLowerCase())
    : ['remotive', 'greenhouse', 'adzuna']

  const workerRunId = crypto.randomUUID()
  const workerStartTime = Date.now()
  console.log(JSON.stringify({
    level: 'info',
    message: `[ingest-jobs] Starting ingestion run across: ${requestedProviders.join(', ')}`,
    runId: workerRunId,
    timestamp: new Date().toISOString(),
  }))

  const providerSummaries: Record<string, any> = {}
  const totals = {
    fetched: 0,
    valid: 0,
    deduplicated: 0,
    failed: 0,
    inserted: 0,
    updated: 0,
  }

  // Helper to execute a single provider independently
  const runSingleProvider = async (providerName: string) => {
    const runId = crypto.randomUUID()
    const startTime = Date.now()
    await persistIngestionRunStart(supabase, providerName, runId)

    let rawJobs: CanonicalJob[] = []
    let fetchError: string | undefined

    try {
      if (providerName === 'remotive') {
        rawJobs = await fetchRemotiveJobs({ timeoutMs: body.timeoutMs })
      } else if (providerName === 'greenhouse') {
        rawJobs = await fetchGreenhouseJobs({ timeoutMs: body.timeoutMs })
      } else if (providerName === 'adzuna') {
        rawJobs = await fetchAdzunaJobs({
          timeoutMs: body.timeoutMs,
          country: body.country,
          maxPages: body.maxPages,
        })
      } else {
        throw new Error(`Unknown provider: ${providerName}`)
      }
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      fetchError = sanitizeLog(rawMsg)
      console.warn(JSON.stringify({
        level: 'warn',
        message: `[ingest-jobs] Provider ${providerName} encountered failure: ${fetchError}`,
        provider: providerName,
        runId,
        timestamp: new Date().toISOString(),
      }))
    }

    // Validate
    const validJobs: CanonicalJob[] = []
    let failedCount = 0
    for (const job of rawJobs) {
      const v = validateCanonicalJob(job)
      if (v.valid) {
        validJobs.push(job)
      } else {
        failedCount++
      }
    }

    // Deduplicate
    const { uniqueJobs, deduplicatedCount } = deduplicateCanonicalJobs(validJobs)

    // Upsert into Supabase
    let inserted = 0
    let updated = 0
    let upsertError: string | undefined

    if (uniqueJobs.length > 0) {
      try {
        const res = await upsertCanonicalJobs(supabase, providerName, uniqueJobs)
        inserted = res.inserted
        updated = res.updated
      } catch (err) {
        upsertError = sanitizeLog(err instanceof Error ? err.message : String(err))
        console.error(JSON.stringify({
          level: 'error',
          message: `[ingest-jobs] Database upsert failed for ${providerName}: ${upsertError}`,
          provider: providerName,
          runId,
          timestamp: new Date().toISOString(),
        }))
      }
    }

    const durationMs = Date.now() - startTime
    const finalError = fetchError || upsertError

    let status: 'completed' | 'failed' | 'partial' = 'completed'
    if (finalError && uniqueJobs.length === 0) {
      status = 'failed'
    } else if (finalError && uniqueJobs.length > 0) {
      status = 'partial'
    } else if (failedCount > 0 && uniqueJobs.length === 0) {
      status = 'failed'
    }

    const summary = {
      provider: providerName,
      runId,
      status,
      durationMs,
      fetchedCount: rawJobs.length,
      validCount: uniqueJobs.length,
      deduplicatedCount,
      failedCount,
      insertedCount: inserted,
      updatedCount: updated,
      errorMessage: finalError,
    }

    await persistIngestionRunComplete(supabase, providerName, runId, summary)
    return summary
  }

  // 5. Execute providers concurrently with fault isolation
  const settled = await Promise.allSettled(
    requestedProviders.map((p) => runSingleProvider(p)),
  )

  for (let i = 0; i < requestedProviders.length; i++) {
    const pName = requestedProviders[i]
    const res = settled[i]

    if (res.status === 'fulfilled') {
      const s = res.value
      providerSummaries[pName] = s
      totals.fetched += s.fetchedCount
      totals.valid += s.validCount
      totals.deduplicated += s.deduplicatedCount
      totals.failed += s.failedCount
      totals.inserted += s.insertedCount
      totals.updated += s.updatedCount
    } else {
      const err = sanitizeLog(res.reason instanceof Error ? res.reason.message : String(res.reason))
      providerSummaries[pName] = {
        provider: pName,
        status: 'failed',
        durationMs: 0,
        fetchedCount: 0,
        validCount: 0,
        deduplicatedCount: 0,
        failedCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        errorMessage: err,
      }
    }
  }

  const totalDurationMs = Date.now() - workerStartTime
  const allFailed = Object.values(providerSummaries).every((s: any) => s.status === 'failed')

  console.log(JSON.stringify({
    level: 'info',
    message: `[ingest-jobs] Ingestion sweep completed in ${totalDurationMs}ms with status: ${allFailed ? 'failed' : 'completed'}`,
    runId: workerRunId,
    counts: totals,
    timestamp: new Date().toISOString(),
  }))

  return jsonResponse(
    {
      success: !allFailed,
      runId: workerRunId,
      totalDurationMs,
      totals,
      providers: providerSummaries,
    },
    allFailed ? 502 : 200,
  )
})
