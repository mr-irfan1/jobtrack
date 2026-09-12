import test from 'node:test'
import assert from 'node:assert/strict'
import type { JobListing } from '../types/jobFeed.ts'
import type { JobApplication } from '../types/application.ts'
import {
  deduplicateJobListings,
  getRecommendedJobs,
  normalizeJobUrl,
  rankJobListings,
  scoreJobListing,
  type CandidateSignals,
} from './jobRecommendationService.ts'

const BASE_JOB_REACT: JobListing = {
  id: 'job-react-1',
  title: 'Frontend React Developer',
  company: 'Acme Corp',
  location: 'Remote (Worldwide)',
  workplaceType: 'Remote',
  employmentType: 'Full-time',
  category: 'Software Development',
  salary: '$120k - $150k',
  description: 'Building modern interfaces with React, TypeScript, and Tailwind CSS.',
  skills: ['React', 'TypeScript', 'Tailwind CSS'],
  postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1d ago
  source: 'Remotive',
  applyUrl: 'https://acme.com/jobs/react-dev?utm_source=jobboard&ref=tracker',
}

const BASE_JOB_DEVOPS: JobListing = {
  id: 'job-devops-2',
  title: 'Cloud DevOps Engineer',
  company: 'CloudFlow Inc',
  location: 'Remote (US)',
  workplaceType: 'Remote',
  employmentType: 'Full-time',
  category: 'DevOps / Sysadmin',
  salary: '$130k - $160k',
  description: 'Managing AWS infrastructure with Terraform, Docker, and Kubernetes.',
  skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
  postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2d ago
  source: 'Remotive',
  applyUrl: 'https://cloudflow.io/careers/devops-engineer/',
}

const BASE_JOB_PYTHON: JobListing = {
  id: 'job-python-3',
  title: 'Backend Python Engineer',
  company: 'DataMetrics',
  location: 'New York, NY',
  workplaceType: 'On-site',
  employmentType: 'Contract',
  category: 'Data Science',
  salary: '$90k - $110k',
  description: 'Data pipelines with Python, PostgreSQL, and Django.',
  skills: ['Python', 'PostgreSQL', 'Django'],
  postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), // 20d ago
  source: 'Remotive',
  applyUrl: 'https://datametrics.com/jobs/python-3',
}

test('1. Skill relevance score - computes overlap accurately', () => {
  const signals: CandidateSignals = {
    skills: ['React', 'TypeScript'],
  }
  const result = scoreJobListing(BASE_JOB_REACT, signals)

  assert.ok(result.score >= 35, `Expected score >= 35, got ${result.score}`)
  const skillReason = result.reasons.find((r) => r.type === 'skill_match')
  assert.ok(skillReason, 'Expected skill_match reason')
  assert.match(skillReason.label, /React/i)
  assert.match(skillReason.label, /TypeScript/i)
})

test('2. Title relevance - matches preferred title and headline tokens', () => {
  const signals: CandidateSignals = {
    preferredJobTitle: 'Frontend Engineer',
  }
  const result = scoreJobListing(BASE_JOB_REACT, signals)

  assert.ok(result.score >= 20, `Expected score >= 20, got ${result.score}`)
  const titleReason = result.reasons.find((r) => r.type === 'title_match')
  assert.ok(titleReason, 'Expected title_match reason')
  assert.match(titleReason.label, /preferred role/i)
})

test('3. Query relevance - explicit search query strongly dominates profile signals', () => {
  const signals: CandidateSignals = {
    skills: ['React', 'TypeScript'], // Profile is React
    searchQuery: 'DevOps', // User explicitly searched for DevOps
  }

  const devopsRelevance = scoreJobListing(BASE_JOB_DEVOPS, signals)
  const reactRelevance = scoreJobListing(BASE_JOB_REACT, signals)

  assert.ok(
    devopsRelevance.score > reactRelevance.score,
    `DevOps score (${devopsRelevance.score}) must exceed React score (${reactRelevance.score}) on query 'DevOps'`,
  )
  const devopsQueryReason = devopsRelevance.reasons.find((r) => r.type === 'query_match')
  assert.ok(devopsQueryReason, 'Expected query_match reason for DevOps job')
  assert.match(devopsQueryReason.label, /DevOps/i)
})

test('4. Freshness weighting - rewards recently posted jobs', () => {
  const freshJob: JobListing = {
    ...BASE_JOB_REACT,
    postedDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
  }
  const oldJob: JobListing = {
    ...BASE_JOB_REACT,
    postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(), // 40d ago
  }

  const freshScore = scoreJobListing(freshJob, {})
  const oldScore = scoreJobListing(oldJob, {})

  assert.ok(
    freshScore.score > oldScore.score,
    `Fresh job score (${freshScore.score}) should exceed old job score (${oldScore.score})`,
  )
  assert.ok(
    freshScore.reasons.some((r) => r.type === 'freshness'),
    'Expected freshness reason for fresh job',
  )
})

