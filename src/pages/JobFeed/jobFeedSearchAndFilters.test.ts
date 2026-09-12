import test from 'node:test'
import assert from 'node:assert/strict'
import type { JobFeedFilterState, JobListing } from '../../types/jobFeed.ts'
import {
  calculateSearchQueryRelevance,
  filterJobListings,
  getActiveFilterChips,
  getActiveFilterCount,
  matchesSearchQuery,
  normalizeSearchQuery,
  sortJobListings,
  tokenizeSearchQuery,
} from './JobFeedModel.ts'
import {
  deduplicateJobListings,
  rankJobListings,
  type CandidateSignals,
} from '../../services/jobRecommendationService.ts'

const TEST_JOBS: JobListing[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer',
    company: 'Acme Corp',
    location: 'Remote (Worldwide)',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    category: 'Software Development',
    salary: '$140k - $180k',
    description: 'We are seeking an expert with React, TypeScript, and modern CSS architecture.',
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
    postedDate: '2026-09-10T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://acme.com/careers/senior-frontend-1',
  },
  {
    id: 'job-2',
    title: 'Cloud DevOps Specialist',
    company: 'Beta Cloud',
    location: 'Remote (US)',
    workplaceType: 'Remote',
    employmentType: 'Contract',
    category: 'DevOps / Sysadmin',
    salary: '$130k - $160k',
    description: 'Deploy Kubernetes clusters and automate AWS infrastructure using Terraform and Docker.',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker'],
    postedDate: '2026-09-08T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://betacloud.io/jobs/devops-2',
  },
  {
    id: 'job-3',
    title: 'Full Stack Developer',
    company: 'Zenith Labs',
    location: 'London, UK',
    workplaceType: 'Hybrid',
    employmentType: 'Part-time',
    category: 'Software Development',
    salary: '£45k - £60k',
    description: 'Developing high-throughput Node.js microservices and React frontends.',
    skills: ['Node.js', 'React', 'PostgreSQL'],
    postedDate: '2026-09-05T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://zenith.co.uk/jobs/fullstack-3',
  },
  {
    id: 'job-4',
    title: 'UI/UX Product Design Intern',
    company: 'DesignCraft',
    location: 'New York, NY',
    workplaceType: 'On-site',
    employmentType: 'Internship',
    category: 'Design',
    salary: '$35/hr',
    description: 'Figma component libraries and user testing interviews.',
    skills: ['Figma', 'User Research', 'Prototyping'],
    postedDate: '2026-09-02T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://designcraft.com/intern-4',
  },
]

test('1. Query normalization - cleans whitespace, casing, and trailing punctuation', () => {
  assert.strictEqual(normalizeSearchQuery('  React   Developer!  '), 'react developer')
  assert.strictEqual(normalizeSearchQuery('PYTHON...'), 'python')
  assert.strictEqual(normalizeSearchQuery(''), '')
  assert.strictEqual(normalizeSearchQuery(undefined), '')
})

test('2. Single-term search - matches title, company, skills, or location', () => {
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[0], 'frontend'), true)
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[0], 'Acme'), true)
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[0], 'Tailwind'), true)
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[0], 'Worldwide'), true)
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[0], 'Kubernetes'), false)
})

test('3. Multi-term search - matches when terms are distributed across title and skills', () => {
  // 'React' is in title and skills; 'TypeScript' is in skills and description
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[0], 'Frontend TypeScript'), true)
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[0], 'Acme React'), true)
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[0], 'React Docker'), false)
})

test('4. Title relevance - exact and phrase matches score higher than description hits', () => {
  const exactScore = calculateSearchQueryRelevance(TEST_JOBS[0], 'Senior Frontend Engineer')
  const partialTitleScore = calculateSearchQueryRelevance(TEST_JOBS[0], 'Frontend')
  const descScore = calculateSearchQueryRelevance(TEST_JOBS[0], 'architecture')

  assert.ok(exactScore > partialTitleScore, 'Exact title should outscore partial title')
  assert.ok(partialTitleScore > descScore, 'Title tokens should outscore description hit')
})

test('5. Company relevance - matching company provides notable relevance', () => {
  const score = calculateSearchQueryRelevance(TEST_JOBS[1], 'Beta Cloud')
  assert.ok(score >= 25, `Expected score >= 25, got ${score}`)
})

test('6. Skill relevance - query matching listed skills scores strongly', () => {
  const score = calculateSearchQueryRelevance(TEST_JOBS[0], 'Tailwind CSS')
  assert.ok(score >= 25, `Expected score >= 25, got ${score}`)
})

test('7. Location relevance - matches candidate location query', () => {
  const score = calculateSearchQueryRelevance(TEST_JOBS[2], 'London')
  assert.ok(score >= 10, `Expected score >= 10, got ${score}`)
})

test('8. Description relevance fallback - matches keywords in body description', () => {
  // 'expert' only appears in the body description of job-1
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[0], 'expert'), true)
  assert.strictEqual(matchesSearchQuery(TEST_JOBS[1], 'expert'), false)
})

