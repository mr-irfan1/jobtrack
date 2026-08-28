/**
 * Validates whether a given string is a valid HTTP or HTTPS URL for job postings.
 */
export function isValidJobUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false
  }
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Returns a validation error message for a job posting URL, or null if valid.
 */
export function validateJobUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) {
    return 'Job posting URL is required.'
  }
  if (!isValidJobUrl(trimmed)) {
    return 'Please enter a valid HTTP or HTTPS URL (e.g. https://example.com/jobs/software-engineer).'
  }
  return null
}
