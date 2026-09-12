// JobTrack — Ingest Jobs Edge Worker Logic & Normalizers
// ========================================================
// Self-contained provider fetchers, canonical normalizers, and deduplication
// logic for serverless edge execution.

export interface CanonicalSalary {
  raw: string | null
  min: number | null
  max: number | null
  currency: string
  period: 'yearly' | 'monthly' | 'hourly' | null
}

export interface CanonicalJob {
  id: string
  source: string
  sourceJobId: string
  rawSourceId?: string | number | null
  sourceName: string
  sourceUrl?: string | null
  applyUrl: string
  canonicalUrl: string
  title: string
  company: string
  companyLogo?: string | null
  description: string
  location: string
  workplaceType: 'Remote' | 'Hybrid' | 'On-site'
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Other'
  category?: string | null
  skills: string[]
  salary: CanonicalSalary
  normalizedTitle: string
  normalizedCompany: string
  normalizedLocation: string
  sourceMetadata: Record<string, unknown>
  isActive: boolean
  postedAt: string
  discoveredAt: string
  lastSeenAt: string
  expiresAt: string | null
}

export function getEnv(key: string): string | undefined {
  if (typeof Deno !== 'undefined' && typeof Deno.env !== 'undefined') {
    return Deno.env.get(key)
  }
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  return g.process?.env?.[key]
}

/**
 * Sanitizes URLs and messages to guarantee secrets and API keys are never logged.
 */
