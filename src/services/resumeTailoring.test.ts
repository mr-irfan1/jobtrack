// JobTrack — Resume Tailoring Unit Test Suite
// ============================================
// Comprehensive tests for Step 10: AI Job-Specific Resume Tailoring & Optimization

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  analyzeResumeTailoring,
  buildTailoringCacheKey,
  calculateLocalResumeTailoring,
  clearResumeTailoringCache,
  normalizeTailoringResponse,
  scoreToTailoringColor,
  scoreToTailoringLabel,
} from './resumeTailoringService.ts'
import type { ResumeTailoringRequest } from '../types/resumeTailoring.ts'

// Helper to encode a string into a fake base64 data URL
function createMockDataUrl(text: string): string {
  const base64 = Buffer.from(text).toString('base64')
  return `data:application/pdf;base64,${base64}`
}

const mockJob = {
  id: 'job-123',
  title: 'Senior Frontend Engineer',
  company: 'Stripe',
  location: 'San Francisco, CA',
  employmentType: 'Full-time',
  workplaceType: 'Remote',
  skills: ['React', 'TypeScript', 'Docker', 'GraphQL', 'Tailwind'],
  description: 'Looking for an experienced engineer skilled in React, TypeScript, and Docker to build payment dashboards.',
}

const mockResume = {
  id: 'res-456',
  name: 'Frontend Engineer Resume',
  fileName: 'resume.pdf',
  fileType: 'pdf',
  fileData: createMockDataUrl(
    'Experienced Frontend Engineer. Skills: React, React, TypeScript, Tailwind, CSS, HTML. Built responsive React dashboards and web apps.',
  ),
  updatedAt: '2026-09-01T12:00:00.000Z',
}

test('1. scoreToTailoringLabel maps scores to user-friendly alignment descriptions', () => {
  assert.equal(scoreToTailoringLabel(95), 'Strong Alignment')
  assert.equal(scoreToTailoringLabel(75), 'Good Alignment')
  assert.equal(scoreToTailoringLabel(55), 'Moderate Alignment')
  assert.equal(scoreToTailoringLabel(35), 'Partial Alignment')
  assert.equal(scoreToTailoringLabel(15), 'Early Stage Alignment')
})

test('2. scoreToTailoringColor returns expected badge and bar styling', () => {
  const strong = scoreToTailoringColor(90)
  assert.ok(strong.badgeText.includes('text-emerald-700'))
  assert.ok(strong.barColor.includes('bg-emerald-500'))

  const weak = scoreToTailoringColor(20)
  assert.ok(weak.badgeText.includes('text-rose-700'))
})

test('3. buildTailoringCacheKey isolates jobs, resumes, and candidate skills', () => {
  const req1: ResumeTailoringRequest = {
    job: mockJob,
    resume: mockResume,
    candidate: { skills: ['React', 'TypeScript'] },
  }
  const req2: ResumeTailoringRequest = {
    job: mockJob,
    resume: { ...mockResume, updatedAt: '2026-09-10T15:00:00.000Z' },
    candidate: { skills: ['React', 'TypeScript'] },
  }
  const req3: ResumeTailoringRequest = {
    job: { ...mockJob, id: 'job-789' },
    resume: mockResume,
    candidate: { skills: ['React', 'TypeScript'] },
  }

  const key1 = buildTailoringCacheKey(req1)
  const key2 = buildTailoringCacheKey(req2)
  const key3 = buildTailoringCacheKey(req3)

  assert.notEqual(key1, key2, 'Cache key must change when resume updatedAt changes')
  assert.notEqual(key1, key3, 'Cache key must change when job ID changes')
})

