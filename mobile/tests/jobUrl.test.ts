import assert from 'node:assert/strict'
import { test } from 'node:test'

export function getSourceBrandName(urlStr: string): string {
  try {
    const parsed = new URL(urlStr)
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./i, '')

    if (hostname.includes('amazon.jobs')) return 'Amazon Jobs'
    if (hostname.includes('unstop.com')) return 'Unstop'
    if (hostname.includes('linkedin.com')) return 'LinkedIn'
    if (hostname.includes('indeed.com')) return 'Indeed'
    if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) {
      return 'Wellfound'
    }
    if (hostname.includes('greenhouse.io')) return 'Greenhouse'
    if (hostname.includes('lever.co')) return 'Lever'
    if (hostname.includes('ashbyhq.com')) return 'Ashby'

    return hostname
  } catch {
    return 'Web'
  }
}

export function extractHttpUrlFromText(text: string): string | null {
  if (!text || typeof text !== 'string') return null
  const urlRegex = /(https?:\/\/[^\s]+)/i
  const match = urlRegex.exec(text)
  if (!match) return null

  const candidate = match[1].replace(/[),;.!'"?]+$/, '')
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return candidate
    }
  } catch {
    return null
  }
  return null
}

export function parseIncomingJobUrl(incomingUrl: string): string | null {
  if (!incomingUrl) return null

  try {
    const urlObj = new URL(incomingUrl.replace(/^jobtrack:\/\//i, 'https://jobtrack.app/'))
    const directUrl =
      urlObj.searchParams.get('url') ||
      urlObj.searchParams.get('jobUrl') ||
      urlObj.searchParams.get('link') ||
      urlObj.searchParams.get('text')

    if (directUrl) {
      const extracted = extractHttpUrlFromText(directUrl)
      if (extracted) return extracted
    }

    const rawExtracted = extractHttpUrlFromText(incomingUrl)
    if (rawExtracted && !rawExtracted.startsWith('jobtrack://')) {
      return rawExtracted
    }

    return null
  } catch {
    return null
  }
}

export function getFriendlyErrorMessage(code: string): string {
  switch (code) {
    case 'INVALID_URL':
      return 'Please enter a valid, public job URL starting with http:// or https://'
    case 'ACCESS_BLOCKED':
      return "We couldn't read this job page. The website may block automated access."
    case 'TIMEOUT':
      return 'The job page took too long to respond. Please try again or enter details manually.'
    case 'NO_JOB_DATA':
      return "We couldn't find key job details on this page. You can add this job manually."
    default:
      return 'Unable to extract job details from this link. You can enter them manually.'
  }
}

test('Job URL: getSourceBrandName correctly identifies provider hostnames', () => {
  assert.equal(
    getSourceBrandName('https://amazon.jobs/en/jobs/12345/software-engineer'),
    'Amazon Jobs',
  )
  assert.equal(
    getSourceBrandName('https://unstop.com/jobs/frontend-developer-999'),
    'Unstop',
  )
  assert.equal(
    getSourceBrandName('https://www.linkedin.com/jobs/view/123456789'),
    'LinkedIn',
  )
  assert.equal(
    getSourceBrandName('https://boards.greenhouse.io/airbnb/jobs/456'),
    'Greenhouse',
  )
  assert.equal(
    getSourceBrandName('https://jobs.lever.co/stripe/789'),
    'Lever',
  )
  assert.equal(
    getSourceBrandName('https://jobs.ashbyhq.com/linear/101'),
    'Ashby',
  )
  assert.equal(
    getSourceBrandName('https://wellfound.com/company/coolstartup/jobs/123'),
    'Wellfound',
  )
})

test('Job URL: extractHttpUrlFromText pulls valid links from raw text payloads', () => {
  const sharedText =
    'Hey, check out this job at Netflix: https://jobs.netflix.com/jobs/123456!'
  const extracted = extractHttpUrlFromText(sharedText)
  assert.equal(extracted, 'https://jobs.netflix.com/jobs/123456')

  assert.equal(extractHttpUrlFromText('No link here'), null)
})

test('Job URL: parseIncomingJobUrl handles custom deep link schemes and query parameters', () => {
  const deepLink =
    'jobtrack://import?url=https%3A%2F%2Fcompany.com%2Fcareers%2Fengineer'
  const parsed = parseIncomingJobUrl(deepLink)
  assert.equal(parsed, 'https://company.com/careers/engineer')

  const intentDeepLink =
    'jobtrack://share?text=Check+this+out+https%3A%2F%2Fuber.com%2Fjob'
  const parsedIntent = parseIncomingJobUrl(intentDeepLink)
  assert.equal(parsedIntent, 'https://uber.com/job')
})

test('Job URL: getFriendlyErrorMessage produces helpful messages for all error codes', () => {
  assert.ok(getFriendlyErrorMessage('INVALID_URL').includes('valid'))
  assert.ok(getFriendlyErrorMessage('ACCESS_BLOCKED').includes('block'))
  assert.ok(getFriendlyErrorMessage('TIMEOUT').includes('too long'))
  assert.ok(getFriendlyErrorMessage('NO_JOB_DATA').includes('key job details'))
})
