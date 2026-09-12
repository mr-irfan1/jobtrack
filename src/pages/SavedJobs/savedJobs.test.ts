import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import type { JobListing } from '../../types/jobFeed.ts'
import type { JobApplication } from '../../types/application.ts'
import {
  filterSavedJobs,
  sortSavedJobs,
} from './SavedJobsModel.ts'
import type { SavedJobsFilterState } from './SavedJobsModel.ts'
import {
  getSavedJobIds,
  getSavedJobItems,
  isJobIdSaved,
  removeSavedJob,
  saveJob,
} from '../../services/savedJobsStore.ts'
import type { SavedJobItem } from '../../services/savedJobsStore.ts'
import { findDuplicateApplication } from '../../components/JobUrlImport/jobUrlImportLogic.ts'

const MOCK_JOB_1: JobListing = {
  id: 'job-1',
  title: 'Senior Frontend Engineer',
  company: 'Stripe',
  location: 'Remote (USA)',
  workplaceType: 'Remote',
  employmentType: 'Full-time',
  category: 'Software Development',
  salary: '$150k',
  description: 'Work with React, TypeScript, and modern UI systems.',
  skills: ['React', 'TypeScript', 'Tailwind'],
  postedDate: '2026-09-01T12:00:00Z',
  source: 'Remotive',
  applyUrl: 'https://remotive.com/stripe-frontend',
}

const MOCK_JOB_2: JobListing = {
  id: 'job-2',
  title: 'Backend Platform Engineer',
  company: 'Airbnb',
  location: 'San Francisco, CA',
  workplaceType: 'Hybrid',
  employmentType: 'Contract',
  category: 'DevOps',
  salary: '$140k',
  description: 'Distributed systems and cloud architecture.',
  skills: ['Go', 'Kubernetes', 'AWS'],
  postedDate: '2026-09-05T12:00:00Z',
  source: 'Remotive',
  applyUrl: 'https://remotive.com/airbnb-backend',
}

const MOCK_JOB_3: JobListing = {
  id: 'job-3',
  title: 'Product Design Intern',
  company: 'Linear',
  location: 'On-site (New York)',
  workplaceType: 'On-site',
  employmentType: 'Internship',
  category: 'Design',
  salary: '$45/hr',
  description: 'Design craft and interaction design.',
  skills: ['Figma', 'UI/UX'],
  postedDate: '2026-09-08T12:00:00Z',
  source: 'Remotive',
  applyUrl: 'https://remotive.com/linear-intern',
}

const MOCK_SAVED_ITEMS: SavedJobItem[] = [
  {
    id: 'job-1',
    savedAt: '2026-09-10T10:00:00Z',
    job: MOCK_JOB_1,
  },
  {
    id: 'job-2',
    savedAt: '2026-09-10T12:00:00Z',
    job: MOCK_JOB_2,
  },
  {
    id: 'job-3',
    savedAt: '2026-09-10T14:00:00Z',
    job: MOCK_JOB_3,
  },
]

// Polyfill localStorage in Node.js test environment if absent
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  }
}

beforeEach(() => {
  localStorage.clear()
})

// 1. SAVING A JOB
test('saveJob adds job to both items and IDs store', () => {
  saveJob(MOCK_JOB_1)
  const items = getSavedJobItems()
  const ids = getSavedJobIds()

  assert.equal(items.length, 1)
  assert.equal(items[0].id, 'job-1')
  assert.equal(items[0].job.title, 'Senior Frontend Engineer')
  assert.ok(ids.includes('job-1'))
  assert.equal(isJobIdSaved('job-1'), true)
})

// 2. PREVENTING DUPLICATE SAVED JOBS
test('saveJob does not duplicate an already saved job', () => {
  saveJob(MOCK_JOB_1)
  saveJob(MOCK_JOB_1)
  const items = getSavedJobItems()
  const ids = getSavedJobIds()

  assert.equal(items.length, 1)
  assert.equal(ids.length, 1)
})

// 3. REMOVING A SAVED JOB
test('removeSavedJob removes job from items and IDs store', () => {
  saveJob(MOCK_JOB_1)
  saveJob(MOCK_JOB_2)
  assert.equal(getSavedJobItems().length, 2)

  removeSavedJob('job-1')
  const items = getSavedJobItems()
  const ids = getSavedJobIds()

  assert.equal(items.length, 1)
  assert.equal(items[0].id, 'job-2')
  assert.equal(isJobIdSaved('job-1'), false)
  assert.equal(isJobIdSaved('job-2'), true)
  assert.ok(!ids.includes('job-1'))
})

// 4. LOADING SAVED JOBS
test('getSavedJobItems handles empty and corrupted storage gracefully', () => {
  assert.deepEqual(getSavedJobItems(), [])
  assert.deepEqual(getSavedJobIds(), [])

  localStorage.setItem('jobtrack_saved_jobs_data', 'invalid-json')
  assert.deepEqual(getSavedJobItems(), [])
})

