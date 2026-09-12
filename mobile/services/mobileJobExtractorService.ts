import { supabase } from '../lib/supabase'

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
}

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

export function getFriendlyErrorMessage(code: ExtractionErrorCode): string {
  switch (code) {
    case 'INVALID_URL':
      return 'Please enter a valid, public job URL starting with http:// or https://'
    case 'ACCESS_BLOCKED':
      return "We couldn't read this job page. The website may block automated access."
    case 'TIMEOUT':
      return 'The job page took too long to respond. Please try again or enter details manually.'
    case 'NO_JOB_DATA':
      return "We couldn't find key job details on this page. You can add this job manually."
    case 'FETCH_ERROR':
    case 'PARSER_ERROR':
    default:
      return 'Unable to extract job details from this link. You can enter them manually.'
  }
}

export async function analyzeJobUrl(url: string): Promise<AnalyzeJobUrlResult> {
  const trimmed = url.trim()
  if (!trimmed) {
    return {
      success: false,
      errorCode: 'INVALID_URL',
      message: getFriendlyErrorMessage('INVALID_URL'),
    }
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        success: false,
        errorCode: 'INVALID_URL',
        message: 'Only HTTP and HTTPS URLs are supported.',
      }
    }
  } catch {
    return {
      success: false,
      errorCode: 'INVALID_URL',
      message: getFriendlyErrorMessage('INVALID_URL'),
    }
  }

  // Call the EXISTING Supabase Edge Function: analyze-job-url
  try {
    const { data, error } = await supabase.functions.invoke('analyze-job-url', {
      body: { url: trimmed },
    })

    if (!error && data && typeof data === 'object') {
      const res = data as {
        success?: boolean
        job?: ExtractedJobData
        errorCode?: ExtractionErrorCode
        message?: string
      }

      if (res.success && res.job) {
        return {
          success: true,
          job: res.job,
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
    // Continue to fallback
  }

  return {
    success: false,
    errorCode: 'ACCESS_BLOCKED',
    message: getFriendlyErrorMessage('ACCESS_BLOCKED'),
  }
}
