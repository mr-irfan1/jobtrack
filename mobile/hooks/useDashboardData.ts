import { useCallback, useEffect, useMemo, useState } from 'react'
import { getApplications } from '../services/mobileApplicationRepository'
import type { JobApplication } from '../types/application'

export interface DashboardStats {
  total: number
  applied: number
  interview: number
  offer: number
  rejected: number
  wishlist: number
  responseRate: number
  offerRate: number
}

export function useDashboardData() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true)
    else setLoading(true)

    setError(null)

    try {
      const data = await getApplications()
      setApplications(data)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load dashboard data. Please pull down to refresh.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const stats: DashboardStats = useMemo(() => {
    const total = applications.length
    const applied = applications.filter((a) => a.status === 'Applied').length
    const interview = applications.filter((a) => a.status === 'Interview').length
    const offer = applications.filter((a) => a.status === 'Offer').length
    const rejected = applications.filter((a) => a.status === 'Rejected').length
    const wishlist = applications.filter((a) => a.status === 'Wishlist').length

    const nonWishlistTotal = total - wishlist
    const responseRate =
      nonWishlistTotal > 0
        ? Math.round(((interview + offer + rejected) / nonWishlistTotal) * 100)
        : 0
    const offerRate =
      nonWishlistTotal > 0 ? Math.round((offer / nonWishlistTotal) * 100) : 0

    return {
      total,
      applied,
      interview,
      offer,
      rejected,
      wishlist,
      responseRate,
      offerRate,
    }
  }, [applications])

  const recentApplications = useMemo(() => {
    return [...applications]
      .sort(
        (a, b) =>
          new Date(b.applicationDate).getTime() -
          new Date(a.applicationDate).getTime(),
      )
      .slice(0, 5)
  }, [applications])

  const upcomingInterviews = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return applications
      .filter((a) => Boolean(a.interviewDate) && a.interviewDate! >= today)
      .sort(
        (a, b) =>
          new Date(a.interviewDate!).getTime() -
          new Date(b.interviewDate!).getTime(),
      )
      .slice(0, 5)
  }, [applications])

  return {
    applications,
    stats,
    recentApplications,
    upcomingInterviews,
    loading,
    refreshing,
    error,
    refresh: () => loadDashboardData(true),
  }
}