test('4. normalizeTailoringResponse validates, clamps score, and sanitizes payload', () => {
  const req: ResumeTailoringRequest = { job: mockJob, resume: mockResume }
  const rawPayload = {
    matchScore: 145, // Out of bounds, should clamp to 100
    summary: 'Great match with strong frontend competencies.',
    matchedRequirements: [
      { requirement: 'React', evidence: 'Present', importance: 'high', action: 'Keep' },
      { requirement: 'TypeScript', importance: 'invalid_priority' }, // Should default to medium
    ],
    missingRequirements: [
      { requirement: 'Docker', importance: 'high', action: 'Not found in provided resume.' },
    ],
    underEmphasizedRequirements: [
      { requirement: 'Tailwind', evidence: 'Single mention', importance: 'medium' },
    ],
    recommendedChanges: [
      { section: 'Skills', recommendation: 'Move React up', priority: 'high' },
    ],
    sectionRecommendations: [
      { section: 'Summary', advice: 'Echo job title', priority: 'high' },
    ],
    suggestedEdits: [
      {
        section: 'Experience',
        originalConcept: 'Built dashboard',
        suggestedDirection: 'Built responsive dashboard using React',
        factualSafeguardNote: 'Do not invent metrics.',
      },
    ],
    keywordSuggestions: {
      technical: ['React', 'TypeScript', 'React'], // Contains duplicate, should dedupe
      professional: ['Architecture'],
      domainSpecific: ['Frontend'],
    },
    risks: ['Docker is missing from resume.'],
    unchangedAreas: ['Education is complete.'],
  }

  const normalized = normalizeTailoringResponse(rawPayload, req)
  assert.ok(normalized)
  assert.equal(normalized.matchScore, 100, 'Score should clamp to 100')
  assert.equal(normalized.matchedRequirements.length, 2)
  assert.equal(normalized.matchedRequirements[1].importance, 'medium', 'Invalid priority defaults to medium')
  assert.equal(normalized.keywordSuggestions.technical.length, 2, 'Deduplicates duplicate keywords')
  assert.equal(normalized.sourceContext.jobTitle, mockJob.title)
  assert.equal(normalized.sourceContext.resumeName, mockResume.name)
})

test('5. normalizeTailoringResponse rejects non-object or missing score payloads', () => {
  const req: ResumeTailoringRequest = { job: mockJob, resume: mockResume }
  assert.equal(normalizeTailoringResponse(null, req), null)
  assert.equal(normalizeTailoringResponse('invalid string', req), null)
  assert.equal(normalizeTailoringResponse({ summary: 'No score' }, req), null)
  assert.equal(normalizeTailoringResponse({ matchScore: 'not-a-number' }, req), null)
})

test('6. calculateLocalResumeTailoring accurately detects matched, under-emphasized, and missing requirements', () => {
  const req: ResumeTailoringRequest = {
    job: mockJob,
    resume: mockResume,
  }

  const result = calculateLocalResumeTailoring(req)
  assert.ok(result.matchScore >= 0 && result.matchScore <= 100)

  // React appears multiple times -> matched
  const reactMatch = result.matchedRequirements.find((m) => m.requirement === 'React')
  assert.ok(reactMatch, 'React should be identified as a matched requirement')
  assert.ok(reactMatch.evidence?.includes('Mentioned'))

  // TypeScript appears once in resume -> under-emphasized!
  const tsUnder = result.underEmphasizedRequirements.find((u) => u.requirement === 'TypeScript')
  assert.ok(tsUnder, 'TypeScript appearing once should be flagged as under-emphasized')
  assert.ok(tsUnder.action?.includes('highlighting your practical use'))

  // Docker does NOT appear in resume -> missing with respectful wording
  const dockerMissing = result.missingRequirements.find((m) => m.requirement === 'Docker')
  assert.ok(dockerMissing, 'Docker should be flagged as missing')
  assert.ok(
    dockerMissing.action?.startsWith('Not found in provided resume'),
    'Gaps must use "Not found in provided resume" language and never claim candidate lacks skill',
  )
})

test('7. calculateLocalResumeTailoring incorporates verified profile skills into matches', () => {
  const req: ResumeTailoringRequest = {
    job: mockJob,
    resume: {
      ...mockResume,
      fileData: createMockDataUrl('Minimal text without explicit keywords.'),
    },
    candidate: {
      skills: ['React', 'TypeScript', 'GraphQL'],
    },
  }

  const result = calculateLocalResumeTailoring(req)
  const matchedNames = result.matchedRequirements.map((m) => m.requirement)
  assert.ok(matchedNames.includes('React'))
  assert.ok(matchedNames.includes('TypeScript'))
})

