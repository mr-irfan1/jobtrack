export interface ExtractedJobData {
  title: string | null
  company: string | null
  location: string | null
  description: string | null
  jobUrl: string
  source: string
  employmentType: string | null
  datePosted: string | null
  salary: string | null
  extractionMethod?: 'jsonld' | 'direct' | 'jina' | 'provider'
}

export type ExtractionErrorCode =
  | 'INVALID_URL'
  | 'ACCESS_BLOCKED'
  | 'TIMEOUT'
  | 'NO_JOB_DATA'
  | 'FETCH_ERROR'
  | 'PARSER_ERROR'

export interface AnalyzeJobUrlResult {
  success: boolean
  job?: ExtractedJobData
  errorCode?: ExtractionErrorCode
  message?: string
  error?: string
  extractionMethod?: 'jsonld' | 'direct' | 'jina' | 'provider'
}

/**
 * Maps hostname to human-readable source brand names.
 */
export function getSourceBrandName(urlStr: string): string {
  try {
    const parsed = new URL(urlStr)
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./i, '')

    if (hostname.includes('amazon.jobs')) return 'Amazon Jobs'
    if (hostname.includes('unstop.com')) return 'Unstop'
    if (hostname.includes('linkedin.com')) return 'LinkedIn'
    if (hostname.includes('indeed.com')) return 'Indeed'
    if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) {
      return 'Wellfound'
    }
    if (hostname.includes('greenhouse.io')) return 'Greenhouse'
    if (hostname.includes('lever.co')) return 'Lever'
    if (hostname.includes('ashbyhq.com')) return 'Ashby'

    return hostname
  } catch {
    return 'Web'
  }
}

/**
 * Checks if a URL is private, internal, or uses unsafe non-HTTP protocols (SSRF protection).
 */
export function isPrivateOrLocalhostUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return true
  const lower = urlStr.trim().toLowerCase()

  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:')
  ) {
    return true
  }

  try {
    const parsed = new URL(urlStr)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return true
    }

    const hostname = parsed.hostname.toLowerCase()

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal')
    ) {
      return true
    }

    const ipMatch = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
    if (ipMatch) {
      const p1 = parseInt(ipMatch[1], 10)
      const p2 = parseInt(ipMatch[2], 10)
      if (p1 === 10) return true
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return true
      if (p1 === 192 && p2 === 168) return true
      if (p1 === 169 && p2 === 254) return true
      if (p1 === 0 || p1 === 127) return true
    }
    return false
  } catch {
    return true
  }
}

/**
 * Strips HTML tags and cleans up excessive whitespace.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return ''
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extracts structured job data from Jina Reader markdown/text content.
 */
export function extractJobFromReadableText(
  text: string,
  originalUrl: string,
): ExtractedJobData | null {
  if (!text || !text.trim()) return null

  let title: string | null = null
  let company: string | null = null
  let location: string | null = null
  let description: string | null = null

  const titleMatch = /^Title:\s*(.+)$/m.exec(text)
  if (titleMatch) {
    const rawTitle = titleMatch[1].trim()
    const atMatch = /(.*?)\s+(?:at|@)\s+([^|]+)(?:\s*\|\s*(.*))?$/i.exec(rawTitle)
    if (atMatch) {
      title = atMatch[1].trim()
      company = atMatch[2].trim()
      if (atMatch[3]) location = atMatch[3].trim()
    } else {
      const pipeMatch = /(.*?)\s*\|\s*(.*)$/i.exec(rawTitle)
      if (pipeMatch) {
        title = pipeMatch[1].trim()
        const possibleLoc = pipeMatch[2].trim()
        if (
          possibleLoc.toLowerCase().includes('remote') ||
          possibleLoc.toLowerCase().includes('hybrid') ||
          possibleLoc.includes(',')
        ) {
          location = possibleLoc
        }
      } else {
        title = rawTitle
      }
    }
  }

  const brandName = getSourceBrandName(originalUrl)
  if (!company && brandName && brandName !== 'Web') {
    if (originalUrl.includes('amazon.jobs')) {
      company = 'Amazon'
    }
  }

  const mdIndex = text.indexOf('Markdown Content:')
  if (mdIndex !== -1) {
    const mdContent = text.slice(mdIndex + 'Markdown Content:'.length).trim()
    description = mdContent
      .replace(/\[!\[.*?\]\(.*?\)\]/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*#_`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (description.length > 300) {
      description = description.slice(0, 300) + '...'
    }
  }

  if (!title && !description) return null

  return {
    title: title ? title.trim() : null,
    company: company ? company.trim() : null,
    location: location ? location.trim() : null,
    description: description ? description.trim() : null,
    employmentType: null,
    salary: null,
    datePosted: null,
    source: brandName,
    jobUrl: originalUrl,
    extractionMethod: 'jina',
  }
}

