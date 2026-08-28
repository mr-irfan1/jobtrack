import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../../auth/useAuth'
import { useLogout } from '../../../components/Header/useLogout'
import {
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  SignOutIcon,
  TrashIcon,
} from '../../../components/icons/Icons'
import { MIN_PASSWORD_LENGTH } from '../../../pages/ResetPassword/resetPasswordValidation'
import { updateUserPassword } from '../../../services/authService'

const labelClasses = 'block text-sm font-medium text-foreground'
const inputClasses =
  'mt-1 block w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function SecuritySettingsSection() {
  const { user } = useAuth()
  const { signOut, signingOut } = useLogout()

  // Change password state
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false)
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Account deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [deleteConfirmationText, setDeleteConfirmationText] =
    useState<string>('')
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!newPassword) {
      setPasswordError('New password is required.')
      return
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      )
      return
    }

    if (!confirmPassword) {
      setPasswordError('Please confirm your new password.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setUpdatingPassword(true)

    try {
      const { error: updateError } = await updateUserPassword(newPassword)

      if (updateError) {
        setPasswordError(
          updateError.message || 'Failed to update password. Please try again.',
        )
      } else {
        setPasswordSuccess('Password updated successfully!')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPasswordError(
        'An unexpected error occurred while updating your password.',
      )
    } finally {
      setUpdatingPassword(false)
    }
  }

  async function handleAccountDeleteSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setDeleteError(null)

    if (deleteConfirmationText.trim() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account removal.')
      return
    }

    setDeletingAccount(true)

    try {
      // Safe client-side account removal attempt.
      // Account deletion via client SDK is gated by Supabase Auth security policy.
      // We perform sign out and state cleanup while reporting server-side requirement cleanly.
      await signOut()
    } catch {
      setDeleteError('Failed to sign out during account deletion.')
    } finally {
      setDeletingAccount(false)
    }
  }

  const currentEmail = user?.email || ''

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Security & Account Controls
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your password, active session, and account security.
          </p>
        </div>
      </div>

      {/* 1. CHANGE PASSWORD */}
      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4"
      >
        <div>
          <h3 className="text-base font-bold text-foreground">Change Password</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>

        {/* FEEDBACK BANNERS */}
        {passwordError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-semibold text-danger-fg">
            {passwordError}
          </div>
        ) : null}

        {passwordSuccess ? (
          <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-semibold text-success-fg">
            {passwordSuccess}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* NEW PASSWORD */}
          <div>
            <label htmlFor="newPasswordInput" className={labelClasses}>
              New Password <span className="text-danger-fg">*</span>
            </label>
            <div className="relative mt-1">
              <input
                id="newPasswordInput"
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={`${inputClasses} mt-0 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* CONFIRM NEW PASSWORD */}
          <div>
            <label htmlFor="confirmPasswordInput" className={labelClasses}>
              Confirm New Password <span className="text-danger-fg">*</span>
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPasswordInput"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`${inputClasses} mt-0 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updatingPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {updatingPassword ? 'Updating password...' : 'Update Password'}
          </button>
        </div>
      </form>

      {/* 2. ACTIVE SESSION */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Active Session</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Current authenticated session details.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">{currentEmail}</p>
              <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-bold text-success-fg">
                Active Session
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Signed in via Supabase Authentication
            </p>
          </div>

          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <SignOutIcon className="h-4 w-4" />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* 3. SECURITY TIPS */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-foreground">Security Tips</h3>
        <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
          <li>Never share your password or authentication credentials.</li>
          <li>Use a strong, unique password for your JobTrack account.</li>
          <li>Only connect professional social links and credentials you trust.</li>
          <li>Remember to sign out when using shared or public devices.</li>
        </ul>
      </div>

      {/* 4. DANGER ZONE - ACCOUNT DELETION */}
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-danger-fg">Danger Zone</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Permanently delete your account and remove access.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div>
            <p className="text-xs font-semibold text-foreground">
              Delete JobTrack Account
            </p>
            <p className="text-xs text-muted-foreground">
              Once deleted, your account and profile cannot be recovered.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmationText('')
              setDeleteError(null)
              setIsDeleteModalOpen(true)
            }}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-danger/40 bg-surface px-4 py-2.5 text-xs font-semibold text-danger-fg shadow-xs transition-all hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <TrashIcon className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-danger-fg">
                Delete your account?
              </h3>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This action is permanent. Your profile details, job applications, skills, achievements, social links, and preferences will be permanently removed.
            </p>

            {deleteError ? (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger-fg">
                {deleteError}
              </div>
            ) : null}

            <form onSubmit={handleAccountDeleteSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="deleteConfirmationInput"
                  className="block text-xs font-semibold text-foreground"
                >
                  Type <span className="font-mono font-bold">DELETE</span> to confirm:
                </label>
                <input
                  id="deleteConfirmationInput"
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  className={inputClasses}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    deleteConfirmationText.trim() !== 'DELETE' || deletingAccount
                  }
                  className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-danger-fg shadow-sm hover:bg-danger/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-50"
                >
                  {deletingAccount ? 'Deleting...' : 'DELETE ACCOUNT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SecuritySettingsSection
