import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CloseIcon, SparklesIcon } from '../../components/icons/Icons'
import type { AlertFrequency, JobAlert, JobAlertCriteria, JobAlertDraft } from '../../types/jobAlert'
import {
  formatCriteriaSummary,
  generateAlertName,
} from '../../services/jobAlertsModel'

interface JobAlertModalProps {
  isOpen: boolean
  editingAlert: JobAlert | null
  categories: string[]
  onClose: () => void
  onSave: (draft: JobAlertDraft) => { success: boolean; error?: string }
  getMatchCount: (criteria: JobAlertCriteria) => number
}

export function JobAlertModal({
  isOpen,
  editingAlert,
  categories,
  onClose,
  onSave,
  getMatchCount,
}: JobAlertModalProps) {
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [workplace, setWorkplace] = useState('all')
  const [employmentType, setEmploymentType] = useState('all')
  const [category, setCategory] = useState('all')
  const [location, setLocation] = useState('')
  const [frequency, setFrequency] = useState<AlertFrequency>('daily')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (isOpen) {
      if (editingAlert) {
        setName(editingAlert.name)
        setQuery(editingAlert.criteria.query || '')
        setWorkplace(editingAlert.criteria.workplace || 'all')
        setEmploymentType(editingAlert.criteria.employmentType || 'all')
        setCategory(editingAlert.criteria.category || 'all')
        setLocation(editingAlert.criteria.location || '')
        setFrequency(editingAlert.frequency)
      } else {
        setName('')
        setQuery('')
        setWorkplace('all')
        setEmploymentType('all')
        setCategory('all')
        setLocation('')
        setFrequency('daily')
      }
      setErrorMessage(null)
      setTimeout(() => firstInputRef.current?.focus(), 50)
    }
  }, [isOpen, editingAlert])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const currentCriteria: JobAlertCriteria = useMemo(
    () => ({
      query: query.trim() || undefined,
      workplace: workplace !== 'all' ? workplace : undefined,
      employmentType: employmentType !== 'all' ? employmentType : undefined,
      category: category !== 'all' ? category : undefined,
      location: location.trim() || undefined,
    }),
    [query, workplace, employmentType, category, location],
  )

  const livePreviewName = useMemo(
    () => generateAlertName(currentCriteria),
    [currentCriteria],
  )

  const criteriaSummary = useMemo(
    () => formatCriteriaSummary(currentCriteria),
    [currentCriteria],
  )

  const matchCount = useMemo(
    () => getMatchCount(currentCriteria),
    [currentCriteria, getMatchCount],
  )

  if (!isOpen) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    const draft: JobAlertDraft = {
      name: name.trim() || undefined,
      criteria: currentCriteria,
      frequency,
    }

    const result = onSave(draft)
    if (!result.success && result.error) {
      setErrorMessage(result.error)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface text-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4.5 bg-muted/20">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-foreground">
              {editingAlert ? 'Edit Job Alert' : 'Create Job Alert'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set your target criteria to catch new matching opportunities.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-medium text-danger-fg"
            >
              {errorMessage}
            </div>
          ) : null}

          {/* ALERT NAME (OPTIONAL) */}
          <div>
            <label
              htmlFor="alert-name-input"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Alert Name <span className="font-normal text-muted-foreground">(Optional)</span>
            </label>
            <input
              id="alert-name-input"
              ref={firstInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${livePreviewName}`}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* KEYWORDS / TITLE QUERY */}
          <div>
            <label
              htmlFor="alert-query-input"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Keywords or Job Title
            </label>
            <input
              id="alert-query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. React Developer, Frontend Engineer, TypeScript"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* 2-COLUMN SELECTS: WORKPLACE & EMPLOYMENT TYPE */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="alert-workplace-select"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Workplace Type
              </label>
              <select
                id="alert-workplace-select"
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              >
                <option value="all">Any Workplace</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="alert-employment-select"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Employment Type
              </label>
              <select
                id="alert-employment-select"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              >
                <option value="all">Any Employment</option>
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          {/* 2-COLUMN: CATEGORY & LOCATION */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="alert-category-select"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Category
              </label>
              <select
                id="alert-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="alert-location-input"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Location <span className="font-normal text-muted-foreground">(e.g. Worldwide, US)</span>
              </label>
              <input
                id="alert-location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Any location"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>

          {/* FREQUENCY */}
          <div>
            <label
              htmlFor="alert-frequency-select"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Notification Frequency
            </label>
            <select
              id="alert-frequency-select"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as AlertFrequency)}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            >
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>

          {/* CRITERIA PREVIEW & LIVE MATCH BADGE */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5 text-primary">
                <SparklesIcon className="h-3.5 w-3.5" />
                <span>You'll be notified about:</span>
              </span>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {matchCount} current match{matchCount === 1 ? '' : 'es'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {criteriaSummary}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {editingAlert ? 'Save Changes' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
