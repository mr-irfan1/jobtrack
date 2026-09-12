import type { Resume, ResumeFileType } from '../../types/resume'

export const MAX_RESUME_SIZE_BYTES = 3 * 1024 * 1024 // 3 MB

const DANGEROUS_MIMES = [
  'text/html',
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
  'application/x-msdownload',
  'application/x-executable',
  'application/x-sh',
]

/**
 * Detects the normalized file type from file name and MIME type with safety checks.
 */
export function detectFileType(fileName: string, mimeType?: string): ResumeFileType {
  const lowerName = fileName.trim().toLowerCase()
  const lowerMime = mimeType?.trim().toLowerCase() || ''

  // If an executable or web script MIME type is provided, reject immediately
  if (lowerMime && DANGEROUS_MIMES.some((m) => lowerMime.includes(m))) {
    return 'other'
  }

  if (lowerName.endsWith('.pdf')) {
    if (lowerMime && !lowerMime.includes('pdf') && lowerMime !== 'application/octet-stream') {
      return 'other'
    }
    return 'pdf'
  }
  if (lowerMime === 'application/pdf') {
    return 'pdf'
  }

  if (lowerName.endsWith('.docx')) {
    if (
      lowerMime &&
      !lowerMime.includes('document') &&
      !lowerMime.includes('zip') &&
      lowerMime !== 'application/octet-stream'
    ) {
      return 'other'
    }
    return 'docx'
  }
  if (lowerMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx'
  }

  if (lowerName.endsWith('.doc')) {
    if (lowerMime && !lowerMime.includes('msword') && !lowerMime.includes('doc') && lowerMime !== 'application/octet-stream') {
      return 'other'
    }
    return 'doc'
  }
  if (lowerMime === 'application/msword') {
    return 'doc'
  }

  return 'other'
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  fileType?: ResumeFileType
}

/**
 * Validates a file's format, size, and existence.
 */
export function validateResumeFile(file: {
  name: string
  size: number
  type?: string
}): FileValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: 'Please select a file to upload.' }
  }

  if (file.size <= 0) {
    return { valid: false, error: 'The selected file is empty.' }
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File size is too large. Maximum supported size is 3MB.',
    }
  }

  const detected = detectFileType(file.name, file.type)
  if (detected === 'other') {
    return {
      valid: false,
      error: 'PDF, DOC, and DOCX files are supported.',
    }
  }

  return { valid: true, fileType: detected }
}

/**
 * Formats byte size into human-readable representation (e.g. "450 KB", "1.5 MB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Derives a clean default title from a file name (e.g. "Software_Engineer_Resume.pdf" -> "Software Engineer Resume").
 */
export function cleanDefaultResumeTitle(fileName: string): string {
  if (!fileName) return 'My Resume'
  const withoutExt = fileName.replace(/\.[^/.]+$/, '')
  const spaced = withoutExt.replace(/[_-]+/g, ' ').trim()
  return spaced || 'My Resume'
}

/**
 * Filters resumes by search term against name and file name.
 */
export function filterResumes(resumes: Resume[], searchQuery: string): Resume[] {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return resumes

  return resumes.filter(
    (r) =>
      r.name.toLowerCase().includes(query) ||
      r.fileName.toLowerCase().includes(query),
  )
}

/**
 * Sorts resumes: Primary resume first, then remaining by updatedAt descending.
 */
export function sortResumes(resumes: Resume[]): Resume[] {
  return [...resumes].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}
