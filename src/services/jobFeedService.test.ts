import test from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchJobListings,
  dbRowToJobListing,
  clearJobFeedCache,
  FALLBACK_VERIFIED_JOBS,
} from './jobFeedService.ts'
import {
  filterJobListings,
  sortJobListings,
} from '../pages/JobFeed/JobFeedModel.ts'
import {
  rankJobListings,
  getRecommendedJobs,
  type CandidateSignals,
} from './jobRecommendationService.ts'
import type { JobFeedFilterState, JobListing } from '../types/jobFeed.ts'

// Sample canonical database rows as stored in public.jobs
function createSampleDbRow(overrides?: Record<string, any>): Record<string, any> {
  return {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    source: 'remotive',
    source_job_id: '1001',
    raw_source_id: 'remotive-1001',
    source_name: 'Remotive',
    source_url: 'https://remotive.com/job/1001',
    apply_url: 'https://remotive.com/apply/1001',
    canonical_url: 'https://remotive.com/apply/1001',
    title: 'Senior Distributed Systems Engineer',
    company: 'Cloudflare',
    company_logo: 'https://cloudflare.com/logo.png',
    description: 'Build high-performance edge compute with Rust and TypeScript.',
    location: 'Remote (Worldwide)',
    workplace_type: 'Remote',
    employment_type: 'Full-time',
    category: 'Software Development',
    skills: ['Rust', 'TypeScript', 'Distributed Systems'],
    salary_raw: '$160k - $200k',
    salary_min: 160000,
    salary_max: 200000,
    salary_currency: 'USD',
    normalized_title: 'senior distributed systems engineer',
    normalized_company: 'cloudflare',
    normalized_location: 'remote (worldwide)',
    source_metadata: { requisitionId: 'REQ-456' },
    is_active: true,
    posted_at: '2026-09-10T12:00:00.000Z',
    discovered_at: '2026-09-10T12:00:00.000Z',
    last_seen_at: '2026-09-12T12:00:00.000Z',
    expires_at: null,
    ...overrides,
  }
}

// Mock Supabase client generator for isolated query testing
function createMockSupabaseClient(response: {
  data?: any[] | null
  error?: { message: string } | null
  shouldThrow?: Error
}): SupabaseClient {
  return {
    from: (_table: string) => {
      const queryBuilder: any = {
        select: (_cols?: string) => queryBuilder,
        eq: (_col: string, _val: any) => queryBuilder,
        order: (_col: string, _opts?: any) => queryBuilder,
        limit: (_limit: number) => {
          if (response.shouldThrow) {
            return Promise.reject(response.shouldThrow)
          }
          return Promise.resolve({
            data: response.data !== undefined ? response.data : null,
            error: response.error !== undefined ? response.error : null,
          })
        },
      }
      return queryBuilder
    },
  } as unknown as SupabaseClient
}

