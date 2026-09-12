import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import type { JobListing } from '../types/jobFeed.ts'
import type { JobAlert, JobAlertCriteria } from '../types/jobAlert.ts'
import {
  canonicalCriteriaSignature,
  formatCriteriaSummary,
  generateAlertName,
  matchesAlertCriteria,
  buildJobFeedUrlFromCriteria,
  validateAlertDraft,
} from './jobAlertsModel.ts'
import {
  deleteAlert,
  getAlerts,
  getAllAlerts,
  JOB_ALERTS_STORAGE_KEY,
  recordAlertNotification,
  saveAlert,
  toggleAlertStatus,
  updateAlert,
} from './jobAlertsStore.ts'
import { evaluateJobAlerts, evaluateJobAlertsFromFeed, isJobAlreadyNotified } from './jobAlertMatchingService.ts'
import { clearJobFeedCache } from './jobFeedService.ts'

// Mock in-memory localStorage for Node test runner
const memoryStore = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => memoryStore.get(key) || null,
  setItem: (key: string, value: string) => memoryStore.set(key, value),
  removeItem: (key: string) => memoryStore.delete(key),
  clear: () => memoryStore.clear(),
}
// @ts-expect-error test mock
globalThis.localStorage = mockLocalStorage

const SAMPLE_JOBS: JobListing[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer (React / TypeScript)',
    company: 'Automattic',
    location: 'Remote (Worldwide)',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    category: 'Software Development',
    skills: ['React', 'TypeScript', 'Next.js'],
    description: 'Build fast accessible interfaces.',
    postedDate: '2026-09-10T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://remotive.com/job/1',
  },
  {
    id: 'job-2',
    title: 'Full Stack Engineer',
    company: 'Ghost',
    location: 'Remote (Anywhere)',
    workplaceType: 'Remote',
    employmentType: 'Contract',
    category: 'Software Development',
    skills: ['Node.js', 'PostgreSQL', 'React'],
    description: 'Work on headless publishing platform.',
    postedDate: '2026-09-09T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://remotive.com/job/2',
  },
  {
    id: 'job-3',
    title: 'Frontend Engineering Intern',
    company: 'DuckDuckGo',
    location: 'Remote (US)',
    workplaceType: 'Remote',
    employmentType: 'Internship',
    category: 'Software Development',
    skills: ['JavaScript', 'HTML', 'CSS', 'React'],
    description: 'Internship opportunity building privacy-first web apps.',
    postedDate: '2026-09-08T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://remotive.com/job/3',
  },
  {
    id: 'job-4',
    title: 'UI/UX Product Designer',
    company: 'GitLab',
    location: 'Remote (Worldwide)',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    category: 'Design',
    skills: ['Figma', 'Prototyping', 'Design Systems'],
    description: 'Design intuitive developer workflows.',
    postedDate: '2026-09-07T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://remotive.com/job/4',
  },
]

