// JobTrack — Resume Tailoring Modal Component
// ============================================
// Modal dialog allowing candidate to select a resume, inspect pre-analysis context,
// and receive grounded, factual job-specific resume optimization recommendations.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../auth/useAuth'
import {
  CheckIcon,
  CloseIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '../../../components/icons/Icons'
import {
  analyzeResumeTailoring,
  scoreToTailoringColor,
  scoreToTailoringLabel,
} from '../../../services/resumeTailoringService'
import {
  getPrimaryResume,
  getResumes,
  subscribeResumes,
} from '../../../services/resumeStore'
import type { JobApplication } from '../../../types/application'
import type { Resume } from '../../../types/resume'
import type {
  ResumeTailoringAnalysis,
  ResumeTailoringRequest,
} from '../../../types/resumeTailoring'

interface ResumeTailoringModalProps {
  isOpen: boolean
  onClose: () => void
  job: {
    id: string
    title: string
    company: string
    location?: string
    employmentType?: string
    workplaceType?: string
    skills?: string[]
    description?: string
  } | null
  existingApplication?: JobApplication
  initialResumeId?: string
}

type TabKey = 'overview' | 'sections' | 'keywords' | 'edits'

export function ResumeTailoringModal({
  isOpen,
  onClose,
  job,
  existingApplication,
  initialResumeId,
}: ResumeTailoringModalProps) {
  const { user } = useAuth()

  const [resumes, setResumes] = useState<Resume[]>(() => getResumes())
  const [explicitSelectedResumeId, setExplicitSelectedResumeId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [analysis, setAnalysis] = useState<ResumeTailoringAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState<string>('Analyzing job requirements and candidate profile...')
  const [copied, setCopied] = useState<boolean>(false)

  // Subscribe to resume store changes
  useEffect(() => {
    const unsub = subscribeResumes(() => {
      setResumes(getResumes())
    })
    return unsub
  }, [])

  // Derive active selected resume based on precedence:
  // 1. User's explicit choice in modal
  // 2. Application-linked resume
  // 3. Initial resume passed as prop
  // 4. Primary resume
  // 5. First available resume
  const selectedResumeId = useMemo(() => {
    if (explicitSelectedResumeId && resumes.some((r) => r.id === explicitSelectedResumeId)) {
      return explicitSelectedResumeId
    }
    if (existingApplication?.resumeId && resumes.some((r) => r.id === existingApplication.resumeId)) {
      return existingApplication.resumeId
    }
    if (initialResumeId && resumes.some((r) => r.id === initialResumeId)) {
      return initialResumeId
    }
    const primary = getPrimaryResume()
    if (primary && resumes.some((r) => r.id === primary.id)) {
      return primary.id
    }
    return resumes.length > 0 ? resumes[0].id : ''
  }, [explicitSelectedResumeId, resumes, existingApplication, initialResumeId])

  const handleClose = useCallback(() => {
    setStatus('idle')
    setAnalysis(null)
    setErrorMessage(null)
    setActiveTab('overview')
    setCopied(false)
    setExplicitSelectedResumeId(null)
    onClose()
  }, [onClose])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  const selectedResume = useMemo(() => {
    return resumes.find((r) => r.id === selectedResumeId) || null
  }, [resumes, selectedResumeId])

  // Candidate profile context
  const candidateContext = useMemo(() => {
    const meta = user?.user_metadata || {}
    const rawSkills = Array.isArray(meta.skills) ? meta.skills : []
    const profileSkills = rawSkills.filter(
      (s): s is string => typeof s === 'string' && Boolean(s.trim()),
    )
    const rawAchievements = Array.isArray(meta.achievements)
      ? meta.achievements
          .map((a: unknown) =>
            a && typeof a === 'object' && 'title' in a
              ? String((a as { title: unknown }).title)
              : '',
          )
          .filter(Boolean)
      : []

    return {
      fullName: typeof meta.full_name === 'string' ? meta.full_name : undefined,
      headline: typeof meta.headline === 'string' ? meta.headline : undefined,
      skills: profileSkills,
      achievements: rawAchievements,
    }
  }, [user])

  if (!isOpen || !job) return null

  async function handleRunAnalysis(bypassCache = false) {
    if (!selectedResume || !job || status === 'loading') return

    setStatus('loading')
    setErrorMessage(null)
    setLoadingStep('Extracting job description requirements and required skills...')

    const t1 = setTimeout(() => {
      setLoadingStep('Scanning resume text streams and comparing competencies...')
    }, 400)

    const t2 = setTimeout(() => {
      setLoadingStep('Identifying under-emphasized skills and formulating section advice...')
    }, 850)

    try {
      const req: ResumeTailoringRequest = {
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          employmentType: job.employmentType,
          workplaceType: job.workplaceType,
          skills: job.skills,
          description: job.description,
        },
        resume: {
          id: selectedResume.id,
          name: selectedResume.name,
          fileName: selectedResume.fileName,
          fileType: selectedResume.fileType,
          fileData: selectedResume.fileData,
          updatedAt: selectedResume.updatedAt,
        },
        candidate: candidateContext,
      }

      const res = await analyzeResumeTailoring(req, { bypassCache })

      clearTimeout(t1)
      clearTimeout(t2)

      if (res.success && res.analysis) {
        setAnalysis(res.analysis)
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(res.message || 'Unable to complete resume tailoring analysis.')
      }
    } catch {
      clearTimeout(t1)
      clearTimeout(t2)
      setStatus('error')
      setErrorMessage('A network error occurred while analyzing the resume.')
    }
  }

  function handleCopyRecommendations() {
    if (!analysis) return
    const lines: string[] = [
      `# Resume Tailoring Recommendations for ${job?.title} at ${job?.company}`,
      `Selected Resume: ${analysis.sourceContext.resumeName}`,
      `Match Alignment Score: ${analysis.matchScore}% (${scoreToTailoringLabel(analysis.matchScore)})`,
      '',
      `## Summary`,
      analysis.summary,
      '',
      `## Strong Matches`,
      ...analysis.matchedRequirements.map(
        (m) => `- [x] ${m.requirement}${m.evidence ? ` (${m.evidence})` : ''}`,
      ),
      '',
      `## Potential Gaps (Not found in provided resume)`,
      ...analysis.missingRequirements.map(
        (g) => `- [ ] ${g.requirement}: ${g.action || 'Consider highlighting if you have experience.'}`,
      ),
      '',
      `## Under-Emphasized Skills`,
      ...analysis.underEmphasizedRequirements.map(
        (u) => `- [!] ${u.requirement}: ${u.action || 'Strengthen in relevant project bullets.'}`,
      ),
      '',
      `## Section-Level Recommendations`,
      ...analysis.sectionRecommendations.map(
        (s) => `### ${s.section}: ${s.heading}\n${s.advice}`,
      ),
      '',
      `## Suggested Keywords`,
      `Technical: ${analysis.keywordSuggestions.technical.join(', ') || 'None'}`,
      `Professional: ${analysis.keywordSuggestions.professional.join(', ') || 'None'}`,
      '',
      `*Note: Optimization assistant suggestions only. Never fabricate experience or metrics.*`,
    ]

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tailoring-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6"
    >
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* MODAL WINDOW */}
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] w-full max-w-3xl flex-col rounded-3xl border border-border bg-surface shadow-2xl text-foreground overflow-hidden">
        {/* HEADER */}
        <header className="flex shrink-0 items-start justify-between border-b border-border p-6 sm:p-7">
          <div className="flex items-start gap-4 min-w-0 pr-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Job-Specific Optimization
                </span>
                {analysis && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    AI Assistant
                  </span>
                )}
              </div>
              <h1
                id="tailoring-modal-title"
                className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl truncate"
              >
                {job.title}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {job.company} • {job.location || 'Remote'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* RESUME SELECTION CARD */}
          <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4 text-primary" />
                  <label
                    htmlFor="tailor-resume-select"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Resume to Optimize
                  </label>
                  {existingApplication?.resumeId === selectedResumeId && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      Linked to Application
                    </span>
                  )}
                </div>

                {resumes.length === 0 ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    No resumes uploaded in Resume Center. Please upload a resume first.
                  </p>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      id="tailor-resume-select"
                      value={selectedResumeId}
                      onChange={(e) => {
                        setExplicitSelectedResumeId(e.target.value)
                        setStatus('idle')
                        setAnalysis(null)
                      }}
                      className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.fileName}){r.isPrimary ? ' — [Primary]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {selectedResume && (
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <span className="font-semibold text-foreground">{selectedResume.fileType.toUpperCase()}</span>
                  <span> • Last updated {new Date(selectedResume.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* PRE-ANALYSIS STATE */}
          {status === 'idle' && !analysis && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4">
                <h2 className="text-sm font-bold text-foreground">
                  Available Context for Grounded Tailoring
                </h2>
                <ul className="space-y-2.5 text-xs text-foreground/90">
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <strong>Job Requirements:</strong> {job.title} at {job.company} (
                      {job.skills?.length || 0} listed skills)
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <strong>Resume Text Stream:</strong> "{selectedResume?.name || 'Selected Resume'}"
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <strong>Candidate Profile:</strong> {candidateContext.skills.length} verified technical skills
                    </span>
                  </li>
                </ul>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-primary leading-relaxed">
                  <p>
                    <strong>Non-destructive Guarantee:</strong> This analysis generates advisory recommendations and optional factual suggestions. Your original uploaded resume file is never modified or overwritten.
                  </p>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={!selectedResume}
                  onClick={() => handleRunAnalysis(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>Analyze Resume for This Job</span>
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <SparklesIcon className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-foreground">Optimizing Resume Alignment</h2>
                <p className="text-xs text-muted-foreground">{loadingStep}</p>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5 text-center space-y-3">
              <p className="text-sm font-bold text-danger-fg">{errorMessage}</p>
              <button
                type="button"
                onClick={() => handleRunAnalysis(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-danger/40 bg-surface px-4 py-2 text-xs font-semibold text-danger-fg hover:bg-muted"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {/* ANALYSIS RESULTS VIEW */}
          {status === 'success' && analysis && (
            <div className="space-y-6">
              {/* SCORE BANNER */}
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Job-Specific Alignment
                    </span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-foreground sm:text-4xl">
                        {analysis.matchScore}%
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                          scoreToTailoringColor(analysis.matchScore).badgeBg
                        } ${scoreToTailoringColor(analysis.matchScore).badgeText}`}
                      >
                        {scoreToTailoringLabel(analysis.matchScore)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:max-w-xs">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Alignment between provided resume evidence and {job.company}'s requirements.
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-500 ${
                      scoreToTailoringColor(analysis.matchScore).barColor
                    }`}
                    style={{ width: `${analysis.matchScore}%` }}
                  />
                </div>

                {/* Summary */}
                <p className="mt-4 text-xs leading-relaxed text-foreground/90">
                  {analysis.summary}
                </p>
              </div>

              {/* TABS NAVIGATION */}
              <div className="flex border-b border-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 px-3 transition-colors border-b-2 -mb-px ${
                    activeTab === 'overview'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Matches & Gaps
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sections')}
                  className={`pb-3 px-3 transition-colors border-b-2 -mb-px ${
                    activeTab === 'sections'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Section Guidance ({analysis.sectionRecommendations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('keywords')}
                  className={`pb-3 px-3 transition-colors border-b-2 -mb-px ${
                    activeTab === 'keywords'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Keywords
                </button>
                {analysis.suggestedEdits && analysis.suggestedEdits.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('edits')}
                    className={`pb-3 px-3 transition-colors border-b-2 -mb-px ${
                      activeTab === 'edits'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Suggested Directions
                  </button>
                )}
              </div>

              {/* TAB CONTENT: OVERVIEW & GAPS */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* STRONG MATCHES */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                      Strong Matches ({analysis.matchedRequirements.length})
                    </h3>
                    {analysis.matchedRequirements.length > 0 ? (
                      <ul className="space-y-2 text-xs">
                        {analysis.matchedRequirements.map((m) => (
                          <li key={m.requirement} className="flex items-start gap-2 text-foreground">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              <CheckIcon className="h-2.5 w-2.5" />
                            </span>
                            <div>
                              <span className="font-bold">{m.requirement}</span>
                              {m.evidence && (
                                <span className="ml-1 text-muted-foreground">— {m.evidence}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No direct requirement matches detected in the provided resume.
                      </p>
                    )}
                  </div>

                  {/* UNDER-EMPHASIZED SKILLS */}
                  {analysis.underEmphasizedRequirements.length > 0 && (
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">
                        Under-Emphasized Skills ({analysis.underEmphasizedRequirements.length})
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        These skills appear in your resume but are only weakly highlighted compared to this job's requirements.
                      </p>
                      <div className="space-y-2.5 text-xs">
                        {analysis.underEmphasizedRequirements.map((u) => (
                          <div
                            key={u.requirement}
                            className="rounded-xl border border-blue-500/20 bg-surface p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{u.requirement}</span>
                              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                {u.evidence || 'Present once'}
                              </span>
                            </div>
                            {u.action && (
                              <p className="mt-1 text-muted-foreground">{u.action}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* POTENTIAL GAPS */}
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        Potential Gaps ({analysis.missingRequirements.length})
                      </h3>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Not found in provided resume
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      A missing keyword does not mean you lack the skill. If you possess relevant experience, consider highlighting it.
                    </p>
                    {analysis.missingRequirements.length > 0 ? (
                      <div className="space-y-2 text-xs">
                        {analysis.missingRequirements.map((gap) => (
                          <div
                            key={gap.requirement}
                            className="rounded-xl border border-amber-500/20 bg-surface p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">• {gap.requirement}</span>
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                Gap in Resume
                              </span>
                            </div>
                            {gap.action && (
                              <p className="mt-1 text-muted-foreground">{gap.action}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        All identified technical role requirements are represented in your resume!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: SECTION RECOMMENDATIONS */}
              {activeTab === 'sections' && (
                <div className="space-y-3">
                  {analysis.sectionRecommendations.map((sec, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {sec.section}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            sec.priority === 'high'
                              ? 'bg-danger/10 text-danger-fg'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {sec.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{sec.heading}</h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">{sec.advice}</p>
                      {sec.suggestedDirection && (
                        <div className="rounded-xl bg-muted/40 p-3 text-xs text-foreground">
                          <strong>Direction:</strong> {sec.suggestedDirection}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB CONTENT: KEYWORDS */}
              {activeTab === 'keywords' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground">
                    <p>
                      <strong>Guidance:</strong> Use these keywords naturally where they accurately describe your existing experience. Never keyword stuff or invent skills.
                    </p>
                  </div>

                  {/* Technical Keywords */}
                  <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                      Technical Competencies
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keywordSuggestions.technical.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-lg border border-border bg-muted/70 px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Professional Keywords */}
                  <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                      Professional & Collaboration Focus
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keywordSuggestions.professional.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-lg border border-border bg-muted/70 px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: SUGGESTED EDITS */}
              {activeTab === 'edits' && analysis.suggestedEdits && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-primary leading-relaxed">
                    <p>
                      <strong>Factuality Safeguard:</strong> The following are optional phrasing directions. Always preserve the truth of your experience and only add measurable outcomes if you actually achieved them.
                    </p>
                  </div>

                  {analysis.suggestedEdits.map((edit, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-2.5"
                    >
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {edit.section}
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                          Current Focus:
                        </span>
                        <p className="text-xs text-muted-foreground italic mt-0.5">
                          "{edit.originalConcept}"
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <span className="text-[11px] font-bold text-foreground uppercase">
                          Suggested Direction:
                        </span>
                        <p className="text-xs text-foreground mt-1 leading-relaxed">
                          "{edit.suggestedDirection}"
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        ⚠️ {edit.factualSafeguardNote}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* TRANSPARENCY NOTICE */}
              <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
                <p>
                  <strong>Transparency Note:</strong> Tailoring recommendations are advisory. JobTrack never writes to or alters your original document. Review suggestions and apply adjustments in your original document editor.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:p-6 bg-surface">
          <div className="flex flex-wrap items-center gap-2">
            {analysis && (
              <button
                type="button"
                onClick={handleCopyRecommendations}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Recommendations'}</span>
              </button>
            )}

            {analysis && (
              <button
                type="button"
                onClick={() => handleRunAnalysis(true)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                Re-analyze
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-border bg-surface px-5 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