export function sanitizeLog(raw: string): string {
  return raw
    .replace(/([?&]app_id=)[^&]+/gi, '$1[REDACTED]')
    .replace(/([?&]app_key=)[^&]+/gi, '$1[REDACTED]')
    .replace(/(app_id=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/(app_key=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/(bearer\s+)[a-zA-Z0-9_\-\.]+/gi, '$1[REDACTED]')
    .replace(/(key=)[a-zA-Z0-9_\-]+/gi, '$1[REDACTED]')
    .replace(/(token=)[a-zA-Z0-9_\-]+/gi, '$1[REDACTED]')
    .replace(/(password=)[^&\s]+/gi, '$1[REDACTED]')
}

export function sanitizeHtml(html?: unknown): string {
  if (typeof html !== 'string') return ''
  let text = html
  if (text.includes('&lt;') && text.includes('&gt;') && !text.includes('<')) {
    text = text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
  }

  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function canonicalizeUrl(raw?: unknown): string {
  if (typeof raw !== 'string') return ''
  const clean = raw.trim()
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) return ''

  try {
    const parsed = new URL(clean)
    const trackingPrefixes = ['utm_', 'ref_', 'fbadid', 'fbclid', 'gclid', 'mc_eid', 'yclid']
    const keysToRemove: string[] = []

    parsed.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase()
      if (
        trackingPrefixes.some((p) => lower.startsWith(p)) ||
        lower === 'ref' ||
        lower === 'source' ||
        lower === 'se' ||
        lower === 'adref'
      ) {
        keysToRemove.push(key)
      }
    })

    for (const key of keysToRemove) {
      parsed.searchParams.delete(key)
    }

    parsed.hash = ''
    let pathname = parsed.pathname.replace(/\/+$/, '')
    if (!pathname) pathname = '/'

    const search = parsed.searchParams.toString()
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname}${search ? `?${search}` : ''}`
  } catch {
    return clean.toLowerCase().replace(/\/+$/, '')
  }
}

export function validateCanonicalJob(job: CanonicalJob): { valid: boolean; reason?: string } {
  if (!job) return { valid: false, reason: 'Null job' }
  if (!job.title || typeof job.title !== 'string' || !job.title.trim()) {
    return { valid: false, reason: 'Missing title' }
  }
  if (!job.company || typeof job.company !== 'string' || !job.company.trim()) {
    return { valid: false, reason: 'Missing company' }
  }
  if (!job.applyUrl || typeof job.applyUrl !== 'string' || !job.applyUrl.trim()) {
    return { valid: false, reason: 'Missing applyUrl' }
  }
  if (!/^https?:\/\//i.test(job.applyUrl.trim())) {
    return { valid: false, reason: 'Invalid applyUrl scheme' }
  }
  if (!job.sourceJobId || typeof job.sourceJobId !== 'string' || !job.sourceJobId.trim()) {
    return { valid: false, reason: 'Missing sourceJobId' }
  }
  if (!job.source || typeof job.source !== 'string' || !job.source.trim()) {
    return { valid: false, reason: 'Missing source' }
  }
  return { valid: true }
}

export function deduplicateCanonicalJobs(jobs: CanonicalJob[]): {
  uniqueJobs: CanonicalJob[]
  deduplicatedCount: number
} {
  const primaryKeys = new Set<string>()
  const canonicalUrls = new Set<string>()
  const uniqueJobs: CanonicalJob[] = []
  let deduplicatedCount = 0

  for (const job of jobs) {
    const primaryKey = `${job.source}::${job.sourceJobId}`
    if (primaryKeys.has(primaryKey)) {
      deduplicatedCount++
      continue
    }

    if (job.canonicalUrl && job.canonicalUrl.startsWith('http')) {
      const normUrl = canonicalizeUrl(job.canonicalUrl)
      if (canonicalUrls.has(normUrl)) {
        deduplicatedCount++
        continue
      }
      canonicalUrls.add(normUrl)
    }

    primaryKeys.add(primaryKey)
    uniqueJobs.push(job)
  }

  return { uniqueJobs, deduplicatedCount }
}

/**
 * 1. Remotive Adapter
 */
export async function fetchRemotiveJobs(options?: { timeoutMs?: number }): Promise<CanonicalJob[]> {
  const timeoutMs = options?.timeoutMs ?? 15000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=60', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`Remotive API responded with HTTP status ${res.status}`)
    }

    const data = (await res.json()) as { jobs?: any[] }
    if (!data || !Array.isArray(data.jobs)) return []

    const nowIso = new Date().toISOString()
    const result: CanonicalJob[] = []

    for (const raw of data.jobs) {
      if (!raw || !raw.id || !raw.title || !raw.company_name) continue

      const loc = (raw.candidate_required_location || '').trim()
      const location = !loc || loc.toLowerCase() === 'anywhere' || loc.toLowerCase() === 'worldwide'
        ? 'Remote (Worldwide)'
        : loc.toLowerCase().includes('remote')
          ? loc
          : `Remote (${loc})`

      const cleanDesc = sanitizeHtml(raw.description)
      const applyUrl = (raw.url || '').trim()
      const canonicalUrl = canonicalizeUrl(applyUrl)

      result.push({
        id: `remotive_${raw.id}`,
        source: 'remotive',
        sourceJobId: String(raw.id),
        rawSourceId: raw.id,
        sourceName: 'Remotive',
        sourceUrl: applyUrl,
        applyUrl,
        canonicalUrl: canonicalUrl || applyUrl,
        title: raw.title.trim(),
        company: raw.company_name.trim(),
        companyLogo: raw.company_logo || null,
        description: cleanDesc,
        location,
        workplaceType: 'Remote',
        employmentType: 'Full-time',
        category: raw.category || 'Engineering',
        skills: Array.isArray(raw.tags) ? raw.tags.filter((t: unknown) => typeof t === 'string') : [],
        salary: {
          raw: raw.salary || null,
          min: null,
          max: null,
          currency: 'USD',
          period: 'yearly',
        },
        normalizedTitle: raw.title.trim().toLowerCase(),
        normalizedCompany: raw.company_name.trim().toLowerCase(),
        normalizedLocation: location.toLowerCase(),
        sourceMetadata: {
          jobType: raw.job_type || null,
          candidateRequiredLocation: raw.candidate_required_location || null,
        },
        isActive: true,
        postedAt: raw.publication_date ? new Date(raw.publication_date).toISOString() : nowIso,
        discoveredAt: nowIso,
        lastSeenAt: nowIso,
        expiresAt: null,
      })
    }

    return result
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

/**
 * 2. Greenhouse Adapter
 */
export const DEFAULT_GREENHOUSE_BOARDS = [
  { boardToken: 'figma', companyName: 'Figma' },
  { boardToken: 'vercel', companyName: 'Vercel' },
  { boardToken: 'automattic', companyName: 'Automattic' },
  { boardToken: 'gitlab', companyName: 'GitLab' },
]

export async function fetchGreenhouseJobs(options?: { timeoutMs?: number }): Promise<CanonicalJob[]> {
  const timeoutMs = options?.timeoutMs ?? 15000
  const nowIso = new Date().toISOString()
  const allJobs: CanonicalJob[] = []

  for (const board of DEFAULT_GREENHOUSE_BOARDS) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board.boardToken}/jobs?content=true`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeoutId)

      if (!res.ok) continue
      const data = (await res.json()) as { jobs?: any[] }
      if (!data || !Array.isArray(data.jobs)) continue

      for (const raw of data.jobs) {
        if (!raw || !raw.id || !raw.title) continue

        const title = raw.title.trim()
        const location = raw.location?.name?.trim() || 'Remote'
        const applyUrl = (raw.absolute_url || '').trim()
        const cleanDesc = sanitizeHtml(raw.content)
        const canonicalUrl = canonicalizeUrl(applyUrl)

        allJobs.push({
          id: `greenhouse_${board.boardToken}_${raw.id}`,
          source: 'greenhouse',
          sourceJobId: String(raw.id),
          rawSourceId: raw.id,
          sourceName: 'Greenhouse',
          sourceUrl: applyUrl,
          applyUrl,
          canonicalUrl: canonicalUrl || applyUrl,
          title,
          company: board.companyName,
          companyLogo: null,
          description: cleanDesc,
          location,
          workplaceType: location.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          employmentType: 'Full-time',
          category: 'Engineering',
          skills: [],
          salary: { raw: null, min: null, max: null, currency: 'USD', period: 'yearly' },
          normalizedTitle: title.toLowerCase(),
          normalizedCompany: board.companyName.toLowerCase(),
          normalizedLocation: location.toLowerCase(),
          sourceMetadata: {
            boardToken: board.boardToken,
            requisitionId: raw.requisition_id || null,
          },
          isActive: true,
          postedAt: raw.updated_at ? new Date(raw.updated_at).toISOString() : nowIso,
          discoveredAt: nowIso,
          lastSeenAt: nowIso,
          expiresAt: null,
        })
      }
    } catch {
      clearTimeout(timeoutId)
    }
  }

  return allJobs
}

