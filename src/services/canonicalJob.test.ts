import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  canonicalizeUrl,
  normalizeComparisonString,
  normalizeDate,
  normalizeEmploymentType,
  normalizeJob,
  normalizeSalary,
  normalizeSkills,
  normalizeString,
  normalizeWorkplaceType,
  sanitizeHtmlDescription,
  sanitizeUrl,
} from './canonicalJobNormalizer.ts'
import { canonicalJobToJobListing } from '../types/canonicalJob.ts'
import { RemotiveAdapter } from './jobProviderAdapter.ts'
import type { RemotiveRawJob } from './jobFeedService.ts'

describe('Canonical Job Model & Normalization Layer', () => {
  describe('String & Comparison Normalization', () => {
    it('trims whitespace and collapses repeated spaces', () => {
      assert.equal(normalizeString('   Senior   Staff    Engineer   '), 'Senior Staff Engineer')
      assert.equal(normalizeString('\n\tGoogle   Cloud \n'), 'Google Cloud')
      assert.equal(normalizeString(null, 'Default'), 'Default')
      assert.equal(normalizeString(undefined, 'Fallback'), 'Fallback')
      assert.equal(normalizeString('   ', 'Default'), 'Default')
    })

    it('creates accurate lowercase comparison strings', () => {
      assert.equal(normalizeComparisonString('  Frontend Engineer (React)  '), 'frontend engineer (react)')
      assert.equal(normalizeComparisonString('Stripe, Inc.'), 'stripe, inc.')
      assert.equal(normalizeComparisonString(null), '')
    })
  })

  describe('Workplace & Employment Normalization', () => {
    it('normalizes various remote workplace expressions to "Remote"', () => {
      assert.equal(normalizeWorkplaceType('Remote'), 'Remote')
      assert.equal(normalizeWorkplaceType('work from home'), 'Remote')
      assert.equal(normalizeWorkplaceType('wfh'), 'Remote')
      assert.equal(normalizeWorkplaceType('telecommute'), 'Remote')
      assert.equal(normalizeWorkplaceType('Virtual'), 'Remote')
      assert.equal(normalizeWorkplaceType('', 'Remote (Worldwide)'), 'Remote')
      assert.equal(normalizeWorkplaceType('', 'Anywhere'), 'Remote')
    })

    it('normalizes hybrid expressions to "Hybrid"', () => {
      assert.equal(normalizeWorkplaceType('Hybrid'), 'Hybrid')
      assert.equal(normalizeWorkplaceType('flexible / hybrid'), 'Hybrid')
      assert.equal(normalizeWorkplaceType('hybrid remote'), 'Hybrid')
    })

    it('normalizes on-site expressions to "On-site"', () => {
      assert.equal(normalizeWorkplaceType('On-site'), 'On-site')
      assert.equal(normalizeWorkplaceType('onsite'), 'On-site')
      assert.equal(normalizeWorkplaceType('in-office'), 'On-site')
      assert.equal(normalizeWorkplaceType('in person'), 'On-site')
      assert.equal(normalizeWorkplaceType('', 'San Francisco, CA'), 'On-site')
    })

    it('normalizes employment types accurately', () => {
      assert.equal(normalizeEmploymentType('Full-time'), 'Full-time')
      assert.equal(normalizeEmploymentType('full_time'), 'Full-time')
      assert.equal(normalizeEmploymentType('permanent'), 'Full-time')
      assert.equal(normalizeEmploymentType('ft'), 'Full-time')

      assert.equal(normalizeEmploymentType('Part-time'), 'Part-time')
      assert.equal(normalizeEmploymentType('part_time'), 'Part-time')
      assert.equal(normalizeEmploymentType('pt'), 'Part-time')

      assert.equal(normalizeEmploymentType('Contract'), 'Contract')
      assert.equal(normalizeEmploymentType('contractor'), 'Contract')
      assert.equal(normalizeEmploymentType('freelance'), 'Contract')

      assert.equal(normalizeEmploymentType('Internship'), 'Internship')
      assert.equal(normalizeEmploymentType('intern'), 'Internship')
      assert.equal(normalizeEmploymentType('student'), 'Internship')

      assert.equal(normalizeEmploymentType('temporary volunteer'), 'Other')
      assert.equal(normalizeEmploymentType(null), 'Full-time')
    })
  })

  describe('URL Sanitization & Canonicalization', () => {
    it('accepts valid http and https URLs', () => {
      assert.equal(sanitizeUrl('https://example.com/jobs/123'), 'https://example.com/jobs/123')
      assert.equal(sanitizeUrl('http://example.org/careers'), 'http://example.org/careers')
    })

    it('rejects dangerous and malformed URLs', () => {
      assert.equal(sanitizeUrl('javascript:alert(1)'), '')
      assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '')
      assert.equal(sanitizeUrl('file:///etc/passwd'), '')
      assert.equal(sanitizeUrl('not-a-valid-url'), '')
      assert.equal(sanitizeUrl(''), '')
      assert.equal(sanitizeUrl(undefined), '')
    })

    it('canonicalizes URLs by stripping tracking parameters, UTM tags, and trailing slashes', () => {
      const input = 'https://jobs.example.com/apply/101/?utm_source=linkedin&utm_medium=feed&ref=newsletter&fbclid=xyz123/'
      const expected = 'https://jobs.example.com/apply/101'
      assert.equal(canonicalizeUrl(input), expected)
    })

    it('preserves legitimate operational query parameters during canonicalization', () => {
      const input = 'https://company.greenhouse.io/job?id=12345&utm_source=adzuna'
      const canonical = canonicalizeUrl(input)
      assert.equal(canonical, 'https://company.greenhouse.io/job?id=12345')
    })
  })

  describe('Description Sanitization', () => {
    it('removes script, style, and HTML tags while formatting bullets and paragraphs', () => {
      const dirtyHtml = `
        <style>.bad { color: red; }</style>
        <script>window.hack();</script>
        <p>We are seeking a <strong>Senior Engineer</strong>.</p>
        <ul>
          <li>React & TypeScript</li>
          <li>PostgreSQL</li>
        </ul>
        <br/>Contact us at jobs&amp;careers@example.com
      `
      const clean = sanitizeHtmlDescription(dirtyHtml)
      assert.ok(!clean.includes('<style>'))
      assert.ok(!clean.includes('<script>'))
      assert.ok(!clean.includes('<strong>'))
      assert.ok(clean.includes('Senior Engineer'))
      assert.ok(clean.includes('• React & TypeScript'))
      assert.ok(clean.includes('• PostgreSQL'))
      assert.ok(clean.includes('jobs&careers@example.com'))
    })
  })

  describe('Date Normalization', () => {
    it('parses valid ISO string dates', () => {
      const iso = '2026-09-12T14:30:00.000Z'
      assert.equal(normalizeDate(iso), iso)
    })

    it('parses Date instances and numeric timestamps', () => {
      const now = new Date()
      assert.equal(normalizeDate(now), now.toISOString())

      const epoch = 1700000000000
      assert.equal(normalizeDate(epoch), new Date(epoch).toISOString())
    })

    it('falls back safely on malformed or empty dates', () => {
      const fallback = '2026-01-01T00:00:00.000Z'
      assert.equal(normalizeDate('invalid-date-string', fallback), fallback)
      assert.equal(normalizeDate('', fallback), fallback)
      assert.equal(normalizeDate(null, fallback), fallback)
    })
  })

  describe('Skills Normalization', () => {
    it('normalizes string arrays and deduplicates case-insensitively', () => {
      const raw = [' React ', 'TypeScript', 'react', 'Tailwind CSS', 'typescript', 'NEXT.JS', '']
      const skills = normalizeSkills(raw)
      assert.deepEqual(skills, ['React', 'TypeScript', 'Tailwind CSS', 'NEXT.JS'])
    })

    it('normalizes comma-separated skill strings', () => {
      const raw = 'Python, Django, python; Docker | Kubernetes'
      const skills = normalizeSkills(raw)
      assert.deepEqual(skills, ['Python', 'Django', 'Docker', 'Kubernetes'])
    })
  })

  describe('Salary Normalization (Zero-Invention Rule)', () => {
    it('returns nulls when no compensation data is provided', () => {
      const salary = normalizeSalary({})
      assert.equal(salary.raw, null)
      assert.equal(salary.min, null)
      assert.equal(salary.max, null)
    })

    it('formats structured min/max numeric salaries with currency', () => {
      const salary = normalizeSalary({
        min: 120000,
        max: 150000,
        currency: 'usd',
        period: 'yearly',
      })
      assert.equal(salary.min, 120000)
      assert.equal(salary.max, 150000)
      assert.equal(salary.currency, 'USD')
      assert.equal(salary.period, 'yearly')
      assert.ok(salary.raw?.includes('120,000 - 150,000'))
    })

    it('corrects inverted min/max numbers cleanly', () => {
      const salary = normalizeSalary({ min: 180000, max: 140000 })
      assert.equal(salary.min, 140000)
      assert.equal(salary.max, 180000)
    })
  })

  describe('Full normalizeJob() Ingestion', () => {
    it('normalizes a valid job completely', () => {
      const job = normalizeJob(
        {
          id: 'remotive-1001',
          sourceJobId: '1001',
          title: 'Senior Frontend Engineer',
          company: 'Automattic',
          companyLogo: 'https://remotive.com/job/1001/logo.png',
          location: 'Remote (Worldwide)',
          workplaceType: 'Remote',
          employmentType: 'Full-time',
          category: 'Software Development',
          skills: ['React', 'TypeScript', 'Next.js'],
          salaryRaw: '$120k - $160k',
          description: '<p>Join our <b>remote</b> team!</p>',
          applyUrl: 'https://remotive.com/remote-jobs/1001?utm_source=jobboard',
          postedAt: '2026-09-10T10:00:00.000Z',
          sourceMetadata: { originalCategory: 'Software' },
        },
        'remotive',
      )

      assert.equal(job.source, 'remotive')
      assert.equal(job.sourceJobId, '1001')
      assert.equal(job.title, 'Senior Frontend Engineer')
      assert.equal(job.company, 'Automattic')
      assert.equal(job.location, 'Remote (Worldwide)')
      assert.equal(job.workplaceType, 'Remote')
      assert.equal(job.employmentType, 'Full-time')
      assert.equal(job.category, 'Software Development')
      assert.deepEqual(job.skills, ['React', 'TypeScript', 'Next.js'])
      assert.equal(job.salary.raw, '$120k - $160k')
      assert.equal(job.description, 'Join our remote team!')
      assert.equal(job.canonicalUrl, 'https://remotive.com/remote-jobs/1001')
      assert.equal(job.normalizedTitle, 'senior frontend engineer')
      assert.equal(job.normalizedCompany, 'automattic')
      assert.equal(job.normalizedLocation, 'remote (worldwide)')
      assert.equal(job.isActive, true)
    })

    it('safely handles missing optional fields without inventing values', () => {
      const minimal = normalizeJob(
        {
          title: 'Staff Software Architect',
          company: 'Acme Corp',
        },
        'greenhouse',
      )

      assert.equal(minimal.title, 'Staff Software Architect')
      assert.equal(minimal.company, 'Acme Corp')
      assert.equal(minimal.companyLogo, null)
      assert.equal(minimal.category, null)
      assert.deepEqual(minimal.skills, [])
      assert.equal(minimal.salary.raw, null)
      assert.equal(minimal.salary.min, null)
      assert.equal(minimal.salary.max, null)
      assert.equal(minimal.source, 'greenhouse')
      assert.ok(minimal.sourceJobId.length > 0)
    })

    it('safely handles malformed data gracefully', () => {
      const malformed = normalizeJob(
        {
          title: '   ',
          company: '   ',
          companyLogo: 'javascript:alert(1)',
          applyUrl: 'not-a-valid-url',
          skills: '  ',
          salaryRaw: null,
          postedAt: 'bad-date',
          sourceMetadata: null as unknown as Record<string, unknown>,
        },
        'adzuna',
      )

      assert.equal(malformed.title, 'Untitled Role')
      assert.equal(malformed.company, 'Confidential Company')
      assert.equal(malformed.companyLogo, null)
      assert.ok(malformed.applyUrl.startsWith('https://jobtrack.app/jobs/adzuna/'))
      assert.deepEqual(malformed.skills, [])
      assert.deepEqual(malformed.sourceMetadata, {})
      assert.ok(malformed.postedAt.length > 0)
    })

    it('preserves unknown/extra fields in sourceMetadata', () => {
      const extra = normalizeJob(
        {
          title: 'Platform Engineer',
          company: 'Tech Co',
          sourceMetadata: {
            requisition_id: 'REQ-998',
            hiring_manager: 'Jane Doe',
            tags: ['infra', 'k8s'],
          },
        },
        'greenhouse',
      )

      assert.equal(extra.sourceMetadata.requisition_id, 'REQ-998')
      assert.equal(extra.sourceMetadata.hiring_manager, 'Jane Doe')
      assert.deepEqual(extra.sourceMetadata.tags, ['infra', 'k8s'])
    })
  })

  describe('Remotive Provider Adapter', () => {
    it('adapts Remotive API responses into canonical jobs', () => {
      const adapter = new RemotiveAdapter()
      const rawRemotive: RemotiveRawJob = {
        id: 9876,
        url: 'https://remotive.com/remote-jobs/software-dev/senior-dev-9876?utm_campaign=feed',
        title: 'Senior Full Stack Engineer',
        company_name: 'DuckDuckGo',
        company_logo: 'https://remotive.com/logo/9876.png',
        category: 'Software Development',
        tags: ['React', 'Node.js', 'PostgreSQL'],
        job_type: 'full_time',
        publication_date: '2026-09-11T12:00:00Z',
        candidate_required_location: 'Worldwide',
        salary: '$130,000 - $160,000',
        description: '<p>Build <b>privacy-first</b> search features.</p>',
      }

      const canonical = adapter.normalizeJob(rawRemotive)
      assert.equal(canonical.source, 'remotive')
      assert.equal(canonical.sourceJobId, '9876')
      assert.equal(canonical.title, 'Senior Full Stack Engineer')
      assert.equal(canonical.company, 'DuckDuckGo')
      assert.equal(canonical.location, 'Remote (Worldwide)')
      assert.equal(canonical.workplaceType, 'Remote')
      assert.equal(canonical.employmentType, 'Full-time')
      assert.deepEqual(canonical.skills, ['React', 'Node.js', 'PostgreSQL'])
      assert.equal(canonical.salary.raw, '$130,000 - $160,000')
      assert.equal(canonical.canonicalUrl, 'https://remotive.com/remote-jobs/software-dev/senior-dev-9876')
      assert.equal(canonical.sourceMetadata.candidate_required_location, 'Worldwide')
    })
  })

  describe('Backward Compatibility with Classic JobListing', () => {
    it('canonicalJobToJobListing maps all fields required by existing Job Feed UI and services', () => {
      const canonical = normalizeJob(
        {
          id: 'job-12345',
          source: 'remotive',
          sourceJobId: '12345',
          sourceName: 'Remotive',
          title: 'Frontend Engineer',
          company: 'Linear',
          companyLogo: 'https://linear.app/logo.png',
          location: 'Remote (US/EU)',
          workplaceType: 'Remote',
          employmentType: 'Full-time',
          category: 'Software Development',
          skills: ['React', 'TypeScript'],
          salaryRaw: '$140k - $170k',
          description: 'Craft beautiful issue tracking software.',
          applyUrl: 'https://linear.app/careers/12345',
          postedAt: '2026-09-10T12:00:00.000Z',
        },
        'remotive',
      )

      const listing = canonicalJobToJobListing(canonical)

      assert.equal(listing.id, 'job-12345')
      assert.equal(listing.title, 'Frontend Engineer')
      assert.equal(listing.company, 'Linear')
      assert.equal(listing.companyLogo, 'https://linear.app/logo.png')
      assert.equal(listing.location, 'Remote (US/EU)')
      assert.equal(listing.workplaceType, 'Remote')
      assert.equal(listing.employmentType, 'Full-time')
      assert.equal(listing.category, 'Software Development')
      assert.equal(listing.salary, '$140k - $170k')
      assert.equal(listing.description, 'Craft beautiful issue tracking software.')
      assert.deepEqual(listing.skills, ['React', 'TypeScript'])
      assert.equal(listing.postedDate, '2026-09-10T12:00:00.000Z')
      assert.equal(listing.source, 'Remotive')
      assert.equal(listing.applyUrl, 'https://linear.app/careers/12345')
    })
  })
})
