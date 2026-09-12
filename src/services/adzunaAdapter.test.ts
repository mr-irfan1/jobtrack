import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AdzunaAdapter,
  extractEmploymentTypeFromAdzuna,
  extractWorkplaceTypeFromAdzuna,
  sanitizeAdzunaUrl,
  type AdzunaRawJob,
} from './adzunaAdapter.ts'

test('Adzuna Provider Adapter', async (t) => {
  const sampleAdzunaRawJob: AdzunaRawJob = {
    id: '4958102384',
    title: '<strong>Senior Fullstack Engineer</strong>',
    description: '<p>We are seeking a talented <b>Senior Fullstack Engineer</b> with React and TypeScript experience.</p>',
    company: {
      display_name: 'Stripe, Inc.',
    },
    location: {
      display_name: 'San Francisco, CA (Remote Friendly)',
      area: ['US', 'California', 'San Francisco'],
    },
    category: {
      label: 'IT Jobs',
      tag: 'it-jobs',
    },
    salary_min: 150000,
    salary_max: 195000,
    salary_is_predicted: '0',
    contract_time: 'full_time',
    contract_type: 'permanent',
    redirect_url: 'https://www.adzuna.com/land/ad/4958102384?se=test_session&utm_source=adzuna',
    created: '2026-09-10T14:30:00Z',
    latitude: 37.7749,
    longitude: -122.4194,
    adref: 'stripe_rec_123',
  }

  await t.test('Contract & Metadata Extraction', async (t2) => {
    const adapter = new AdzunaAdapter({
      appId: 'test_app_id',
      appKey: 'test_app_key',
      country: 'us',
    })

    await t2.test('identifies with providerName "adzuna"', () => {
      assert.equal(adapter.providerName, 'adzuna')
    })

    await t2.test('extracts sourceJobId correctly', () => {
      assert.equal(adapter.getSourceJobId(sampleAdzunaRawJob), '4958102384')
    })

    await t2.test('extracts workplace type from location and title hints', () => {
      assert.equal(extractWorkplaceTypeFromAdzuna(sampleAdzunaRawJob), 'Remote')

      const onsiteJob: AdzunaRawJob = {
        id: '1',
        title: 'Office Receptionist',
        location: { display_name: 'Austin, TX', area: ['US', 'Texas'] },
      }
      assert.equal(extractWorkplaceTypeFromAdzuna(onsiteJob), 'On-site')

      const hybridJob: AdzunaRawJob = {
        id: '2',
        title: 'Frontend Developer (Hybrid 2 days in office)',
        location: { display_name: 'New York, NY' },
      }
      assert.equal(extractWorkplaceTypeFromAdzuna(hybridJob), 'Hybrid')
    })

    await t2.test('extracts employment type from contract_time and contract_type', () => {
      assert.equal(extractEmploymentTypeFromAdzuna(sampleAdzunaRawJob), 'Full-time')

      const partTimeJob: AdzunaRawJob = {
        id: '2',
        contract_time: 'part_time',
      }
      assert.equal(extractEmploymentTypeFromAdzuna(partTimeJob), 'Part-time')

      const contractJob: AdzunaRawJob = {
        id: '3',
        contract_type: 'contract',
      }
      assert.equal(extractEmploymentTypeFromAdzuna(contractJob), 'Contract')
    })

    await t2.test('normalizes a complete Adzuna job fixture into canonical format', () => {
      const canonical = adapter.normalizeJob(sampleAdzunaRawJob)

      assert.equal(canonical.source, 'adzuna')
      assert.equal(canonical.sourceName, 'Adzuna')
      assert.equal(canonical.sourceJobId, '4958102384')
      assert.equal(canonical.title, 'Senior Fullstack Engineer')
      assert.equal(canonical.company, 'Stripe, Inc.')
      assert.equal(canonical.location, 'San Francisco, CA (Remote Friendly)')
      assert.equal(canonical.workplaceType, 'Remote')
      assert.equal(canonical.employmentType, 'Full-time')
      assert.equal(canonical.category, 'IT Jobs')
      assert.equal(canonical.salary.min, 150000)
      assert.equal(canonical.salary.max, 195000)
      assert.equal(canonical.salary.currency, 'USD')
      assert.equal(canonical.salary.period, 'yearly')
      assert.match(canonical.salary.raw || '', /USD 150,000 - 195,000/)
      assert.equal(canonical.postedAt, '2026-09-10T14:30:00.000Z')
      assert.ok(canonical.description.includes('Senior Fullstack Engineer'))
      assert.ok(!canonical.description.includes('<p>'))
      assert.ok(canonical.applyUrl.startsWith('https://www.adzuna.com/land/ad/4958102384'))
      assert.equal(canonical.sourceMetadata.adref, 'stripe_rec_123')
      assert.equal(canonical.sourceMetadata.salaryIsPredicted, false)
      assert.equal(canonical.sourceMetadata.contractTime, 'full_time')
      assert.equal(canonical.sourceMetadata.contractType, 'permanent')
      assert.equal(canonical.sourceMetadata.country, 'us')
    })

    await t2.test('maps UK currency GBP when country is "gb"', () => {
      const ukAdapter = new AdzunaAdapter({
        appId: 'test_id',
        appKey: 'test_key',
        country: 'gb',
      })
      const ukJob: AdzunaRawJob = {
        ...sampleAdzunaRawJob,
        salary_min: 75000,
        salary_max: 95000,
      }
      const canonical = ukAdapter.normalizeJob(ukJob)
      assert.equal(canonical.salary.currency, 'GBP')
      assert.match(canonical.salary.raw || '', /GBP 75,000 - 95,000/)
    })
  })

  await t.test('Security & Credential Protection', async (t2) => {
    await t2.test('never leaks credentials in sanitized URLs', () => {
      const sensitiveUrl = 'https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=super_secret_id&app_key=super_secret_key_123&what=react'
      const sanitized = sanitizeAdzunaUrl(sensitiveUrl)
      assert.ok(!sanitized.includes('super_secret_id'))
      assert.ok(!sanitized.includes('super_secret_key_123'))
      assert.ok(sanitized.includes('app_id=[REDACTED]'))
      assert.ok(sanitized.includes('app_key=[REDACTED]'))
    })

    await t2.test('returns error and does not throw when credentials are missing', async () => {
      const unconfiguredAdapter = new AdzunaAdapter({ appId: undefined, appKey: undefined })
      assert.equal(unconfiguredAdapter.hasCredentials(), false)

      const result = await unconfiguredAdapter.fetchJobs()
      assert.equal(result.success, false)
      assert.match(result.error || '', /credentials missing/i)
      assert.equal(result.jobs.length, 0)
    })

    await t2.test('sanitizes error messages containing URLs', async () => {
      const originalFetch = globalThis.fetch
      t2.after(() => {
        globalThis.fetch = originalFetch
      })

      const adapter = new AdzunaAdapter({
        appId: 'secret_app_id_999',
        appKey: 'secret_app_key_888',
      })

      globalThis.fetch = async (url) => {
        // Simulate network error containing the requested URL in error message
        throw new Error(`Failed to fetch ${url}`)
      }

      const res = await adapter.fetchJobs()
      assert.equal(res.success, false)
      assert.ok(!res.error?.includes('secret_app_id_999'))
      assert.ok(!res.error?.includes('secret_app_key_888'))
      assert.ok(res.error?.includes('[REDACTED]'))
    })
  })

  await t.test('Configuration Management', async (t2) => {
    const adapter = new AdzunaAdapter({
      appId: 'id',
      appKey: 'key',
      country: 'us',
      searchQuery: { what: 'frontend', where: 'remote' },
      resultsPerPage: 25,
      maxPages: 2,
    })

    await t2.test('reads and updates country cleanly', () => {
      assert.equal(adapter.getCountry(), 'us')
      adapter.setCountry('GB')
      assert.equal(adapter.getCountry(), 'gb')
    })

    await t2.test('reads and updates search query', () => {
      const q = adapter.getSearchQuery()
      assert.equal(q.what, 'frontend')
      assert.equal(q.where, 'remote')

      adapter.setSearchQuery({ what: 'backend', where: 'chicago' })
      assert.equal(adapter.getSearchQuery().what, 'backend')
      assert.equal(adapter.getSearchQuery().where, 'chicago')
    })

    await t2.test('clamps resultsPerPage between 1 and 50', () => {
      adapter.setResultsPerPage(100)
      assert.equal(adapter.getResultsPerPage(), 50)
      adapter.setResultsPerPage(-5)
      assert.equal(adapter.getResultsPerPage(), 1)
      adapter.setResultsPerPage(30)
      assert.equal(adapter.getResultsPerPage(), 30)
    })

    await t2.test('clamps maxPages to minimum 1', () => {
      adapter.setMaxPages(0)
      assert.equal(adapter.getMaxPages(), 1)
      adapter.setMaxPages(4)
      assert.equal(adapter.getMaxPages(), 4)
    })
  })

  await t.test('Network Ingestion & Resilience (Mocked Fetch)', async (t2) => {
    const originalFetch = globalThis.fetch
    t2.after(() => {
      globalThis.fetch = originalFetch
    })

    await t2.test('fetches and normalizes jobs on 200 OK', async () => {
      const adapter = new AdzunaAdapter({
        appId: 'mock_id',
        appKey: 'mock_key',
        country: 'us',
      })

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            count: 1,
            results: [sampleAdzunaRawJob],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const res = await adapter.fetchJobs()
      assert.equal(res.success, true)
      assert.equal(res.jobs.length, 1)
      assert.equal(res.jobs[0].title, 'Senior Fullstack Engineer')
      assert.equal(res.fromCache, false)

      // Cached on repeated call
      const cachedRes = await adapter.fetchJobs()
      assert.equal(cachedRes.success, true)
      assert.equal(cachedRes.fromCache, true)
    })

    await t2.test('handles authentication failure (HTTP 401 / 403) cleanly', async () => {
      const adapter = new AdzunaAdapter({
        appId: 'bad_id',
        appKey: 'bad_key',
      })

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const res = await adapter.fetchJobs()
      assert.equal(res.success, false)
      assert.equal(res.statusCode, 401)
      assert.match(res.error || '', /authentication failed/i)
      assert.equal(res.jobs.length, 0)
    })

    await t2.test('handles rate limit (HTTP 429) cleanly', async () => {
      const adapter = new AdzunaAdapter({
        appId: 'valid_id',
        appKey: 'valid_key',
      })

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ error: 'Too Many Requests' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const res = await adapter.fetchJobs()
      assert.equal(res.success, false)
      assert.equal(res.statusCode, 429)
      assert.match(res.error || '', /rate limit/i)
    })

    await t2.test('handles network timeouts without crashing', async () => {
      const adapter = new AdzunaAdapter({
        appId: 'valid_id',
        appKey: 'valid_key',
        timeoutMs: 20,
      })

      globalThis.fetch = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        const abortErr = new Error('The operation was aborted')
        abortErr.name = 'AbortError'
        throw abortErr
      }

      const res = await adapter.fetchJobs()
      assert.equal(res.success, false)
      assert.match(res.error || '', /timed out/i)
    })

    await t2.test('handles malformed non-JSON response cleanly', async () => {
      const adapter = new AdzunaAdapter({
        appId: 'valid_id',
        appKey: 'valid_key',
      })

      globalThis.fetch = async () => {
        return new Response('<html>502 Bad Gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        })
      }

      const res = await adapter.fetchJobs()
      assert.equal(res.success, false)
      assert.equal(res.statusCode, 502)
    })

    await t2.test('handles empty results array cleanly', async () => {
      const adapter = new AdzunaAdapter({
        appId: 'valid_id',
        appKey: 'valid_key',
      })

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ count: 0, results: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const res = await adapter.fetchJobs()
      assert.equal(res.success, true)
      assert.equal(res.jobs.length, 0)
    })

    await t2.test('supports pagination across multiple pages with deduplication', async () => {
      const adapter = new AdzunaAdapter({
        appId: 'valid_id',
        appKey: 'valid_key',
        maxPages: 2,
        resultsPerPage: 1,
      })

      let requestCount = 0
      globalThis.fetch = async (url) => {
        requestCount++
        const urlStr = String(url)
        const isPage2 = urlStr.includes('/search/2')

        const job: AdzunaRawJob = {
          id: isPage2 ? '222' : '111',
          title: isPage2 ? 'Cloud Architect' : 'Staff Engineer',
          redirect_url: isPage2 ? 'https://adzuna.com/job/222' : 'https://adzuna.com/job/111',
        }

        return new Response(
          JSON.stringify({ count: 2, results: [job] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const res = await adapter.fetchJobs()
      assert.equal(res.success, true)
      assert.equal(res.jobs.length, 2)
      assert.equal(requestCount, 2)
      assert.equal(res.jobs[0].title, 'Staff Engineer')
      assert.equal(res.jobs[1].title, 'Cloud Architect')
    })
  })
})
