import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobFeedFilterState, JobListing } from '../../types/jobFeed.ts'
import {
  filterJobListings,
  getDistinctCategories,
  sortJobListings,
} from './JobFeedModel.ts'

const MOCK_JOBS: JobListing[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'Acme Corp',
    location: 'Remote (Worldwide)',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    category: 'Software Development',
    salary: '$120k',
    description: 'Working with React and TypeScript.',
    skills: ['React', 'TypeScript'],
    postedDate: '2026-09-01T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://remotive.com/1',
  },
  {
    id: '2',
    title: 'Junior Full Stack Developer',
    company: 'Beta Labs',
    location: 'Remote (USA)',
    workplaceType: 'Remote',
    employmentType: 'Contract',
    category: 'Software Development',
    salary: null,
    description: 'Node.js and Python backend.',
    skills: ['Node.js', 'Python'],
    postedDate: '2026-09-05T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://remotive.com/2',
  },
  {
    id: '3',
    title: 'Product Design Intern',
    company: 'Zenith Inc',
    location: 'Remote (Europe)',
    workplaceType: 'Remote',
    employmentType: 'Internship',
    category: 'Design',
    salary: '$40/hr',
    description: 'Figma and design systems.',
    skills: ['Figma', 'UI/UX'],
    postedDate: '2026-09-08T10:00:00Z',
    source: 'Remotive',
    applyUrl: 'https://remotive.com/3',
  },
]

test('filterJobListings returns all jobs when filters are at defaults', () => {
  const filters: JobFeedFilterState = {
    search: '',
    location: 'all',
    employmentType: 'all',
    category: 'all',
    sortBy: 'newest',
  }
  const result = filterJobListings(MOCK_JOBS, filters)
  assert.equal(result.length, 3)
})

test('filterJobListings filters by search query matching role title', () => {
  const filters: JobFeedFilterState = {
    search: 'Frontend',
    location: 'all',
    employmentType: 'all',
    category: 'all',
    sortBy: 'newest',
  }
  const result = filterJobListings(MOCK_JOBS, filters)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, '1')
})

test('filterJobListings filters by search query matching company name', () => {
  const filters: JobFeedFilterState = {
    search: 'Beta Labs',
    location: 'all',
    employmentType: 'all',
    category: 'all',
    sortBy: 'newest',
  }
  const result = filterJobListings(MOCK_JOBS, filters)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, '2')
})

test('filterJobListings filters by search query matching skills', () => {
  const filters: JobFeedFilterState = {
    search: 'Figma',
    location: 'all',
    employmentType: 'all',
    category: 'all',
    sortBy: 'newest',
  }
  const result = filterJobListings(MOCK_JOBS, filters)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, '3')
})

test('filterJobListings filters by employment type', () => {
  const filters: JobFeedFilterState = {
    search: '',
    location: 'all',
    employmentType: 'internship',
    category: 'all',
    sortBy: 'newest',
  }
  const result = filterJobListings(MOCK_JOBS, filters)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, '3')
})

test('filterJobListings filters by category', () => {
  const filters: JobFeedFilterState = {
    search: '',
    location: 'all',
    employmentType: 'all',
    category: 'design',
    sortBy: 'newest',
  }
  const result = filterJobListings(MOCK_JOBS, filters)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, '3')
})

test('sortJobListings sorts by newest date descending', () => {
  const sorted = sortJobListings(MOCK_JOBS, 'newest')
  assert.equal(sorted[0].id, '3') // Sep 8
  assert.equal(sorted[1].id, '2') // Sep 5
  assert.equal(sorted[2].id, '1') // Sep 1
})

test('sortJobListings sorts by company name ascending', () => {
  const sorted = sortJobListings(MOCK_JOBS, 'company')
  assert.equal(sorted[0].company, 'Acme Corp')
  assert.equal(sorted[1].company, 'Beta Labs')
  assert.equal(sorted[2].company, 'Zenith Inc')
})

test('getDistinctCategories extracts sorted unique categories', () => {
  const categories = getDistinctCategories(MOCK_JOBS)
  assert.deepEqual(categories, ['Design', 'Software Development'])
})
