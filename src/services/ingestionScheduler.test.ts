import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_INGESTION_CRON,
  DEFAULT_FETCH_INTERVAL_MINUTES,
  DEFAULT_STALE_LOCK_MINUTES,
  explainCronCadence,
  triggerIngestion,
  getIngestionStatus,
  checkActiveIngestionRun,
  acquireProcessLock,
  releaseProcessLock,
  isProcessLockActive,
} from './ingestionScheduler.ts'
import { MockIngestionDatabaseClient } from './jobIngestionWorker.ts'

test('JobTrack Ingestion Scheduler & Trigger Suite', async (t) => {
  t.beforeEach(() => {
    releaseProcessLock()
  })

  t.afterEach(() => {
    releaseProcessLock()
  })

  await t.test('1. Cadence & Schedule Constants', async () => {
    assert.equal(DEFAULT_INGESTION_CRON, '0 */6 * * *')
    assert.equal(DEFAULT_FETCH_INTERVAL_MINUTES, 360)
    assert.equal(DEFAULT_STALE_LOCK_MINUTES, 15)

    const explanation = explainCronCadence('0 */6 * * *')
    assert.ok(explanation.includes('6 hours'))
    assert.ok(explanation.includes('4 times daily'))

    assert.ok(explainCronCadence('0 */4 * * *').includes('4 hours'))
    assert.ok(explainCronCadence('0 0 * * *').includes('midnight'))
  })

  await t.test('2. Overlap Prevention & Process Locking', async (t2) => {
    await t2.test('acquires and releases process lock cleanly', () => {
      assert.equal(isProcessLockActive(), false)
      const acquired = acquireProcessLock('test_run_1')
      assert.equal(acquired, true)
      assert.equal(isProcessLockActive(), true)

      // Cannot acquire second lock while first is active
      const secondAcquire = acquireProcessLock('test_run_2')
      assert.equal(secondAcquire, false)

      releaseProcessLock()
      assert.equal(isProcessLockActive(), false)
    })

    await t2.test('detects active run in mock database client', async () => {
      const mockClient = new MockIngestionDatabaseClient()
      const nowIso = new Date().toISOString()
      mockClient.ingestionRuns.push({
        id: 'active_run_101',
        source: 'remotive',
        status: 'started',
        started_at: nowIso,
        fetched_count: 0,
        inserted_count: 0,
        updated_count: 0,
        deduplicated_count: 0,
        failed_count: 0,
        metadata: {},
      })

      const check = await checkActiveIngestionRun(mockClient, 15)
      assert.equal(check.inProgress, true)
      assert.equal(check.activeRun?.id, 'active_run_101')
      assert.equal(check.activeRun?.source, 'remotive')
    })

    await t2.test('ignores stale runs older than threshold', async () => {
      const mockClient = new MockIngestionDatabaseClient()
      // Started 30 minutes ago
      const staleDate = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      mockClient.ingestionRuns.push({
        id: 'stale_run_999',
        source: 'remotive',
        status: 'started',
        started_at: staleDate,
        fetched_count: 0,
        inserted_count: 0,
        updated_count: 0,
        deduplicated_count: 0,
        failed_count: 0,
        metadata: {},
      })

      const check = await checkActiveIngestionRun(mockClient, 15)
      assert.equal(check.inProgress, false)
    })

    await t2.test('skips invocation when active run is detected and force is false', async () => {
      const mockClient = new MockIngestionDatabaseClient()
      mockClient.ingestionRuns.push({
        id: 'running_now_1',
        source: 'greenhouse',
        status: 'started',
        started_at: new Date().toISOString(),
        fetched_count: 0,
        inserted_count: 0,
        updated_count: 0,
        deduplicated_count: 0,
        failed_count: 0,
        metadata: {},
      })

      const res = await triggerIngestion({
        databaseClient: mockClient,
        force: false,
      })

      assert.equal(res.success, false)
      assert.equal(res.skipped, true)
      assert.equal(res.executionMode, 'skipped')
      assert.ok(res.skipReason?.includes('running_now_1'))
      assert.ok(res.skipReason?.includes('already in progress'))
    })

    await t2.test('bypasses active run check when force is true', async () => {
      const mockClient = new MockIngestionDatabaseClient()
      mockClient.ingestionRuns.push({
        id: 'running_now_2',
        source: 'greenhouse',
        status: 'started',
        started_at: new Date().toISOString(),
        fetched_count: 0,
        inserted_count: 0,
        updated_count: 0,
        deduplicated_count: 0,
        failed_count: 0,
        metadata: {},
      })

      const res = await triggerIngestion({
        databaseClient: mockClient,
        force: true,
      })

      // Forced run proceeds to worker
      assert.equal(res.skipped, undefined)
      assert.equal(res.executionMode, 'in-process-worker')
      assert.ok(res.runId)
    })
  })

  await t.test('3. Edge Function Endpoint Invocation', async (t2) => {
    await t2.test('invokes remote endpoint with Bearer authorization and parses results', async () => {
      let interceptedUrl = ''
      let interceptedHeaders: Record<string, string> = {}
      let interceptedBody: any = {}

      const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        interceptedUrl = String(input)
        interceptedHeaders = (init?.headers || {}) as Record<string, string>
        interceptedBody = init?.body ? JSON.parse(String(init.body)) : {}

        return new Response(
          JSON.stringify({
            success: true,
            runId: 'remote_run_123',
            totalDurationMs: 450,
            totals: {
              fetched: 60,
              valid: 58,
              deduplicated: 2,
              failed: 0,
              inserted: 58,
              updated: 0,
            },
            providers: {
              remotive: {
                provider: 'remotive',
                status: 'completed',
                durationMs: 400,
                fetchedCount: 60,
                validCount: 58,
                deduplicatedCount: 2,
                failedCount: 0,
                insertedCount: 58,
                updatedCount: 0,
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const res = await triggerIngestion({
        supabaseUrl: 'https://test-project.supabase.co',
        serviceRoleKey: 'test_service_key_xyz',
        customFetch: mockFetch as typeof fetch,
        providers: ['remotive'],
      })

      assert.equal(interceptedUrl, 'https://test-project.supabase.co/functions/v1/ingest-jobs')
      assert.equal(interceptedHeaders['Authorization'], 'Bearer test_service_key_xyz')
      assert.deepEqual(interceptedBody.providers, ['remotive'])

      assert.equal(res.success, true)
      assert.equal(res.runId, 'remote_run_123')
      assert.equal(res.executionMode, 'edge-function')
      assert.equal(res.totals.inserted, 58)
      assert.equal(res.providers.remotive.status, 'completed')
    })

    await t2.test('invokes remote endpoint with x-ingestion-secret header', async () => {
      let interceptedHeaders: Record<string, string> = {}

      const mockFetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        interceptedHeaders = (init?.headers || {}) as Record<string, string>
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }

      await triggerIngestion({
        supabaseUrl: 'https://test-project.supabase.co',
        ingestionSecret: 'cron_secret_pass_777',
        customFetch: mockFetch as typeof fetch,
      })

      assert.equal(interceptedHeaders['x-ingestion-secret'], 'cron_secret_pass_777')
    })

    await t2.test('handles Edge Function non-200 failure gracefully without throwing', async () => {
      const mockFetch = async (): Promise<Response> => {
        return new Response(JSON.stringify({ error: 'Internal server error from provider' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const res = await triggerIngestion({
        supabaseUrl: 'https://test-project.supabase.co',
        serviceRoleKey: 'key_123',
        customFetch: mockFetch as typeof fetch,
      })

      assert.equal(res.success, false)
      assert.equal(res.executionMode, 'edge-function')
      assert.ok(res.error?.includes('Internal server error'))
    })
  })

  await t.test('4. Ingestion Status & Health Inspector', async (t2) => {
    await t2.test('reports running health when an active run is in progress', async () => {
      const mockClient = new MockIngestionDatabaseClient()
      mockClient.ingestionRuns.push({
        id: 'run_active_99',
        source: 'remotive',
        status: 'started',
        started_at: new Date().toISOString(),
        fetched_count: 0,
        inserted_count: 0,
        updated_count: 0,
        deduplicated_count: 0,
        failed_count: 0,
        metadata: {},
      })

      const status = await getIngestionStatus(mockClient)
      assert.equal(status.overallHealth, 'running')
      assert.equal(status.isActiveRunInProgress, true)
      assert.equal(status.activeRun?.id, 'run_active_99')
    })

    await t2.test('reports healthy status when sources have succeeded without error', async () => {
      const mockClient = new MockIngestionDatabaseClient()
      const nowIso = new Date().toISOString()
      mockClient.jobSources.set('remotive', { last_run_at: nowIso, last_success_at: nowIso, last_error: null })
      mockClient.jobSources.set('greenhouse', { last_run_at: nowIso, last_success_at: nowIso, last_error: null })
      mockClient.jobSources.set('adzuna', { last_run_at: nowIso, last_success_at: nowIso, last_error: null })

      const status = await getIngestionStatus(mockClient)
      assert.equal(status.overallHealth, 'healthy')
      assert.equal(status.isActiveRunInProgress, false)
      assert.equal(status.sources.length, 3)
    })

    await t2.test('reports degraded status when one provider has error but others succeeded', async () => {
      const mockClient = new MockIngestionDatabaseClient()
      const nowIso = new Date().toISOString()
      mockClient.jobSources.set('remotive', { last_run_at: nowIso, last_success_at: nowIso, last_error: null })
      mockClient.jobSources.set('greenhouse', { last_run_at: nowIso, last_success_at: nowIso, last_error: null })
      mockClient.jobSources.set('adzuna', { last_run_at: nowIso, last_error: 'Missing Adzuna credentials' })

      const status = await getIngestionStatus(mockClient)
      assert.equal(status.overallHealth, 'degraded')
      const adzuna = status.sources.find((s) => s.id === 'adzuna')
      assert.equal(adzuna?.lastError, 'Missing Adzuna credentials')
    })

    await t2.test('reports idle status on clean initialized state', async () => {
      const status = await getIngestionStatus()
      assert.equal(status.overallHealth, 'idle')
      assert.equal(status.isActiveRunInProgress, false)
      assert.equal(status.sources.length, 3)
    })
  })
})
