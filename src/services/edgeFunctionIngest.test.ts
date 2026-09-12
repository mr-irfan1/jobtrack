import test from 'node:test'
import assert from 'node:assert/strict'
import { requireServerAuth } from '../../supabase/functions/_shared/serverAuth.ts'
import {
  canonicalizeUrl,
  deduplicateCanonicalJobs,
  sanitizeHtml,
  sanitizeLog,
  validateCanonicalJob,
  type CanonicalJob,
} from '../../supabase/functions/ingest-jobs/worker.ts'

function createSampleJob(overrides?: Partial<CanonicalJob>): CanonicalJob {
  const id = overrides?.sourceJobId || '101'
  return {
    id: `job_${id}`,
    source: 'remotive',
    sourceJobId: id,
    sourceName: 'Remotive',
    sourceUrl: `https://remotive.com/job/${id}`,
    applyUrl: `https://remotive.com/apply/${id}`,
    canonicalUrl: `https://remotive.com/apply/${id}`,
    title: 'Staff Platform Engineer',
    company: 'Vercel',
    companyLogo: null,
    description: 'Lead edge infrastructure.',
    location: 'Remote',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    category: 'Engineering',
    skills: ['Rust', 'TypeScript'],
    salary: { raw: 'USD 180,000', min: 180000, max: 180000, currency: 'USD', period: 'yearly' },
    normalizedTitle: 'staff platform engineer',
    normalizedCompany: 'vercel',
    normalizedLocation: 'remote',
    sourceMetadata: {},
    isActive: true,
    postedAt: '2026-09-01T00:00:00.000Z',
    discoveredAt: '2026-09-01T00:00:00.000Z',
    lastSeenAt: '2026-09-01T00:00:00.000Z',
    expiresAt: null,
    ...overrides,
  }
}

