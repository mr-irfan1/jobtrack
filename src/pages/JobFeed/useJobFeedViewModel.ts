import { useCallback, useEffect, useMemo, useState } from 'react'
import type { JobFeedFilterState, JobListing, JobSortOption } from '../../types/jobFeed'
import { INITIAL_JOB_FEED_FILTERS } from '../../types/jobFeed'
import { fetchJobListings } from '../../services/jobFeedService'
import {
  getSavedJobIds,
  getSavedJobItems,
  isJobIdSaved,
  removeSavedJob,
  saveJob,
  subscribeSavedJobs,
} from '../../services/savedJobsStore'
import {
  filterJobListings,
  getActiveFilterChips,
  getActiveFilterCount,
  getDistinctCategories,
  sortJobListings,
  type ActiveFilterChip,
} from './JobFeedModel'
import { useAuth } from '../../auth/useAuth'
import { useApplicationsViewModel } from '../Applications/useApplicationsViewModel'
import {
  deduplicateJobListings,
  getRecommendedJobs,
  rankJobListings,
  type CandidateSignals,
  type JobRelevance,
  type ScoredJobListing,
} from '../../services/jobRecommendationService'

const PAGE_SIZE = 15

export interface JobFeedViewModel {
  jobs: JobListing[]
  filteredJobs: JobListing[]
  paginatedJobs: JobListing[]
  loading: boolean
  error: string | null
  filters: JobFeedFilterState
  setSearch: (search: string) => void
  setWorkplace: (workplace: string) => void
  setLocation: (location: string) => void
  setEmploymentType: (type: string) => void
  setCategory: (category: string) => void
  setSortBy: (sortBy: JobSortOption) => void
  removeFilter: (type: string) => void
  resetFilters: () => void
  activeFilterChips: ActiveFilterChip[]
  activeFilterCount: number
  totalFilteredCount: number
  page: number
  totalPages: number
  pageSize: number
  setPage: (page: number) => void
  categories: string[]
  selectedJob: JobListing | null
  setSelectedJob: (job: JobListing | null) => void
  savedJobIds: string[]
  toggleSaveJob: (jobOrId: JobListing | string) => void
  isSaved: (id: string) => boolean
  refresh: () => void
  recommendedJobs: ScoredJobListing[]
  hasProfileSignals: boolean
  getJobRelevance: (id: string) => JobRelevance | undefined
}

function getInitialFiltersFromUrl(): JobFeedFilterState {
  if (typeof window === 'undefined') return INITIAL_JOB_FEED_FILTERS
  try {
    const params = new URLSearchParams(window.location.search)
    const search = params.get('q') || ''
    const workplace = params.get('workplace') || 'all'
    const employmentType = params.get('type') || 'all'
    const category = params.get('category') || 'all'
    const location = params.get('location') || 'all'
    const sortParam = params.get('sort') as JobSortOption | null
    const sortBy: JobSortOption =
      sortParam === 'newest' || sortParam === 'company' || sortParam === 'relevant'
        ? sortParam
        : 'relevant'

    return {
      search,
      workplace,
      employmentType,
      category,
      location,
      sortBy,
    }
  } catch {
    return INITIAL_JOB_FEED_FILTERS
  }
}

