import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ApplicationDraft, JobApplication } from '../../types/application'
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
} from './ApplicationsModel'
import { ALL_STATUSES, filterApplications } from './applicationFilters'
import type { StatusFilter } from './applicationFilters'

const LOAD_ERROR = 'Unable to load your applications. Please try again.'
const SAVE_ERROR = 'Unable to save your application. Please try again.'
const UPDATE_ERROR = 'Unable to update your application. Please try again.'
const DELETE_ERROR = 'Unable to remove your application. Please try again.'

export interface ApplicationsViewModel {
  /** The full, unfiltered list — use for total counts and empty-state logic. */
  applications: JobApplication[]
  /** The list to render: applications narrowed by the current search + status. */
  filteredApplications: JobApplication[]
  loading: boolean
  error: string | null
  search: string
  setSearch: (value: string) => void
  statusFilter: StatusFilter
  setStatusFilter: (value: StatusFilter) => void
  clearFilters: () => void
  loadApplications: () => void
  addApplication: (draft: ApplicationDraft) => void
  editApplication: (application: JobApplication) => void
  removeApplication: (id: string) => void
}

/**
 * ViewModel for the Applications page. Owns UI state (applications, loading,
 * error, and the presentation-only search/status filter) and talks only to
 * ApplicationsModel — never to localStorage or the storage service directly.
 * Search/filter state lives here (not in storage) and narrowing is done with
 * the pure filterApplications helper. All errors are surfaced as user-readable
 * strings.
 */
export function useApplicationsViewModel(): ApplicationsViewModel {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_STATUSES)

  const loadApplications = useCallback(async () => {
    setLoading(true)
    try {
      setApplications(await getApplications())
      setError(null)
    } catch {
      setError(LOAD_ERROR)
    } finally {
      setLoading(false)
    }
  }, [])

  const addApplication = useCallback(async (draft: ApplicationDraft) => {
    try {
      const created = await createApplication(draft)
      setApplications((current) => [...current, created])
      setError(null)
    } catch {
      setError(SAVE_ERROR)
    }
  }, [])

  const editApplication = useCallback(async (application: JobApplication) => {
    try {
      // The repository returns the stored row (server-normalized times +
      // updated_at); reflect that authoritative copy in the list.
      const updated = await updateApplication(application)
      setApplications((current) =>
        current.map((existing) =>
          existing.id === updated.id ? updated : existing,
        ),
      )
      setError(null)
    } catch {
      setError(UPDATE_ERROR)
    }
  }, [])

  const removeApplication = useCallback(async (id: string) => {
    try {
      await deleteApplication(id)
      setApplications((current) =>
        current.filter((existing) => existing.id !== id),
      )
      setError(null)
    } catch {
      setError(DELETE_ERROR)
    }
  }, [])

  // Presentation-only derivation: narrow the loaded list by the current search
  // and status. Recomputed only when the list or the criteria change.
  const filteredApplications = useMemo(
    () => filterApplications(applications, { search, status: statusFilter }),
    [applications, search, statusFilter],
  )

  const clearFilters = useCallback(() => {
    setSearch('')
    setStatusFilter(ALL_STATUSES)
  }, [])

  // Load once on mount. Reading from localStorage is external-system
  // synchronization (exactly what effects are for), so loading state here is
  // intentional despite the generic set-state-in-effect lint heuristic.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadApplications()
  }, [loadApplications])

  return {
    applications,
    filteredApplications,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    clearFilters,
    loadApplications,
    addApplication,
    editApplication,
    removeApplication,
  }
}
