import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import type { JobListing } from '../../types/jobFeed'
import type { JobAlert, JobAlertCriteria, JobAlertDraft } from '../../types/jobAlert'
import {
  deleteAlert,
  getAlerts,
  saveAlert,
  subscribeJobAlerts,
  toggleAlertStatus,
  updateAlert,
} from '../../services/jobAlertsStore'
import { fetchJobListings } from '../../services/jobFeedService'
import { getDistinctCategories } from '../JobFeed/JobFeedModel'
import { matchesAlertCriteria } from '../../services/jobAlertsModel'

export interface JobAlertsViewModel {
  alerts: JobAlert[]
  loading: boolean
  categories: string[]
  activeCount: number
  pausedCount: number
  // Modal states
  isModalOpen: boolean
  editingAlert: JobAlert | null
  deletingAlert: JobAlert | null
  openCreateModal: () => void
  openEditModal: (alert: JobAlert) => void
  closeModal: () => void
  openDeleteModal: (alert: JobAlert) => void
  closeDeleteModal: () => void
  // CRUD actions
  handleSaveAlert: (draft: JobAlertDraft) => { success: boolean; error?: string }
  handleToggleStatus: (id: string) => void
  handleConfirmDelete: () => void
  // Previews
  getMatchCount: (criteria: JobAlertCriteria) => number
}

export function useJobAlertsViewModel(): JobAlertsViewModel {
  const { user } = useAuth()
  const userId = user?.id

  const [alerts, setAlerts] = useState<JobAlert[]>(() => getAlerts(userId))
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null)
  const [deletingAlert, setDeletingAlert] = useState<JobAlert | null>(null)

  const loadAlerts = useCallback(() => {
    setAlerts(getAlerts(userId))
  }, [userId])

  useEffect(() => {
    loadAlerts()
    return subscribeJobAlerts(loadAlerts)
  }, [loadAlerts])

  useEffect(() => {
    let mounted = true
    async function loadFeed() {
      try {
        const feedJobs = await fetchJobListings()
        if (mounted) {
          setJobs(feedJobs)
        }
      } catch {
        // Fallback to empty if feed fails
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    loadFeed()
    return () => {
      mounted = false
    }
  }, [])

  const categories = useMemo(() => getDistinctCategories(jobs), [jobs])

  const activeCount = useMemo(
    () => alerts.filter((a) => a.status === 'active').length,
    [alerts],
  )
  const pausedCount = useMemo(
    () => alerts.filter((a) => a.status === 'paused').length,
    [alerts],
  )

  const openCreateModal = useCallback(() => {
    setEditingAlert(null)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback((alert: JobAlert) => {
    setEditingAlert(alert)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingAlert(null)
  }, [])

  const openDeleteModal = useCallback((alert: JobAlert) => {
    setDeletingAlert(alert)
  }, [])

  const closeDeleteModal = useCallback(() => {
    setDeletingAlert(null)
  }, [])

  const handleSaveAlert = useCallback(
    (draft: JobAlertDraft) => {
      if (editingAlert) {
        const res = updateAlert(editingAlert.id, draft, userId)
        if (res.success) {
          closeModal()
          loadAlerts()
        }
        return res
      } else {
        const res = saveAlert(draft, userId)
        if (res.success) {
          closeModal()
          loadAlerts()
        }
        return res
      }
    },
    [editingAlert, userId, closeModal, loadAlerts],
  )

  const handleToggleStatus = useCallback(
    (id: string) => {
      toggleAlertStatus(id, userId)
      loadAlerts()
    },
    [userId, loadAlerts],
  )

  const handleConfirmDelete = useCallback(() => {
    if (!deletingAlert) return
    deleteAlert(deletingAlert.id, userId)
    closeDeleteModal()
    loadAlerts()
  }, [deletingAlert, userId, closeDeleteModal, loadAlerts])

  const getMatchCount = useCallback(
    (criteria: JobAlertCriteria) => {
      if (jobs.length === 0) return 0
      return jobs.filter((job) => matchesAlertCriteria(job, criteria)).length
    },
    [jobs],
  )

  return {
    alerts,
    loading,
    categories,
    activeCount,
    pausedCount,
    isModalOpen,
    editingAlert,
    deletingAlert,
    openCreateModal,
    openEditModal,
    closeModal,
    openDeleteModal,
    closeDeleteModal,
    handleSaveAlert,
    handleToggleStatus,
    handleConfirmDelete,
    getMatchCount,
  }
}
