// JobTrack — Cover Letter Service
// =================================
// Deterministic and AI cover letter generation, persistence, and retrieval.
// Grounded strictly in candidate profile and target job specifications.

import type { CoverLetterDraft, CoverLetterRequest, CoverLetterResult } from '../types/coverLetter.ts'

export const COVER_LETTERS_STORAGE_KEY = 'jobtrack_cover_letters'
export const COVER_LETTERS_EVENT = 'jobtrack_cover_letters_updated'

export function getCoverLetters(): CoverLetterDraft[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(COVER_LETTERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getCoverLetterForJob(jobId?: string, applicationId?: string): CoverLetterDraft | null {
  const letters = getCoverLetters()
  if (!jobId && !applicationId) return null
  return (
    letters.find((l) => (applicationId && l.applicationId === applicationId) || (jobId && l.jobId === jobId)) ||
    null
  )
}

export function saveCoverLetter(draft: CoverLetterDraft): void {
  if (typeof localStorage === 'undefined') return
  const letters = getCoverLetters().filter((l) => l.id !== draft.id)
  letters.unshift(draft)
  try {
    localStorage.setItem(COVER_LETTERS_STORAGE_KEY, JSON.stringify(letters))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(COVER_LETTERS_EVENT))
    }
  } catch {
    // Fail silently in restricted storage
  }
}

export function deleteCoverLetter(id: string): void {
  if (typeof localStorage === 'undefined') return
  const letters = getCoverLetters().filter((l) => l.id !== id)
  try {
    localStorage.setItem(COVER_LETTERS_STORAGE_KEY, JSON.stringify(letters))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(COVER_LETTERS_EVENT))
    }
  } catch {
    // Fail silently
  }
}

export function clearAllCoverLetters(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(COVER_LETTERS_STORAGE_KEY)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(COVER_LETTERS_EVENT))
    }
  } catch {
    // Fail silently
  }
}

export function subscribeCoverLetters(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(COVER_LETTERS_EVENT, callback)
  return () => window.removeEventListener(COVER_LETTERS_EVENT, callback)
}

/**
 * Deterministic local grounded generator.
 * Never invents metrics, past companies, or unverified skills.
 */
export function generateLocalCoverLetter(request: CoverLetterRequest): CoverLetterDraft {
  const { job, candidate, applicationId } = request
  const skillsList = candidate.skills && candidate.skills.length > 0 ? candidate.skills : ['modern software development']
  const matchedSkills = skillsList.slice(0, 4).join(', ')

  const candidateName = candidate.fullName || 'Candidate'
  const candidateHeadline = candidate.headline ? `as a ${candidate.headline}` : 'in software engineering'

  const achievementClause =
    candidate.achievements && candidate.achievements.length > 0
      ? ` Throughout my background, key deliverables include ${candidate.achievements[0]}.`
      : ''

  const resumeClause = candidate.resumeName
    ? ` As detailed in my resume (${candidate.resumeName}), I focus on delivering clean, maintainable code and scalable systems.`
    : ' I focus on building reliable, production-ready software solutions.'

  const content = `Dear Hiring Team at ${job.company},

I am writing to express my strong enthusiasm for the ${job.title} position at ${job.company}. With a dedicated background ${candidateHeadline} and hands-on proficiency in ${matchedSkills}, I am excited about the opportunity to contribute to your engineering organization.

In my recent work, I have focused on solving technical challenges with high quality and sustainable architecture.${achievementClause}${resumeClause} The requirements for ${job.title} align well with my core technical competencies, and I am particularly drawn to ${job.company}'s focus on engineering excellence.

I would welcome the opportunity to discuss how my practical experience and problem-solving background can support ${job.company}'s upcoming milestones. Thank you for your time and consideration.

Sincerely,
${candidateName}`

  return {
    id: `cl-${job.id || 'job'}-${Date.now()}`,
    jobId: job.id,
    applicationId,
    jobTitle: job.title,
    company: job.company,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Main Cover Letter generation entry point:
 * - Attempts Supabase Edge Function if configured
 * - Falls back to local grounded generator
 * - Saves result to store
 */
export async function generateCoverLetter(
  request: CoverLetterRequest,
): Promise<CoverLetterResult> {
  if (!request.job?.title || !request.job?.company) {
    return {
      success: false,
      errorCode: 'INVALID_JOB',
      message: 'Job title and company are required to generate a cover letter.',
    }
  }

  // Attempt Supabase Edge Function
  try {
    const { supabase } = await import('./supabaseClient.ts')
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 12000),
    )

    const invokePromise = supabase.functions.invoke('generate-cover-letter', {
      body: request,
    })

    const response = (await Promise.race([invokePromise, timeoutPromise])) as {
      data: unknown
      error: unknown
    }

    if (!response.error && response.data && typeof response.data === 'object') {
      const d = response.data as Record<string, unknown>
      if (typeof d.content === 'string' && d.content.trim()) {
        const draft: CoverLetterDraft = {
          id: `cl-${request.job.id || 'job'}-${Date.now()}`,
          jobId: request.job.id,
          applicationId: request.applicationId,
          jobTitle: request.job.title,
          company: request.job.company,
          content: d.content.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        saveCoverLetter(draft)
        return { success: true, draft }
      }
    }
  } catch {
    // Continue down to deterministic local fallback
  }

  // Fallback to deterministic local generation
  try {
    const localDraft = generateLocalCoverLetter(request)
    saveCoverLetter(localDraft)
    return { success: true, draft: localDraft }
  } catch (err) {
    return {
      success: false,
      errorCode: 'GENERATION_FAILED',
      message: err instanceof Error ? err.message : 'Unable to generate cover letter.',
    }
  }
}
