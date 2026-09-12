import { useEffect, useState } from 'react'
import { CheckIcon, CloseIcon, SparklesIcon } from '../../../components/icons/Icons'
import {
  analyzeResume,
  verdictToColor,
  verdictToLabel,
} from '../../../services/resumeAnalysisService'
import type { Resume } from '../../../types/resume'
import type { ResumeAnalysis } from '../../../types/resumeAnalysis'

interface ResumeAnalysisModalProps {
  resume: Resume | null
  isOpen: boolean
  onClose: () => void
}

export function ResumeAnalysisModal({
  resume,
  isOpen,
  onClose,
}: ResumeAnalysisModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState<string>('Reading document bytes...')

  // Trigger analysis when modal opens for a resume
  useEffect(() => {
    if (isOpen && resume) {
      handleRunAnalysis(false)
    } else {
      setStatus('idle')
      setAnalysis(null)
      setErrorMessage(null)
    }
  }, [isOpen, resume?.id])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  async function handleRunAnalysis(bypassCache = false) {
    if (!resume || status === 'loading') return
    setStatus('loading')
    setErrorMessage(null)
    setLoadingStep('Inspecting document structure & text streams...')

    const timer1 = setTimeout(() => {
      setLoadingStep('Evaluating standard ATS sections & contact signals...')
    }, 450)

    const timer2 = setTimeout(() => {
      setLoadingStep('Auditing technical keywords & content impact...')
    }, 900)

    try {
      const result = await analyzeResume(resume, { bypassCache })
      if (result.success && result.analysis) {
        setAnalysis(result.analysis)
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(result.message || 'Unable to analyze resume.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network or processing error during resume analysis.')
    } finally {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }

  if (!isOpen || !resume) return null

  const colors = analysis ? verdictToColor(analysis.verdict) : null
  const verdictLabel = analysis ? verdictToLabel(analysis.verdict) : ''

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-analysis-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6"
    >
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* MODAL WINDOW */}
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] w-full max-w-3xl flex-col rounded-3xl border border-border bg-surface shadow-2xl text-foreground overflow-hidden">
        {/* MODAL HEADER */}
        <header className="flex shrink-0 items-start justify-between border-b border-border p-6 sm:p-7">
          <div className="flex items-start gap-3.5 min-w-0 pr-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1
                  id="resume-analysis-title"
                  className="text-lg font-bold tracking-tight text-foreground sm:text-xl truncate"
                >
                  ATS Readiness & Resume Intelligence
                </h1>
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                  AI Powered
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                Evaluating: <span className="font-semibold text-foreground">{resume.name}</span> ({resume.fileName} • {resume.fileType.toUpperCase()})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* LOADING STATE */}
          {status === 'loading' && (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <svg
                  className="h-7 w-7 animate-spin text-primary"
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
              </div>
              <h2 className="text-sm font-bold text-foreground">{loadingStep}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Analyzing heading structures, contact info, and keyword densities...
              </p>
              <div className="mt-6 mx-auto max-w-xs space-y-2">
                <div className="h-2 w-full animate-pulse rounded-full bg-primary/20" />
                <div className="h-2 w-2/3 mx-auto animate-pulse rounded-full bg-primary/10" />
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5 text-center">
              <p className="text-sm font-semibold text-danger-fg">
                {errorMessage || 'Unable to complete resume analysis.'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                For scanned documents, ensure you upload a text-based PDF or DOCX file.
              </p>
              <button
                type="button"
                onClick={() => handleRunAnalysis(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
              >
                Try Again
              </button>
            </div>
          )}

          {/* SUCCESS RESULTS */}
          {status === 'success' && analysis && (
            <>
              {/* TOP SCORE CARDS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* ATS READINESS SCORE */}
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Estimated ATS Readiness
                    </span>
                    <span
                      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold ${
                        colors?.badgeBg || ''
                      } ${colors?.badgeText || ''}`}
                    >
                      {verdictLabel}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                      {analysis.atsScore}%
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      / 100 compatibility
                    </span>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        colors?.barColor || 'bg-primary'
                      }`}
                      style={{ width: `${analysis.atsScore}%` }}
                    />
                  </div>
                </div>

                {/* CONTENT QUALITY SCORE */}
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Content Quality
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      Clarity & Completeness
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                      {analysis.qualityScore}%
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      / 100 content strength
                    </span>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${analysis.qualityScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                <p className="text-xs leading-relaxed text-foreground/90 font-medium">
                  {analysis.summary}
                </p>
              </div>

              {/* SECTIONS & CONTACT AUDIT */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* SECTION AUDIT */}
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Standard Sections Detected
                  </h3>
                  <div className="space-y-2">
                    {analysis.sections.map((sec) => (
                      <div
                        key={sec.name}
                        className="flex items-center justify-between text-xs py-0.5"
                      >
                        <span className="flex items-center gap-2 text-foreground font-medium">
                          {sec.detected ? (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              ✓
                            </span>
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground/50">
                              ✕
                            </span>
                          )}
                          <span>{sec.name}</span>
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            sec.detected
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : sec.importance === 'critical'
                                ? 'text-danger-fg'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {sec.detected ? 'Present' : sec.importance === 'critical' ? 'Missing (Critical)' : 'Missing'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CONTACT SIGNALS */}
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Contact & Online Signals
                  </h3>
                  <div className="space-y-2">
                    {analysis.contactSignals.map((contact) => (
                      <div
                        key={contact.type}
                        className="flex items-center justify-between text-xs py-0.5"
                      >
                        <span className="flex items-center gap-2 text-foreground font-medium">
                          {contact.detected ? (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              ✓
                            </span>
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground/50">
                              ✕
                            </span>
                          )}
                          <span>{contact.label}</span>
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            contact.detected
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {contact.detected ? 'Verified' : 'Not detected'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* KEYWORD SIGNALS */}
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Detected Keyword Signals
                </h3>

                {analysis.keywordSignals.technical.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                      Technical Skills & Tools ({analysis.keywordSignals.technical.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keywordSignals.technical.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-lg border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.keywordSignals.professional.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                      Professional & Leadership Competencies ({analysis.keywordSignals.professional.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keywordSignals.professional.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-lg border border-border bg-muted/80 px-2 py-0.5 text-xs font-medium text-foreground"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* STRENGTHS & WEAKNESSES */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* STRENGTHS */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                    <CheckIcon className="h-3.5 w-3.5" />
                    <span>Key Strengths</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-foreground/90">
                    {analysis.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* WEAKNESSES / GAPS */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 mb-2">
                    <span>Potential Format & ATS Risks</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-foreground/90">
                    {analysis.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* RECOMMENDATIONS */}
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Actionable Improvement Recommendations
                </h3>
                <ol className="space-y-2 text-xs text-foreground/90 list-decimal list-inside">
                  {analysis.recommendations.map((rec) => (
                    <li key={rec} className="leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ol>
              </div>

              {/* TRANSPARENT DISCLAIMER */}
              <div className="rounded-xl bg-muted/40 p-3 text-[11px] leading-normal text-muted-foreground">
                <p>
                  <strong className="text-foreground">Advisory Notice:</strong> Estimated ATS Readiness reflects
                  document parseability, standard section structures, and keyword density. Different employer ATS engines
                  (e.g. Workday, Greenhouse, Taleo, Ashby) use varying parsers and recruiter criteria.
                </p>
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:p-6 bg-surface">
          <button
            type="button"
            disabled={status === 'loading'}
            onClick={() => handleRunAnalysis(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>{status === 'loading' ? 'Analyzing...' : 'Re-analyze Resume'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