// 5. SEARCH SAVED JOBS
test('filterSavedJobs searches by title, company, or skills', () => {
  const defaultFilters: SavedJobsFilterState = {
    search: 'Stripe',
    workplaceType: 'all',
    employmentType: 'all',
    sortBy: 'recently_saved',
  }
  const byCompany = filterSavedJobs(MOCK_SAVED_ITEMS, defaultFilters)
  assert.equal(byCompany.length, 1)
  assert.equal(byCompany[0].id, 'job-1')

  const bySkill = filterSavedJobs(MOCK_SAVED_ITEMS, {
    ...defaultFilters,
    search: 'Kubernetes',
  })
  assert.equal(bySkill.length, 1)
  assert.equal(bySkill[0].id, 'job-2')

  const byTitle = filterSavedJobs(MOCK_SAVED_ITEMS, {
    ...defaultFilters,
    search: 'Intern',
  })
  assert.equal(byTitle.length, 1)
  assert.equal(byTitle[0].id, 'job-3')
})

// 6. FILTERS (WORKPLACE & EMPLOYMENT TYPE)
test('filterSavedJobs filters by workplace and employment type', () => {
  const remoteOnly = filterSavedJobs(MOCK_SAVED_ITEMS, {
    search: '',
    workplaceType: 'remote',
    employmentType: 'all',
    sortBy: 'recently_saved',
  })
  assert.equal(remoteOnly.length, 1)
  assert.equal(remoteOnly[0].id, 'job-1')

  const hybridOnly = filterSavedJobs(MOCK_SAVED_ITEMS, {
    search: '',
    workplaceType: 'hybrid',
    employmentType: 'all',
    sortBy: 'recently_saved',
  })
  assert.equal(hybridOnly.length, 1)
  assert.equal(hybridOnly[0].id, 'job-2')

  const internshipOnly = filterSavedJobs(MOCK_SAVED_ITEMS, {
    search: '',
    workplaceType: 'all',
    employmentType: 'internship',
    sortBy: 'recently_saved',
  })
  assert.equal(internshipOnly.length, 1)
  assert.equal(internshipOnly[0].id, 'job-3')
})

// 7. SORTING
test('sortSavedJobs sorts by recently_saved, newest, company, and title', () => {
  const byRecent = sortSavedJobs(MOCK_SAVED_ITEMS, 'recently_saved')
  assert.equal(byRecent[0].id, 'job-3') // 14:00
  assert.equal(byRecent[1].id, 'job-2') // 12:00
  assert.equal(byRecent[2].id, 'job-1') // 10:00

  const byNewest = sortSavedJobs(MOCK_SAVED_ITEMS, 'newest')
  assert.equal(byNewest[0].id, 'job-3') // Sep 8
  assert.equal(byNewest[1].id, 'job-2') // Sep 5
  assert.equal(byNewest[2].id, 'job-1') // Sep 1

  const byCompany = sortSavedJobs(MOCK_SAVED_ITEMS, 'company')
  assert.equal(byCompany[0].job.company, 'Airbnb')
  assert.equal(byCompany[1].job.company, 'Linear')
  assert.equal(byCompany[2].job.company, 'Stripe')

  const byTitle = sortSavedJobs(MOCK_SAVED_ITEMS, 'title')
  assert.equal(byTitle[0].job.title, 'Backend Platform Engineer')
  assert.equal(byTitle[1].job.title, 'Product Design Intern')
  assert.equal(byTitle[2].job.title, 'Senior Frontend Engineer')
})

// 8. EMPTY STATE
test('filterSavedJobs returns empty array when no matches found', () => {
  const noMatch = filterSavedJobs(MOCK_SAVED_ITEMS, {
    search: 'NonExistentSkillOrCompany',
    workplaceType: 'all',
    employmentType: 'all',
    sortBy: 'recently_saved',
  })
  assert.equal(noMatch.length, 0)
})

// 9. DUPLICATE APPLICATION DETECTION
test('findDuplicateApplication detects matching job URL regardless of case or whitespace', () => {
  const applications: JobApplication[] = [
    {
      id: 'app-1',
      company: 'Stripe',
      jobTitle: 'Senior Frontend Engineer',
      location: 'Remote',
      jobUrl: 'https://remotive.com/stripe-frontend',
      applicationDate: '2026-09-02',
      status: 'Applied',
      notes: '',
    },
  ]

  const duplicate = findDuplicateApplication(
    '  HTTPS://REMOTIVE.COM/STRIPE-FRONTEND  ',
    applications,
  )
  assert.ok(duplicate)
  assert.equal(duplicate?.id, 'app-1')

  const nonDuplicate = findDuplicateApplication(
    'https://remotive.com/other-job',
    applications,
  )
  assert.equal(nonDuplicate, undefined)
})

// 10. HANDLING CORRUPTED / UNAVAILABLE SAVED JOBS
test('filterSavedJobs excludes malformed items safely without throwing', () => {
  const malformedItems: SavedJobItem[] = [
    {
      id: 'corrupted-1',
      savedAt: '2026-09-10T10:00:00Z',
      job: undefined as unknown as JobListing,
    },
    MOCK_SAVED_ITEMS[0],
  ]

  const filtered = filterSavedJobs(malformedItems, {
    search: '',
    workplaceType: 'all',
    employmentType: 'all',
    sortBy: 'recently_saved',
  })
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].id, 'job-1')
})
