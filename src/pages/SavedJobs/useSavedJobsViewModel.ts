import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import type { ApplicationDraft, JobApplication } from '../../types/application'
import type { JobListing } from '../../types/jobFeed'
import { createApplication, getApplications } from '../Applications/ApplicationsModel'
import { findDuplicateApplication } from '../../components/JobUrlImport/jobUrlImportLogic'
import {
  getSavedJobItems,
  removeSavedJob,
  subscribeSavedJobs,
} from '../../services/savedJobsStore'
import { getPrimaryResume, setApplicationResume } from '../../services/resumeStore'
import type { SavedJobItem } from '../../services/savedJobsStore'
import {
  INITIAL_SAVED_JOBS_FILTERS,
  filterSavedJobs,
  sortSavedJobs,
} from './SavedJobsModel'
import type { SavedJobsFilterState, SavedJobsSortOption } from './SavedJobsModel'

export interface AddApplicationOutcome {
  success: boolean
  message: string
  application?: JobApplication
  isDuplicate?: boolean
}

export interface SavedJobsViewModel {
  savedJobs: SavedJobItem[]
  filteredJobs: SavedJobItem[]
  applications: JobApplication[]
  loading: boolean
  error: string | null
  filters: SavedJobsFilterState
  setSearch: (search: string) => void
  setWorkplaceType: (type: string) => void
  setEmploymentType: (type: string) => void
  setSortBy: (sortBy: SavedJobsSortOption) => void
  resetFilters: () => void
  selectedJob: JobListing | null
  setSelectedJob: (job: JobListing | null) => void
  removeSaved: (id: string) => void
  addingAppId: string | null
  addToApplications: (job: JobListing) => Promise<AddApplicationOutcome>
  getExistingApplication: (job: JobListing) => JobApplication | undefined
  feedbackMessage: { type: 'success' | 'info' | 'error'; text: string; appId?: string } | null
  clearFeedback: () => void
}

export function useSavedJobsViewModel(): SavedJobsViewModel {
  const { user } = useAuth()
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>(() => getSavedJobItems())
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SavedJobsFilterState>(INITIAL_SAVED_JOBS_FILTERS)
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)
  const [addingAppId, setAddingAppId] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'info' | 'error'
    text: string
    appId?: string
  } | null>(null)

  // Sync saved jobs from local storage and storage events
  const reloadSavedJobs = useCallback(() => {
    setSavedJobs(getSavedJobItems())
  }, [])

  useEffect(() => {
    return subscribeSavedJobs(reloadSavedJobs)
  }, [reloadSavedJobs])

  // Load existing applications to detect duplicates and show "In Applications" status
  useEffect(() => {
    let mounted = true
    async function loadUserApps() {
      try {
        const apps = await getApplications()
        if (mounted) {
          setApplications(apps)
        }
      } catch {
        // Continue even if applications fetch is delayed
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    loadUserApps()
    return () => {
      mounted = false
    }
  }, [])

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const setWorkplaceType = useCallback((workplaceType: string) => {
    setFilters((prev) => ({ ...prev, workplaceType }))
  }, [])

  const setEmploymentType = useCallback((employmentType: string) => {
    setFilters((prev) => ({ ...prev, employmentType }))
  }, [])

  const setSortBy = useCallback((sortBy: SavedJobsSortOption) => {
    setFilters((prev) => ({ ...prev, sortBy }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_SAVED_JOBS_FILTERS)
  }, [])

  const removeSaved = useCallback((id: string) => {
    const updated = removeSavedJob(id)
    setSavedJobs(updated)
    setFeedbackMessage({
      type: 'info',
      text: 'Job removed from saved jobs.',
    })
  }, [])

  const getExistingApplication = useCallback(
    (job: JobListing): JobApplication | undefined => {
      // Check 1: match normalized job URL
      const byUrl = findDuplicateApplication(job.applyUrl, applications)
      if (byUrl) return byUrl

      // Check 2: match normalized company + job title
      const targetCompany = job.company.trim().toLowerCase()
      const targetTitle = job.title.trim().toLowerCase()
      return applications.find(
        (app) =>
          app.company.trim().toLowerCase() === targetCompany &&
          app.jobTitle.trim().toLowerCase() === targetTitle,
      )
    },
    [applications],
  )

  const addToApplications = useCallback(
    async (job: JobListing): Promise<AddApplicationOutcome> => {
      setAddingAppId(job.id)
      try {
        // 1. Check duplicate
        const existing = getExistingApplication(job)
        if (existing) {
          setFeedbackMessage({
            type: 'info',
            text: 'This job is already in your applications.',
            appId: existing.id,
          })
          return {
            success: false,
            isDuplicate: true,
            message: 'This job is already in your applications.',
            application: existing,
          }
        }

        // 2. Resolve default status (use user's preferred default or 'Wishlist')
        const preferredStatus =
          user?.user_metadata?.preferences?.defaultApplicationStatus || 'Wishlist'

        const primaryResume = getPrimaryResume()

        const draft: ApplicationDraft = {
          company: job.company.trim(),
          jobTitle: job.title.trim(),
          location: job.location.trim(),
          jobUrl: job.applyUrl.trim(),
          applicationDate: new Date().toLocaleDateString('en-CA'),
          status: preferredStatus,
          notes: job.description
            ? `Sourced via ${job.source}\n\n${job.description.slice(0, 600)}`
            : `Sourced via ${job.source}`,
          resumeId: primaryResume?.id,
        }

        // 3. Create application through existing application repository
        const created = await createApplication(draft)
        if (primaryResume) {
          setApplicationResume(created.id, primaryResume.id)
        }
        setApplications((prev) => [...prev, created])
        setFeedbackMessage({
          type: 'success',
          text: `Added "${job.title}" to applications under ${preferredStatus}${primaryResume ? ` with primary resume attached` : ''}.`,
          appId: created.id,
        })

        return {
          success: true,
          message: `Added "${job.title}" to applications.`,
          application: created,
        }
      } catch {
        const errorMsg = 'Unable to add to applications. Please try again.'
        setError(errorMsg)
        setFeedbackMessage({
          type: 'error',
          text: errorMsg,
        })
        return {
          success: false,
          message: errorMsg,
        }
      } finally {
        setAddingAppId(null)
      }
    },
    [getExistingApplication, user],
  )

  const clearFeedback = useCallback(() => {
    setFeedbackMessage(null)
  }, [])

  const filteredJobs = useMemo(() => {
    const filtered = filterSavedJobs(savedJobs, filters)
    return sortSavedJobs(filtered, filters.sortBy)
  }, [savedJobs, filters])

  return {
    savedJobs,
    filteredJobs,
    applications,
    loading,
    error,
    filters,
    setSearch,
    setWorkplaceType,
    setEmploymentType,
    setSortBy,
    resetFilters,
    selectedJob,
    setSelectedJob,
    removeSaved,
    addingAppId,
    addToApplications,
    getExistingApplication,
    feedbackMessage,
    clearFeedback,
  }
}
