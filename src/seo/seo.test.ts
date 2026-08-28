import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  LANDING_SEO,
  LOGIN_SEO,
  SIGNUP_SEO,
  SITE_ORIGIN,
  siteUrl,
} from './seo.ts'

test('SITE_ORIGIN is the production https origin with no trailing slash', () => {
  assert.equal(SITE_ORIGIN, 'https://www.jobtrack.co.in')
})

test('siteUrl builds the root URL with a single trailing slash', () => {
  assert.equal(siteUrl('/'), 'https://www.jobtrack.co.in/')
})

test('siteUrl joins a root-relative path onto the production origin', () => {
  assert.equal(siteUrl('/signup'), 'https://www.jobtrack.co.in/signup')
  // A path missing its leading slash is still joined with exactly one.
  assert.equal(siteUrl('login'), 'https://www.jobtrack.co.in/login')
})

test('landing SEO matches the exact required title/description/canonical', () => {
  // These three are contractually exact (SEO spec) — guard against typos.
  assert.equal(
    LANDING_SEO.title,
    'JobTrack — Track Jobs, Manage Applications & Land Your Next Opportunity',
  )
  assert.equal(
    LANDING_SEO.description,
    'JobTrack helps you organize job applications, track application progress, manage interviews, and stay on top of your job search in one place.',
  )
  assert.equal(LANDING_SEO.canonical, 'https://www.jobtrack.co.in/')
})

test('each public route self-canonicalizes to its own production URL', () => {
  assert.equal(LOGIN_SEO.canonical, 'https://www.jobtrack.co.in/login')
  assert.equal(SIGNUP_SEO.canonical, 'https://www.jobtrack.co.in/signup')
})

test('every canonical is absolute, https, and on the production origin', () => {
  for (const seo of [LANDING_SEO, LOGIN_SEO, SIGNUP_SEO]) {
    assert.ok(
      seo.canonical.startsWith('https://www.jobtrack.co.in'),
      `canonical must be on the production origin: ${seo.canonical}`,
    )
  }
})

test('login/signup titles are distinct from the landing title (non-competitive)', () => {
  assert.notEqual(LOGIN_SEO.title, LANDING_SEO.title)
  assert.notEqual(SIGNUP_SEO.title, LANDING_SEO.title)
  // ...and the login title stays short and utility-focused, not keyword-stuffed.
  assert.ok(LOGIN_SEO.title.length <= 30)
})

test('every route provides a non-empty title and description', () => {
  for (const seo of [LANDING_SEO, LOGIN_SEO, SIGNUP_SEO]) {
    assert.ok(seo.title.trim().length > 0)
    assert.ok(seo.description.trim().length > 0)
  }
})
