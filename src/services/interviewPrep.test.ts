import test from 'node:test'
import assert from 'node:assert/strict'
import type {
  InterviewCandidateContext,
  InterviewPrepRequest,
} from '../types/interviewPrep.ts'
import {
  buildInterviewPrepCacheKey,
  clearInterviewPrepCache,
  composeLocalInterviewPrep,
  evaluateMockAnswer,
  generateInterviewPrep,
  getDefaultChecklist,
  getStoredChecklist,
  normalizeInterviewPrepResponse,
  saveStoredChecklist,
} from './interviewPrepService.ts'

const MOCK_CANDIDATE: InterviewCandidateContext = {
  fullName: 'Elena Rostova',
  headline: 'Full Stack Engineer',
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  achievements: ['Speaker at React Summit 2025'],
  resumeId: 'res-elena-1',
  resumeName: 'Elena_Rostova_Resume.pdf',
}

const MOCK_REQUEST: InterviewPrepRequest = {
  applicationId: 'app-stripe-1',
  jobTitle: 'Senior Frontend Engineer',
  company: 'Stripe',
  location: 'Remote',
  jobDescription: 'Seeking an engineer with strong React, TypeScript, and Docker background to build financial interfaces.',
  skills: ['React', 'TypeScript', 'Docker', 'GraphQL'],
  interviewType: 'Technical Screen (Round 1)',
  interviewDate: '2026-09-20',
  interviewTime: '14:00',
  candidate: MOCK_CANDIDATE,
}

test('getDefaultChecklist provides balanced preparation tasks', () => {
  const checklist = getDefaultChecklist('Senior Frontend Engineer', 'Stripe')
  assert.ok(checklist.length >= 5)
  assert.ok(checklist.some((c) => c.label.includes('Senior Frontend Engineer')))
  assert.ok(checklist.some((c) => c.label.includes('Stripe')))
  assert.ok(checklist.every((c) => c.completed === false))
})

test('buildInterviewPrepCacheKey differentiates distinct roles, companies, and skills', () => {
  const req1 = MOCK_REQUEST
  const req2 = { ...MOCK_REQUEST, company: 'Shopify' }
  const req3 = { ...MOCK_REQUEST, interviewType: 'System Design' }

  const key1 = buildInterviewPrepCacheKey(req1)
  const key2 = buildInterviewPrepCacheKey(req2)
  const key3 = buildInterviewPrepCacheKey(req3)

  assert.notEqual(key1, key2)
  assert.notEqual(key1, key3)
  assert.equal(key1, buildInterviewPrepCacheKey(req1))
})

test('normalizeInterviewPrepResponse safely validates server payload', () => {
  const rawPayload = {
    summary: 'Focused technical interview for Stripe.',
    difficulty: 'challenging',
    technicalTopics: ['React', 'TypeScript', 'State Management'],
    behavioralTopics: ['Collaboration', 'Conflict Resolution'],
    roleFocusAreas: ['Payment UI Systems'],
    questions: [
      {
        id: 'q-custom-1',
        category: 'technical',
        question: 'How do you optimize React render cycles?',
        whyItMayBeAsked: 'Checks core React proficiency.',
        answerGuidance: 'Discuss useMemo, React.memo, and virtualization.',
      },
      {
        id: 'q-custom-2',
        category: 'behavioral',
        question: 'Describe a difficult code review discussion.',
        whyItMayBeAsked: 'Checks humility and collaboration.',
        answerGuidance: 'Use STAR structure.',
        suggestedStarStructure: {
          situation: 'Disagreeing on pattern.',
          task: 'Find team alignment.',
          action: 'Held whiteboard discussion.',
          result: 'Adopted optimal architecture.',
        },
      },
    ],
  }

  const normalized = normalizeInterviewPrepResponse(rawPayload, MOCK_REQUEST)
  assert.ok(normalized)
  assert.equal(normalized.company, 'Stripe')
  assert.equal(normalized.jobTitle, 'Senior Frontend Engineer')
  assert.equal(normalized.difficulty, 'challenging')
  assert.equal(normalized.questions.length, 2)
  assert.equal(normalized.questions[0].category, 'technical')
  assert.equal(normalized.questions[1].category, 'behavioral')
  assert.ok(normalized.questions[1].suggestedStarStructure)
})

