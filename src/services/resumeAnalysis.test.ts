import test from 'node:test'
import assert from 'node:assert/strict'
import type { Resume } from '../types/resume.ts'
import {
  analyzeResume,
  buildResumeAnalysisCacheKey,
  calculateLocalResumeAnalysis,
  clearResumeAnalysisCache,
  extractTextFromDataUrl,
  normalizeResumeAnalysis,
  scoreToAtsVerdict,
  verdictToColor,
  verdictToLabel,
} from './resumeAnalysisService.ts'

// Mock base64 encoded text containing a realistic resume layout
const SAMPLE_RESUME_TEXT = `
Alex Morgan
Email: alex.morgan@example.com | Phone: (555) 123-4567 | San Francisco, CA
LinkedIn: linkedin.com/in/alexmorgan | GitHub: github.com/alexmorgan

PROFESSIONAL SUMMARY
Results-driven Senior Software Engineer with 6+ years of experience building scalable web applications.

TECHNICAL SKILLS
Languages & Frameworks: React, TypeScript, JavaScript, Node.js, Python, PostgreSQL, HTML5, CSS3, Tailwind
Tools & Cloud: Git, Docker, AWS, Vite, REST APIs, CI/CD, Agile

WORK EXPERIENCE
Senior Frontend Engineer | Acme Corp (2022 - Present)
• Architected scalable React and TypeScript design systems used by 50+ engineers.
• Reduced web application bundle size by 35% using code-splitting and Vite optimizations.
• Led cross-functional sprint planning in an Agile environment.

Software Engineer | StartupX (2019 - 2022)
• Developed responsive interfaces with React and Tailwind CSS.
• Built RESTful microservices with Node.js and PostgreSQL.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley (2015 - 2019)

PROJECTS
JobTrack Open Source
• Built interactive career management platform with TypeScript and React.
`

function textToDataUrl(text: string): string {
  const base64 = Buffer.from(text).toString('base64')
  return `data:application/pdf;base64,${base64}`
}

const MOCK_RESUME_VALID: Resume = {
  id: 'resume-alex-001',
  name: 'Alex Morgan - Staff Engineer',
  fileName: 'Alex_Morgan_Resume.pdf',
  fileType: 'pdf',
  fileSize: 1048576,
  fileData: textToDataUrl(SAMPLE_RESUME_TEXT),
  isPrimary: true,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
}

const MOCK_RESUME_SCANNED: Resume = {
  id: 'resume-scanned-002',
  name: 'Scanned Old Resume',
  fileName: 'Scanned_Doc.pdf',
  fileType: 'pdf',
  fileSize: 524288,
  fileData: 'data:application/pdf;base64,JVBERi0xLjQK...', // minimal/no ASCII text
  isPrimary: false,
  createdAt: '2026-09-02T10:00:00.000Z',
  updatedAt: '2026-09-02T10:00:00.000Z',
}

test('scoreToAtsVerdict correctly maps scores to verbal categories', () => {
  assert.equal(scoreToAtsVerdict(95), 'excellent')
  assert.equal(scoreToAtsVerdict(90), 'excellent')
  assert.equal(scoreToAtsVerdict(89), 'strong')
  assert.equal(scoreToAtsVerdict(75), 'strong')
  assert.equal(scoreToAtsVerdict(74), 'needs_improvement')
  assert.equal(scoreToAtsVerdict(60), 'needs_improvement')
  assert.equal(scoreToAtsVerdict(59), 'weak')
  assert.equal(scoreToAtsVerdict(10), 'weak')

  // Boundary clamping
  assert.equal(scoreToAtsVerdict(-15), 'weak')
  assert.equal(scoreToAtsVerdict(140), 'excellent')
})

test('verdictToLabel and verdictToColor return expected UI metadata', () => {
  assert.equal(verdictToLabel('excellent'), 'Excellent ATS Readiness')
  assert.equal(verdictToLabel('strong'), 'Strong ATS Readiness')
  assert.equal(verdictToLabel('needs_improvement'), 'Moderate / Needs Improvement')
  assert.equal(verdictToLabel('weak'), 'High ATS Risk')

  const colors = verdictToColor('excellent')
  assert.ok(colors.badgeBg.includes('emerald'))
  assert.ok(colors.barColor.includes('emerald'))
})

test('extractTextFromDataUrl extracts printable ASCII/UTF-8 text safely', () => {
  const extracted = extractTextFromDataUrl(MOCK_RESUME_VALID.fileData)
  assert.ok(extracted.includes('Alex Morgan'))
  assert.ok(extracted.includes('React'))
  assert.ok(extracted.includes('TypeScript'))
  assert.ok(extracted.includes('alex.morgan@example.com'))

  // Invalid or empty strings return empty string without throwing
  assert.equal(extractTextFromDataUrl(undefined), '')
  assert.equal(extractTextFromDataUrl(''), '')
  assert.equal(extractTextFromDataUrl('invalid-string'), '')
})

