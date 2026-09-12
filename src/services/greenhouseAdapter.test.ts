import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  GreenhouseAdapter,
  extractEmploymentTypeFromGreenhouse,
  extractWorkplaceTypeFromGreenhouse,
  type GreenhouseBoardConfig,
  type GreenhouseRawJob,
} from './greenhouseAdapter.ts'
import { getProviderAdapter } from './jobProviderAdapter.ts'

describe('Greenhouse Provider Adapter', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('Contract & Metadata Extraction', () => {
    const adapter = new GreenhouseAdapter({
      boards: [
        { boardToken: 'figma', companyName: 'Figma', companyLogo: 'https://figma.com/logo.png', defaultCategory: 'Design' },
      ],
    })

    it('identifies with providerName "greenhouse"', () => {
      assert.equal(adapter.providerName, 'greenhouse')
      assert.equal(getProviderAdapter('greenhouse')?.providerName, 'greenhouse')
    })

    it('extracts sourceJobId correctly', () => {
      assert.equal(adapter.getSourceJobId({ id: 987654 } as GreenhouseRawJob), '987654')
      assert.equal(adapter.getSourceJobId({ id: 'gh-123' } as GreenhouseRawJob), 'gh-123')
    })

    it('extracts workplace type from custom metadata or location hints', () => {
      // 1. Explicit metadata
      const remoteJob: GreenhouseRawJob = {
        id: 1,
        title: 'Engineer',
        absolute_url: 'https://boards.greenhouse.io/job/1',
        metadata: [{ name: 'Workplace Type', value: 'Remote' }],
      }
      assert.equal(extractWorkplaceTypeFromGreenhouse(remoteJob), 'Remote')

      const hybridJob: GreenhouseRawJob = {
        id: 2,
        title: 'Designer',
        absolute_url: 'https://boards.greenhouse.io/job/2',
        metadata: [{ name: 'Workplace Type', value: 'Hybrid' }],
      }
      assert.equal(extractWorkplaceTypeFromGreenhouse(hybridJob), 'Hybrid')

      // 2. Location name hints
      const locRemote: GreenhouseRawJob = {
        id: 3,
        title: 'Writer',
        absolute_url: 'https://boards.greenhouse.io/job/3',
        location: { name: 'Remote - United States' },
      }
      assert.equal(extractWorkplaceTypeFromGreenhouse(locRemote), 'Remote')

      const locOnsite: GreenhouseRawJob = {
        id: 4,
        title: 'Manager',
        absolute_url: 'https://boards.greenhouse.io/job/4',
        location: { name: 'San Francisco, CA' },
      }
      assert.equal(extractWorkplaceTypeFromGreenhouse(locOnsite), 'On-site')
    })

    it('extracts employment type from metadata', () => {
      const ftJob: GreenhouseRawJob = {
        id: 1,
        title: 'Engineer',
        absolute_url: 'https://boards.greenhouse.io/job/1',
        metadata: [{ name: 'Employment Type', value: 'Full-Time' }],
      }
      assert.equal(extractEmploymentTypeFromGreenhouse(ftJob), 'Full-time')

      const contractJob: GreenhouseRawJob = {
        id: 2,
        title: 'Consultant',
        absolute_url: 'https://boards.greenhouse.io/job/2',
        metadata: [{ name: 'Employment Type', value: 'Contractor' }],
      }
      assert.equal(extractEmploymentTypeFromGreenhouse(contractJob), 'Contract')

      const defaultJob: GreenhouseRawJob = {
        id: 3,
        title: 'Intern',
        absolute_url: 'https://boards.greenhouse.io/job/3',
      }
      assert.equal(extractEmploymentTypeFromGreenhouse(defaultJob), 'Full-time')
    })

    it('normalizes a complete Greenhouse job fixture into canonical format', () => {
      const rawJob: GreenhouseRawJob = {
        id: 445566,
        internal_job_id: 112233,
        title: 'Senior Systems Engineer (Distributed Systems)',
        updated_at: '2026-09-11T16:00:00-04:00',
        requisition_id: 'INFRA-900',
        absolute_url: 'https://boards.greenhouse.io/figma/jobs/445566?gh_jid=445566',
        location: { name: 'San Francisco, CA or Remote' },
        metadata: [
          { name: 'Workplace Type', value: 'Remote' },
          { name: 'Employment Type', value: 'Full-Time' },
        ],
        departments: [{ id: 10, name: 'Core Infrastructure' }],
        offices: [{ id: 20, name: 'San Francisco HQ', location: 'San Francisco, CA' }],
        content: '&lt;p&gt;Help us scale &lt;strong&gt;Figma&lt;/strong&gt; infrastructure.&lt;/p&gt;',
      }

      const board: GreenhouseBoardConfig = {
        boardToken: 'figma',
        companyName: 'Figma',
        companyLogo: 'https://figma.com/logo.png',
        defaultCategory: 'Infrastructure',
      }

      const canonical = adapter.normalizeJob(rawJob, board)

      assert.equal(canonical.id, 'greenhouse_445566')
      assert.equal(canonical.source, 'greenhouse')
      assert.equal(canonical.sourceJobId, '445566')
      assert.equal(canonical.rawSourceId, '112233')
      assert.equal(canonical.sourceName, 'Figma (Greenhouse)')
      assert.equal(canonical.company, 'Figma')
      assert.equal(canonical.companyLogo, 'https://figma.com/logo.png')
      assert.equal(canonical.title, 'Senior Systems Engineer (Distributed Systems)')
      assert.equal(canonical.location, 'San Francisco, CA or Remote')
      assert.equal(canonical.workplaceType, 'Remote')
      assert.equal(canonical.employmentType, 'Full-time')
      assert.equal(canonical.category, 'Core Infrastructure')
      assert.equal(canonical.applyUrl, 'https://boards.greenhouse.io/figma/jobs/445566?gh_jid=445566')
      assert.equal(canonical.canonicalUrl, 'https://boards.greenhouse.io/figma/jobs/445566')
      assert.equal(canonical.normalizedTitle, 'senior systems engineer (distributed systems)')
      assert.equal(canonical.normalizedCompany, 'figma')
      assert.equal(canonical.description, 'Help us scale Figma infrastructure.')
      assert.equal(canonical.sourceMetadata.board_token, 'figma')
      assert.equal(canonical.sourceMetadata.requisition_id, 'INFRA-900')
      assert.equal(canonical.isActive, true)
    })
  })

  describe('Board Configuration Management', () => {
    it('manages allowlist dynamically via setBoard and removeBoard', () => {
      const adapter = new GreenhouseAdapter({ boards: [] })
      assert.equal(adapter.getBoards().length, 0)

      adapter.setBoard({
        boardToken: 'stripe',
        companyName: 'Stripe',
        isEnabled: true,
      })
      assert.equal(adapter.getBoards().length, 1)
      assert.equal(adapter.getBoards()[0].companyName, 'Stripe')

      adapter.removeBoard('stripe')
      assert.equal(adapter.getBoards().length, 0)
    })
  })

  describe('Network Ingestion & Resilience (Mocked Fetch)', () => {
    const testBoards: GreenhouseBoardConfig[] = [
      { boardToken: 'figma', companyName: 'Figma', isEnabled: true },
      { boardToken: 'vercel', companyName: 'Vercel', isEnabled: true },
    ]

    let adapter: GreenhouseAdapter

    beforeEach(() => {
      adapter = new GreenhouseAdapter({
        baseUrl: 'https://boards-api.greenhouse.io/v1/boards',
        boards: testBoards,
        cacheTtlMs: 1000,
      })
    })

    it('fetches and aggregates jobs across multiple configured boards', async () => {
      const figmaJobs: GreenhouseRawJob[] = [
        {
          id: 1001,
          title: 'Product Designer',
          absolute_url: 'https://boards.greenhouse.io/figma/jobs/1001',
          location: { name: 'Remote' },
        },
      ]
      const vercelJobs: GreenhouseRawJob[] = [
        {
          id: 2002,
          title: 'Next.js Solutions Engineer',
          absolute_url: 'https://boards.greenhouse.io/vercel/jobs/2002',
          location: { name: 'San Francisco, CA' },
        },
      ]

      globalThis.fetch = async (url) => {
        const urlStr = String(url)
        if (urlStr.includes('/figma/')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({ jobs: figmaJobs }),
          } as unknown as Response
        }
        if (urlStr.includes('/vercel/')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({ jobs: vercelJobs }),
          } as unknown as Response
        }
        return { ok: false, status: 404 } as unknown as Response
      }

      const res = await adapter.fetchJobs()
      assert.equal(res.success, true)
      assert.equal(res.jobs.length, 2)
      assert.equal(res.fromCache, false)

      const titles = res.jobs.map((j) => j.title)
      assert.ok(titles.includes('Product Designer'))
      assert.ok(titles.includes('Next.js Solutions Engineer'))

      // Second call reads from memory cache
      const cached = await adapter.fetchJobs()
      assert.equal(cached.success, true)
      assert.equal(cached.fromCache, true)
    })

    it('handles invalid board token (HTTP 404) gracefully', async () => {
      const singleAdapter = new GreenhouseAdapter({
        boards: [{ boardToken: 'nonexistent-co', companyName: 'Ghost', isEnabled: true }],
      })

      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as unknown as Response
      }

      const res = await singleAdapter.fetchJobs()
      assert.equal(res.success, false)
      assert.ok(res.error?.includes('not found'))
    })

    it('handles rate limits (HTTP 429) cleanly', async () => {
      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        } as unknown as Response
      }

      const res = await adapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, false)
      assert.ok(res.error?.includes('Rate limited'))
    })

    it('handles network timeouts without crashing', async () => {
      globalThis.fetch = async (_url, init) => {
        return new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
      }

      const res = await adapter.fetchJobs({ timeoutMs: 20, forceRefresh: true })
      assert.equal(res.success, false)
      assert.ok(res.error?.includes('timed out') || res.error?.includes('aborted'))
    })

    it('handles malformed non-JSON responses from a board', async () => {
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => {
            throw new SyntaxError('Unexpected token < in JSON')
          },
        } as unknown as Response
      }

      const res = await adapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, false)
      assert.ok(res.error?.includes('malformed'))
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

      const res = await adapter.fetchJobs({ forceRefresh: true })
      assert.equal(res.success, true)
      assert.equal(res.jobs.length, 0)
    })

    it('demonstrates partial board failure resilience (1 fails, 1 succeeds)', async () => {
      globalThis.fetch = async (url) => {
        const urlStr = String(url)
        if (urlStr.includes('/figma/')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              jobs: [
                {
                  id: 991,
                  title: 'Core Design Engineer',
                  absolute_url: 'https://boards.greenhouse.io/figma/jobs/991',
                  location: { name: 'Remote' },
                },
              ],
            }),
          } as unknown as Response
        }
        // Vercel board fails with 500
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as unknown as Response
      }

      const res = await adapter.fetchJobs({ forceRefresh: true })
      // Overall response succeeds because Figma provided valid jobs
      assert.equal(res.success, true)
      assert.equal(res.jobs.length, 1)
      assert.equal(res.jobs[0].title, 'Core Design Engineer')

      // Metadata documents the partial failure on Vercel
      const meta = res.metadata as { boardErrors: Record<string, string> }
      assert.ok(meta.boardErrors.vercel?.includes('500'))
    })
  })
})
