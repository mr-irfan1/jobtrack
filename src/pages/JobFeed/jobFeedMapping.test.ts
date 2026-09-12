import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  mapRemotiveJobType,
  rawToJobListing,
  sanitizeHtmlDescription,
} from '../../services/jobFeedService.ts'
import type { RemotiveRawJob } from '../../services/jobFeedService.ts'

test('mapRemotiveJobType normalizes raw job type strings correctly', () => {
  assert.equal(mapRemotiveJobType('full_time'), 'Full-time')
  assert.equal(mapRemotiveJobType('full-time'), 'Full-time')
  assert.equal(mapRemotiveJobType('contract'), 'Contract')
  assert.equal(mapRemotiveJobType('part_time'), 'Part-time')
  assert.equal(mapRemotiveJobType('internship'), 'Internship')
  assert.equal(mapRemotiveJobType(undefined), 'Full-time')
})

test('sanitizeHtmlDescription strips scripts, styles and converts formatting', () => {
  const html = `
    <style>.bad { color: red; }</style>
    <p>Join our team &amp; build the future.</p>
    <script>alert(1)</script>
    <ul>
      <li>First perk</li>
      <li>Second perk</li>
    </ul>
  `
  const cleaned = sanitizeHtmlDescription(html)
  assert.ok(!cleaned.includes('<script>'))
  assert.ok(!cleaned.includes('<style>'))
  assert.ok(!cleaned.includes('.bad'))
  assert.ok(cleaned.includes('&'))
  assert.ok(cleaned.includes('Join our team & build the future.'))
  assert.ok(cleaned.includes('• First perk'))
  assert.ok(cleaned.includes('• Second perk'))
})

test('rawToJobListing converts raw API payload into strict JobListing', () => {
  const raw: RemotiveRawJob = {
    id: 12345,
    title: '  Cloud Architect  ',
    company_name: '  Vercel  ',
    company_logo: 'https://remotive.com/logo.png',
    candidate_required_location: 'Worldwide',
    category: 'DevOps',
    job_type: 'contract',
    salary: ' $140k - $180k ',
    publication_date: '2026-09-10T12:00:00Z',
    url: 'https://remotive.com/remote-jobs/12345',
    tags: ['Next.js', 'Vercel', 'Edge'],
    description: '<p>Architect cloud systems.</p>',
  }

  const listing = rawToJobListing(raw)

  assert.equal(listing.id, '12345')
  assert.equal(listing.title, 'Cloud Architect')
  assert.equal(listing.company, 'Vercel')
  assert.equal(listing.location, 'Remote (Worldwide)')
  assert.equal(listing.workplaceType, 'Remote')
  assert.equal(listing.employmentType, 'Contract')
  assert.equal(listing.category, 'DevOps')
  assert.equal(listing.salary, '$140k - $180k')
  assert.equal(listing.source, 'Remotive')
  assert.equal(listing.applyUrl, 'https://remotive.com/remote-jobs/12345')
  assert.deepEqual(listing.skills, ['Next.js', 'Vercel', 'Edge'])
  assert.equal(listing.description, 'Architect cloud systems.')
})

test('rawToJobListing handles missing optional fields gracefully', () => {
  const raw: RemotiveRawJob = {
    id: 999,
    title: '',
    company_name: '',
    url: 'invalid-url',
  }

  const listing = rawToJobListing(raw)

  assert.equal(listing.id, '999')
  assert.equal(listing.title, 'Untitled Role')
  assert.equal(listing.company, 'Confidential Company')
  assert.equal(listing.salary, null)
  assert.equal(listing.location, 'Remote (Worldwide)')
  assert.equal(listing.applyUrl, 'https://remotive.com/remote-jobs/999')
  assert.deepEqual(listing.skills, [])
})
