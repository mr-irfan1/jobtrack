import type { JobApplication } from '../types/application'

const STORAGE_KEY = 'jobtrack_applications'

/**
 * Read and parse the full list from localStorage.
 * Returns an empty array when nothing is stored or the data is malformed.
 * This is the single point where stored JSON is read.
 */
function readAll(): JobApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as JobApplication[]) : []
  } catch {
    return []
  }
}

/** Persist the full list to localStorage. Single point where data is written. */
function writeAll(applications: JobApplication[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications))
}

export function getApplications(): JobApplication[] {
  return readAll()
}

export function addApplication(application: JobApplication): void {
  const applications = readAll()
  applications.push(application)
  writeAll(applications)
}

export function updateApplication(application: JobApplication): void {
  const applications = readAll()
  const next = applications.map((existing) =>
    existing.id === application.id ? application : existing,
  )
  writeAll(next)
}

export function deleteApplication(id: string): void {
  const applications = readAll()
  const next = applications.filter((existing) => existing.id !== id)
  writeAll(next)
}
