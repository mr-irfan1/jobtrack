import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/useAuth'
import { PlusIcon } from '../../../components/icons/Icons'
import { updateUserProfile } from '../../../services/authService'
import type { Achievement } from '../../../types/achievement'
import AchievementCard from './AchievementCard'
import AchievementFormModal from './AchievementFormModal'

function sortAchievements(items: Achievement[]): Achievement[] {
  return [...items].sort((a, b) => {
    if (a.date && !b.date) return -1
    if (!a.date && b.date) return 1
    if (a.date && b.date) {
      return b.date.localeCompare(a.date)
    }
    return b.createdAt.localeCompare(a.createdAt)
  })
}

function AchievementsSettingsSection() {
  const { user } = useAuth()

  const metaAchievements = Array.isArray(user?.user_metadata?.achievements)
    ? (user.user_metadata.achievements as Achievement[])
    : []

  const [achievements, setAchievements] =
    useState<Achievement[]>(metaAchievements)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [editingAchievement, setEditingAchievement] =
    useState<Achievement | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const metaAchievementsKey = JSON.stringify(metaAchievements)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setAchievements(metaAchievements)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [metaAchievementsKey])

  async function persistAchievements(
    nextAchievements: Achievement[],
  ): Promise<boolean> {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await updateUserProfile({
        achievements: nextAchievements,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to save achievements.')
        return false
      }

      setAchievements(nextAchievements)
      setSuccess('Achievements updated successfully!')
      return true
    } catch {
      setError('An unexpected error occurred while saving achievements.')
      return false
    } finally {
      setSaving(false)
    }
  }

  function handleOpenAdd(): void {
    setEditingAchievement(null)
    setIsFormOpen(true)
  }

  function handleOpenEdit(achievement: Achievement): void {
    setEditingAchievement(achievement)
    setIsFormOpen(true)
  }

  function handleCloseModal(): void {
    setIsFormOpen(false)
    setEditingAchievement(null)
  }

  function handleFormSubmit(
    draft: Omit<Achievement, 'id' | 'createdAt'>,
  ): void {
    let next: Achievement[]

    if (editingAchievement) {
      next = achievements.map((item) =>
        item.id === editingAchievement.id
          ? { ...item, ...draft }
          : item,
      )
    } else {
      const newItem: Achievement = {
        id: crypto.randomUUID(),
        ...draft,
        createdAt: new Date().toISOString(),
      }
      next = [newItem, ...achievements]
    }

    handleCloseModal()
    persistAchievements(next)
  }

  function handleConfirmDelete(id: string): void {
    const next = achievements.filter((item) => item.id !== id)
    setDeletingId(null)
    persistAchievements(next)
  }

  const sortedList = sortAchievements(achievements)

  return (
    <div className="space-y-6">
      {/* HEADER & ADD BUTTON CARD */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Achievements & Certifications
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your professional achievements, certifications, awards, and recognitions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          disabled={saving}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" />
          Add Achievement
        </button>
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

      {/* ACHIEVEMENTS GRID / EMPTY STATE */}
      {sortedList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-xs">
          <span aria-hidden="true" className="mx-auto mb-2 text-3xl block">
            🏆
          </span>
          <h3 className="text-base font-bold text-foreground">
            No achievements yet
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Add certifications, awards, hackathons and other accomplishments to strengthen your professional profile.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PlusIcon className="h-4 w-4" />
            Add Achievement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sortedList.map((item) => (
            <AchievementCard
              key={item.id}
              achievement={item}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isFormOpen ? (
        <AchievementFormModal
          initialValue={editingAchievement}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
        />
      ) : null}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Delete achievement?
            </h3>
            <p className="text-xs text-muted-foreground">
              This achievement will be permanently removed from your profile.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deletingId)}
                className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-danger-fg shadow-sm hover:bg-danger/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AchievementsSettingsSection