function findJobPostingInObject(obj: unknown): Record<string, unknown> | null {
  if (!obj || typeof obj !== 'object') return null
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findJobPostingInObject(item)
      if (found) return found
    }
    return null
  }
  const record = obj as Record<string, unknown>
  const typeVal = record['@type'] || record.type
  if (
    typeVal === 'JobPosting' ||
    (Array.isArray(typeVal) && typeVal.includes('JobPosting'))
  ) {
    return record
  }
  if (record['@graph']) {
    return findJobPostingInObject(record['@graph'])
  }
  return null
}

export function extractJobMetadataFromHtml(
  html: string,
  url: string,
): ExtractedJobData {
  const brandName = getSourceBrandName(url)
  let title: string | null = null
  let company: string | null = null
  let location: string | null = null
  let description: string | null = null
  let employmentType: string | null = null
  let datePosted: string | null = null
  let salary: string | null = null
  let extractionMethod: 'jsonld' | 'direct' = 'direct'

  if (html && html.trim()) {
    const jsonLdRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let match: RegExpExecArray | null

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const jsonText = match[1].trim()
        if (!jsonText) continue
        const parsed = JSON.parse(jsonText)
        const jobPosting = findJobPostingInObject(parsed)

        if (jobPosting) {
          extractionMethod = 'jsonld'
          if (typeof jobPosting.title === 'string') {
            title = jobPosting.title.trim()
          }
          if (typeof jobPosting.description === 'string') {
            description = stripHtmlTags(jobPosting.description)
          }

          if (jobPosting.hiringOrganization) {
            if (typeof jobPosting.hiringOrganization === 'string') {
              company = jobPosting.hiringOrganization.trim()
            } else if (
              typeof jobPosting.hiringOrganization === 'object' &&
              jobPosting.hiringOrganization
            ) {
              const org = jobPosting.hiringOrganization as Record<
                string,
                unknown
              >
              if (typeof org.name === 'string') company = org.name.trim()
            }
          }

          if (jobPosting.jobLocation) {
            if (typeof jobPosting.jobLocation === 'string') {
              location = jobPosting.jobLocation.trim()
            } else if (typeof jobPosting.jobLocation === 'object') {
              const locObj = jobPosting.jobLocation as Record<string, unknown>
              if (typeof locObj.name === 'string') {
                location = locObj.name.trim()
              } else if (
                locObj.address &&
                typeof locObj.address === 'object'
              ) {
                const addr = locObj.address as Record<string, unknown>
                const parts = [
                  addr.addressLocality,
                  addr.addressRegion,
                  addr.addressCountry,
                ].filter(
                  (p): p is string =>
                    typeof p === 'string' && Boolean(p.trim()),
                )
                if (parts.length > 0) location = parts.join(', ')
              }
            }
          }

          if (jobPosting.employmentType) {
            if (typeof jobPosting.employmentType === 'string') {
              const rawType = jobPosting.employmentType
                .replace(/_/g, ' ')
                .toLowerCase()
              employmentType =
                rawType.charAt(0).toUpperCase() + rawType.slice(1)
            } else if (Array.isArray(jobPosting.employmentType)) {
              employmentType = jobPosting.employmentType.join(', ')
            }
          }

          if (typeof jobPosting.datePosted === 'string') {
            datePosted = jobPosting.datePosted.slice(0, 10)
          }

          if (jobPosting.baseSalary) {
            const sal = jobPosting.baseSalary as Record<string, unknown>
            if (typeof sal.value === 'string') {
              salary = sal.value
            } else if (sal.value && typeof sal.value === 'object') {
              const val = sal.value as Record<string, unknown>
              const curr = typeof sal.currency === 'string' ? sal.currency : '$'
              if (val.value) salary = `${curr} ${val.value}`
              else if (val.minValue || val.maxValue) {
                salary = `${curr} ${val.minValue ?? 0} - ${val.maxValue ?? ''}`
              }
            }
          }
          break
        }
      } catch {
        // scan next script tag
      }
    }

    if (!title) {
      const ogTitleMatch =
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(
          html,
        ) ||
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i.exec(
          html,
        )
      if (ogTitleMatch) title = ogTitleMatch[1].trim()
    }

    if (!description) {
      const ogDescMatch =
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i.exec(
          html,
        ) ||
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i.exec(
          html,
        ) ||
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i.exec(
          html,
        )
      if (ogDescMatch) description = stripHtmlTags(ogDescMatch[1])
    }

    if (!company) {
      const ogSiteMatch =
        /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i.exec(
          html,
        )
      if (ogSiteMatch) company = ogSiteMatch[1].trim()
    }

    if (!title) {
      const titleTagMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
      if (titleTagMatch) title = stripHtmlTags(titleTagMatch[1])
    }

    if (!company && brandName && brandName !== 'Web') {
      if (url.includes('amazon.jobs')) {
        company = 'Amazon'
      }
    }

    if (title && !company) {
      const atMatch = /(.*?)\s+(?:at|@|-|\|)\s+([^|-]+)$/i.exec(title)
      if (atMatch) {
        const possibleCompany = atMatch[2].trim()
        if (possibleCompany && possibleCompany.length <= 50) {
          company = possibleCompany
        }
      }
    }
  }

  if (description && description.length > 300) {
    description = description.slice(0, 300) + '...'
  }

  return {
    title: title ? title.trim() : null,
    company: company ? company.trim() : null,
    location: location ? location.trim() : null,
    description: description ? description.trim() : null,
    employmentType: employmentType ? employmentType.trim() : null,
    datePosted: datePosted ? datePosted.trim() : null,
    salary: salary ? salary.trim() : null,
    source: brandName,
    jobUrl: url,
    extractionMethod,
  }
}

