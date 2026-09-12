import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { RemotiveAdapter, defaultRemotiveAdapter } from './jobProviderAdapter.ts'
import { canonicalJobToJobListing } from '../types/canonicalJob.ts'
import { fetchJobListings, FALLBACK_VERIFIED_JOBS, type RemotiveRawJob } from './jobFeedService.ts'

describe('Remotive Provider Adapter & Ingestion Pipeline', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('RemotiveAdapter Unit Contract', () => {
    const adapter = new RemotiveAdapter()

    it('identifies with providerName "remotive"', () => {
      assert.equal(adapter.providerName, 'remotive')
    })

    it('extracts sourceJobId correctly from raw job', () => {
      assert.equal(adapter.getSourceJobId({ id: 12345 } as RemotiveRawJob), '12345')
      assert.equal(adapter.getSourceJobId({ id: 'abc-99' } as RemotiveRawJob), 'abc-99')
    })

    it('normalizes Remotive job into canonical format', () => {
      const raw: RemotiveRawJob = {
        id: 7711,
        url: 'https://remotive.com/remote-jobs/dev/lead-architect-7711?ref=board',
        title: 'Lead Cloud Architect',
        company_name: 'HashiCorp',
        company_logo: 'https://remotive.com/logos/7711.png',
        category: 'DevOps / Sysadmin',
        tags: ['Terraform', 'Vault', 'Consul', 'AWS'],
        job_type: 'full_time',
        publication_date: '2026-09-12T08:00:00Z',
        candidate_required_location: 'USA, Canada',
        salary: '$180,000 - $220,000',
        description: '<p>Lead infrastructure automation across distributed environments.</p>',
      }

      const job = adapter.normalizeJob(raw)

      assert.equal(job.source, 'remotive')
      assert.equal(job.sourceJobId, '7711')
      assert.equal(job.sourceName, 'Remotive')
      assert.equal(job.title, 'Lead Cloud Architect')
      assert.equal(job.company, 'HashiCorp')
      assert.equal(job.location, 'Remote (USA, Canada)')
      assert.equal(job.workplaceType, 'Remote')
      assert.equal(job.employmentType, 'Full-time')
      assert.equal(job.category, 'DevOps / Sysadmin')
      assert.deepEqual(job.skills, ['Terraform', 'Vault', 'Consul', 'AWS'])
      assert.equal(job.salary.raw, '$180,000 - $220,000')
      assert.equal(job.applyUrl, 'https://remotive.com/remote-jobs/dev/lead-architect-7711?ref=board')
      assert.equal(job.canonicalUrl, 'https://remotive.com/remote-jobs/dev/lead-architect-7711')
      assert.equal(job.normalizedTitle, 'lead cloud architect')
      assert.equal(job.normalizedCompany, 'hashicorp')
      assert.equal(job.sourceMetadata.candidate_required_location, 'USA, Canada')
      assert.equal(job.isActive, true)
    })

    it('handles worldwide / anywhere candidate locations cleanly', () => {
      const raw1: RemotiveRawJob = {
        id: 1,
        url: 'https://remotive.com/1',
        title: 'Engineer',
        company_name: 'Co',
        candidate_required_location: 'Worldwide',
      }
      const raw2: RemotiveRawJob = {
        id: 2,
        url: 'https://remotive.com/2',
        title: 'Engineer',
        company_name: 'Co',
        candidate_required_location: 'Anywhere',
      }
      const raw3: RemotiveRawJob = {
        id: 3,
        url: 'https://remotive.com/3',
        title: 'Engineer',
        company_name: 'Co',
        candidate_required_location: '',
      }

      assert.equal(adapter.normalizeJob(raw1).location, 'Remote (Worldwide)')
      assert.equal(adapter.normalizeJob(raw2).location, 'Remote (Worldwide)')
      assert.equal(adapter.normalizeJob(raw3).location, 'Remote (Worldwide)')
    })
  })

  describe('fetchJobs() Resiliency & Edge Case Handling', () => {
    let testAdapter: RemotiveAdapter

    beforeEach(() => {
      testAdapter = new RemotiveAdapter({ baseUrl: 'https://remotive.com/api/remote-jobs', cacheTtlMs: 1000 })
    })

    it('handles successful API response and caches results', async () => {
      const mockJobs: RemotiveRawJob[] = [
        {
          id: 101,
          url: 'https://remotive.com/101',
          title: 'Staff Frontend Engineer',
          company_name: 'Shopify',
          tags: ['React', 'TypeScript'],
        },
      ]

      let callCount = 0
      globalThis.fetch = async () => {
        callCount++
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ jobs: mockJobs }),
        } as unknown as Response
      }

      const res1 = await testAdapter.fetchJobs()
      assert.equal(res1.success, true)
      assert.equal(res1.jobs.length, 1)
      assert.equal(res1.fromCache, false)
      assert.equal(res1.jobs[0].title, 'Staff Frontend Engineer')
      assert.equal(callCount, 1)

      // Second call should return from memory cache without invoking fetch again
      const res2 = await testAdapter.fetchJobs()
      assert.equal(res2.success, true)
      assert.equal(res2.fromCache, true)
      assert.equal(callCount, 1)

      // Forced refresh bypasses cache
      const res3 = await testAdapter.fetchJobs({ forceRefresh: true })
      assert.equal(res3.success, true)
      assert.equal(res3.fromCache, false)
      assert.equal(callCount, 2)
    })

    it('gracefully handles rate limits (HTTP 429) without crashing', async () => {
      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        } as unknown as Response
      }

      const res = await testAdapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, false)
      assert.equal(res.statusCode, 429)
      assert.ok(res.error?.includes('rate limit'))
    })

    it('gracefully handles server errors (HTTP 500) without crashing', async () => {
      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as unknown as Response
      }

      const res = await testAdapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, false)
      assert.equal(res.statusCode, 500)
      assert.ok(res.error?.includes('HTTP 500'))
    })

    it('gracefully handles network timeouts / abort signals', async () => {
      globalThis.fetch = async (_url, init) => {
        return new Promise((_, reject) => {
          const signal = init?.signal
          if (signal) {
            signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted')
              err.name = 'AbortError'
              reject(err)
            })
          }
        })
      }

      const res = await testAdapter.fetchJobs({ timeoutMs: 20 })
      assert.equal(res.success, false)
      assert.ok(res.error?.includes('timed out') || res.error?.includes('aborted'))
    })

    it('gracefully handles malformed non-JSON response', async () => {
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => {
            throw new SyntaxError('Unexpected token < in JSON at position 0')
          },
        } as unknown as Response
      }

      const res = await testAdapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, false)
      assert.ok(res.error?.includes('malformed'))
    })

    it('gracefully handles unexpected response schemas', async () => {
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ wrongKey: [] }), // Missing 'jobs' array
        } as unknown as Response
      }

      const res = await testAdapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, false)
      assert.ok(res.error?.includes('schema'))
    })

    it('handles empty jobs array cleanly', async () => {
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ jobs: [] }),
        } as unknown as Response
      }

      const res = await testAdapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, true)
      assert.equal(res.jobs.length, 0)
    })

    it('skips individual corrupted records while preserving valid ones in the batch', async () => {
      const mixedData: unknown[] = [
        null,
        'not a job object',
        { id: 99, title: 'Valid Job', company_name: 'Acme', url: 'https://example.com/job' },
      ]

      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ jobs: mixedData }),
        } as unknown as Response
      }

      const res = await testAdapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, true)
      assert.equal(res.jobs.length, 1)
      assert.equal(res.jobs[0].title, 'Valid Job')
    })
  })

  describe('Integration with fetchJobListings() Frontend Service', () => {
    it('returns verified fallback listings if the provider adapter fails', async () => {
      globalThis.fetch = async () => {
        throw new Error('Network offline')
      }

      const jobs = await fetchJobListings({ forceRefresh: true })
      assert.ok(Array.isArray(jobs))
      assert.equal(jobs.length, FALLBACK_VERIFIED_JOBS.length)
      assert.equal(jobs[0].id, FALLBACK_VERIFIED_JOBS[0].id)
    })

    it('returns converted JobListing objects when the provider succeeds', async () => {
      const mockRaw: RemotiveRawJob = {
        id: 550,
        title: 'Principal Systems Engineer',
        company_name: 'Vercel',
        url: 'https://remotive.com/jobs/550',
        tags: ['Rust', 'Go', 'Next.js'],
        job_type: 'full_time',
        candidate_required_location: 'Worldwide',
        salary: '$200,000',
        publication_date: '2026-09-12T00:00:00.000Z',
      }

      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ jobs: [mockRaw] }),
        } as unknown as Response
      }

      const res = await defaultRemotiveAdapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, true)
      assert.equal(res.jobs.length, 1)
      const job = canonicalJobToJobListing(res.jobs[0])
      assert.equal(job.title, 'Principal Systems Engineer')
      assert.equal(job.company, 'Vercel')
      assert.equal(job.workplaceType, 'Remote')
      assert.equal(job.employmentType, 'Full-time')
      assert.deepEqual(job.skills, ['Rust', 'Go', 'Next.js'])
      assert.equal(job.salary, '$200,000')
      assert.equal(job.source, 'Remotive')
    })
  })
})