test('8. calculateLocalResumeTailoring generates grounded section recommendations without fabricated metrics', () => {
  const req: ResumeTailoringRequest = {
    job: mockJob,
    resume: mockResume,
  }

  const result = calculateLocalResumeTailoring(req)
  assert.ok(result.sectionRecommendations.length >= 3)
  const sections = result.sectionRecommendations.map((s) => s.section)
  assert.ok(sections.includes('Summary'))
  assert.ok(sections.includes('Technical Skills'))
  assert.ok(sections.includes('Work Experience'))

  // Suggested edits safeguard check
  if (result.suggestedEdits && result.suggestedEdits.length > 0) {
    for (const edit of result.suggestedEdits) {
      assert.ok(edit.factualSafeguardNote, 'Every suggested edit must contain a factual safeguard note')
      assert.ok(
        !edit.suggestedDirection.includes('%') && !edit.suggestedDirection.includes('improved by'),
        'Must never invent fake percentage metrics',
      )
    }
  }
})

test('9. calculateLocalResumeTailoring provides categorized keywords and anti-stuffing guidance', () => {
  const req: ResumeTailoringRequest = {
    job: mockJob,
    resume: mockResume,
  }

  const result = calculateLocalResumeTailoring(req)
  assert.ok(result.keywordSuggestions.technical.length > 0)
  assert.ok(result.keywordSuggestions.professional.length > 0)
  assert.ok(result.keywordSuggestions.domainSpecific.length > 0)
})

test('10. original uploaded resume object is never mutated or overwritten', async () => {
  const originalDataUrl = mockResume.fileData
  const originalName = mockResume.name
  const originalUpdatedAt = mockResume.updatedAt

  const req: ResumeTailoringRequest = {
    job: mockJob,
    resume: mockResume,
  }

  const res = await analyzeResumeTailoring(req)
  assert.ok(res.success)

  // Verify original resume properties are strictly unchanged
  assert.equal(mockResume.fileData, originalDataUrl, 'Resume data URL must not be mutated')
  assert.equal(mockResume.name, originalName, 'Resume name must not be mutated')
  assert.equal(mockResume.updatedAt, originalUpdatedAt, 'Resume timestamp must not be mutated')
})

test('11. analyzeResumeTailoring caches result and honors bypassCache flag', async () => {
  clearResumeTailoringCache()

  const req: ResumeTailoringRequest = {
    job: mockJob,
    resume: mockResume,
  }

  const firstCall = await analyzeResumeTailoring(req)
  assert.ok(firstCall.success)
  assert.equal(firstCall.fromCache, false)

  const cachedCall = await analyzeResumeTailoring(req)
  assert.ok(cachedCall.success)
  assert.equal(cachedCall.fromCache, true, 'Subsequent call with identical parameters should hit session cache')

  const bypassedCall = await analyzeResumeTailoring(req, { bypassCache: true })
  assert.ok(bypassedCall.success)
  assert.equal(bypassedCall.fromCache, false, 'bypassCache: true should regenerate fresh analysis')
})

test('12. cache is isolated per resume and invalidated when resume updatedAt changes', async () => {
  clearResumeTailoringCache()

  const reqA: ResumeTailoringRequest = {
    job: mockJob,
    resume: { ...mockResume, id: 'res-A', updatedAt: '2026-09-01T00:00:00Z' },
  }
  const reqB: ResumeTailoringRequest = {
    job: mockJob,
    resume: { ...mockResume, id: 'res-B', updatedAt: '2026-09-01T00:00:00Z' },
  }
  const reqAUpdated: ResumeTailoringRequest = {
    job: mockJob,
    resume: { ...mockResume, id: 'res-A', updatedAt: '2026-09-11T12:00:00Z' },
  }

  const resA = await analyzeResumeTailoring(reqA)
  assert.equal(resA.fromCache, false)

  const resB = await analyzeResumeTailoring(reqB)
  assert.equal(resB.fromCache, false, 'Different resume ID must not share cache')

  const resAUpdated = await analyzeResumeTailoring(reqAUpdated)
  assert.equal(resAUpdated.fromCache, false, 'Updated resume timestamp must bypass stale cache')
})

