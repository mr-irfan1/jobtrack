import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'
import { CheckIcon, SparklesIcon } from '../../../components/icons/Icons'
import { getPrimaryResume, getResumes } from '../../../services/resumeStore'
import {
  analyzeJobMatch,
  verdictToColor,
  verdictToLabel,
} from '../../../services/jobMatchService'
import type { JobApplication } from '../../../types/application'
import type { JobListing } from '../../../types/jobFeed'
import type { CandidateProfileContext, JobMatchAnalysis, JobMatchRequest } from '../../../types/jobMatch'

interface JobMatchSectionProps {
  job: JobListing
  existingApplication?: JobApplication
}

export function JobMatchSection({ job, existingApplication }: JobMatchSectionProps) {
  const { user } = useAuth()

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [analysis, setAnalysis] = useState<JobMatchAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState<string>('Analyzing job requirements...')
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  // Derive candidate context
  const candidateContext: CandidateProfileContext = useMemo(() => {
    const meta = user?.user_metadata || {}
    const rawSkills = Array.isArray(meta.skills) ? meta.skills : []
    const profileSkills = rawSkills.filter(
      (s): s is string => typeof s === 'string' && Boolean(s.trim()),
    )

    // Precedence: 1. Application-linked resume, 2. Primary resume
    let activeResume = null
    const allResumes = getResumes()
    if (existingApplication?.resumeId) {
      activeResume = allResumes.find((r) => r.id === existingApplication.resumeId) || null
    }
    if (!activeResume) {
      activeResume = getPrimaryResume()
    }

    const rawAchievements = Array.isArray(meta.achievements)
      ? meta.achievements
          .map((a: unknown) => (a && typeof a === 'object' && 'title' in a ? String((a as { title: unknown }).title) : ''))
          .filter(Boolean)
      : []

    return {
      fullName: typeof meta.full_name === 'string' ? meta.full_name : undefined,
      headline: typeof meta.headline === 'string' ? meta.headline : undefined,
      bio: typeof meta.bio === 'string' ? meta.bio : undefined,
      skills: profileSkills,
      achievements: rawAchievements,
      resumeId: activeResume?.id,
      resumeName: activeResume?.fileName,
    }
  }, [user, existingApplication])

  // Reset analysis if job ID changes
  useEffect(() => {
    setStatus('idle')
    setAnalysis(null)
    setErrorMessage(null)
  }, [job.id])

  async function handleRunAnalysis(bypassCache = false) {
    if (status === 'loading') return
    setStatus('loading')
    setErrorMessage(null)
    setLoadingStep('Extracting job description requirements...')

    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Comparing against your profile & technical skills...')
    }, 450)

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Finalizing transparent match scoring...')
    }, 900)

    try {
      const req: JobMatchRequest = {
        job,
        candidate: candidateContext,
      }

      const res = await analyzeJobMatch(req, { bypassCache })

      if (res.success && res.analysis) {
        setAnalysis(res.analysis)
        setStatus('success')
        setIsExpanded(true)
      } else {
        setStatus('error')
        setErrorMessage(res.message || 'Unable to complete match analysis.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('A network error occurred while analyzing the job.')
    } finally {
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
    }
  }

  const colors = analysis ? verdictToColor(analysis.verdict) : null
  const label = analysis ? verdictToLabel(analysis.verdict) : ''

  return (
    <div className="rounded-2xl border border-border/90 bg-muted/30 p-4 sm:p-5 transition-all">
      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SparklesIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">AI Job Match</h2>
              <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                Advisory Intelligence
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {candidateContext.skills.length > 0
                ? `Evaluated with ${candidateContext.skills.length} profile skills${
                    candidateContext.resumeName ? ` · ${candidateContext.resumeName}` : ''
                  }`
                : 'No skills found on profile — add skills in Settings for highest accuracy'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'success' ? (
            <>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1"
                aria-expanded={isExpanded}
              >
                {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
              </button>
              <button
                type="button"
                onClick={() => handleRunAnalysis(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <span>Re-analyze</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => handleRunAnalysis(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all disabled:opacity-60"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>{status === 'loading' ? 'Analyzing…' : 'Analyze Match'}</span>
            </button>
          )}
        </div>
      </div>

      {/* IDLE TEASER */}
      {status === 'idle' && (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface/60 p-3 text-xs text-muted-foreground">
          <span>
            Compare your background and skills against this role&apos;s requirements to check your fit.
          </span>
          {candidateContext.skills.length === 0 && (
            <Link
              to="/settings"
              className="font-semibold text-primary hover:underline"
            >
              Add skills in Settings →
            </Link>
          )}
        </div>
      )}

      {/* LOADING STATE */}
      {status === 'loading' && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-semibold text-xs">
            <svg
              className="h-4 w-4 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>{loadingStep}</span>
          </div>
          <div className="mt-3 mx-auto max-w-sm space-y-2">
            <div className="h-2 w-full animate-pulse rounded-full bg-primary/20" />
            <div className="h-2 w-3/4 mx-auto animate-pulse rounded-full bg-primary/10" />
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {status === 'error' && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger-fg">
          <div className="flex items-center justify-between gap-2">
            <span>{errorMessage || 'Unable to analyze match.'}</span>
            <button
              type="button"
              onClick={() => handleRunAnalysis(true)}
              className="rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {status === 'success' && analysis && isExpanded && (
        <div className="mt-4 space-y-4 pt-2 border-t border-border/60">
          {/* SCORE BANNER */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-muted px-4 py-2 text-center">
                <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  {analysis.score}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Match Score
                </span>
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                    colors?.badgeBg || ''
                  } ${colors?.badgeText || ''}`}
                >
                  {label}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confidence:{' '}
                  <span className="font-medium text-foreground capitalize">
                    {analysis.confidence === 'low' ? 'Limited profile data' : `${analysis.confidence} confidence`}
                  </span>
                </p>
              </div>
            </div>

            {/* PROGRESS GAUGE BAR */}
            <div className="w-full sm:w-48">
              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                <span>Alignment</span>
                <span>{analysis.score}/100</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors?.barColor || 'bg-primary'}`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* SKILLS MATCHED & GAPS */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* MATCHED SKILLS */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                <CheckIcon className="h-3.5 w-3.5" />
                <span>Matched Skills ({analysis.matchedSkills.length})</span>
              </div>
              {analysis.matchedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-surface px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-200"
                    >
                      <span>✓</span>
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No verified skill overlap found with current profile.
                </p>
              )}
            </div>

            {/* GAPS / MISSING */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 mb-2">
                <span>Potential Gaps ({analysis.missingSkills.length})</span>
              </div>
              {analysis.missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-md border border-amber-500/30 bg-surface px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200"
                    >
                      <span>• {skill}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  All identified technical role requirements are matched!
                </p>
              )}
            </div>
          </div>

          {/* RECOMMENDATION CALLOUT */}
          <div className="rounded-xl border border-border bg-surface p-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Recommendation
            </h3>
            <p className="text-xs leading-relaxed text-foreground">
              {analysis.recommendation}
            </p>
          </div>

          {/* TRANSPARENT DISCLAIMER */}
          <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] leading-normal text-muted-foreground">
            <p>
              <strong className="text-foreground">Transparency note:</strong> Analyzed from{' '}
              {analysis.analyzedSources.skillsCount} profile skills
              {analysis.analyzedSources.resumeName
                ? ` and attached resume "${analysis.analyzedSources.resumeName}"`
                : ''}
              . AI Job Match provides advisory candidate guidance based on available data and does not represent employer hiring decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
