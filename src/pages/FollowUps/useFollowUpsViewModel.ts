import { useCallback, useEffect, useMemo, useState } from 'react'
import type { JobApplication } from '../../types/application'
import type { FollowUp, FollowUpDraft, FollowUpTabFilter, FollowUpWithApplication } from '../../types/followUp'
import { getApplications } from '../../services/applicationRepository'
import {
  addFollowUp,
  completeFollowUp,
  deleteFollowUp,
  getFollowUps,
  rescheduleFollowUp,
  subscribeFollowUps,
} from '../../services/followUpStore'
import {
  filterFollowUps,
  isCompleted,
  isOverdue,
  isUpcoming,
  sortFollowUps,
} from './FollowUpModel'

export interface FollowUpsViewModel {
  followUps: FollowUpWithApplication[]
  allFollowUps: FollowUpWithApplication[]
  applications: JobApplication[]
  loading: boolean
  error: string | null
  tabFilter: FollowUpTabFilter
  setTabFilter: (tab: FollowUpTabFilter) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  totalCount: number
  upcomingCount: number
  overdueCount: number
  completedCount: number
  isModalOpen: boolean
  editingFollowUp: FollowUp | null
  targetApplicationId?: string
  openCreateModal: (applicationId?: string) => void
  openEditModal: (followUp: FollowUp) => void
  closeModal: () => void
  createFollowUp: (draft: FollowUpDraft) => { success: boolean; error?: string }
  saveRescheduled: (id: string, date: string, time?: string, note?: string) => { success: boolean; error?: string }
  markCompleted: (id: string) => void
  removeFollowUp: (id: string) => void
  refresh: () => Promise<void>
}

export function useFollowUpsViewModel(initialApplicationId?: string): FollowUpsViewModel {
  const [rawFollowUps, setRawFollowUps] = useState<FollowUp[]>(() => getFollowUps())
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [tabFilter, setTabFilter] = useState<FollowUpTabFilter>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(Boolean(initialApplicationId))
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)
  const [targetApplicationId, setTargetApplicationId] = useState<string | undefined>(initialApplicationId)

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const apps = await getApplications()
      setApplications(apps)
      setError(null)
    } catch {
      // Degrade gracefully if offline or not logged in
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  useEffect(() => {
    const unsubscribe = subscribeFollowUps(() => {
      setRawFollowUps(getFollowUps())
    })
    return unsubscribe
  }, [])

  // Map applicationId -> JobApplication
  const applicationMap = useMemo(() => {
    const map = new Map<string, JobApplication>()
    for (const app of applications) {
      map.set(app.id, app)
    }
    return map
  }, [applications])

  // Enriched follow-ups with application data
  const enrichedFollowUps = useMemo<FollowUpWithApplication[]>(() => {
    return rawFollowUps.map((fu) => ({
      ...fu,
      application: applicationMap.get(fu.applicationId),
    }))
  }, [rawFollowUps, applicationMap])

  // KPI Counts
  const now = useMemo(() => new Date(), [])
  const totalCount = enrichedFollowUps.length
  const upcomingCount = useMemo(
    () => enrichedFollowUps.filter((f) => isUpcoming(f, now)).length,
    [enrichedFollowUps, now],
  )
  const overdueCount = useMemo(
    () => enrichedFollowUps.filter((f) => isOverdue(f, now)).length,
    [enrichedFollowUps, now],
  )
  const completedCount = useMemo(
    () => enrichedFollowUps.filter(isCompleted).length,
    [enrichedFollowUps],
  )

  // Filtered & Sorted follow-ups
  const displayedFollowUps = useMemo(() => {
    const filtered = filterFollowUps(enrichedFollowUps, tabFilter, searchQuery, now)
    return sortFollowUps(filtered, now)
  }, [enrichedFollowUps, tabFilter, searchQuery, now])

  // Modal Handlers
  const openCreateModal = useCallback((appId?: string) => {
    setEditingFollowUp(null)
    setTargetApplicationId(appId)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback((followUp: FollowUp) => {
    setEditingFollowUp(followUp)
    setTargetApplicationId(followUp.applicationId)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingFollowUp(null)
    setTargetApplicationId(undefined)
  }, [])

  // Actions
  const handleCreateFollowUp = useCallback((draft: FollowUpDraft) => {
    const result = addFollowUp(draft)
    if (result.success) {
      setRawFollowUps(getFollowUps())
      closeModal()
    }
    return result
  }, [closeModal])

  const handleSaveRescheduled = useCallback(
    (id: string, date: string, time?: string, note?: string) => {
      const result = rescheduleFollowUp(id, date, time, note)
      if (result.success) {
        setRawFollowUps(getFollowUps())
        closeModal()
      }
      return result
    },
    [closeModal],
  )

  const handleMarkCompleted = useCallback((id: string) => {
    completeFollowUp(id)
    setRawFollowUps(getFollowUps())
  }, [])

  const handleRemoveFollowUp = useCallback((id: string) => {
    deleteFollowUp(id)
    setRawFollowUps(getFollowUps())
  }, [])

  const refresh = useCallback(async () => {
    setRawFollowUps(getFollowUps())
    await fetchApplications()
  }, [fetchApplications])

  return {
    followUps: displayedFollowUps,
    allFollowUps: enrichedFollowUps,
    applications,
    loading,
    error,
    tabFilter,
    setTabFilter,
    searchQuery,
    setSearchQuery,
    totalCount,
    upcomingCount,
    overdueCount,
    completedCount,
    isModalOpen,
    editingFollowUp,
    targetApplicationId,
    openCreateModal,
    openEditModal,
    closeModal,
    createFollowUp: handleCreateFollowUp,
    saveRescheduled: handleSaveRescheduled,
    markCompleted: handleMarkCompleted,
    removeFollowUp: handleRemoveFollowUp,
    refresh,
  }
}
