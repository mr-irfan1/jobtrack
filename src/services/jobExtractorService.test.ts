import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  extractJobFromReadableText,
  extractJobMetadataFromHtml,
  getFriendlyErrorMessage,
  getSourceBrandName,
  isPrivateOrLocalhostUrl,
} from './jobExtractorService.ts'

test('1. Valid generic public job URL - extracts title, company, description from HTML', () => {
  const html = `
    <html>
      <head>
        <title>Senior Software Engineer at Acme Corp</title>
        <meta name="description" content="Build scalable microservices in Node.js and Go." />
      </head>
    </html>
  `
  const job = extractJobMetadataFromHtml(html, 'https://acme.com/jobs/dev-1')
  assert.equal(job.title, 'Senior Software Engineer at Acme Corp')
  assert.equal(job.company, 'Acme Corp')
  assert.equal(job.description, 'Build scalable microservices in Node.js and Go.')
  assert.equal(job.extractionMethod, 'direct')
})

test('2. Amazon Jobs URL - extracts title and maps brand name to Amazon Jobs', () => {
  const html = `
    <html>
      <head>
        <meta property="og:title" content="Internships for Students" />
        <meta property="og:description" content="Discover Amazon internship opportunities for students worldwide." />
      </head>
    </html>
  `
  const job = extractJobMetadataFromHtml(html, 'https://www.amazon.jobs/content/en/career-programs/university/internships-for-students')
  assert.equal(job.title, 'Internships for Students')
  assert.equal(job.company, 'Amazon')
  assert.equal(job.source, 'Amazon Jobs')
})

test('3. Unstop URL - Jina Reader text parser extracts title, company, and location', () => {
  const jinaText = `Title: Web Designing Internship at Learntricks Edutech | Remote

URL Source: https://unstop.com/o/Vtf9Gum?lb=use5JVPn

Markdown Content:
## Eligibility
Undergraduate

## Details
**Responsibilities of the Intern:**
* Develop and maintain web applications`

  const job = extractJobFromReadableText(jinaText, 'https://unstop.com/o/Vtf9Gum')
  assert.ok(job)
  assert.equal(job.title, 'Web Designing Internship')
  assert.equal(job.company, 'Learntricks Edutech')
  assert.equal(job.location, 'Remote')
  assert.equal(job.source, 'Unstop')
  assert.equal(job.extractionMethod, 'jina')
})

test('4. Invalid URL - isPrivateOrLocalhostUrl rejects invalid format', () => {
  assert.equal(isPrivateOrLocalhostUrl('not-a-valid-url'), true)
})

test('5. Localhost URL - blocks localhost and .local hostnames', () => {
  assert.equal(isPrivateOrLocalhostUrl('http://localhost:3000/job'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://app.local/job'), true)
})

test('6. Private IP URL - blocks internal IPv4 ranges (10.x, 192.168.x, 172.16.x, 127.x)', () => {
  assert.equal(isPrivateOrLocalhostUrl('http://127.0.0.1/admin'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://10.0.1.5/job'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://192.168.0.1/job'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://172.20.0.1/job'), true)
})

test('7. Timeout - getFriendlyErrorMessage returns user-friendly timeout copy', () => {
  const msg = getFriendlyErrorMessage('TIMEOUT')
  assert.ok(msg.includes('timed out'))
})

test('8. Blocked website - getFriendlyErrorMessage returns ACCESS_BLOCKED message', () => {
  const msg = getFriendlyErrorMessage('ACCESS_BLOCKED')
  assert.ok(msg.includes("We couldn't access this job page automatically"))
})

test('9. Malformed response - handles empty/whitespace Jina response gracefully', () => {
  const result = extractJobFromReadableText('   \n\t   ', 'https://example.com/job')
  assert.equal(result, null)
})

test('10. Missing job title - fallback parsing leaves missing fields as null', () => {
  const html = '<html><head></head><body>No title tags here</body></html>'
  const job = extractJobMetadataFromHtml(html, 'https://example.com/no-title')
  assert.equal(job.title, null)
  assert.equal(job.company, null)
})

test('11. Missing company - sets company to null when unavailable', () => {
  const html = '<html><head><title>Generic Role</title></head></html>'
  const job = extractJobMetadataFromHtml(html, 'https://example.com/no-company')
  assert.equal(job.title, 'Generic Role')
  assert.equal(job.company, null)
})

test('12. Missing location - sets location to null when unavailable', () => {
  const html = '<html><head><title>Remote Engineer</title></head></html>'
  const job = extractJobMetadataFromHtml(html, 'https://example.com/no-location')
  assert.equal(job.location, null)
})

test('13. Source Brand Name - maps domains accurately', () => {
  assert.equal(getSourceBrandName('https://amazon.jobs/job/1'), 'Amazon Jobs')
  assert.equal(getSourceBrandName('https://unstop.com/o/123'), 'Unstop')
  assert.equal(getSourceBrandName('https://linkedin.com/jobs/1'), 'LinkedIn')
  assert.equal(getSourceBrandName('https://indeed.com/view/1'), 'Indeed')
  assert.equal(getSourceBrandName('https://customcompany.com/job'), 'customcompany.com')
})