export function getFriendlyErrorMessage(
  code?: ExtractionErrorCode,
  fallbackMsg?: string,
): string {
  switch (code) {
    case 'INVALID_URL':
      return 'Please enter a valid HTTP or HTTPS URL (e.g. https://example.com/jobs/software-engineer).'
    case 'ACCESS_BLOCKED':
      return "We couldn't access this job page automatically. You can still add the application manually."
    case 'NO_JOB_DATA':
      return "We reached the page, but couldn't find structured job details."
    case 'TIMEOUT':
      return 'The request to the job website timed out. The site may be slow or restricting automated requests.'
    default:
      return (
        fallbackMsg ||
        "We couldn't access this job page automatically. You can still add the application manually."
      )
  }
}

/**
 * Client service method to analyze a job posting URL via Supabase Edge Function,
 * with graceful fallback to Jina Reader / Direct client extraction if the Edge Function is undeployed locally.
 */
export async function analyzeJobUrl(url: string): Promise<AnalyzeJobUrlResult> {
  const trimmed = url.trim()

  if (!trimmed) {
    return {
      success: false,
      errorCode: 'INVALID_URL',
      message: 'Job posting URL is required.',
    }
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return {
      success: false,
      errorCode: 'INVALID_URL',
      message: getFriendlyErrorMessage('INVALID_URL'),
    }
  }

  try {
    new URL(trimmed)
  } catch {
    return {
      success: false,
      errorCode: 'INVALID_URL',
      message: getFriendlyErrorMessage('INVALID_URL'),
    }
  }

  if (isPrivateOrLocalhostUrl(trimmed)) {
    return {
      success: false,
      errorCode: 'INVALID_URL',
      message:
        'Private, internal, and localhost URLs are not supported for job analysis.',
    }
  }

  try {
    const { supabase } = await import('./supabaseClient')
    const { data, error } = await supabase.functions.invoke(
      'analyze-job-url',
      {
        body: { url: trimmed },
      },
    )

    if (!error && data && typeof data === 'object') {
      const res = data as {
        success?: boolean
        job?: ExtractedJobData
        errorCode?: ExtractionErrorCode
        message?: string
        extractionMethod?: 'jsonld' | 'direct' | 'jina' | 'provider'
      }

      if (res.success && res.job) {
        return {
          success: true,
          job: res.job,
          extractionMethod: res.extractionMethod || 'direct',
        }
      }

      const code = res.errorCode || 'ACCESS_BLOCKED'
      return {
        success: false,
        errorCode: code,
        message: res.message || getFriendlyErrorMessage(code),
      }
    }
  } catch {
    // Continue to client fallback
  }

  // Client-side fallback to Jina Reader if Edge Function is unavailable locally
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${encodeURIComponent(trimmed)}`, {
      headers: { Accept: 'text/plain, text/markdown, */*' },
    })

    if (jinaRes.ok) {
      const text = await jinaRes.text()
      const job = extractJobFromReadableText(text, trimmed)
      if (job && (job.title || job.description)) {
        return {
          success: true,
          job,
          extractionMethod: 'jina',
        }
      }
    }
  } catch {
    // Ignore Jina fetch errors
  }

  return {
    success: false,
    errorCode: 'ACCESS_BLOCKED',
    message: getFriendlyErrorMessage('ACCESS_BLOCKED'),
  }
}