describe('Step 14: Job Alerts & Matching Opportunities', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
  })

  it('1. Alert creation & default values', () => {
    const res = saveAlert(
      {
        criteria: { query: 'React', workplace: 'Remote' },
        frequency: 'daily',
      },
      'user-1',
    )
    assert.equal(res.success, true)
    assert.ok(res.alert)
    assert.equal(res.alert.name, 'React • Remote')
    assert.equal(res.alert.status, 'active')
    assert.equal(res.alert.frequency, 'daily')
    assert.equal(res.alert.userId, 'user-1')
    assert.deepEqual(res.alert.notifiedJobIds, [])
  })

  it('2. Alert validation - requires at least one criterion', () => {
    const res = validateAlertDraft({
      criteria: {},
    })
    assert.equal(res.valid, false)
    assert.ok(res.error?.includes('at least one search criterion'))
  })

  it('3. Alert validation - rejects invalid frequency', () => {
    const res = validateAlertDraft({
      criteria: { query: 'Python' },
      // @ts-expect-error testing invalid frequency
      frequency: 'hourly',
    })
    assert.equal(res.valid, false)
    assert.ok(res.error?.includes('Frequency must be either Daily or Weekly'))
  })

  it('4. Deterministic alert name generation from criteria', () => {
    assert.equal(
      generateAlertName({ query: 'React', workplace: 'Remote', employmentType: 'Internship' }),
      'React • Remote • Internship',
    )
    assert.equal(
      generateAlertName({ category: 'Design', workplace: 'Remote' }),
      'Remote • Design',
    )
    assert.equal(
      generateAlertName({ workplace: 'all', employmentType: 'all' }),
      'General Job Alert',
    )
  })

  it('5. Canonical duplicate signature comparison', () => {
    const sig1 = canonicalCriteriaSignature({ query: '  React  ', workplace: 'Remote' })
    const sig2 = canonicalCriteriaSignature({ query: 'react', workplace: 'remote' })
    assert.equal(sig1, sig2)
  })

  it('6. Exact duplicate alert prevention', () => {
    const first = saveAlert({ criteria: { query: 'React', workplace: 'Remote' } })
    assert.equal(first.success, true)

    const dup = saveAlert({ criteria: { query: 'react', workplace: 'remote' } })
    assert.equal(dup.success, false)
    assert.ok(dup.error?.includes('already exists'))
  })

  it('7. Allows different alerts with distinct criteria', () => {
    const a1 = saveAlert({ criteria: { query: 'React', workplace: 'Remote' } })
    const a2 = saveAlert({ criteria: { query: 'React', workplace: 'Hybrid' } })
    assert.equal(a1.success, true)
    assert.equal(a2.success, true)
  })

  it('8. Editing alert updates criteria and updatedAt', () => {
    const created = saveAlert({ criteria: { query: 'React' } }).alert!
    const edited = updateAlert(created.id, {
      criteria: { query: 'TypeScript', employmentType: 'Full-time' },
    })

    assert.equal(edited.success, true)
    assert.equal(edited.alert?.criteria.query, 'TypeScript')
    assert.equal(edited.alert?.criteria.employmentType, 'Full-time')
    assert.notEqual(edited.alert?.updatedAt, '')
  })

  it('9. Editing alert prevents collision with another existing alert', () => {
    saveAlert({ criteria: { query: 'Python' } })
    const a2 = saveAlert({ criteria: { query: 'Go' } }).alert!

    const editColliding = updateAlert(a2.id, { criteria: { query: 'Python' } })
    assert.equal(editColliding.success, false)
    assert.ok(editColliding.error?.includes('already exists'))
  })

  it('10. Pause and resume toggle', () => {
    const created = saveAlert({ criteria: { query: 'Frontend' } }).alert!
    assert.equal(created.status, 'active')

    const paused = toggleAlertStatus(created.id)!
    assert.equal(paused.status, 'paused')

    const resumed = toggleAlertStatus(created.id)!
    assert.equal(resumed.status, 'active')
  })

  it('11. Deletion of alert', () => {
    const created = saveAlert({ criteria: { query: 'DevOps' } }).alert!
    assert.equal(getAlerts().length, 1)

    const deleted = deleteAlert(created.id)
    assert.equal(deleted, true)
    assert.equal(getAlerts().length, 0)
  })

  it('12. Matching by keyword in title', () => {
    const match = matchesAlertCriteria(SAMPLE_JOBS[0], { query: 'Frontend' })
    assert.equal(match, true)

    const noMatch = matchesAlertCriteria(SAMPLE_JOBS[0], { query: 'Python' })
    assert.equal(noMatch, false)
  })

  it('13. Matching by keyword in skills', () => {
    const match = matchesAlertCriteria(SAMPLE_JOBS[0], { query: 'Next.js' })
    assert.equal(match, true)
  })

  it('14. Matching by keyword in description', () => {
    const match = matchesAlertCriteria(SAMPLE_JOBS[1], { query: 'headless' })
    assert.equal(match, true)
  })

  it('15. Matching by workplace type', () => {
    const match = matchesAlertCriteria(SAMPLE_JOBS[0], { workplace: 'Remote' })
    assert.equal(match, true)

    const noMatch = matchesAlertCriteria(SAMPLE_JOBS[0], { workplace: 'On-site' })
    assert.equal(noMatch, false)
  })

  it('16. Matching by employment type', () => {
    const match = matchesAlertCriteria(SAMPLE_JOBS[2], { employmentType: 'Internship' })
    assert.equal(match, true)

    const noMatch = matchesAlertCriteria(SAMPLE_JOBS[2], { employmentType: 'Full-time' })
    assert.equal(noMatch, false)
  })

  it('17. Matching by category', () => {
    const match = matchesAlertCriteria(SAMPLE_JOBS[3], { category: 'Design' })
    assert.equal(match, true)

    const noMatch = matchesAlertCriteria(SAMPLE_JOBS[0], { category: 'Design' })
    assert.equal(noMatch, false)
  })

  it('18. Matching by location', () => {
    const match = matchesAlertCriteria(SAMPLE_JOBS[2], { location: 'US' })
    assert.equal(match, true)

    const noMatch = matchesAlertCriteria(SAMPLE_JOBS[2], { location: 'Germany' })
    assert.equal(noMatch, false)
  })

  it('19. Multi-criteria matching', () => {
    const criteria: JobAlertCriteria = {
      query: 'React',
      workplace: 'Remote',
      employmentType: 'Internship',
    }
    // Only job-3 is React + Remote + Internship
    const match1 = matchesAlertCriteria(SAMPLE_JOBS[0], criteria) // Full-time -> false
    const match3 = matchesAlertCriteria(SAMPLE_JOBS[2], criteria) // Internship -> true

    assert.equal(match1, false)
    assert.equal(match3, true)
  })

  it('20. New-job detection (unnotified jobs flagged as new)', () => {
    const alert: JobAlert = {
      id: 'al-1',
      name: 'Frontend Internships',
      criteria: { query: 'React', employmentType: 'Internship' },
      frequency: 'daily',
      status: 'active',
      createdAt: '2026-09-12T00:00:00Z',
      updatedAt: '2026-09-12T00:00:00Z',
      notifiedJobIds: [],
    }

    const results = evaluateJobAlerts(SAMPLE_JOBS, [alert])
    assert.equal(results[0].newMatches.length, 1)
    assert.equal(results[0].newMatches[0].id, 'job-3')
    assert.ok(results[0].notification)
    assert.equal(results[0].notification?.type, 'job_alert')
  })

  it('21. Previously-notified job prevention', () => {
    const alert: JobAlert = {
      id: 'al-1',
      name: 'Frontend Internships',
      criteria: { query: 'React', employmentType: 'Internship' },
      frequency: 'daily',
      status: 'active',
      createdAt: '2026-09-12T00:00:00Z',
      updatedAt: '2026-09-12T00:00:00Z',
      notifiedJobIds: ['job-3'], // already notified
    }

    const results = evaluateJobAlerts(SAMPLE_JOBS, [alert])
    assert.equal(results[0].newMatches.length, 0)
    assert.equal(results[0].notification, undefined)
  })

  it('22. Duplicate job deduplication across alerts', () => {
    const duplicatedJobs = [
      SAMPLE_JOBS[0],
      { ...SAMPLE_JOBS[0], id: 'job-1-dup' }, // duplicate url
    ]

    const alert: JobAlert = {
      id: 'al-dup',
      name: 'React Jobs',
      criteria: { query: 'React' },
      frequency: 'daily',
      status: 'active',
      createdAt: '2026-09-12T00:00:00Z',
      updatedAt: '2026-09-12T00:00:00Z',
      notifiedJobIds: [],
    }

    const results = evaluateJobAlerts(duplicatedJobs, [alert])
    // Deduplicated down to 1
    assert.equal(results[0].matchedJobs.length, 1)
  })

  it('23. Notification grouping: single match produces specific headline', () => {
    const alert: JobAlert = {
      id: 'al-single',
      name: 'Design Roles',
      criteria: { category: 'Design' },
      frequency: 'daily',
      status: 'active',
      createdAt: '2026-09-12T00:00:00Z',
      updatedAt: '2026-09-12T00:00:00Z',
      notifiedJobIds: [],
    }

    const results = evaluateJobAlerts(SAMPLE_JOBS, [alert])
    assert.ok(results[0].notification)
    assert.equal(results[0].notification?.title, 'New job matches "Design Roles"')
    assert.equal(results[0].notification?.company, 'GitLab')
  })

  it('24. Notification grouping: multiple matches produce grouped summary', () => {
    const alert: JobAlert = {
      id: 'al-multi',
      name: 'React Positions',
      criteria: { query: 'React' },
      frequency: 'daily',
      status: 'active',
      createdAt: '2026-09-12T00:00:00Z',
      updatedAt: '2026-09-12T00:00:00Z',
      notifiedJobIds: [],
    }

    // Matches job-1, job-2, job-3
    const results = evaluateJobAlerts(SAMPLE_JOBS, [alert])
    assert.equal(results[0].newMatches.length, 3)
    assert.ok(results[0].notification)
    assert.equal(results[0].notification?.title, '3 new jobs match "React Positions"')
  })

  it('25. Notification actionUrl links to correct Job Feed query string', () => {
    const criteria: JobAlertCriteria = {
      query: 'react',
      workplace: 'Remote',
      employmentType: 'Full-time',
    }
    const url = buildJobFeedUrlFromCriteria(criteria)
    assert.equal(url, '/jobs?q=react&workplace=Remote&type=Full-time')
  })

  it('26. Paused alert produces 0 matches and 0 notifications', () => {
    const alert: JobAlert = {
      id: 'al-paused',
      name: 'React Positions',
      criteria: { query: 'React' },
      frequency: 'daily',
      status: 'paused',
      createdAt: '2026-09-12T00:00:00Z',
      updatedAt: '2026-09-12T00:00:00Z',
      notifiedJobIds: [],
    }

    const results = evaluateJobAlerts(SAMPLE_JOBS, [alert])
    assert.equal(results[0].matchedJobs.length, 0)
    assert.equal(results[0].newMatches.length, 0)
    assert.equal(results[0].notification, undefined)
  })

  it('27. State isolation between users', () => {
    saveAlert({ criteria: { query: 'Python' } }, 'user-A')
    saveAlert({ criteria: { query: 'Java' } }, 'user-B')

    const userAAlerts = getAlerts('user-A')
    const userBAlerts = getAlerts('user-B')

    assert.equal(userAAlerts.length, 1)
    assert.equal(userAAlerts[0].criteria.query, 'Python')
    assert.equal(userBAlerts.length, 1)
    assert.equal(userBAlerts[0].criteria.query, 'Java')
  })

  it('28. Capped notification history prevents unbounded storage growth', () => {
    const created = saveAlert({ criteria: { query: 'React' } }).alert!

    // Record 250 dummy job IDs
    const dummyIds = Array.from({ length: 250 }, (_, i) => `job-${i}`)
    recordAlertNotification(created.id, dummyIds)

    const updated = getAlerts().find((a) => a.id === created.id)!
    assert.equal(updated.notifiedJobIds.length, 200) // capped to MAX_NOTIFIED_JOBS_PER_ALERT
  })

  it('29. formatCriteriaSummary presents human-readable label', () => {
    const label = formatCriteriaSummary({
      query: 'React',
      workplace: 'Remote',
      employmentType: 'Full-time',
    })
    assert.equal(label, 'Keywords: "React" · Remote · Full-time')
  })

  it('30. Corrupted localStorage degrades gracefully', () => {
    mockLocalStorage.setItem(JOB_ALERTS_STORAGE_KEY, 'invalid-json{{{')
    assert.deepEqual(getAllAlerts(), [])
  })

  describe('Canonical Jobs Database & Multi-Provider Alert Evaluation', () => {
    const CANONICAL_TEST_JOBS: JobListing[] = [
      {
        id: 'uuid-remotive-1',
        source: 'Remotive',
        sourceJobId: '1001',
        title: 'Staff Rust Platform Engineer',
        company: 'Cloudflare',
        location: 'Remote (Worldwide)',
        workplaceType: 'Remote',
        employmentType: 'Full-time',
        category: 'Software Development',
        skills: ['Rust', 'Distributed Systems', 'Wasm'],
        description: 'Lead edge runtime development.',
        postedDate: '2026-09-12T00:00:00Z',
        applyUrl: 'https://cloudflare.com/apply/1001',
        canonicalUrl: 'https://cloudflare.com/apply/1001',
        isActive: true,
        expiresAt: null,
      },
      {
        id: 'uuid-greenhouse-2',
        source: 'Greenhouse',
        sourceJobId: 'gh-456',
        title: 'Kubernetes Infrastructure Architect',
        company: 'GitLab',
        location: 'London, UK',
        workplaceType: 'Hybrid',
        employmentType: 'Contract',
        category: 'DevOps / Sysadmin',
        skills: ['Kubernetes', 'Terraform', 'AWS'],
        description: 'Scale multi-cloud Kubernetes clusters.',
        postedDate: '2026-09-11T00:00:00Z',
        applyUrl: 'https://boards.greenhouse.io/gitlab/jobs/456',
        canonicalUrl: 'https://boards.greenhouse.io/gitlab/jobs/456',
        isActive: true,
        expiresAt: null,
      },
      {
        id: 'uuid-adzuna-3',
        source: 'Adzuna',
        sourceJobId: 'adzuna-789',
        title: 'Senior Product Designer',
        company: 'Figma',
        location: 'San Francisco, CA',
        workplaceType: 'On-site',
        employmentType: 'Part-time',
        category: 'Design',
        skills: ['Figma', 'Design Systems'],
        description: 'Design accessible collaborative interfaces.',
        postedDate: '2026-09-10T00:00:00Z',
        applyUrl: 'https://adzuna.com/land/ad/789',
        canonicalUrl: 'https://adzuna.com/land/ad/789',
        isActive: true,
        expiresAt: null,
      },
    ]

    it('31. Evaluates canonical jobs across query, workplace, type, category, and location', () => {
      const alert: JobAlert = {
        id: 'al-k8s',
        name: 'DevOps Alert',
        criteria: {
          query: 'Kubernetes',
          workplace: 'Hybrid',
          employmentType: 'Contract',
          category: 'DevOps',
          location: 'London',
        },
        frequency: 'daily',
        status: 'active',
        createdAt: '2026-09-12T00:00:00Z',
        updatedAt: '2026-09-12T00:00:00Z',
        notifiedJobIds: [],
      }

      const results = evaluateJobAlerts(CANONICAL_TEST_JOBS, [alert])
      assert.equal(results.length, 1)
      assert.equal(results[0].matchedJobs.length, 1)
      assert.equal(results[0].matchedJobs[0].id, 'uuid-greenhouse-2')
      assert.equal(results[0].newMatches.length, 1)
      assert.ok(results[0].notification)
      assert.equal(results[0].notification?.title, 'New job matches "DevOps Alert"')
    })

    it('32. Respects explicit skills criteria on canonical jobs', () => {
      const alert: JobAlert = {
        id: 'al-skills',
        name: 'Rust Wasm Alert',
        criteria: {
          skills: ['Wasm'],
        },
        frequency: 'daily',
        status: 'active',
        createdAt: '2026-09-12T00:00:00Z',
        updatedAt: '2026-09-12T00:00:00Z',
        notifiedJobIds: [],
      }

      const results = evaluateJobAlerts(CANONICAL_TEST_JOBS, [alert])
      assert.equal(results[0].matchedJobs.length, 1)
      assert.equal(results[0].matchedJobs[0].id, 'uuid-remotive-1')
      assert.equal(results[0].matchedJobs[0].company, 'Cloudflare')
    })

    it('33. Avoids repeatedly notifying the same job across UUID, sourceJobId, and canonicalUrl', () => {
      const alert: JobAlert = {
        id: 'al-dedupe',
        name: 'Rust Alert',
        criteria: { query: 'Rust' },
        frequency: 'daily',
        status: 'active',
        createdAt: '2026-09-12T00:00:00Z',
        updatedAt: '2026-09-12T00:00:00Z',
        notifiedJobIds: ['1001'], // Previously notified using provider sourceJobId
      }

      const results = evaluateJobAlerts(CANONICAL_TEST_JOBS, [alert])
      // Matched the criteria, but newMatches is 0 because 1001 was already notified!
      assert.equal(results[0].matchedJobs.length, 1)
      assert.equal(results[0].newMatches.length, 0)
      assert.equal(results[0].notification, undefined)

      // Test notification check helper directly
      const notifiedSet = new Set(['https://cloudflare.com/apply/1001'])
      assert.equal(isJobAlreadyNotified(CANONICAL_TEST_JOBS[0], notifiedSet), true)
    })

    it('34. Handles job IDs consistently across providers and records multi-identifier history', () => {
      const alert = saveAlert({ criteria: { query: 'Kubernetes' } }).alert!

      // Evaluate and record notification
      const results = evaluateJobAlerts(CANONICAL_TEST_JOBS, [alert], { recordNotified: true })
      assert.equal(results[0].newMatches.length, 1)

      const updated = getAlerts().find((a) => a.id === alert.id)!
      // Records UUID, sourceJobId, provider prefix, and canonicalUrl
      assert.ok(updated.notifiedJobIds.includes('uuid-greenhouse-2'))
      assert.ok(updated.notifiedJobIds.includes('gh-456'))
      assert.ok(updated.notifiedJobIds.includes('greenhouse::gh-456'))
      assert.ok(updated.notifiedJobIds.includes('https://boards.greenhouse.io/gitlab/jobs/456'))

      // Subsequent evaluation produces zero new matches
      const reResults = evaluateJobAlerts(CANONICAL_TEST_JOBS, [updated])
      assert.equal(reResults[0].newMatches.length, 0)
    })

    it('35. Do NOT notify on inactive jobs (isActive: false)', () => {
      const inactiveJob: JobListing = {
        ...CANONICAL_TEST_JOBS[0],
        id: 'inactive-rust-job',
        title: 'Senior Rust Engineer',
        isActive: false,
      }

      const alert: JobAlert = {
        id: 'al-active-only',
        name: 'Rust Only',
        criteria: { query: 'Rust' },
        frequency: 'daily',
        status: 'active',
        createdAt: '2026-09-12T00:00:00Z',
        updatedAt: '2026-09-12T00:00:00Z',
        notifiedJobIds: [],
      }

      const results = evaluateJobAlerts([inactiveJob], [alert])
      assert.equal(results[0].matchedJobs.length, 0)
      assert.equal(results[0].newMatches.length, 0)
    })

    it('36. Do NOT notify on expired jobs (expiresAt in past)', () => {
      const expiredJob: JobListing = {
        ...CANONICAL_TEST_JOBS[0],
        id: 'expired-rust-job',
        title: 'Senior Rust Engineer',
        isActive: true,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // expired yesterday
      }

      const alert: JobAlert = {
        id: 'al-fresh-only',
        name: 'Rust Only',
        criteria: { query: 'Rust' },
        frequency: 'daily',
        status: 'active',
        createdAt: '2026-09-12T00:00:00Z',
        updatedAt: '2026-09-12T00:00:00Z',
        notifiedJobIds: [],
      }

      const results = evaluateJobAlerts([expiredJob], [alert])
      assert.equal(results[0].matchedJobs.length, 0)
      assert.equal(results[0].newMatches.length, 0)
    })

    it('37. Matches and notifies jobs with valid future expiration date', () => {
      const validFutureJob: JobListing = {
        ...CANONICAL_TEST_JOBS[0],
        id: 'future-exp-rust-job',
        title: 'Senior Rust Engineer',
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // expires in 7 days
      }

      const alert: JobAlert = {
        id: 'al-valid-future',
        name: 'Rust Only',
        criteria: { query: 'Rust' },
        frequency: 'daily',
        status: 'active',
        createdAt: '2026-09-12T00:00:00Z',
        updatedAt: '2026-09-12T00:00:00Z',
        notifiedJobIds: [],
      }

      const results = evaluateJobAlerts([validFutureJob], [alert])
      assert.equal(results[0].matchedJobs.length, 1)
      assert.equal(results[0].newMatches.length, 1)
    })

    it('38. evaluateJobAlertsFromFeed loads jobs and evaluates active alerts', async () => {
      clearJobFeedCache()
      const alert: JobAlert = {
        id: 'al-from-feed',
        name: 'Frontend Alert',
        criteria: { query: 'Frontend' },
        frequency: 'daily',
        status: 'active',
        createdAt: '2026-09-12T00:00:00Z',
        updatedAt: '2026-09-12T00:00:00Z',
        notifiedJobIds: [],
      }

      const results = await evaluateJobAlertsFromFeed([alert])
      assert.ok(Array.isArray(results))
      assert.equal(results.length, 1)
      assert.equal(results[0].alert.id, 'al-from-feed')
    })
  })
})
