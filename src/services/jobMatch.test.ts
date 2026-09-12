import test from 'node:test'
import assert from 'node:assert/strict'
import type { JobListing } from '../types/jobFeed.ts'
import type { CandidateProfileContext, JobMatchRequest } from '../types/jobMatch.ts'
import {
  analyzeJobMatch,
  buildMatchCacheKey,
  calculateLocalJobMatch,
  clearJobMatchCache,
  normalizeJobMatchResponse,
  scoreToVerdict,
  verdictToColor,
  verdictToLabel,
} from './jobMatchService.ts'

const MOCK_JOB: JobListing = {
  id: 'job-frontend-lead',
  title: 'Senior React Developer',
  company: 'Stripe',
  location: 'Remote (Worldwide)',
  workplaceType: 'Remote',
  employmentType: 'Full-time',
  salary: '$140k - $180k',
  description: `We are looking for a Senior React Developer to join our team.
Requirements:
• 4+ years of professional experience with React and TypeScript
• Experience building scalable REST APIs and state architectures with Next.js
• Familiarity with Docker and AWS cloud deployments is a plus
• Passion for clean code and testing`,
  skills: ['React', 'TypeScript', 'Next.js', 'REST APIs'],
  postedDate: '2026-09-01',
  source: 'Remotive',
  applyUrl: 'https://stripe.com/jobs/123',
}

const MOCK_CANDIDATE_MATCH: CandidateProfileContext = {
  fullName: 'Alex Developer',
  headline: 'Senior Frontend Engineer (React / TypeScript)',
  skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Next.js', 'REST APIs'],
  achievements: ['Published open-source React component library'],
  resumeName: 'Alex_Staff_Frontend_Resume.pdf',
}

const MOCK_CANDIDATE_NO_SKILLS: CandidateProfileContext = {
  fullName: 'New Candidate',
  skills: [],
}

test('scoreToVerdict correctly categorizes scores into verbal verdicts', () => {
  assert.equal(scoreToVerdict(95), 'excellent_match')
  assert.equal(scoreToVerdict(90), 'excellent_match')
  assert.equal(scoreToVerdict(89), 'strong_match')
  assert.equal(scoreToVerdict(75), 'strong_match')
  assert.equal(scoreToVerdict(74), 'moderate_match')
  assert.equal(scoreToVerdict(60), 'moderate_match')
  assert.equal(scoreToVerdict(59), 'partial_match')
  assert.equal(scoreToVerdict(40), 'partial_match')
  assert.equal(scoreToVerdict(39), 'weak_match')
  assert.equal(scoreToVerdict(0), 'weak_match')

  // Boundary clamping
  assert.equal(scoreToVerdict(-10), 'weak_match')
  assert.equal(scoreToVerdict(150), 'excellent_match')
})

test('verdictToLabel and verdictToColor return expected presentation metadata', () => {
  assert.equal(verdictToLabel('excellent_match'), 'Excellent Match')
  assert.equal(verdictToLabel('strong_match'), 'Strong Match')
  assert.equal(verdictToLabel('moderate_match'), 'Moderate Match')
  assert.equal(verdictToLabel('partial_match'), 'Partial Match')
  assert.equal(verdictToLabel('weak_match'), 'Weak Match')

  const colors = verdictToColor('strong_match')
  assert.ok(colors.badgeBg.includes('blue'))
  assert.ok(colors.barColor.includes('blue'))
})

test('normalizeJobMatchResponse safely handles valid and edge-case AI outputs', () => {
  const req: JobMatchRequest = { job: MOCK_JOB, candidate: MOCK_CANDIDATE_MATCH }

  // 1. Valid payload
  const valid = normalizeJobMatchResponse(
    {
      score: 85,
      matchedSkills: ['React', 'TypeScript', 'react'], // duplicate test
      missingSkills: ['Docker', 'AWS'],
      requiredSkills: ['React', 'TypeScript', 'Docker', 'AWS'],
      strengths: ['Great React background'],
      gaps: ['Needs Docker'],
      recommendation: 'Good match',
      confidence: 'high',
    },
    req,
  )

  assert.ok(valid)
  assert.equal(valid.score, 85)
  assert.equal(valid.verdict, 'strong_match')
  assert.deepEqual(valid.matchedSkills, ['React', 'TypeScript']) // deduplicated
  assert.equal(valid.confidence, 'high')
  assert.equal(valid.analyzedSources.hasJobDescription, true)
  assert.equal(valid.analyzedSources.resumeName, 'Alex_Staff_Frontend_Resume.pdf')

  // 2. Score clamping
  const overflow = normalizeJobMatchResponse({ score: 120 }, req)
  assert.ok(overflow)
  assert.equal(overflow.score, 100)

  // 3. Non-numeric score returns null
  const invalid = normalizeJobMatchResponse({ score: 'not-a-number' }, req)
  assert.equal(invalid, null)

  // 4. Non-object returns null
  assert.equal(normalizeJobMatchResponse(null, req), null)
  assert.equal(normalizeJobMatchResponse('string', req), null)
})

