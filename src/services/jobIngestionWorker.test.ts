import test from 'node:test'
import assert from 'node:assert/strict'
import type { CanonicalJob } from '../types/canonicalJob.ts'
import type { JobProviderAdapter, JobProviderFetchResult } from './jobProviderAdapter.ts'
import {
  JobIngestionWorker,
  MockIngestionDatabaseClient,
  deduplicateCanonicalJobs,
  sanitizeLogString,
  validateCanonicalJob,
} from './jobIngestionWorker.ts'

function createSampleCanonicalJob(overrides?: Partial<CanonicalJob>): CanonicalJob {
  const id = overrides?.sourceJobId || '1001'
  return {
    id: `job_test_${id}`,
    source: 'remotive',
    sourceJobId: id,
    sourceName: 'Remotive',
    sourceUrl: `https://remotive.com/job/${id}`,
    title: 'Senior Software Engineer',
    company: 'Stripe',
    companyLogo: null,
    description: 'We are looking for a Senior Software Engineer.',
    location: 'Remote (Worldwide)',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    category: 'Engineering',
    skills: ['TypeScript', 'React'],
    salary: {
      raw: 'USD 140,000 - 180,000 / year',
      min: 140000,
      max: 180000,
      currency: 'USD',
      period: 'yearly',
    },
    applyUrl: `https://remotive.com/apply/${id}`,
    canonicalUrl: `https://remotive.com/apply/${id}`,
    normalizedTitle: 'senior software engineer',
    normalizedCompany: 'stripe',
    normalizedLocation: 'remote',
    sourceMetadata: {},
    isActive: true,
    postedAt: '2026-09-01T10:00:00.000Z',
    discoveredAt: '2026-09-01T10:00:00.000Z',
    lastSeenAt: '2026-09-01T10:00:00.000Z',
    expiresAt: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

class MockJobProvider implements JobProviderAdapter {
  readonly providerName: string
  private readonly fetchResult: JobProviderFetchResult
  private readonly shouldThrow: boolean

  constructor(
    providerName: string,
    fetchResult: JobProviderFetchResult,
    shouldThrow = false,
  ) {
    this.providerName = providerName
    this.fetchResult = fetchResult
    this.shouldThrow = shouldThrow
  }

  getSourceJobId(rawJob: any): string {
    return String(rawJob?.id || 'mock_id')
  }

  normalizeJob(rawJob: any): CanonicalJob {
    return createSampleCanonicalJob({
      source: this.providerName,
      sourceJobId: String(rawJob?.id || 'mock_id'),
    })
  }

  async fetchJobs(): Promise<JobProviderFetchResult> {
    if (this.shouldThrow) {
      throw new Error(`Network failure connecting to ${this.providerName}`)
    }
    return this.fetchResult
  }
}

test('Central Job Ingestion Worker', async (t) => {
  await t.test('1. Validation & Field Integrity', async (t2) => {
    await t2.test('accepts a fully valid canonical job', () => {
      const validJob = createSampleCanonicalJob()
      const result = validateCanonicalJob(validJob)
      assert.equal(result.valid, true)
    })

    await t2.test('rejects jobs with missing or whitespace-only title', () => {
      const invalidJob = createSampleCanonicalJob({ title: '   ' })
      const result = validateCanonicalJob(invalidJob)
      assert.equal(result.valid, false)
      assert.match(result.reason || '', /title/i)
    })

    await t2.test('rejects jobs with missing or whitespace-only company', () => {
      const invalidJob = createSampleCanonicalJob({ company: '' })
      const result = validateCanonicalJob(invalidJob)
      assert.equal(result.valid, false)
      assert.match(result.reason || '', /company/i)
    })

    await t2.test('rejects jobs with missing or non-HTTP applyUrl', () => {
      const emptyUrlJob = createSampleCanonicalJob({ applyUrl: '  ' })
      assert.equal(validateCanonicalJob(emptyUrlJob).valid, false)

      const ftpJob = createSampleCanonicalJob({ applyUrl: 'ftp://files.com/job' })
      assert.equal(validateCanonicalJob(ftpJob).valid, false)

      const jsJob = createSampleCanonicalJob({ applyUrl: 'javascript:alert(1)' })
      assert.equal(validateCanonicalJob(jsJob).valid, false)
    })

    await t2.test('rejects jobs with missing source or sourceJobId', () => {
      const noSource = createSampleCanonicalJob({ source: '' })
      assert.equal(validateCanonicalJob(noSource).valid, false)

      const noSourceId = createSampleCanonicalJob({ sourceJobId: '  ' })
      assert.equal(validateCanonicalJob(noSourceId).valid, false)
    })
  })

  await t.test('2. Deduplication Strategy', async (t2) => {
    await t2.test('deduplicates duplicate (source, sourceJobId) within same batch', () => {
      const job1 = createSampleCanonicalJob({ sourceJobId: '101' })
      const job2 = createSampleCanonicalJob({ sourceJobId: '101' }) // duplicate
      const job3 = createSampleCanonicalJob({ sourceJobId: '102' }) // unique

      const { uniqueJobs, deduplicatedCount } = deduplicateCanonicalJobs([job1, job2, job3])
      assert.equal(uniqueJobs.length, 2)
      assert.equal(deduplicatedCount, 1)
      assert.equal(uniqueJobs[0].sourceJobId, '101')
      assert.equal(uniqueJobs[1].sourceJobId, '102')
    })

    await t2.test('deduplicates identical canonical_url across different listings', () => {
      const job1 = createSampleCanonicalJob({
        sourceJobId: '101',
        canonicalUrl: 'https://careers.acme.com/jobs/dev-1',
      })
      const job2 = createSampleCanonicalJob({
        sourceJobId: '102',
        canonicalUrl: 'https://careers.acme.com/jobs/dev-1?utm_source=adzuna', // duplicate canonical URL
      })

      const { uniqueJobs, deduplicatedCount } = deduplicateCanonicalJobs([job1, job2])
      assert.equal(uniqueJobs.length, 1)
      assert.equal(deduplicatedCount, 1)
    })

    await t2.test('does NOT merge legitimately distinct jobs', () => {
      const nyJob = createSampleCanonicalJob({
        sourceJobId: '201',
        title: 'Backend Engineer',
        location: 'New York, NY',
        canonicalUrl: 'https://acme.com/job/201',
      })
      const sfJob = createSampleCanonicalJob({
        sourceJobId: '202',
        title: 'Backend Engineer',
        location: 'San Francisco, CA',
        canonicalUrl: 'https://acme.com/job/202',
      })

      const { uniqueJobs, deduplicatedCount } = deduplicateCanonicalJobs([nyJob, sfJob])
      assert.equal(uniqueJobs.length, 2)
      assert.equal(deduplicatedCount, 0)
    })
  })

  await t.test('3. Multi-Provider Ingestion & Fault Isolation', async (t2) => {
    await t2.test('executes all providers and aggregates results', async () => {
      const dbClient = new MockIngestionDatabaseClient()

      const remotiveJobs = [
        createSampleCanonicalJob({ source: 'remotive', sourceJobId: 'r1', title: 'Remotive Engineer' }),
      ]
      const greenhouseJobs = [
        createSampleCanonicalJob({ source: 'greenhouse', sourceJobId: 'g1', title: 'Greenhouse Designer' }),
      ]
      const adzunaJobs = [
        createSampleCanonicalJob({ source: 'adzuna', sourceJobId: 'a1', title: 'Adzuna Architect' }),
      ]

      const remotiveProvider = new MockJobProvider('remotive', { success: true, jobs: remotiveJobs })
      const greenhouseProvider = new MockJobProvider('greenhouse', { success: true, jobs: greenhouseJobs })
      const adzunaProvider = new MockJobProvider('adzuna', { success: true, jobs: adzunaJobs })

      const worker = new JobIngestionWorker({
        providers: [remotiveProvider, greenhouseProvider, adzunaProvider],
        databaseClient: dbClient,
      })

      const runResult = await worker.runAll()

      assert.equal(runResult.totals.fetched, 3)
      assert.equal(runResult.totals.valid, 3)
      assert.equal(runResult.totals.inserted, 3)
      assert.equal(runResult.totals.updated, 0)
      assert.equal(runResult.totals.failed, 0)

      assert.equal(runResult.providers.remotive.status, 'completed')
      assert.equal(runResult.providers.greenhouse.status, 'completed')
      assert.equal(runResult.providers.adzuna.status, 'completed')

      // Ingestion runs created in db
      assert.equal(dbClient.ingestionRuns.length, 3)
      assert.equal(dbClient.jobs.size, 3)
    })

    await t2.test('demonstrates independent failure isolation (Remotive fails, Greenhouse & Adzuna succeed)', async () => {
      const dbClient = new MockIngestionDatabaseClient()

      // Remotive fails
      const remotiveProvider = new MockJobProvider('remotive', {
        success: false,
        jobs: [],
        error: 'Remotive 500 Internal Server Error',
      })
      // Greenhouse succeeds
      const greenhouseJobs = [
        createSampleCanonicalJob({ source: 'greenhouse', sourceJobId: 'g100' }),
      ]
      const greenhouseProvider = new MockJobProvider('greenhouse', { success: true, jobs: greenhouseJobs })
      // Adzuna succeeds
      const adzunaJobs = [
        createSampleCanonicalJob({ source: 'adzuna', sourceJobId: 'a200' }),
      ]
      const adzunaProvider = new MockJobProvider('adzuna', { success: true, jobs: adzunaJobs })

      const worker = new JobIngestionWorker({
        providers: [remotiveProvider, greenhouseProvider, adzunaProvider],
        databaseClient: dbClient,
      })

      const runResult = await worker.runAll()

      // Overall run must not crash
      assert.equal(runResult.providers.remotive.status, 'failed')
      assert.equal(runResult.providers.greenhouse.status, 'completed')
      assert.equal(runResult.providers.adzuna.status, 'completed')

      // Succeeded jobs are safely stored
      assert.equal(runResult.totals.fetched, 2)
      assert.equal(runResult.totals.inserted, 2)
      assert.equal(dbClient.jobs.size, 2)
      assert.ok(dbClient.jobs.has('greenhouse::g100'))
      assert.ok(dbClient.jobs.has('adzuna::a200'))
    })
  })

  await t.test('4. Upsert Semantics & Timestamp Preservation', async (t2) => {
    await t2.test('preserves original posted_at when updating an existing job', async () => {
      const dbClient = new MockIngestionDatabaseClient()

      const initialJob = createSampleCanonicalJob({
        source: 'greenhouse',
        sourceJobId: 'p1',
        title: 'Initial Title',
        postedAt: '2026-08-15T00:00:00.000Z',
      })

      const providerInitial = new MockJobProvider('greenhouse', { success: true, jobs: [initialJob] })
      const worker1 = new JobIngestionWorker({
        providers: [providerInitial],
        databaseClient: dbClient,
      })

      // First run: inserts job
      const run1 = await worker1.runAll()
      assert.equal(run1.totals.inserted, 1)
      assert.equal(run1.totals.updated, 0)

      const storedInitial = dbClient.jobs.get('greenhouse::p1')!
      assert.equal(storedInitial.title, 'Initial Title')
      assert.equal(storedInitial.posted_at, '2026-08-15T00:00:00.000Z')

      // Second run: provider re-delivers the same job with an updated description and newer timestamp
      const updatedJob = createSampleCanonicalJob({
        source: 'greenhouse',
        sourceJobId: 'p1',
        title: 'Updated Senior Title',
        postedAt: '2026-09-12T00:00:00.000Z', // newer timestamp
      })

      const providerUpdated = new MockJobProvider('greenhouse', { success: true, jobs: [updatedJob] })
      const worker2 = new JobIngestionWorker({
        providers: [providerUpdated],
        databaseClient: dbClient,
      })

      const run2 = await worker2.runAll()
      assert.equal(run2.totals.inserted, 0)
      assert.equal(run2.totals.updated, 1)

      const storedUpdated = dbClient.jobs.get('greenhouse::p1')!
      assert.equal(storedUpdated.title, 'Updated Senior Title')
      // posted_at must remain the original 2026-08-15 date!
      assert.equal(storedUpdated.posted_at, '2026-08-15T00:00:00.000Z')
      assert.equal(storedUpdated.is_active, true)
    })
  })

  await t.test('5. Credential Protection & Log Sanitization', async (t2) => {
    await t2.test('redacts secrets, tokens, and app keys from logs', () => {
      const sensitiveMsg = 'Error calling https://api.adzuna.com/v1/jobs/search?app_id=my_secret_id&app_key=my_secret_key with bearer eyJhbGciOi'
      const sanitized = sanitizeLogString(sensitiveMsg)

      assert.ok(!sanitized.includes('my_secret_id'))
      assert.ok(!sanitized.includes('my_secret_key'))
      assert.ok(!sanitized.includes('eyJhbGciOi'))
      assert.ok(sanitized.includes('[REDACTED]'))
    })

    await t2.test('never logs credentials when provider fails with auth error', async () => {
      const loggedEntries: any[] = []
      const customLogger = (entry: any) => {
        loggedEntries.push(entry)
      }

      const failingProvider = new MockJobProvider('adzuna', {
        success: false,
        jobs: [],
        error: 'Failed to authenticate with app_id=secret_id_123&app_key=secret_key_456',
      })

      const worker = new JobIngestionWorker({
        providers: [failingProvider],
        logger: customLogger,
      })

      await worker.runAll()

      for (const entry of loggedEntries) {
        const str = JSON.stringify(entry)
        assert.ok(!str.includes('secret_id_123'))
        assert.ok(!str.includes('secret_key_456'))
      }
    })
  })

  await t.test('6. Ingestion Runs Metrics Recording', async (t2) => {
    await t2.test('records accurate metrics in ingestion_runs and job_sources', async () => {
      const dbClient = new MockIngestionDatabaseClient()

      const jobs = [
        createSampleCanonicalJob({ source: 'remotive', sourceJobId: 'j1' }),
        createSampleCanonicalJob({ source: 'remotive', sourceJobId: 'j2' }),
        createSampleCanonicalJob({ source: 'remotive', sourceJobId: 'j2' }), // duplicate
        createSampleCanonicalJob({ source: 'remotive', sourceJobId: '', title: '' }), // invalid
      ]

      const provider = new MockJobProvider('remotive', { success: true, jobs })
      const worker = new JobIngestionWorker({
        providers: [provider],
        databaseClient: dbClient,
      })

      const summary = await worker.runProvider(provider)

      assert.equal(summary.fetchedCount, 4)
      assert.equal(summary.failedCount, 1) // 1 invalid
      assert.equal(summary.deduplicatedCount, 1) // 1 duplicate
      assert.equal(summary.validCount, 2)
      assert.equal(summary.insertedCount, 2)
      assert.equal(summary.status, 'completed')

      // Check ingestion_runs record
      const runRecord = dbClient.ingestionRuns[0]
      assert.equal(runRecord.source, 'remotive')
      assert.equal(runRecord.status, 'completed')
      assert.equal(runRecord.fetched_count, 4)
      assert.equal(runRecord.failed_count, 1)
      assert.equal(runRecord.deduplicated_count, 1)
      assert.equal(runRecord.inserted_count, 2)
      assert.ok(runRecord.completed_at)

      // Check job_sources record
      const sourceRecord = dbClient.jobSources.get('remotive')!
      assert.ok(sourceRecord.last_run_at)
      assert.ok(sourceRecord.last_success_at)
      assert.equal(sourceRecord.last_error, null)
    })
  })
})