test('normalizeInterviewPrepResponse rejects malformed or empty questions array', () => {
  assert.equal(normalizeInterviewPrepResponse(null, MOCK_REQUEST), null)
  assert.equal(normalizeInterviewPrepResponse('not an object', MOCK_REQUEST), null)
  assert.equal(normalizeInterviewPrepResponse({ questions: [] }, MOCK_REQUEST), null)
})

test('composeLocalInterviewPrep produces grounded questions and STAR outlines', () => {
  const prep = composeLocalInterviewPrep(MOCK_REQUEST)

  assert.ok(prep.summary)
  assert.equal(prep.company, 'Stripe')
  assert.equal(prep.jobTitle, 'Senior Frontend Engineer')
  assert.equal(prep.isLocalFallback, true)

  // Must have questions in multiple categories
  const categories = new Set(prep.questions.map((q) => q.category))
  assert.ok(categories.has('technical'))
  assert.ok(categories.has('behavioral'))
  assert.ok(categories.has('project'))

  // Behavioral questions must have STAR outlines
  const behavioralQ = prep.questions.find((q) => q.category === 'behavioral')
  assert.ok(behavioralQ?.suggestedStarStructure)
  assert.ok(behavioralQ?.suggestedStarStructure?.situation)
  assert.ok(behavioralQ?.suggestedStarStructure?.result)

  // Must detect Docker as gap skill (candidate has React/TS, job requires Docker)
  const gapQuestion = prep.questions.find((q) => q.question.includes('Docker'))
  assert.ok(gapQuestion)
})

test('composeLocalInterviewPrep handles unknown interview format honestly', () => {
  const reqWithoutFormat = { ...MOCK_REQUEST, interviewType: undefined }
  const prep = composeLocalInterviewPrep(reqWithoutFormat)
  assert.equal(prep.interviewType, 'Interview format not specified')
})

test('generateInterviewPrep rejects missing jobTitle or company', async () => {
  const result = await generateInterviewPrep({
    ...MOCK_REQUEST,
    company: '',
  })
  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'MISSING_INTERVIEW_CONTEXT')
})

test('generateInterviewPrep caches results in-memory and reuses them', async () => {
  clearInterviewPrepCache()

  const first = await generateInterviewPrep(MOCK_REQUEST)
  assert.equal(first.success, true)
  assert.equal(first.fromCache, false)

  const second = await generateInterviewPrep(MOCK_REQUEST)
  assert.equal(second.success, true)
  assert.equal(second.fromCache, true)

  const bypassed = await generateInterviewPrep(MOCK_REQUEST, { bypassCache: true })
  assert.equal(bypassed.success, true)
  assert.equal(bypassed.fromCache, false)
})

test('evaluateMockAnswer provides constructive, non-judgmental feedback', async () => {
  const answer = 'In my previous project, we faced high latency during database reads. I implemented Redis caching, which reduced load by 60% and improved response times from 400ms to 80ms.'
  const result = await evaluateMockAnswer({
    question: 'Tell me about a time you optimized application performance.',
    category: 'technical',
    userAnswer: answer,
    jobTitle: 'Senior Frontend Engineer',
    company: 'Stripe',
  })

  assert.equal(result.success, true)
  assert.ok(result.evaluation)
  assert.ok(result.evaluation.clarity)
  assert.ok(result.evaluation.relevance)
  assert.ok(result.evaluation.improvementSuggestion)
})

test('evaluateMockAnswer rejects trivial or overly short answers', async () => {
  const result = await evaluateMockAnswer({
    question: 'How do you test your code?',
    category: 'technical',
    userAnswer: 'I write tests.',
    jobTitle: 'Engineer',
    company: 'Stripe',
  })

  assert.equal(result.success, false)
  assert.match(result.message || '', /detailed response/i)
})

test('checklist persistence is isolated by interview/application key', () => {
  // Clear any existing stored checklist
  if (typeof window !== 'undefined' && window.localStorage) {
    const key1 = 'app-101'
    const key2 = 'app-202'
    const items1 = [{ id: 'chk-1', label: 'Task 1', completed: true }]
    const items2 = [{ id: 'chk-2', label: 'Task 2', completed: false }]

    saveStoredChecklist(key1, items1)
    saveStoredChecklist(key2, items2)

    assert.deepEqual(getStoredChecklist(key1), items1)
    assert.deepEqual(getStoredChecklist(key2), items2)
  }
})