test('9. Workplace filter - filters by Remote, Hybrid, or On-site', () => {
  const remoteFilter: JobFeedFilterState = {
    search: '',
    workplace: 'remote',
    employmentType: 'all',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  }
  const hybridFilter: JobFeedFilterState = {
    ...remoteFilter,
    workplace: 'hybrid',
  }
  const onsiteFilter: JobFeedFilterState = {
    ...remoteFilter,
    workplace: 'on-site',
  }

  const remoteJobs = filterJobListings(TEST_JOBS, remoteFilter)
  const hybridJobs = filterJobListings(TEST_JOBS, hybridFilter)
  const onsiteJobs = filterJobListings(TEST_JOBS, onsiteFilter)

  assert.strictEqual(remoteJobs.length, 2)
  assert.strictEqual(hybridJobs.length, 1)
  assert.strictEqual(onsiteJobs.length, 1)
})

test('10. Employment filter - filters by Full-time, Part-time, Contract, Internship', () => {
  const fulltime = filterJobListings(TEST_JOBS, {
    search: '',
    workplace: 'all',
    employmentType: 'full-time',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  })
  const internship = filterJobListings(TEST_JOBS, {
    search: '',
    workplace: 'all',
    employmentType: 'internship',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  })

  assert.strictEqual(fulltime.length, 1)
  assert.strictEqual(fulltime[0].id, 'job-1')
  assert.strictEqual(internship.length, 1)
  assert.strictEqual(internship[0].id, 'job-4')
})

test('11. Category filter - matches specific categories', () => {
  const devops = filterJobListings(TEST_JOBS, {
    search: '',
    workplace: 'all',
    employmentType: 'all',
    category: 'devops',
    location: 'all',
    sortBy: 'newest',
  })
  assert.strictEqual(devops.length, 1)
  assert.strictEqual(devops[0].id, 'job-2')
})

test('12. Location filter - filters by location substring', () => {
  const london = filterJobListings(TEST_JOBS, {
    search: '',
    workplace: 'all',
    employmentType: 'all',
    category: 'all',
    location: 'london',
    sortBy: 'newest',
  })
  assert.strictEqual(london.length, 1)
  assert.strictEqual(london[0].id, 'job-3')
})

test('13. Multiple active filters - respects conjunction of search, workplace, and employment type', () => {
  const combinedFilter: JobFeedFilterState = {
    search: 'React',
    workplace: 'remote',
    employmentType: 'full-time',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  }
  const results = filterJobListings(TEST_JOBS, combinedFilter)
  assert.strictEqual(results.length, 1)
  assert.strictEqual(results[0].id, 'job-1')
})

test('14. Filter clearing - returns all jobs when reset to all', () => {
  const resetFilters: JobFeedFilterState = {
    search: '',
    workplace: 'all',
    employmentType: 'all',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  }
  const results = filterJobListings(TEST_JOBS, resetFilters)
  assert.strictEqual(results.length, TEST_JOBS.length)
})

test('15. Active filter count and chips derivation - computes count and human labels', () => {
  const activeFilters: JobFeedFilterState = {
    search: 'React',
    workplace: 'remote',
    employmentType: 'full-time',
    category: 'all',
    location: 'all',
    sortBy: 'relevant',
  }
  const count = getActiveFilterCount(activeFilters)
  const chips = getActiveFilterChips(activeFilters)

  assert.strictEqual(count, 2) // workplace + employmentType
  assert.strictEqual(chips.length, 3) // search + workplace + employmentType
  assert.ok(chips.some((c) => c.label === '"React"'))
  assert.ok(chips.some((c) => c.label === 'Remote'))
  assert.ok(chips.some((c) => c.label === 'Full-time'))
})

test('16. Search-intent dominance - query relevance dominates unrelated profile background', () => {
  const candidateWithReact: CandidateSignals = {
    skills: ['React', 'TypeScript'],
    searchQuery: 'Kubernetes', // Explicit search for DevOps/Kubernetes
  }
  const ranked = rankJobListings(TEST_JOBS, candidateWithReact)

  assert.strictEqual(ranked[0].job.id, 'job-2', 'DevOps job must rank first when searching for Kubernetes')
})

test('17. Recommendation relevance combination - incorporates profile skills when no query is present', () => {
  const candidateWithReact: CandidateSignals = {
    skills: ['React', 'TypeScript'],
  }
  const ranked = rankJobListings(TEST_JOBS, candidateWithReact)

  assert.strictEqual(ranked[0].job.id, 'job-1', 'React job must rank first when candidate has React skills and no query')
})

test('18. Explicit sort override - sorts by company when requested even with search score', () => {
  const scoreMap = new Map([
    ['job-1', 95],
    ['job-2', 90],
    ['job-3', 85],
    ['job-4', 70],
  ])
  const sorted = sortJobListings(TEST_JOBS, 'company', scoreMap)

  assert.strictEqual(sorted[0].company, 'Acme Corp')
  assert.strictEqual(sorted[1].company, 'Beta Cloud')
  assert.strictEqual(sorted[2].company, 'DesignCraft')
  assert.strictEqual(sorted[3].company, 'Zenith Labs')
})

