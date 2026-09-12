import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Resume } from '../../types/resume.ts'
import {
  cleanDefaultResumeTitle,
  detectFileType,
  filterResumes,
  formatFileSize,
  sortResumes,
  validateResumeFile,
} from './ResumeModel.ts'

function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: 'res-1',
    name: 'Frontend Resume',
    fileName: 'resume.pdf',
    fileType: 'pdf',
    fileSize: 1024 * 500, // 500 KB
    isPrimary: false,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    ...overrides,
  }
}

test('detectFileType accurately resolves PDF, DOC, and DOCX', () => {
  assert.equal(detectFileType('resume.pdf'), 'pdf')
  assert.equal(detectFileType('RESUME.PDF'), 'pdf')
  assert.equal(detectFileType('cv.docx'), 'docx')
  assert.equal(detectFileType('legacy.doc'), 'doc')
  assert.equal(detectFileType('archive.zip'), 'other')
  assert.equal(detectFileType('photo.png'), 'other')
})

test('validateResumeFile accepts valid PDF, DOC, and DOCX within size limit', () => {
  const validPdf = validateResumeFile({ name: 'my_resume.pdf', size: 1024 * 1024 })
  assert.equal(validPdf.valid, true)
  assert.equal(validPdf.fileType, 'pdf')

  const validDocx = validateResumeFile({ name: 'my_resume.docx', size: 500000 })
  assert.equal(validDocx.valid, true)
  assert.equal(validDocx.fileType, 'docx')

  const validDoc = validateResumeFile({ name: 'my_resume.doc', size: 500000 })
  assert.equal(validDoc.valid, true)
  assert.equal(validDoc.fileType, 'doc')
})

test('validateResumeFile rejects unsupported formats and oversized files', () => {
  const invalidType = validateResumeFile({ name: 'profile.png', size: 1000 })
  assert.equal(invalidType.valid, false)
  assert.match(invalidType.error || '', /PDF, DOC, and DOCX/i)

  const oversized = validateResumeFile({ name: 'giant_resume.pdf', size: 4 * 1024 * 1024 })
  assert.equal(oversized.valid, false)
  assert.match(oversized.error || '', /too large/i)

  const emptyFile = validateResumeFile({ name: 'empty.pdf', size: 0 })
  assert.equal(emptyFile.valid, false)
  assert.match(emptyFile.error || '', /empty/i)
})

test('formatFileSize produces clean human-readable text', () => {
  assert.equal(formatFileSize(500), '500 B')
  assert.equal(formatFileSize(1024 * 150), '150.0 KB')
  assert.equal(formatFileSize(1024 * 1024 * 2.5), '2.5 MB')
})

test('cleanDefaultResumeTitle converts filenames to readable titles', () => {
  assert.equal(cleanDefaultResumeTitle('john_doe_resume_2026.pdf'), 'john doe resume 2026')
  assert.equal(cleanDefaultResumeTitle('Software-Engineer-Resume.docx'), 'Software Engineer Resume')
  assert.equal(cleanDefaultResumeTitle(''), 'My Resume')
})

test('filterResumes matches name and filename case-insensitively', () => {
  const r1 = makeResume({ name: 'Fullstack Dev Resume', fileName: 'fs_cv.pdf' })
  const r2 = makeResume({ name: 'Data Science Resume', fileName: 'ds_profile.pdf' })

  assert.equal(filterResumes([r1, r2], '').length, 2)
  assert.equal(filterResumes([r1, r2], 'fullstack').length, 1)
  assert.equal(filterResumes([r1, r2], 'ds_profile').length, 1)
  assert.equal(filterResumes([r1, r2], 'nonexistent').length, 0)
})

test('sortResumes always places Primary resume first', () => {
  const r1 = makeResume({ id: '1', isPrimary: false, updatedAt: '2026-09-05T00:00:00Z' })
  const r2 = makeResume({ id: '2', isPrimary: true, updatedAt: '2026-09-01T00:00:00Z' })
  const r3 = makeResume({ id: '3', isPrimary: false, updatedAt: '2026-09-08T00:00:00Z' })

  const sorted = sortResumes([r1, r2, r3])
  assert.equal(sorted[0].id, '2') // Primary wins even if older
  assert.equal(sorted[1].id, '3') // Newest non-primary next
  assert.equal(sorted[2].id, '1')
})