/**
 * 3. Adzuna Adapter
 */
export async function fetchAdzunaJobs(options?: {
  timeoutMs?: number
  country?: string
  maxPages?: number
}): Promise<CanonicalJob[]> {
  const appId = getEnv('ADZUNA_APP_ID')
  const appKey = getEnv('ADZUNA_APP_KEY')
  if (!appId || !appKey) {
    throw new Error('Adzuna credentials missing: ADZUNA_APP_ID and ADZUNA_APP_KEY must be configured in server environment')
  }

  const country = (options?.country || 'us').toLowerCase()
  const timeoutMs = options?.timeoutMs ?? 15000
  const maxPages = options?.maxPages ?? 1
  const nowIso = new Date().toISOString()
  const results: CanonicalJob[] = []

  for (let page = 1; page <= maxPages; page++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=software+engineer&content-type=application/json`
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`Adzuna API responded with status ${res.status}`)
      }

      const data = (await res.json()) as { results?: any[] }
      if (!data || !Array.isArray(data.results)) break

      for (const raw of data.results) {
        if (!raw || !raw.id || !raw.title) continue

        const title = sanitizeHtml(raw.title) || raw.title.trim()
        const company = raw.company?.display_name?.trim() || 'Adzuna Employer'
        const location = raw.location?.display_name?.trim() || 'Remote'
        const applyUrl = (raw.redirect_url || '').trim()
        const cleanDesc = sanitizeHtml(raw.description)
        const canonicalUrl = canonicalizeUrl(applyUrl)

        results.push({
          id: `adzuna_${raw.id}`,
          source: 'adzuna',
          sourceJobId: String(raw.id),
          rawSourceId: raw.id,
          sourceName: 'Adzuna',
          sourceUrl: applyUrl,
          applyUrl,
          canonicalUrl: canonicalUrl || applyUrl,
          title,
          company,
          companyLogo: null,
          description: cleanDesc,
          location,
          workplaceType: location.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          employmentType: raw.contract_time === 'part_time' ? 'Part-time' : 'Full-time',
          category: raw.category?.label || 'General',
          skills: [],
          salary: {
            raw: raw.salary_min && raw.salary_max ? `USD ${raw.salary_min.toLocaleString()} - ${raw.salary_max.toLocaleString()}` : null,
            min: raw.salary_min ?? null,
            max: raw.salary_max ?? null,
            currency: 'USD',
            period: 'yearly',
          },
          normalizedTitle: title.toLowerCase(),
          normalizedCompany: company.toLowerCase(),
          normalizedLocation: location.toLowerCase(),
          sourceMetadata: {
            country,
            contractTime: raw.contract_time || null,
            contractType: raw.contract_type || null,
          },
          isActive: true,
          postedAt: raw.created ? new Date(raw.created).toISOString() : nowIso,
          discoveredAt: nowIso,
          lastSeenAt: nowIso,
          expiresAt: null,
        })
      }

      if (data.results.length < 20) break
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  return results
}
