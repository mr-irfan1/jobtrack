import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../../auth/useAuth'
import { CloseIcon, PlusIcon } from '../../../components/icons/Icons'
import { updateUserProfile } from '../../../services/authService'

const MAX_SKILLS = 20

const COMMON_SUGGESTIONS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Python',
  'SQL',
  'Git',
  'Tailwind CSS',
  'Node.js',
]

const inputClasses =
  'block w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function SkillsSettingsSection() {
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  const metaSkills = Array.isArray(user?.user_metadata?.skills)
    ? (user.user_metadata.skills.filter(
        (s): s is string => typeof s === 'string',
      ) as string[])
    : []

  const [skills, setSkills] = useState<string[]>(metaSkills)
  const [newSkill, setNewSkill] = useState<string>('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState<string>('')

  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const metaSkillsKey = metaSkills.join(',')

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setSkills(metaSkills)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [metaSkillsKey])

  async function persistSkills(nextSkills: string[]): Promise<boolean> {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await updateUserProfile({
        skills: nextSkills,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to save skills.')
        return false
      }

      setSkills(nextSkills)
      setSuccess('Skills updated successfully!')
      return true
    } catch {
      setError('An unexpected error occurred while saving skills.')
      return false
    } finally {
      setSaving(false)
    }
  }

  function handleAdd(nameToAdd: string): void {
    setError(null)
    setSuccess(null)
    const trimmed = nameToAdd.trim()

    if (!trimmed) {
      setError('Skill name cannot be empty.')
      return
    }

    if (skills.length >= MAX_SKILLS) {
      setError(`You have reached the maximum limit of ${MAX_SKILLS} skills.`)
      return
    }

    // Case-insensitive duplicate check
    const isDuplicate = skills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase(),
    )
    if (isDuplicate) {
      setError(`"${trimmed}" has already been added to your skills.`)
      return
    }

    const nextSkills = [...skills, trimmed]
    setNewSkill('')
    persistSkills(nextSkills)
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    handleAdd(newSkill)
  }

  function handleRemove(indexToRemove: number): void {
    const nextSkills = skills.filter((_, idx) => idx !== indexToRemove)
    persistSkills(nextSkills)
  }

  function handleStartEdit(index: number): void {
    setEditingIndex(index)
    setEditingText(skills[index] || '')
    setError(null)
  }

  function handleSaveEdit(): void {
    if (editingIndex === null) return
    const trimmed = editingText.trim()

    if (!trimmed) {
      handleRemove(editingIndex)
      setEditingIndex(null)
      return
    }

    // Case-insensitive duplicate check excluding current item
    const isDuplicate = skills.some(
      (s, idx) =>
        idx !== editingIndex && s.toLowerCase() === trimmed.toLowerCase(),
    )

    if (isDuplicate) {
      setError(`"${trimmed}" already exists in your skills.`)
      return
    }

    const nextSkills = [...skills]
    nextSkills[editingIndex] = trimmed
    setEditingIndex(null)
    persistSkills(nextSkills)
  }

  function focusInput(): void {
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-6">
      {/* HEADER & COUNTER CARD */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Skills</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add the technologies, tools, and abilities you want to showcase.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-bold text-muted-foreground">
          {skills.length} / {MAX_SKILLS} skills
        </span>
      </div>

      {/* FEEDBACK BANNERS */}
      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-semibold text-danger-fg">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-semibold text-success-fg">
          {success}
        </div>
      ) : null}

      {/* ADD SKILL FORM */}
      <form onSubmit={handleFormSubmit} className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <label htmlFor="newSkillInput" className="block text-sm font-bold text-foreground">
          Add New Skill
        </label>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            ref={inputRef}
            id="newSkillInput"
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="e.g. React, TypeScript, Python..."
            className={inputClasses}
            disabled={saving || skills.length >= MAX_SKILLS}
          />

          <button
            type="submit"
            disabled={saving || !newSkill.trim() || skills.length >= MAX_SKILLS}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" />
            Add Skill
          </button>
        </div>

        {/* QUICK SUGGESTIONS */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Popular Suggestions:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COMMON_SUGGESTIONS.map((suggestion) => {
              const exists = skills.some(
                (s) => s.toLowerCase() === suggestion.toLowerCase(),
              )

              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAdd(suggestion)}
                  disabled={saving || exists || skills.length >= MAX_SKILLS}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    exists
                      ? 'border-border bg-muted/40 text-muted-foreground/60 cursor-not-allowed'
                      : 'border-border bg-surface text-foreground hover:border-primary/40 hover:bg-muted'
                  }`}
                >
                  + {suggestion}
                </button>
              )
            })}
          </div>
        </div>
      </form>

      {/* SKILLS LIST & CHIPS */}
      {skills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-xs">
          <span aria-hidden="true" className="mx-auto mb-2 text-3xl block">
            🛠
          </span>
          <h3 className="text-base font-bold text-foreground">
            No skills added yet
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Add the technologies and abilities you want to showcase on your JobTrack profile.
          </p>
          <button
            type="button"
            onClick={focusInput}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PlusIcon className="h-4 w-4" />
            Add your first skill
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            Your Skills ({skills.length})
          </h3>

          <div className="flex flex-wrap gap-2 pt-1">
            {skills.map((skill, index) => {
              const isEditing = editingIndex === index

              if (isEditing) {
                return (
                  <div
                    key={`edit-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary bg-primary/5 px-2.5 py-1"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') setEditingIndex(null)
                      }}
                      className="w-28 rounded-md border border-border bg-input px-2 py-0.5 text-xs text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )
              }

              return (
                <div
                  key={`${skill}-${index}`}
                  className="group inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-primary/40 hover:bg-muted/40"
                >
                  <span
                    onClick={() => handleStartEdit(index)}
                    title="Click to edit skill"
                    className="cursor-pointer select-none"
                  >
                    {skill}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    disabled={saving}
                    aria-label={`Remove ${skill} skill`}
                    title={`Remove ${skill}`}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default SkillsSettingsSection
