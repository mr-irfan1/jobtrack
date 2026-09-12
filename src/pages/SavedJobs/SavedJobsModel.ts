import type { SavedJobItem } from '../../services/savedJobsStore'

export type SavedJobsSortOption = 'recently_saved' | 'newest' | 'company' | 'title'

export interface SavedJobsFilterState {
  search: string
  workplaceType: string
  employmentType: string
  sortBy: SavedJobsSortOption
}

export const INITIAL_SAVED_JOBS_FILTERS: SavedJobsFilterState = {
  search: '',
  workplaceType: 'all',
  employmentType: 'all',
  sortBy: 'recently_saved',
}

export function filterSavedJobs(
  items: SavedJobItem[],
  filters: SavedJobsFilterState,
): SavedJobItem[] {
  const query = filters.search.trim().toLowerCase()
  const wpFilter = filters.workplaceType.trim().toLowerCase()
  const empFilter = filters.employmentType.trim().toLowerCase()

  return items.filter(({ job }) => {
    if (!job) return false

    if (query) {
      const matchTitle = (job.title || '').toLowerCase().includes(query)
      const matchCompany = (job.company || '').toLowerCase().includes(query)
      const matchSkills = Array.isArray(job.skills) && job.skills.some((s) => s.toLowerCase().includes(query))
      const matchLoc = (job.location || '').toLowerCase().includes(query)
      if (!matchTitle && !matchCompany && !matchSkills && !matchLoc) {
        return false
      }
    }

    if (wpFilter && wpFilter !== 'all') {
      const jobWp = (job.workplaceType || '').toLowerCase()
      if (jobWp !== wpFilter) {
        return false
      }
    }

    if (empFilter && empFilter !== 'all') {
      const jobEmp = (job.employmentType || '').toLowerCase()
      if (jobEmp !== empFilter) {
        return false
      }
    }

    return true
  })
}

export function sortSavedJobs(
  items: SavedJobItem[],
  sortBy: SavedJobsSortOption,
): SavedJobItem[] {
  const copy = [...items]

  switch (sortBy) {
    case 'recently_saved':
      return copy.sort((a, b) => {
        const timeA = new Date(a.savedAt).getTime() || 0
        const timeB = new Date(b.savedAt).getTime() || 0
        return timeB - timeA
      })
    case 'newest':
      return copy.sort((a, b) => {
        const timeA = new Date(a.job?.postedDate || 0).getTime() || 0
        const timeB = new Date(b.job?.postedDate || 0).getTime() || 0
        return timeB - timeA
      })
    case 'company':
      return copy.sort((a, b) => (a.job?.company || '').localeCompare(b.job?.company || ''))
    case 'title':
      return copy.sort((a, b) => (a.job?.title || '').localeCompare(b.job?.title || ''))
    default:
      return copy
  }
}