test('5. Preference matching - workplace and employment type alignment', () => {
  const signals: CandidateSignals = {
    workPreference: 'Remote',
    employmentType: 'Full-time',
  }
  const result = scoreJobListing(BASE_JOB_REACT, signals)

  const prefReasons = result.reasons.filter((r) => r.type === 'preference_match')
  assert.ok(prefReasons.length >= 2, 'Expected workplace and employment preference reasons')
  assert.ok(prefReasons.some((r) => r.label.includes('Remote')))
  assert.ok(prefReasons.some((r) => r.label.includes('Full-time')))
})

test('6. Saved-job similarity - rewards roles similar in category to saved jobs', () => {
  const signals: CandidateSignals = {
    savedJobs: [
      {
        ...BASE_JOB_REACT,
        id: 'different-react-job',
        category: 'Software Development',
      },
    ],
  }
  const similarJob: JobListing = {
    ...BASE_JOB_REACT,
    id: 'another-unrelated-id',
    title: 'Junior Web Builder',
    skills: ['HTML', 'CSS'], // no direct skill overlap with React
    category: 'Software Development',
    applyUrl: 'https://example.com/jobs/web-builder',
  }

  const result = scoreJobListing(similarJob, signals)
  assert.ok(
    result.reasons.some((r) => r.type === 'saved_similarity'),
    'Expected saved_similarity reason',
  )
})

test('7. Application state awareness - identifies active applications', () => {
  const app: JobApplication = {
    id: 'app-1',
    company: 'Acme Corp',
    jobTitle: 'Frontend React Developer',
    status: 'Interview',
    applicationDate: '2026-09-01',
    location: 'Remote',
  }
  const signals: CandidateSignals = {
    applications: [app],
  }

  const result = scoreJobListing(BASE_JOB_REACT, signals)
  assert.strictEqual(result.isApplied, true)
  assert.strictEqual(result.applicationStatus, 'Interview')
  assert.ok(
    result.reasons.some((r) => r.label.includes('In Applications (Interview)')),
    'Expected applied status label in reasons',
  )
})

test('8. Already-applied handling - deprioritizes score while preserving visibility', () => {
  const app: JobApplication = {
    id: 'app-1',
    company: 'Acme Corp',
    jobTitle: 'Frontend React Developer',
    status: 'Applied',
    applicationDate: '2026-09-01',
    location: 'Remote',
  }
  const signalsWithoutApp: CandidateSignals = {
    skills: ['React', 'TypeScript'],
  }
  const signalsWithApp: CandidateSignals = {
    skills: ['React', 'TypeScript'],
    applications: [app],
  }

  const unapplied = scoreJobListing(BASE_JOB_REACT, signalsWithoutApp)
  const applied = scoreJobListing(BASE_JOB_REACT, signalsWithApp)

  assert.ok(
    unapplied.score > applied.score,
    `Applied job score (${applied.score}) should be lower than unapplied (${unapplied.score})`,
  )
  assert.strictEqual(applied.isRecommended, false, 'Applied job should not be recommended as a new opportunity')
})

test('9. Already-saved handling - marks isSaved and notes saved status', () => {
  const signals: CandidateSignals = {
    savedJobs: [BASE_JOB_REACT],
  }
  const result = scoreJobListing(BASE_JOB_REACT, signals)

  assert.strictEqual(result.isSaved, true)
  assert.ok(
    result.reasons.some((r) => r.label === 'In your Saved Jobs'),
    'Expected In your Saved Jobs reason',
  )
})

test('10. Cold-start behavior - provides clean fallback without fake reasons', () => {
  const signals: CandidateSignals = {}
  const result = scoreJobListing(BASE_JOB_REACT, signals)

  // Should have basic freshness score without manufactured skill/role claims
  assert.ok(!result.reasons.some((r) => r.type === 'skill_match'))
  assert.ok(!result.reasons.some((r) => r.type === 'title_match'))
})

test('11. No-profile-signal behavior - does not fabricate personalization', () => {
  const emptySignals: CandidateSignals = {
    skills: [],
    preferredJobTitle: '',
    headline: '',
    workPreference: 'Any',
    employmentType: 'Any',
  }
  const result = scoreJobListing(BASE_JOB_PYTHON, emptySignals)

  assert.strictEqual(result.reasons.some((r) => r.type === 'skill_match'), false)
  assert.strictEqual(result.reasons.some((r) => r.type === 'title_match'), false)
})

test('12. Recommendation reason generation - labels are concise and human-readable', () => {
  const signals: CandidateSignals = {
    skills: ['React', 'TypeScript', 'GraphQL'],
    preferredJobTitle: 'Frontend Engineer',
    workPreference: 'Remote',
  }
  const result = scoreJobListing(BASE_JOB_REACT, signals)

  for (const reason of result.reasons) {
    assert.ok(typeof reason.label === 'string')
    assert.ok(reason.label.length > 3)
    assert.ok(reason.label.length < 80, `Reason too long: ${reason.label}`)
  }
})

