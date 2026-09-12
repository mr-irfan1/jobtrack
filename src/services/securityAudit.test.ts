import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isPrivateOrLocalhostUrl } from './jobExtractorService.ts'
import { detectFileType, validateResumeFile } from '../pages/ResumeCenter/ResumeModel.ts'
import { buildMatchCacheKey } from './jobMatchService.ts'
import { buildResumeAnalysisCacheKey } from './resumeAnalysisService.ts'
import { buildTailoringCacheKey } from './resumeTailoringService.ts'
import { buildInterviewPrepCacheKey } from './interviewPrepService.ts'
import type { Resume } from '../types/resume.ts'

test('SECURITY: validateResumeFile rejects files with dangerous or deceptive MIME types', () => {
  // A file claiming to be a PDF by filename extension but having HTML or JavaScript MIME
  const htmlFile = validateResumeFile({
    name: 'exploit.pdf',
    size: 5000,
    type: 'text/html',
  })
  assert.equal(htmlFile.valid, false)
  assert.match(htmlFile.error || '', /PDF, DOC, and DOCX/i)

  const jsFile = validateResumeFile({
    name: 'payload.pdf',
    size: 2000,
    type: 'application/javascript',
  })
  assert.equal(jsFile.valid, false)

  const exeFile = validateResumeFile({
    name: 'malware.pdf',
    size: 10000,
    type: 'application/x-msdownload',
  })
  assert.equal(exeFile.valid, false)
})

test('SECURITY: detectFileType correctly validates matching MIME types and rejects mismatches', () => {
  assert.equal(detectFileType('resume.pdf', 'application/pdf'), 'pdf')
  assert.equal(detectFileType('resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), 'docx')
  assert.equal(detectFileType('resume.doc', 'application/msword'), 'doc')

  // Mismatched dangerous types are flagged as other
  assert.equal(detectFileType('resume.pdf', 'text/html'), 'other')
  assert.equal(detectFileType('resume.docx', 'application/x-sh'), 'other')
})

test('SECURITY: validateResumeFile rejects empty and oversized files', () => {
  const empty = validateResumeFile({ name: 'empty.pdf', size: 0, type: 'application/pdf' })
  assert.equal(empty.valid, false)
  assert.match(empty.error || '', /empty/i)

  const oversized = validateResumeFile({
    name: 'huge.pdf',
    size: 4 * 1024 * 1024, // 4MB > 3MB limit
    type: 'application/pdf',
  })
  assert.equal(oversized.valid, false)
  assert.match(oversized.error || '', /too large/i)
})

test('SECURITY: isPrivateOrLocalhostUrl blocks SSRF port-scanning, internal IPv6, and metadata services', () => {
  // Non-standard ports (port-scanning vectors)
  assert.equal(isPrivateOrLocalhostUrl('http://example.com:22/ssh'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://example.com:6379/redis'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://example.com:5432/postgres'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://example.com:8080/internal'), true)

  // Standard ports allowed for public domains
  assert.equal(isPrivateOrLocalhostUrl('http://example.com:80/job'), false)
  assert.equal(isPrivateOrLocalhostUrl('https://example.com:443/job'), false)
  assert.equal(isPrivateOrLocalhostUrl('https://example.com/job'), false)

  // Cloud metadata services
  assert.equal(isPrivateOrLocalhostUrl('http://169.254.169.254/latest/meta-data/'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://metadata.google.internal/computeMetadata/v1/'), true)

  // IPv6 loopback and private ranges
  assert.equal(isPrivateOrLocalhostUrl('http://[::1]/secret'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://[::]/secret'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://[fe80::1]/link-local'), true)
  assert.equal(isPrivateOrLocalhostUrl('http://[fc00::1]/unique-local'), true)
})

test('SECURITY: Cache keys strictly isolate distinct jobs, resumes, versions, and candidate skills', () => {
  const resumeA: Resume = {
    id: 'res-A',
    name: 'Resume A',
    fileName: 'resumeA.pdf',
    fileType: 'pdf',
    fileSize: 1000,
    isPrimary: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  }

  const resumeAUpdated: Resume = {
    ...resumeA,
    updatedAt: '2026-09-02T12:00:00Z',
  }

  const resumeB: Resume = {
    ...resumeA,
    id: 'res-B',
    name: 'Resume B',
    fileName: 'resumeB.pdf',
  }

  // Resume analysis cache keys must distinguish ID and updatedAt versions
  const keyA = buildResumeAnalysisCacheKey(resumeA)
  const keyAUpdated = buildResumeAnalysisCacheKey(resumeAUpdated)
  const keyB = buildResumeAnalysisCacheKey(resumeB)

  assert.notEqual(keyA, keyAUpdated)
  assert.notEqual(keyA, keyB)

  // Job Match cache key isolates different jobs and candidate skills
  const matchKey1 = buildMatchCacheKey({
    job: { id: 'job-1', title: 'Frontend', company: 'Acme' },
    candidate: { skills: ['React', 'TypeScript'], resumeId: 'res-A' },
  })

  const matchKey2 = buildMatchCacheKey({
    job: { id: 'job-2', title: 'Backend', company: 'Acme' },
    candidate: { skills: ['React', 'TypeScript'], resumeId: 'res-A' },
  })

  const matchKeySkillsChanged = buildMatchCacheKey({
    job: { id: 'job-1', title: 'Frontend', company: 'Acme' },
    candidate: { skills: ['React', 'Node.js'], resumeId: 'res-A' },
  })

  assert.notEqual(matchKey1, matchKey2)
  assert.notEqual(matchKey1, matchKeySkillsChanged)

  // Tailoring cache key isolates resume versions
  const tailKey1 = buildTailoringCacheKey({
    job: { id: 'job-1', title: 'Frontend', company: 'Acme' },
    resume: resumeA,
    candidate: { skills: ['React'] },
  })

  const tailKeyUpdated = buildTailoringCacheKey({
    job: { id: 'job-1', title: 'Frontend', company: 'Acme' },
    resume: resumeAUpdated,
    candidate: { skills: ['React'] },
  })

  assert.notEqual(tailKey1, tailKeyUpdated)

  // Interview prep cache key isolates jobs and formats
  const prepKey1 = buildInterviewPrepCacheKey({
    applicationId: 'app-1',
    jobTitle: 'Frontend Engineer',
    company: 'Acme',
    interviewType: 'Technical Screening',
    candidate: { skills: ['React'] },
  })

  const prepKey2 = buildInterviewPrepCacheKey({
    applicationId: 'app-1',
    jobTitle: 'Frontend Engineer',
    company: 'Acme',
    interviewType: 'System Design',
    candidate: { skills: ['React'] },
  })

  assert.notEqual(prepKey1, prepKey2)
})
