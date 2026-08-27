import { useCallback, useEffect, useMemo, useState } from 'react'
import type { JobApplication } from '../../types/application'
import { getApplications } from './DashboardModel'
import { summarizeApplications } from './dashboardStats'
import type { StatusCounts } from './dashboardStats'

const LOAD_ERROR = 'Unable to load your dashboard. Please try again.'

export interface DashboardViewModel {
  /** All applications behind the summary — the source list for the dashboard. */
  applications: JobApplication[]
  loading: boolean
  error: string | null
  /** Total number of applications, across all statuses. */
  total: number
  /** Count for each APPLICATION_STATUSES value (0 when none match). */
  statusCounts: StatusCounts
  loadApplications: () => void
}

/**
 * ViewModel for the Dashboard page. Owns UI state (applications, loading, error)
 * and talks only to DashboardModel — never to localStorage or the storage
 * service directly. The summary (total + per-status counts) is derived from the
 * loaded list with the pure summarizeApplications helper. Read-only: it loads
 * and summarizes but never mutates applications. Load failures are surfaced as a
 * user-readable string.
 */
export function useDashboardViewModel(): DashboardViewModel {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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

  // Presentation-only derivation: recomputed only when the list changes.
  const { total, statusCounts } = useMemo(
    () => summarizeApplications(applications),
    [applications],
  )

  // Load once on mount. Reading from localStorage is external-system
  // synchronization (exactly what effects are for), so the loading state here is
  // intentional despite the generic set-state-in-effect lint heuristic.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    loadApplications()
  }, [loadApplications])

  return {
    applications,
    loading,
    error,
    total,
    statusCounts,
    loadApplications,
  }
}