test('13. Score normalization - clamps strictly between 0 and 100', () => {
  const superSignals: CandidateSignals = {
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
    preferredJobTitle: 'Frontend React Developer',
    headline: 'Frontend React Developer',
    workPreference: 'Remote',
    employmentType: 'Full-time',
    searchQuery: 'Frontend React',
  }
  const result = scoreJobListing(BASE_JOB_REACT, superSignals)
  assert.ok(result.score <= 100, `Score ${result.score} should not exceed 100`)
  assert.ok(result.score >= 0, `Score ${result.score} should be >= 0`)
})

test('14. Deterministic ordering - identical inputs yield identical rankings', () => {
  const signals: CandidateSignals = {
    skills: ['React'],
  }
  const jobs = [BASE_JOB_PYTHON, BASE_JOB_REACT, BASE_JOB_DEVOPS]

  const run1 = rankJobListings(jobs, signals)
  const run2 = rankJobListings(jobs, signals)

  assert.deepStrictEqual(
    run1.map((r) => r.job.id),
    run2.map((r) => r.job.id),
  )
})

test('15. Duplicate job removal - deduplicates by ID and normalized URL', () => {
  const dupeById: JobListing = {
    ...BASE_JOB_REACT,
    title: 'Frontend React Developer (Duplicate ID)',
  }
  const dupeByUrl: JobListing = {
    ...BASE_JOB_REACT,
    id: 'job-react-different-id',
    applyUrl: 'https://acme.com/jobs/react-dev?utm_medium=email', // same normalized URL
  }

  const unique = deduplicateJobListings([BASE_JOB_REACT, dupeById, dupeByUrl])
  assert.strictEqual(unique.length, 1, `Expected 1 unique job, got ${unique.length}`)
})

test('16. URL normalization - strips tracking query params and trailing slashes', () => {
  const raw1 = 'https://Example.com/jobs/123/?utm_source=twitter&utm_medium=social&ref=partner'
  const raw2 = 'https://example.com/jobs/123'

  assert.strictEqual(normalizeJobUrl(raw1), normalizeJobUrl(raw2))
})

test('17. Search intent priority - searching "Python" ranks Python first over React profile skills', () => {
  const signals: CandidateSignals = {
    skills: ['React', 'TypeScript'], // Strong React background
    searchQuery: 'Python', // Explicit search for Python
  }
  const jobs = [BASE_JOB_REACT, BASE_JOB_PYTHON, BASE_JOB_DEVOPS]
  const ranked = rankJobListings(jobs, signals)

  assert.strictEqual(ranked[0].job.id, BASE_JOB_PYTHON.id, 'Python job must rank first when searching for Python')
})

test('18. Cache invalidation & dynamic signals - ranking updates immediately when skills change', () => {
  const jobs = [BASE_JOB_REACT, BASE_JOB_DEVOPS]

  const reactSignals: CandidateSignals = { skills: ['React'] }
  const devopsSignals: CandidateSignals = { skills: ['Kubernetes', 'Terraform'] }

  const rankedReact = rankJobListings(jobs, reactSignals)
  const rankedDevops = rankJobListings(jobs, devopsSignals)

  assert.strictEqual(rankedReact[0].job.id, BASE_JOB_REACT.id)
  assert.strictEqual(rankedDevops[0].job.id, BASE_JOB_DEVOPS.id)
})

test('19. State isolation - signals object is never mutated', () => {
  const signals: CandidateSignals = {
    skills: ['React'],
    savedJobs: [BASE_JOB_REACT],
  }
  const originalSkills = [...signals.skills!]
  rankJobListings([BASE_JOB_REACT], signals)

  assert.deepStrictEqual(signals.skills, originalSkills)
})

test('20. Recommendation failure fallback - handles empty or null signals gracefully', () => {
  const nullSignals = {} as CandidateSignals
  const ranked = rankJobListings([BASE_JOB_REACT, BASE_JOB_PYTHON], nullSignals)

  assert.strictEqual(ranked.length, 2)
  assert.ok(ranked[0].relevance.score >= 0)
})

test('21. Top curated recommendations - getRecommendedJobs filters unapplied high scores', () => {
  const signals: CandidateSignals = {
    skills: ['React', 'TypeScript'],
    workPreference: 'Remote',
  }
  const scored = rankJobListings([BASE_JOB_REACT, BASE_JOB_PYTHON], signals)
  const recommended = getRecommendedJobs(scored, 3)

  assert.ok(recommended.length >= 1)
  assert.strictEqual(recommended[0].job.id, BASE_JOB_REACT.id)
  assert.strictEqual(recommended[0].relevance.isRecommended, true)
})

test('22. Standard Job Feed regression - jobs with 0 score still retain full original JobListing data', () => {
  const unrelatedJob: JobListing = {
    ...BASE_JOB_PYTHON,
    postedDate: '2020-01-01', // very old
  }
  const signals: CandidateSignals = {
    searchQuery: 'NonExistentQueryXYZ',
  }
  const scored = rankJobListings([unrelatedJob], signals)

  assert.strictEqual(scored.length, 1)
  assert.strictEqual(scored[0].job.title, unrelatedJob.title)
  assert.strictEqual(scored[0].job.company, unrelatedJob.company)
  assert.strictEqual(scored[0].job.applyUrl, unrelatedJob.applyUrl)
})