test('calculateLocalJobMatch accurately computes skill overlap and provides grounded gaps', () => {
  const req: JobMatchRequest = { job: MOCK_JOB, candidate: MOCK_CANDIDATE_MATCH }
  const analysis = calculateLocalJobMatch(req)

  assert.ok(analysis.score >= 70, `Expected score >= 70, got ${analysis.score}`)
  assert.ok(analysis.matchedSkills.includes('React'))
  assert.ok(analysis.matchedSkills.includes('TypeScript'))
  assert.ok(analysis.matchedSkills.includes('Next.js'))
  assert.ok(analysis.missingSkills.includes('Docker') || analysis.missingSkills.includes('AWS'))
  assert.equal(analysis.confidence, 'high')
  assert.ok(analysis.strengths.length > 0)
  assert.ok(analysis.gaps.length > 0)
  assert.ok(analysis.recommendation.includes('React') || analysis.recommendation.includes('fit'))
})

test('calculateLocalJobMatch provides honest fallback when candidate has no skills', () => {
  const req: JobMatchRequest = { job: MOCK_JOB, candidate: MOCK_CANDIDATE_NO_SKILLS }
  const analysis = calculateLocalJobMatch(req)

  assert.ok(analysis.score <= 30, `Expected score <= 30 for candidate with no skills, got ${analysis.score}`)
  assert.equal(analysis.verdict, 'weak_match')
  assert.equal(analysis.confidence, 'low')
  assert.equal(analysis.matchedSkills.length, 0)
  assert.ok(analysis.gaps[0].includes('No skills recorded'))
  assert.ok(analysis.recommendation.includes('Account Settings'))
})

test('buildMatchCacheKey differentiates distinct candidate skills and resumes', () => {
  const req1: JobMatchRequest = { job: MOCK_JOB, candidate: MOCK_CANDIDATE_MATCH }
  const req2: JobMatchRequest = {
    job: MOCK_JOB,
    candidate: { ...MOCK_CANDIDATE_MATCH, resumeId: 'res-custom-002' },
  }
  const req3: JobMatchRequest = {
    job: MOCK_JOB,
    candidate: { ...MOCK_CANDIDATE_MATCH, skills: ['Python', 'Django'] },
  }

  const key1 = buildMatchCacheKey(req1)
  const key2 = buildMatchCacheKey(req2)
  const key3 = buildMatchCacheKey(req3)

  assert.notEqual(key1, key2)
  assert.notEqual(key1, key3)
  assert.notEqual(key2, key3)

  // Skill order does not change cache key
  const reqPermuted: JobMatchRequest = {
    job: MOCK_JOB,
    candidate: {
      ...MOCK_CANDIDATE_MATCH,
      skills: [...MOCK_CANDIDATE_MATCH.skills].reverse(),
    },
  }
  assert.equal(buildMatchCacheKey(req1), buildMatchCacheKey(reqPermuted))
})

test('analyzeJobMatch caches results in-memory and reuses them on subsequent calls', async () => {
  clearJobMatchCache()
  const req: JobMatchRequest = { job: MOCK_JOB, candidate: MOCK_CANDIDATE_MATCH }

  const res1 = await analyzeJobMatch(req)
  assert.equal(res1.success, true)
  assert.equal(res1.fromCache, false)
  assert.ok(res1.analysis)

  const res2 = await analyzeJobMatch(req)
  assert.equal(res2.success, true)
  assert.equal(res2.fromCache, true)
  assert.equal(res2.analysis?.score, res1.analysis?.score)

  // Bypassing cache forces re-evaluation
  const res3 = await analyzeJobMatch(req, { bypassCache: true })
  assert.equal(res3.success, true)
  assert.equal(res3.fromCache, false)
})
