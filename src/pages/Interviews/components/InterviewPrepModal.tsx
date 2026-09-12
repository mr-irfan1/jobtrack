import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../auth/useAuth'
import {
  CheckIcon,
  CloseIcon,
  SparklesIcon,
} from '../../../components/icons/Icons'
import {
  evaluateMockAnswer,
  generateInterviewPrep,
  saveStoredChecklist,
} from '../../../services/interviewPrepService'
import { getPrimaryResume, getResumes } from '../../../services/resumeStore'
import type { JobApplication } from '../../../types/application'
import type {
  InterviewChecklistItem,
  InterviewPrep,
  InterviewPrepRequest,
  InterviewQuestion,
  MockAnswerEvaluation,
} from '../../../types/interviewPrep'

interface InterviewPrepModalProps {
  isOpen: boolean
  onClose: () => void
  application: JobApplication | null
  explicitResumeId?: string
}

type ActiveTab = 'overview' | 'questions' | 'checklist' | 'mock'

export function InterviewPrepModal({
  isOpen,
  onClose,
  application,
  explicitResumeId,
}: InterviewPrepModalProps) {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [prep, setPrep] = useState<InterviewPrep | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState<string>('Analyzing job requirements and interview format...')
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false)

  // Question filter & expanded state
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedGuidance, setExpandedGuidance] = useState<Record<string, boolean>>({})

  // Interactive checklist state
  const [checklist, setChecklist] = useState<InterviewChecklistItem[]>([])

  // Mock Practice state
  const [mockQuestionIndex, setMockQuestionIndex] = useState<number>(0)
  const [userAnswer, setUserAnswer] = useState<string>('')
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState<boolean>(false)
  const [mockEvaluation, setMockEvaluation] = useState<MockAnswerEvaluation | null>(null)
  const [mockError, setMockError] = useState<string | null>(null)

  // Candidate context derivation
  const candidateContext = useMemo(() => {
    const meta = user?.user_metadata || {}
    const rawSkills = Array.isArray(meta.skills) ? meta.skills : []
    const profileSkills = rawSkills.filter(
      (s): s is string => typeof s === 'string' && Boolean(s.trim()),
    )

    // Precedence: 1. Application-linked resume, 2. Explicitly selected resume, 3. Primary resume, 4. Profile skills only
    const allResumes = getResumes()
    let activeResume = null

    if (application?.resumeId) {
      activeResume = allResumes.find((r) => r.id === application.resumeId) || null
    }
    if (!activeResume && explicitResumeId) {
      activeResume = allResumes.find((r) => r.id === explicitResumeId) || null
    }
    if (!activeResume) {
      activeResume = getPrimaryResume()
    }

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
      bio: typeof meta.bio === 'string' ? meta.bio : undefined,
      skills: profileSkills,
      achievements: rawAchievements,
      resumeId: activeResume?.id,
      resumeName: activeResume?.fileName || activeResume?.name,
    }
  }, [user, application, explicitResumeId])

  // Key for checklist persistence
  const checklistKeyId = application?.id || `${application?.company}-${application?.jobTitle}`

  function handleClose() {
    setStatus('idle')
    setPrep(null)
    setErrorMessage(null)
    setActiveTab('overview')
    setUserAnswer('')
    setMockEvaluation(null)
    setMockError(null)
    onClose()
  }

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
  }, [isOpen, onClose])

  // Load existing prep or auto-fetch when opened
  useEffect(() => {
    if (isOpen && application && status === 'idle' && !prep) {
      handleGeneratePrep(false)
    }
  }, [isOpen, application?.id])

  async function handleGeneratePrep(bypassCache = false) {
    if (!application || status === 'loading' || isRegenerating) return

    if (bypassCache) {
      setIsRegenerating(true)
    } else {
      setStatus('loading')
    }
    setErrorMessage(null)
    setLoadingStep('Reviewing role requirements and interview context...')

    const timer1 = setTimeout(() => {
      setLoadingStep('Grounding technical topics with your verified skills...')
    }, 500)

    const timer2 = setTimeout(() => {
      setLoadingStep('Drafting role-specific questions and STAR guidance...')
    }, 1000)

    const request: InterviewPrepRequest = {
      applicationId: application.id,
      jobTitle: application.jobTitle,
      company: application.company,
      location: application.location,
      jobDescription: application.notes || undefined,
      interviewType: application.interviewType,
      interviewDate: application.interviewDate,
      interviewTime: application.interviewTime,
      candidate: candidateContext,
    }

    try {
      const result = await generateInterviewPrep(request, { bypassCache })
      if (result.success && result.prep) {
        setPrep(result.prep)
        setChecklist(result.prep.checklist)
        setStatus('success')
      } else {
        if (!bypassCache) setStatus('error')
        setErrorMessage(result.message || 'Unable to generate interview preparation.')
      }
    } catch {
      if (!bypassCache) setStatus('error')
      setErrorMessage('Network or processing failure while preparing interview guide.')
    } finally {
      clearTimeout(timer1)
      clearTimeout(timer2)
      setIsRegenerating(false)
    }
  }

  function handleToggleChecklist(itemId: string) {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    )
    setChecklist(updated)
    saveStoredChecklist(checklistKeyId, updated)
  }

  function toggleGuidance(qId: string) {
    setExpandedGuidance((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }))
  }

  async function handleEvaluateAnswer() {
    if (isEvaluatingAnswer) return
    if (!prep || !prep.questions[mockQuestionIndex]) return
    const activeQ = prep.questions[mockQuestionIndex]

    const trimmedAnswer = userAnswer.trim().slice(0, 3000)
    if (trimmedAnswer.length < 15) {
      setMockError('Please write at least a few sentences so we can evaluate your structure and content.')
      return
    }

    setIsEvaluatingAnswer(true)
    setMockError(null)
    setMockEvaluation(null)

    try {
      const res = await evaluateMockAnswer({
        question: activeQ.question,
        category: activeQ.category,
        userAnswer: trimmedAnswer,
        jobTitle: prep.jobTitle,
        company: prep.company,
      })

      if (res.success && res.evaluation) {
        setMockEvaluation(res.evaluation)
      } else {
        setMockError(res.message || 'Unable to evaluate answer right now.')
      }
    } catch {
      setMockError('Evaluation service error. Please try again.')
    } finally {
      setIsEvaluatingAnswer(false)
    }
  }

  function handleStartMockOnQuestion(questionIndex: number) {
    setMockQuestionIndex(questionIndex)
    setUserAnswer('')
    setMockEvaluation(null)
    setMockError(null)
    setActiveTab('mock')
  }

  if (!isOpen || !application) return null

  const filteredQuestions = prep?.questions.filter((q) => {
    if (selectedCategory === 'all') return true
    return q.category === selectedCategory
  }) || []

  const completedChecklistCount = checklist.filter((c) => c.completed).length
  const totalChecklistCount = checklist.length
  const checklistPercent = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0

  const activeMockQuestion: InterviewQuestion | undefined = prep?.questions[mockQuestionIndex]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-prep-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* MODAL CONTAINER */}
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] w-full max-w-3xl flex-col rounded-3xl border border-border bg-surface text-foreground shadow-2xl overflow-hidden">
        {/* HEADER */}
        <header className="flex shrink-0 items-start justify-between border-b border-border p-5 sm:p-6 bg-surface">
          <div className="flex items-start gap-3.5 min-w-0 pr-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  id="interview-prep-title"
                  className="text-lg font-bold tracking-tight text-foreground sm:text-xl truncate"
                >
                  AI Interview Prep
                </h1>
                {prep?.difficulty && (
                  <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {prep.difficulty} difficulty
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs font-semibold text-foreground/90 truncate">
                {application.jobTitle} • {application.company}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                {application.interviewType ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 font-medium text-primary">
                    🎯 {application.interviewType}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground">
                    Interview format not specified
                  </span>
                )}

                {application.interviewDate && (
                  <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground">
                    📅 {application.interviewDate}
                  </span>
                )}

                {candidateContext.resumeName ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground truncate max-w-[200px]">
                    📄 {candidateContext.resumeName}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground">
                    👤 Profile & Skills
                  </span>
                )}

                {prep?.isLocalFallback && (
                  <span className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    Grounded Offline Guide
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        {/* NAVIGATION TABS */}
        <nav
          aria-label="Interview Prep Tabs"
          className="flex shrink-0 items-center gap-1 border-b border-border bg-muted/20 px-4 sm:px-6 overflow-x-auto text-xs font-semibold"
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 py-3 px-3 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview & Topics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`border-b-2 py-3 px-3 transition-colors ${
              activeTab === 'questions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Questions ({prep?.questions.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`border-b-2 py-3 px-3 transition-colors ${
              activeTab === 'checklist'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Checklist ({completedChecklistCount}/{totalChecklistCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mock')}
            className={`border-b-2 py-3 px-3 transition-colors ${
              activeTab === 'mock'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Mock Practice
          </button>
        </nav>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* LOADING STATE */}
          {status === 'loading' && (
            <div className="rounded-2xl border border-border bg-muted/20 p-12 text-center space-y-4">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {loadingStep}
                </p>
                <p className="text-xs text-muted-foreground">
                  Grounded in verified requirements with zero fabricated claims...
                </p>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-3">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                Unable to Generate Interview Guide
              </p>
              <p className="text-xs text-muted-foreground">
                {errorMessage || 'A network error occurred. You can retry or use the grounded offline guidance.'}
              </p>
              <button
                type="button"
                onClick={() => handleGeneratePrep(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                Retry Preparation
              </button>
            </div>
          )}

          {/* SUCCESS CONTENT */}
          {prep && status !== 'loading' && (
            <>
              {/* TAB 1: OVERVIEW & TOPICS */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* SUMMARY BOX */}
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5 space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Preparation Summary
                    </h2>
                    <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
                      {prep.summary}
                    </p>
                  </div>

                  {/* 3-COLUMN TOPICS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* TECHNICAL REVISION */}
                    <div className="rounded-2xl border border-border bg-surface p-4 space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <span>⚡</span> Technical Topics
                      </h3>
                      <ul className="space-y-1.5 text-xs text-foreground/90">
                        {prep.technicalTopics.map((topic) => (
                          <li key={topic} className="flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* BEHAVIORAL THEMES */}
                    <div className="rounded-2xl border border-border bg-surface p-4 space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span>🤝</span> Behavioral Themes
                      </h3>
                      <ul className="space-y-1.5 text-xs text-foreground/90">
                        {prep.behavioralTopics.map((topic) => (
                          <li key={topic} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* ROLE FOCUS */}
                    <div className="rounded-2xl border border-border bg-surface p-4 space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <span>🎯</span> Role Focus
                      </h3>
                      <ul className="space-y-1.5 text-xs text-foreground/90">
                        {prep.roleFocusAreas.map((area) => (
                          <li key={area} className="flex items-start gap-1.5">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* WEAK AREAS / GAP FOCUS (IF ANY) */}
                  {prep.weakAreasToAddress.length > 0 && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Areas Requiring Focused Review
                      </h3>
                      <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                        {prep.weakAreasToAddress.map((item) => (
                          <li key={item} className="flex items-start gap-1.5">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* GENERAL INTERVIEW TIPS */}
                  <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Strategic Interview Tips
                    </h3>
                    <ul className="space-y-1.5 text-xs text-foreground/80">
                      {prep.generalTips.map((tip) => (
                        <li key={tip} className="flex items-start gap-1.5">
                          <span className="text-primary font-bold">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: QUESTIONS & GUIDANCE */}
              {activeTab === 'questions' && (
                <div className="space-y-4">
                  {/* CATEGORY FILTER PILLS */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {(['all', 'technical', 'behavioral', 'project', 'situational', 'role_specific'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-xl px-3 py-1.5 font-semibold capitalize transition-colors ${
                          selectedCategory === cat
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'border border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {cat === 'role_specific' ? 'Role-specific' : cat}
                      </button>
                    ))}
                  </div>

                  {/* QUESTION CARDS LIST */}
                  <div className="space-y-3">
                    {filteredQuestions.map((q, idx) => {
                      const isExpanded = Boolean(expandedGuidance[q.id])
                      return (
                        <article
                          key={q.id}
                          className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-3 transition-all hover:border-primary/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <span className="inline-block rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {q.category === 'role_specific' ? 'Role-Specific' : q.category}
                              </span>
                              <h3 className="text-sm font-bold text-foreground leading-snug">
                                {q.question}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartMockOnQuestion(idx)}
                              title="Practice answering this question in Mock mode"
                              className="shrink-0 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                            >
                              Practice →
                            </button>
                          </div>

                          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                            <strong className="text-foreground/80">Why it&apos;s asked:</strong> {q.whyItMayBeAsked}
                          </div>

                          {/* COLLAPSIBLE ANSWER GUIDANCE */}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => toggleGuidance(q.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus:outline-none"
                            >
                              <span>{isExpanded ? 'Hide Guidance ▲' : 'View Answer Guidance ▼'}</span>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3 text-xs text-foreground/90">
                                <div>
                                  <strong className="block text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                                    Recommended Approach:
                                  </strong>
                                  <p className="leading-relaxed">{q.answerGuidance}</p>
                                </div>

                                {q.suggestedStarStructure && (
                                  <div className="rounded-lg border border-border bg-surface p-3 space-y-1.5 text-xs">
                                    <strong className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                      Suggested STAR Framework:
                                    </strong>
                                    <p><strong>Situation:</strong> {q.suggestedStarStructure.situation}</p>
                                    <p><strong>Task:</strong> {q.suggestedStarStructure.task}</p>
                                    <p><strong>Action:</strong> {q.suggestedStarStructure.action}</p>
                                    <p><strong>Result:</strong> {q.suggestedStarStructure.result}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: PREPARATION CHECKLIST */}
              {activeTab === 'checklist' && (
                <div className="space-y-4">
                  {/* PROGRESS BAR */}
                  <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        Preparation Readiness
                      </span>
                      <span className="font-semibold text-primary">
                        {completedChecklistCount} of {totalChecklistCount} tasks completed ({checklistPercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${checklistPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* CHECKLIST ITEMS */}
                  <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-2.5">
                    {checklist.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                          item.completed
                            ? 'border-emerald-500/20 bg-emerald-500/5 text-foreground'
                            : 'border-border bg-surface hover:bg-muted/30 text-foreground'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist(item.id)}
                          className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary focus:outline-none"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.label}
                          </p>
                          {item.category && (
                            <span className="mt-0.5 inline-block text-[10px] font-semibold text-muted-foreground uppercase">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.completed && (
                          <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: MOCK INTERVIEW PRACTICE */}
              {activeTab === 'mock' && (
                <div className="space-y-4">
                  {/* QUESTION SELECTOR BAR */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground">
                      Question {mockQuestionIndex + 1} of {prep.questions.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={mockQuestionIndex === 0}
                        onClick={() => {
                          setMockQuestionIndex((prev) => Math.max(0, prev - 1))
                          setUserAnswer('')
                          setMockEvaluation(null)
                        }}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        disabled={mockQuestionIndex >= prep.questions.length - 1}
                        onClick={() => {
                          setMockQuestionIndex((prev) => Math.min(prep.questions.length - 1, prev + 1))
                          setUserAnswer('')
                          setMockEvaluation(null)
                        }}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>

                  {/* ACTIVE QUESTION CARD */}
                  {activeMockQuestion && (
                    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {activeMockQuestion.category}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground">
                        {activeMockQuestion.question}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        <strong>Why it matters:</strong> {activeMockQuestion.whyItMayBeAsked}
                      </p>
                    </div>
                  )}

                  {/* ANSWER TEXTAREA */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="mock-answer-input" className="font-bold text-foreground">
                        Your Practice Answer
                      </label>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0} words
                      </span>
                    </div>
                    <textarea
                      id="mock-answer-input"
                      rows={6}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Write your answer in your own voice. Frame your technical reasoning, specific actions taken, and the results achieved..."
                      className="w-full rounded-2xl border border-border bg-surface p-4 text-xs sm:text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <p className="italic">
                        Private practice: your answers are evaluated in session and never stored permanently.
                      </p>
                      <button
                        type="button"
                        disabled={isEvaluatingAnswer || userAnswer.trim().length < 15}
                        onClick={handleEvaluateAnswer}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        <SparklesIcon className="h-3.5 w-3.5" />
                        <span>{isEvaluatingAnswer ? 'Evaluating...' : 'Evaluate My Answer'}</span>
                      </button>
                    </div>
                  </div>

                  {mockError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                      {mockError}
                    </div>
                  )}

                  {/* EVALUATION FEEDBACK BOX */}
                  {mockEvaluation && (
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                          ✓
                        </span>
                        <h4 className="font-bold text-foreground">
                          Coaching Feedback
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                          <span className="font-bold text-muted-foreground uppercase text-[10px]">Clarity</span>
                          <p className="text-foreground/90">{mockEvaluation.clarity}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                          <span className="font-bold text-muted-foreground uppercase text-[10px]">Relevance</span>
                          <p className="text-foreground/90">{mockEvaluation.relevance}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5 text-xs">
                        <span className="font-bold text-muted-foreground uppercase text-[10px]">Identified Strengths</span>
                        <ul className="space-y-1 text-foreground/90">
                          {mockEvaluation.strengths.map((str, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1 text-xs text-amber-900 dark:text-amber-200">
                        <span className="font-bold uppercase text-[10px] text-amber-800 dark:text-amber-300">Suggestion for Elevation</span>
                        <p>{mockEvaluation.improvementSuggestion}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:p-5 bg-surface text-xs">
          <div>
            {prep && (
              <button
                type="button"
                disabled={isRegenerating || status === 'loading'}
                onClick={() => handleGeneratePrep(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <SparklesIcon className="h-3.5 w-3.5 text-primary" />
                <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Prep'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-border bg-surface px-4 py-2 font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