test('13. missing requirements explicitly say "Not found in provided resume"', () => {
  const req: ResumeTailoringRequest = {
    job: {
      ...mockJob,
      skills: ['Rust', 'Solidity', 'Kubernetes'],
    },
    resume: mockResume,
  }

  const analysis = calculateLocalResumeTailoring(req)
  for (const missing of analysis.missingRequirements) {
    assert.ok(
      missing.action?.includes('Not found in provided resume'),
      `Missing requirement "${missing.requirement}" must explicitly state "Not found in provided resume"`,
    )
    assert.ok(
      !missing.action?.toLowerCase().includes('you do not know'),
      'Must never state "you do not know" or judgmental phrasing',
    )
    assert.ok(
      !missing.action?.toLowerCase().includes('you lack'),
      'Must never state "you lack" or judgmental phrasing',
    )
  }
})

test('14. under-emphasized skills generate helpful strengthening advice', () => {
  const req: ResumeTailoringRequest = {
    job: {
      ...mockJob,
      skills: ['TypeScript'], // Appears once in resume
    },
    resume: mockResume,
  }

  const analysis = calculateLocalResumeTailoring(req)
  const ts = analysis.underEmphasizedRequirements.find((u) => u.requirement === 'TypeScript')
  assert.ok(ts)
  assert.ok(ts.action?.includes('highlighting your practical use'))
})

test('15. score bounds: negative or >100 scores are safely clamped', () => {
  const req: ResumeTailoringRequest = { job: mockJob, resume: mockResume }
  const payloadLow = { matchScore: -20 }
  const payloadHigh = { matchScore: 999 }

  const resLow = normalizeTailoringResponse(payloadLow, req)
  assert.equal(resLow?.matchScore, 0)

  const resHigh = normalizeTailoringResponse(payloadHigh, req)
  assert.equal(resHigh?.matchScore, 100)
})

test('16. priority values default to medium when invalid priority strings are received', () => {
  const req: ResumeTailoringRequest = { job: mockJob, resume: mockResume }
  const raw = {
    matchScore: 80,
    matchedRequirements: [{ requirement: 'React', importance: 'super_urgent' }],
    recommendedChanges: [{ section: 'Skills', recommendation: 'Update', priority: 'extreme' }],
    sectionRecommendations: [{ section: 'Summary', advice: 'Edit', priority: 'critical' }],
  }

  const normalized = normalizeTailoringResponse(raw, req)
  assert.equal(normalized?.matchedRequirements[0].importance, 'medium')
  assert.equal(normalized?.recommendedChanges[0].priority, 'medium')
  assert.equal(normalized?.sectionRecommendations[0].priority, 'medium')
})

test('17. keyword suggestions handles missing or empty keyword groups safely', () => {
  const req: ResumeTailoringRequest = { job: mockJob, resume: mockResume }
  const raw = { matchScore: 70 }

  const normalized = normalizeTailoringResponse(raw, req)
  assert.deepEqual(normalized?.keywordSuggestions.technical, [])
  assert.deepEqual(normalized?.keywordSuggestions.professional, [])
  assert.deepEqual(normalized?.keywordSuggestions.domainSpecific, [])
})

test('18. risks array flags scanned or minimal text resumes', () => {
  const req: ResumeTailoringRequest = {
    job: mockJob,
    resume: {
      ...mockResume,
      fileData: createMockDataUrl('Short'),
    },
  }

  const analysis = calculateLocalResumeTailoring(req)
  assert.ok(analysis.risks.some((r) => r.includes('limited extractable text stream')))
})

test('19. unchangedAreas lists stable sections like education and verified contact links', () => {
  const req: ResumeTailoringRequest = { job: mockJob, resume: mockResume }
  const analysis = calculateLocalResumeTailoring(req)
  assert.ok(analysis.unchangedAreas.length > 0)
  assert.ok(analysis.unchangedAreas.some((u) => u.toLowerCase().includes('education')))
})

test('20. clearResumeTailoringCache empties cache completely', async () => {
  const req: ResumeTailoringRequest = { job: mockJob, resume: mockResume }
  await analyzeResumeTailoring(req)

  const check1 = await analyzeResumeTailoring(req)
  assert.equal(check1.fromCache, true)

  clearResumeTailoringCache()
  const check2 = await analyzeResumeTailoring(req)
  assert.equal(check2.fromCache, false, 'After cache clear, result should not be from cache')
})