test('ingest-jobs Supabase Edge Function', async (t) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
  }

  await t.test('1. Security & Server Authorization', async (t2) => {
    const originalEnvServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    const originalEnvIngestionSecret = process.env.INGESTION_SECRET

    t2.beforeEach(() => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_secret_key_777'
      process.env.INGESTION_SECRET = 'test_cron_secret_abc'
    })

    t2.afterEach(() => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnvServiceRole
      process.env.INGESTION_SECRET = originalEnvIngestionSecret
    })

    await t2.test('rejects unauthenticated requests without authorization header', async () => {
      const req = new Request('https://edge.supabase.co/functions/v1/ingest-jobs', {
        method: 'POST',
      })
      const auth = requireServerAuth(req, corsHeaders)
      assert.equal(auth.authorized, false)
      assert.ok(auth.errorResponse)
      assert.equal(auth.errorResponse?.status, 401)
    })

    await t2.test('rejects unauthorized requests with invalid bearer token', async () => {
      const req = new Request('https://edge.supabase.co/functions/v1/ingest-jobs', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer wrong_token_value',
        },
      })
      const auth = requireServerAuth(req, corsHeaders)
      assert.equal(auth.authorized, false)
      assert.equal(auth.errorResponse?.status, 401)
    })

    await t2.test('authorizes internal calls with SUPABASE_SERVICE_ROLE_KEY as Bearer token', async () => {
      const req = new Request('https://edge.supabase.co/functions/v1/ingest-jobs', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test_service_role_secret_key_777',
        },
      })
      const auth = requireServerAuth(req, corsHeaders)
      assert.equal(auth.authorized, true)
      assert.equal(auth.errorResponse, undefined)
    })

    await t2.test('authorizes backend cron calls with x-ingestion-secret header', async () => {
      const req = new Request('https://edge.supabase.co/functions/v1/ingest-jobs', {
        method: 'POST',
        headers: {
          'x-ingestion-secret': 'test_cron_secret_abc',
        },
      })
      const auth = requireServerAuth(req, corsHeaders)
      assert.equal(auth.authorized, true)
      assert.equal(auth.errorResponse, undefined)
    })

    await t2.test('redacts secrets, tokens, and app keys from log strings', () => {
      const sensitive = 'Failed connecting with app_id=secret_id_999&app_key=secret_key_888 and Bearer jwt_secret_123'
      const sanitized = sanitizeLog(sensitive)

      assert.ok(!sanitized.includes('secret_id_999'))
      assert.ok(!sanitized.includes('secret_key_888'))
      assert.ok(!sanitized.includes('jwt_secret_123'))
      assert.ok(sanitized.includes('[REDACTED]'))
    })
  })

  await t.test('2. HTML Sanitization & URL Canonicalization', async (t2) => {
    await t2.test('strips HTML and decodes entities cleanly', () => {
      const dirtyHtml = '<p>Role description with <b>bold text</b> &amp; bullet point:</p><li>Feature</li>'
      const clean = sanitizeHtml(dirtyHtml)

      assert.ok(!clean.includes('<p>'))
      assert.ok(!clean.includes('<b>'))
      assert.ok(clean.includes('&'))
      assert.ok(clean.includes('• Feature'))
    })

    await t2.test('strips marketing & tracking query parameters from canonical URL', () => {
      const rawUrl = 'https://boards.greenhouse.io/figma/jobs/4001?utm_source=adzuna&utm_medium=cpc&ref=aggregator'
      const canonical = canonicalizeUrl(rawUrl)

      assert.equal(canonical, 'https://boards.greenhouse.io/figma/jobs/4001')
      assert.ok(!canonical.includes('utm_source'))
      assert.ok(!canonical.includes('ref='))
    })
  })

  await t.test('3. Schema Validation', async (t2) => {
    await t2.test('validates required canonical fields', () => {
      assert.equal(validateCanonicalJob(createSampleJob()).valid, true)
    })

    await t2.test('rejects missing or empty fields', () => {
      assert.equal(validateCanonicalJob(createSampleJob({ title: '   ' })).valid, false)
      assert.equal(validateCanonicalJob(createSampleJob({ company: '' })).valid, false)
      assert.equal(validateCanonicalJob(createSampleJob({ applyUrl: '' })).valid, false)
      assert.equal(validateCanonicalJob(createSampleJob({ applyUrl: 'javascript:void(0)' })).valid, false)
      assert.equal(validateCanonicalJob(createSampleJob({ sourceJobId: '' })).valid, false)
      assert.equal(validateCanonicalJob(createSampleJob({ source: '' })).valid, false)
    })
  })

  await t.test('4. Cross-Provider Deduplication Strategy', async (t2) => {
    await t2.test('deduplicates same (source, sourceJobId)', () => {
      const jobA = createSampleJob({ sourceJobId: '101' })
      const jobB = createSampleJob({ sourceJobId: '101' })

      const { uniqueJobs, deduplicatedCount } = deduplicateCanonicalJobs([jobA, jobB])
      assert.equal(uniqueJobs.length, 1)
      assert.equal(deduplicatedCount, 1)
    })

    await t2.test('deduplicates identical canonical URLs across providers', () => {
      const remotiveJob = createSampleJob({
        source: 'remotive',
        sourceJobId: 'r_100',
        canonicalUrl: 'https://careers.stripe.com/jobs/lead-architect',
      })
      const greenhouseJob = createSampleJob({
        source: 'greenhouse',
        sourceJobId: 'gh_200',
        canonicalUrl: 'https://careers.stripe.com/jobs/lead-architect?utm_source=remotive',
      })

      const { uniqueJobs, deduplicatedCount } = deduplicateCanonicalJobs([remotiveJob, greenhouseJob])
      assert.equal(uniqueJobs.length, 1)
      assert.equal(deduplicatedCount, 1)
    })

    await t2.test('does NOT merge distinct jobs', () => {
      const job1 = createSampleJob({ sourceJobId: '1', canonicalUrl: 'https://a.com/job1' })
      const job2 = createSampleJob({ sourceJobId: '2', canonicalUrl: 'https://a.com/job2' })

      const { uniqueJobs, deduplicatedCount } = deduplicateCanonicalJobs([job1, job2])
      assert.equal(uniqueJobs.length, 2)
      assert.equal(deduplicatedCount, 0)
    })
  })
})