test('JobTrack Job Feed Centralized Database Migration Suite', async (t) => {
  t.beforeEach(() => {
    clearJobFeedCache()
  })

  await t.test('1. Normalization: dbRowToJobListing', async (t2) => {
    await t2.test('correctly transforms valid database row into JobListing', () => {
      const row = createSampleDbRow()
      const listing = dbRowToJobListing(row)

      assert.ok(listing)
      assert.equal(listing.id, 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
      assert.equal(listing.title, 'Senior Distributed Systems Engineer')
      assert.equal(listing.company, 'Cloudflare')
      assert.equal(listing.companyLogo, 'https://cloudflare.com/logo.png')
      assert.equal(listing.location, 'Remote (Worldwide)')
      assert.equal(listing.workplaceType, 'Remote')
      assert.equal(listing.employmentType, 'Full-time')
      assert.equal(listing.category, 'Software Development')
      assert.equal(listing.salary, '$160k - $200k')
      assert.equal(listing.description, 'Build high-performance edge compute with Rust and TypeScript.')
      assert.deepEqual(listing.skills, ['Rust', 'TypeScript', 'Distributed Systems'])
      assert.equal(listing.postedDate, '2026-09-10T12:00:00.000Z')
      assert.equal(listing.source, 'Remotive')
      assert.equal(listing.applyUrl, 'https://remotive.com/apply/1001')

      // Canonical metadata preserved
      assert.equal(listing.sourceJobId, '1001')
      assert.equal(listing.canonicalUrl, 'https://remotive.com/apply/1001')
      assert.deepEqual(listing.sourceMetadata, { requisitionId: 'REQ-456' })
      assert.equal(listing.rawSourceId, 'remotive-1001')
    })

    await t2.test('rejects malformed records missing essential fields', () => {
      assert.equal(dbRowToJobListing(null), null)
      assert.equal(dbRowToJobListing(undefined), null)
      assert.equal(dbRowToJobListing({}), null)
      assert.equal(dbRowToJobListing(createSampleDbRow({ title: '' })), null)
      assert.equal(dbRowToJobListing(createSampleDbRow({ company: '   ' })), null)
      assert.equal(dbRowToJobListing(createSampleDbRow({ apply_url: '' })), null)
      assert.equal(dbRowToJobListing(createSampleDbRow({ apply_url: 'javascript:alert(1)' })), null)
      assert.equal(dbRowToJobListing(createSampleDbRow({ apply_url: 'ftp://ftp.example.com' })), null)
    })

    await t2.test('gracefully clamps unaligned workplace and employment types', () => {
      const row = createSampleDbRow({
        workplace_type: 'UnknownWorkplace',
        employment_type: 'Seasonal',
      })
      const listing = dbRowToJobListing(row)
      assert.ok(listing)
      assert.equal(listing.workplaceType, 'Remote')
      assert.equal(listing.employmentType, 'Full-time')
    })
  })

  await t.test('2. Primary Source: Jobs Fetched from Supabase', async (t2) => {
    await t2.test('fetches and normalizes records from Supabase public.jobs', async () => {
      const mockRows = [
        createSampleDbRow({ id: 'job-uuid-1', title: 'Full Stack Engineer', company: 'Linear' }),
        createSampleDbRow({ id: 'job-uuid-2', title: 'DevOps Architect', company: 'GitHub' }),
      ]

      const mockClient = createMockSupabaseClient({ data: mockRows, error: null })
      const jobs = await fetchJobListings({ client: mockClient, forceRefresh: true })

      assert.equal(jobs.length, 2)
      assert.equal(jobs[0].id, 'job-uuid-1')
      assert.equal(jobs[0].title, 'Full Stack Engineer')
      assert.equal(jobs[0].company, 'Linear')
      assert.equal(jobs[1].id, 'job-uuid-2')
      assert.equal(jobs[1].title, 'DevOps Architect')
      assert.equal(jobs[1].company, 'GitHub')
    })

    await t2.test('caches jobs in memory and re-uses on repeated calls without forceRefresh', async () => {
      let callCount = 0
      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => {
                  callCount++
                  return Promise.resolve({ data: [createSampleDbRow()], error: null })
                },
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient

      const first = await fetchJobListings({ client: mockClient, forceRefresh: true })
      assert.equal(callCount, 1)
      assert.equal(first.length, 1)

      const second = await fetchJobListings({ client: mockClient, forceRefresh: false })
      assert.equal(callCount, 1) // Re-used cache, no second database query
      assert.equal(second.length, 1)
    })
  })

  await t.test('3. Empty Remote Result: Never Falls Back to Local Jobs', async (t2) => {
    await t2.test('returns empty array when Supabase returns 0 jobs without error', async () => {
      const mockClient = createMockSupabaseClient({ data: [], error: null })
      const jobs = await fetchJobListings({ client: mockClient, forceRefresh: true })

      // CRITICAL REQUIREMENT 4: Must NOT return FALLBACK_VERIFIED_JOBS
      assert.equal(jobs.length, 0)
      assert.notEqual(jobs.length, FALLBACK_VERIFIED_JOBS.length)
    })
  })

  await t.test('4. Backend Failure: Fallback Only on Genuine Outage', async (t2) => {
    await t2.test('returns verified fallback listings on Supabase query error', async () => {
      const mockClient = createMockSupabaseClient({
        data: null,
        error: { message: '503 Service Unavailable: Database paused' },
      })

      const jobs = await fetchJobListings({ client: mockClient, forceRefresh: true })
      assert.ok(Array.isArray(jobs))
      assert.equal(jobs.length, FALLBACK_VERIFIED_JOBS.length)
      assert.equal(jobs[0].id, FALLBACK_VERIFIED_JOBS[0].id)
    })

    await t2.test('returns verified fallback listings when client throws network exception', async () => {
      const mockClient = createMockSupabaseClient({
        shouldThrow: new Error('Failed to fetch (net::ERR_INTERNET_DISCONNECTED)'),
      })

      const jobs = await fetchJobListings({ client: mockClient, forceRefresh: true })
      assert.equal(jobs.length, FALLBACK_VERIFIED_JOBS.length)
    })
  })

  await t.test('5. Malformed Jobs Isolation', async (t2) => {
    await t2.test('safely filters out corrupted records while preserving valid jobs in batch', async () => {
      const mixedRows = [
        createSampleDbRow({ id: 'valid-1', title: 'Frontend Developer' }),
        { id: 'corrupt-1', title: '', company: 'Bad Corp' }, // missing title
        { id: 'corrupt-2', title: 'Designer' }, // missing company & apply_url
        createSampleDbRow({ id: 'valid-2', title: 'Backend Developer' }),
      ]

      const mockClient = createMockSupabaseClient({ data: mixedRows, error: null })
      const jobs = await fetchJobListings({ client: mockClient, forceRefresh: true })

      assert.equal(jobs.length, 2)
      assert.equal(jobs[0].id, 'valid-1')
      assert.equal(jobs[1].id, 'valid-2')
    })
  })

  await t.test('6. Search Filtering on Canonical Jobs', async (t2) => {
    const jobs: JobListing[] = [
      dbRowToJobListing(createSampleDbRow({ id: '1', title: 'React Frontend Specialist', company: 'Meta' }))!,
      dbRowToJobListing(createSampleDbRow({ id: '2', title: 'Kubernetes Platform Engineer', company: 'Google', skills: ['Go', 'K8s'] }))!,
      dbRowToJobListing(createSampleDbRow({ id: '3', title: 'Data Scientist', company: 'OpenAI', skills: ['Python', 'PyTorch'] }))!,
    ]

    const baseFilter: JobFeedFilterState = {
      search: '',
      location: 'all',
      workplace: 'all',
      employmentType: 'all',
      category: 'all',
      sortBy: 'relevant',
    }

    const reactResults = filterJobListings(jobs, { ...baseFilter, search: 'React' })
    assert.equal(reactResults.length, 1)
    assert.equal(reactResults[0].id, '1')

    const k8sResults = filterJobListings(jobs, { ...baseFilter, search: 'kubernetes' })
    assert.equal(k8sResults.length, 1)
    assert.equal(k8sResults[0].id, '2')
  })

  await t.test('7. Workplace, Employment, and Category Filters', async (t2) => {
    const jobs: JobListing[] = [
      dbRowToJobListing(createSampleDbRow({ id: '1', workplace_type: 'Remote', employment_type: 'Full-time', category: 'Engineering' }))!,
      dbRowToJobListing(createSampleDbRow({ id: '2', workplace_type: 'Hybrid', employment_type: 'Contract', category: 'Engineering' }))!,
      dbRowToJobListing(createSampleDbRow({ id: '3', workplace_type: 'On-site', employment_type: 'Part-time', category: 'Design' }))!,
    ]

    const baseFilter: JobFeedFilterState = {
      search: '',
      location: 'all',
      workplace: 'all',
      employmentType: 'all',
      category: 'all',
      sortBy: 'relevant',
    }

    const remoteJobs = filterJobListings(jobs, { ...baseFilter, workplace: 'remote' })
    assert.equal(remoteJobs.length, 1)
    assert.equal(remoteJobs[0].id, '1')

    const contractJobs = filterJobListings(jobs, { ...baseFilter, employmentType: 'contract' })
    assert.equal(contractJobs.length, 1)
    assert.equal(contractJobs[0].id, '2')

    const designJobs = filterJobListings(jobs, { ...baseFilter, category: 'design' })
    assert.equal(designJobs.length, 1)
    assert.equal(designJobs[0].id, '3')
  })

  await t.test('8. Relevance Ranking & Smart Job Discovery on Canonical Jobs', async (t2) => {
    const jobs: JobListing[] = [
      dbRowToJobListing(createSampleDbRow({
        id: '1',
        apply_url: 'https://cloudflare.com/jobs/1',
        canonical_url: 'https://cloudflare.com/jobs/1',
        title: 'Staff Rust Engineer',
        skills: ['Rust', 'WebAssembly'],
      }))!,
      dbRowToJobListing(createSampleDbRow({
        id: '2',
        apply_url: 'https://cloudflare.com/jobs/2',
        canonical_url: 'https://cloudflare.com/jobs/2',
        title: 'Junior QA Tester',
        skills: ['Manual Testing'],
      }))!,
    ]

    const signals: CandidateSignals = {
      skills: ['Rust', 'WebAssembly'],
      preferredJobTitle: 'Staff Rust Engineer',
    }

    const ranked = rankJobListings(jobs, signals)
    assert.equal(ranked.length, 2)
    assert.equal(ranked[0].job.id, '1')
    assert.ok(ranked[0].relevance.score >= 50)
    assert.equal(ranked[0].relevance.isRecommended, true)
    assert.ok(ranked[0].relevance.reasons.some((r) => r.type === 'skill_match'))

    const recommended = getRecommendedJobs(ranked, 1)
    assert.equal(recommended.length, 1)
    assert.equal(recommended[0].job.id, '1')
  })

  await t.test('9. Pagination on Canonical Jobs', async (t2) => {
    const manyJobs: JobListing[] = []
    for (let i = 1; i <= 35; i++) {
      manyJobs.push(
        dbRowToJobListing(
          createSampleDbRow({ id: `job-${i}`, title: `Engineer ${i}` }),
        )!,
      )
    }

    const PAGE_SIZE = 15
    const totalPages = Math.ceil(manyJobs.length / PAGE_SIZE)
    assert.equal(totalPages, 3)

    const page1 = manyJobs.slice(0, PAGE_SIZE)
    assert.equal(page1.length, 15)
    assert.equal(page1[0].id, 'job-1')
    assert.equal(page1[14].id, 'job-15')

    const page2 = manyJobs.slice(PAGE_SIZE, PAGE_SIZE * 2)
    assert.equal(page2.length, 15)
    assert.equal(page2[0].id, 'job-16')
    assert.equal(page2[14].id, 'job-30')

    const page3 = manyJobs.slice(PAGE_SIZE * 2)
    assert.equal(page3.length, 5)
    assert.equal(page3[0].id, 'job-31')
    assert.equal(page3[4].id, 'job-35')
  })
})