export function useJobFeedViewModel(): JobFeedViewModel {
  const { user } = useAuth()
  const { applications } = useApplicationsViewModel()

  const [rawJobs, setRawJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<JobFeedFilterState>(getInitialFiltersFromUrl)
  const [page, setPage] = useState<number>(1)
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => getSavedJobIds())

  // Sync active filters to URL search parameters for back/forward navigation & deep linking
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const params = new URLSearchParams()
      if (filters.search.trim()) params.set('q', filters.search.trim())
      if (filters.workplace && filters.workplace !== 'all') params.set('workplace', filters.workplace)
      if (filters.employmentType && filters.employmentType !== 'all') params.set('type', filters.employmentType)
      if (filters.category && filters.category !== 'all') params.set('category', filters.category)
      if (filters.location && filters.location !== 'all') params.set('location', filters.location)
      if (filters.sortBy && filters.sortBy !== 'relevant') params.set('sort', filters.sortBy)

      const queryStr = params.toString()
      const newUrl = queryStr
        ? `${window.location.pathname}?${queryStr}`
        : window.location.pathname
      if (window.location.search !== (queryStr ? `?${queryStr}` : '')) {
        window.history.replaceState(null, '', newUrl)
      }
    } catch {
      // Ignore URL manipulation failures
    }
  }, [filters])

  // Step 13.15 & 13.16: Deduplicate raw jobs before filtering, scoring, or pagination
  const jobs = useMemo(() => {
    return deduplicateJobListings(rawJobs)
  }, [rawJobs])

  // Derive candidate signals from user profile, saved jobs, and tracked applications
  const candidateSignals: CandidateSignals = useMemo(() => {
    const meta = user?.user_metadata || {}
    const rawSkills = Array.isArray(meta.skills) ? meta.skills : []
    const profileSkills = rawSkills.filter(
      (s): s is string => typeof s === 'string' && Boolean(s.trim()),
    )
    const prefs = meta.preferences || {}
    const savedItems = getSavedJobItems()

    return {
      skills: profileSkills,
      preferredJobTitle: typeof prefs.preferredJobTitle === 'string' ? prefs.preferredJobTitle : undefined,
      headline: typeof meta.headline === 'string' ? meta.headline : undefined,
      preferredLocation: typeof prefs.preferredLocation === 'string' ? prefs.preferredLocation : undefined,
      workPreference: typeof prefs.workPreference === 'string' ? prefs.workPreference : undefined,
      employmentType: typeof prefs.employmentType === 'string' ? prefs.employmentType : undefined,
      savedJobs: savedItems.map((s) => s.job),
      applications,
      searchQuery: filters.search,
    }
  }, [user, applications, filters.search, savedJobIds])

  const hasProfileSignals = Boolean(
    (candidateSignals.skills && candidateSignals.skills.length > 0) ||
      candidateSignals.preferredJobTitle ||
      candidateSignals.headline,
  )

  // Rank jobs deterministically
  const scoredJobs = useMemo(() => {
    return rankJobListings(jobs, candidateSignals)
  }, [jobs, candidateSignals])

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of scoredJobs) {
      map.set(item.job.id, item.relevance.score)
    }
    return map
  }, [scoredJobs])

  const relevanceMap = useMemo(() => {
    const map = new Map<string, JobRelevance>()
    for (const item of scoredJobs) {
      map.set(item.job.id, item.relevance)
    }
    return map
  }, [scoredJobs])

  const recommendedJobs = useMemo(() => {
    return getRecommendedJobs(scoredJobs, 4)
  }, [scoredJobs])

  const getJobRelevance = useCallback(
    (id: string) => relevanceMap.get(id),
    [relevanceMap],
  )

  const loadJobs = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchJobListings({ forceRefresh: force })
      setRawJobs(data)
    } catch {
      setError('Unable to load jobs. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => {
      // Step 13.11: If search becomes active, default to 'relevant' unless user explicitly chose otherwise
      const nextSort: JobSortOption = prev.sortBy === 'company' || prev.sortBy === 'newest' ? prev.sortBy : 'relevant'
      return { ...prev, search, sortBy: nextSort }
    })
    setPage(1)
  }, [])

  const setWorkplace = useCallback((workplace: string) => {
    setFilters((prev) => ({ ...prev, workplace }))
    setPage(1)
  }, [])

  const setLocation = useCallback((location: string) => {
    setFilters((prev) => ({ ...prev, location }))
    setPage(1)
  }, [])

  const setEmploymentType = useCallback((employmentType: string) => {
    setFilters((prev) => ({ ...prev, employmentType }))
    setPage(1)
  }, [])

  const setCategory = useCallback((category: string) => {
    setFilters((prev) => ({ ...prev, category }))
    setPage(1)
  }, [])

  const setSortBy = useCallback((sortBy: JobSortOption) => {
    setFilters((prev) => ({ ...prev, sortBy }))
    setPage(1)
  }, [])

  const removeFilter = useCallback((type: string) => {
    setFilters((prev) => {
      switch (type) {
        case 'search':
          return { ...prev, search: '' }
        case 'workplace':
          return { ...prev, workplace: 'all' }
        case 'employmentType':
          return { ...prev, employmentType: 'all' }
        case 'category':
          return { ...prev, category: 'all' }
        case 'location':
          return { ...prev, location: 'all' }
        default:
          return prev
      }
    })
    setPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_JOB_FEED_FILTERS)
    setPage(1)
  }, [])

  const activeFilterChips = useMemo(() => getActiveFilterChips(filters), [filters])
  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters])

  // Filter jobs first, then sort by score/date/company
  const filteredJobs = useMemo(() => {
    const filtered = filterJobListings(jobs, filters)
    return sortJobListings(filtered, filters.sortBy, scoreMap)
  }, [jobs, filters, scoreMap])

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE))

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredJobs.slice(start, start + PAGE_SIZE)
  }, [filteredJobs, page])

  // Subscribe to changes from /saved-jobs or other tabs
  useEffect(() => {
    return subscribeSavedJobs(() => {
      setSavedJobIds(getSavedJobIds())
    })
  }, [])

  const categories = useMemo(() => getDistinctCategories(jobs), [jobs])

  const toggleSaveJob = useCallback(
    (jobOrId: JobListing | string) => {
      const id = typeof jobOrId === 'string' ? jobOrId : jobOrId.id
      if (isJobIdSaved(id)) {
        removeSavedJob(id)
        setSavedJobIds(getSavedJobIds())
      } else {
        const targetJob =
          typeof jobOrId === 'object'
            ? jobOrId
            : jobs.find((j) => j.id === id)
        if (targetJob) {
          saveJob(targetJob)
          setSavedJobIds(getSavedJobIds())
        }
      }
    },
    [jobs],
  )

  const isSaved = useCallback(
    (id: string) => savedJobIds.includes(id),
    [savedJobIds],
  )

  const refresh = useCallback(() => {
    loadJobs(true)
  }, [loadJobs])

  return {
    jobs,
    filteredJobs,
    paginatedJobs,
    loading,
    error,
    filters,
    setSearch,
    setWorkplace,
    setLocation,
    setEmploymentType,
    setCategory,
    setSortBy,
    removeFilter,
    resetFilters,
    activeFilterChips,
    activeFilterCount,
    totalFilteredCount: filteredJobs.length,
    page,
    totalPages,
    pageSize: PAGE_SIZE,
    setPage,
    categories,
    selectedJob,
    setSelectedJob,
    savedJobIds,
    toggleSaveJob,
    isSaved,
    refresh,
    recommendedJobs,
    hasProfileSignals,
    getJobRelevance,
  }
}
