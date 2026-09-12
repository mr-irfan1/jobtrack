import type { JobListing, WorkplaceType, EmploymentType } from '../types/jobFeed.ts'
import type { SavedJobItem } from './savedJobsStore.ts'
import { supabase } from './supabaseClient.ts'
import * as localSavedJobsStore from './savedJobsStore.ts'

const SAVED_JOBS_TABLE = 'saved_jobs'

interface SavedJobRow {
  id: string
  user_id: string
  job_id: string
  title: string
  company: string
  company_logo: string | null
  location: string
  workplace_type: string
  employment_type: string
  category: string | null
  salary: string | null
  apply_url: string
  posted_date: string | null
  source: string
  skills: string[]
  saved_at: string
  created_at: string
  updated_at: string
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user.id || null
  } catch {
    return null
  }
}

function rowToSavedJobItem(row: SavedJobRow): SavedJobItem {
  const job: JobListing = {
    id: row.job_id,
    title: row.title,
    company: row.company,
    companyLogo: row.company_logo,
    location: row.location,
    workplaceType: (row.workplace_type as WorkplaceType) || 'Remote',
    employmentType: (row.employment_type as EmploymentType) || 'Full-time',
    category: row.category,
    salary: row.salary,
    description: '', // Saved job snapshot stores essential metadata without duplicating megabytes of descriptions
    skills: row.skills || [],
    postedDate: row.posted_date || '',
    source: row.source || 'External',
    applyUrl: row.apply_url,
  }

  return {
    id: row.job_id,
    savedAt: row.saved_at,
    job,
  }
}

export async function getSavedJobs(): Promise<SavedJobItem[]> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localSavedJobsStore.getSavedJobItems()
  }

  try {
    const { data, error } = await supabase
      .from(SAVED_JOBS_TABLE)
      .select('*')
      .order('saved_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as SavedJobRow[]).map(rowToSavedJobItem)
  } catch {
    return localSavedJobsStore.getSavedJobItems()
  }
}

export async function getSavedJobIds(): Promise<string[]> {
  const items = await getSavedJobs()
  return items.map((i) => i.id)
}

export async function saveJob(job: JobListing): Promise<SavedJobItem[]> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localSavedJobsStore.saveJob(job)
  }

  try {
    const payload = {
      user_id: userId,
      job_id: job.id,
      title: job.title,
      company: job.company,
      company_logo: job.companyLogo || null,
      location: job.location || '',
      workplace_type: job.workplaceType || 'Remote',
      employment_type: job.employmentType || 'Full-time',
      category: job.category || null,
      salary: job.salary || null,
      apply_url: job.applyUrl || '',
      posted_date: job.postedDate || null,
      source: job.source || 'External',
      skills: job.skills || [],
      saved_at: new Date().toISOString(),
    }

    await supabase
      .from(SAVED_JOBS_TABLE)
      .upsert(payload, { onConflict: 'user_id,job_id' })

    localSavedJobsStore.saveJob(job)
    return getSavedJobs()
  } catch {
    return localSavedJobsStore.saveJob(job)
  }
}

export async function removeSavedJob(jobId: string): Promise<SavedJobItem[]> {
  const userId = await getAuthUserId()
  if (!userId) {
    return localSavedJobsStore.removeSavedJob(jobId)
  }

  try {
    await supabase
      .from(SAVED_JOBS_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId)

    localSavedJobsStore.removeSavedJob(jobId)
    return getSavedJobs()
  } catch {
    return localSavedJobsStore.removeSavedJob(jobId)
  }
}

export async function isJobSaved(jobId: string): Promise<boolean> {
  const ids = await getSavedJobIds()
  return ids.includes(jobId)
}