test('normalizeResumeAnalysis validates, deduplicates, and clamps AI output', () => {
  const valid = normalizeResumeAnalysis(
    {
      atsScore: 88,
      qualityScore: 85,
      detectedSections: ['Work Experience', 'Technical Skills', 'work experience'],
      missingSections: ['Certifications'],
      contactSignals: [
        { type: 'email', label: 'Email Address', detected: true },
        { type: 'linkedin', label: 'LinkedIn Profile', detected: true },
      ],
      strengths: ['Clear reverse-chronological layout'],
      weaknesses: ['Add more metrics'],
      keywordSignals: {
        technical: ['React', 'TypeScript', 'react'],
        professional: ['Leadership', 'Agile'],
      },
      recommendations: ['Quantify project impact'],
      summary: 'Solid resume.',
      confidence: 'high',
    },
    MOCK_RESUME_VALID,
  )

  assert.ok(valid)
  assert.equal(valid.atsScore, 88)
  assert.equal(valid.verdict, 'strong')
  assert.deepEqual(valid.detectedSections, ['Work Experience', 'Technical Skills'])
  assert.deepEqual(valid.keywordSignals.technical, ['React', 'TypeScript'])
  assert.equal(valid.resumeId, MOCK_RESUME_VALID.id)
  assert.equal(valid.resumeName, MOCK_RESUME_VALID.name)

  // Clamping test
  const clamped = normalizeResumeAnalysis({ atsScore: 150 }, MOCK_RESUME_VALID)
  assert.ok(clamped)
  assert.equal(clamped.atsScore, 100)

  // Invalid payload returns null
  assert.equal(normalizeResumeAnalysis(null, MOCK_RESUME_VALID), null)
  assert.equal(normalizeResumeAnalysis({ atsScore: 'invalid' }, MOCK_RESUME_VALID), null)
})

test('calculateLocalResumeAnalysis extracts sections, contacts, and keywords accurately', () => {
  const analysis = calculateLocalResumeAnalysis(MOCK_RESUME_VALID)

  assert.ok(analysis.atsScore >= 75, `Expected atsScore >= 75, got ${analysis.atsScore}`)
  assert.ok(analysis.detectedSections.includes('Work Experience'))
  assert.ok(analysis.detectedSections.includes('Technical Skills'))
  assert.ok(analysis.detectedSections.includes('Education'))
  assert.ok(analysis.detectedSections.includes('Projects'))

  // Verify contact signals
  const emailSignal = analysis.contactSignals.find((c) => c.type === 'email')
  assert.equal(emailSignal?.detected, true)
  const linkedInSignal = analysis.contactSignals.find((c) => c.type === 'linkedin')
  assert.equal(linkedInSignal?.detected, true)
  const githubSignal = analysis.contactSignals.find((c) => c.type === 'github')
  assert.equal(githubSignal?.detected, true)

  // Verify keywords
  assert.ok(analysis.keywordSignals.technical.includes('React'))
  assert.ok(analysis.keywordSignals.technical.includes('TypeScript'))
  assert.ok(analysis.keywordSignals.professional.includes('Agile'))

  assert.ok(analysis.strengths.length > 0)
  assert.ok(analysis.recommendations.length > 0)
  assert.equal(analysis.isLocalFallback, true)
})

test('calculateLocalResumeAnalysis correctly flags scanned or minimal text documents', () => {
  const analysis = calculateLocalResumeAnalysis(MOCK_RESUME_SCANNED)

  assert.ok(analysis.atsScore <= 40, `Expected low ATS score for scanned file, got ${analysis.atsScore}`)
  assert.equal(analysis.verdict, 'weak')
  assert.equal(analysis.confidence, 'low')
  assert.ok(analysis.weaknesses[0].includes('Scanned or image-based'))
  assert.ok(analysis.recommendations[0].includes('text-based PDF or DOCX'))
})

test('buildResumeAnalysisCacheKey distinguishes different resumes and versions', () => {
  const key1 = buildResumeAnalysisCacheKey(MOCK_RESUME_VALID)
  const key2 = buildResumeAnalysisCacheKey(MOCK_RESUME_SCANNED)
  const key1Updated = buildResumeAnalysisCacheKey({
    ...MOCK_RESUME_VALID,
    updatedAt: '2026-09-11T12:00:00.000Z',
  })

  assert.notEqual(key1, key2)
  assert.notEqual(key1, key1Updated)
})

test('analyzeResume caches results in-memory and re-uses on repeated invocations', async () => {
  clearResumeAnalysisCache()

  const res1 = await analyzeResume(MOCK_RESUME_VALID)
  assert.equal(res1.success, true)
  assert.equal(res1.fromCache, false)
  assert.ok(res1.analysis)

  const res2 = await analyzeResume(MOCK_RESUME_VALID)
  assert.equal(res2.success, true)
  assert.equal(res2.fromCache, true)
  assert.equal(res2.analysis?.atsScore, res1.analysis?.atsScore)

  // Bypass cache
  const res3 = await analyzeResume(MOCK_RESUME_VALID, { bypassCache: true })
  assert.equal(res3.success, true)
  assert.equal(res3.fromCache, false)
})