test('19. Default sort behavior - sorts by scoreMap when relevant is chosen', () => {
  const scoreMap = new Map([
    ['job-1', 10],
    ['job-2', 95], // Highest
    ['job-3', 50],
    ['job-4', 20],
  ])
  const sorted = sortJobListings(TEST_JOBS, 'relevant', scoreMap)
  assert.strictEqual(sorted[0].id, 'job-2')
})

test('20. Duplicate removal before pagination - prevents duplicate cards across pages', () => {
  const duplicateJobs: JobListing[] = [
    TEST_JOBS[0],
    { ...TEST_JOBS[0], title: 'Duplicate Senior Frontend' },
    TEST_JOBS[1],
  ]
  const unique = deduplicateJobListings(duplicateJobs)
  assert.strictEqual(unique.length, 2)
})

test('21. Pagination after filtering - slices correct page items', () => {
  const pageSize = 2
  const filtered = filterJobListings(TEST_JOBS, {
    search: '',
    workplace: 'all',
    employmentType: 'all',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  })
  const page1 = filtered.slice(0, pageSize)
  const page2 = filtered.slice(pageSize, pageSize * 2)

  assert.strictEqual(page1.length, 2)
  assert.strictEqual(page2.length, 2)
  assert.notStrictEqual(page1[0].id, page2[0].id)
})

test('22. Result count - reflects exact filtered count', () => {
  const results = filterJobListings(TEST_JOBS, {
    search: 'Acme',
    workplace: 'all',
    employmentType: 'all',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  })
  assert.strictEqual(results.length, 1)
})

test('23. Zero-result recovery - accurately detects no matches for impossible query', () => {
  const emptyFilter: JobFeedFilterState = {
    search: 'NonExistentTechnologyXYZ123',
    workplace: 'all',
    employmentType: 'all',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  }
  const results = filterJobListings(TEST_JOBS, emptyFilter)
  assert.strictEqual(results.length, 0)
})

test('24. Saved state preservation - candidate signals retain saved job links across search', () => {
  const signals: CandidateSignals = {
    savedJobs: [TEST_JOBS[0]],
    searchQuery: 'Acme',
  }
  const ranked = rankJobListings(TEST_JOBS, signals)
  assert.strictEqual(ranked[0].relevance.isSaved, true)
})

test('25. Applied state awareness - signals mark application status on matching search jobs', () => {
  const signals: CandidateSignals = {
    applications: [
      {
        id: 'app-1',
        company: 'Acme Corp',
        jobTitle: 'Senior Frontend Engineer',
        status: 'Interview',
        applicationDate: '2026-09-01',
        location: 'Remote',
      },
    ],
    searchQuery: 'Frontend',
  }
  const ranked = rankJobListings(TEST_JOBS, signals)
  const appliedJob = ranked.find((r) => r.job.id === 'job-1')

  assert.ok(appliedJob)
  assert.strictEqual(appliedJob.relevance.isApplied, true)
  assert.strictEqual(appliedJob.relevance.applicationStatus, 'Interview')
})

test('26. Deterministic ordering - identical queries on identical jobs yield identical order', () => {
  const signals: CandidateSignals = { searchQuery: 'React' }
  const run1 = rankJobListings(TEST_JOBS, signals)
  const run2 = rankJobListings(TEST_JOBS, signals)

  assert.deepStrictEqual(
    run1.map((r) => r.job.id),
    run2.map((r) => r.job.id),
  )
})

test('27. State isolation between searches - separate queries do not leak state', () => {
  const resPython = filterJobListings(TEST_JOBS, {
    search: 'Python',
    workplace: 'all',
    employmentType: 'all',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  })
  const resFigma = filterJobListings(TEST_JOBS, {
    search: 'Figma',
    workplace: 'all',
    employmentType: 'all',
    category: 'all',
    location: 'all',
    sortBy: 'newest',
  })

  assert.strictEqual(resPython.length, 0)
  assert.strictEqual(resFigma.length, 1)
  assert.strictEqual(resFigma[0].id, 'job-4')
})

test('28. Mobile filter state derivation - computes correct chips when workplace or type changes', () => {
  const mobileFilters: JobFeedFilterState = {
    search: '',
    workplace: 'remote',
    employmentType: 'contract',
    category: 'devops',
    location: 'all',
    sortBy: 'newest',
  }
  const count = getActiveFilterCount(mobileFilters)
  assert.strictEqual(count, 3)
})

test('29. Step 12 regression protection - all existing job properties remain unmutated', () => {
  const originalTitle = TEST_JOBS[0].title
  const originalCompany = TEST_JOBS[0].company
  const originalSkills = [...TEST_JOBS[0].skills]

  filterJobListings(TEST_JOBS, {
    search: 'Frontend',
    workplace: 'all',
    employmentType: 'all',
    category: 'all',
    location: 'all',
    sortBy: 'relevant',
  })

  assert.strictEqual(TEST_JOBS[0].title, originalTitle)
  assert.strictEqual(TEST_JOBS[0].company, originalCompany)
  assert.deepStrictEqual(TEST_JOBS[0].skills, originalSkills)
})
