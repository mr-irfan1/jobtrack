import { useAuth } from '../../auth/useAuth'
import { SignOutIcon } from '../icons/Icons'
import { useLogout } from '../Header/useLogout'
import { displayName, initials } from './userProfile'

interface SidebarUserProps {
  /** Desktop rail collapsed to icons — show just the avatar + an icon logout. */
  collapsed: boolean
}

// Avatar chip: soft branded fill, theme-aware, readable in both light and dark.
const avatarClasses =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary ring-1 ring-inset ring-primary/20'

// Icon-only control, matching the sidebar's other quiet controls.
const iconButtonClasses =
  'inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60'

/**
 * The signed-in user's identity + logout control, pinned to the bottom of the
 * sidebar. Presentation only: the display name/initials are derived from the real
 * authenticated user (useAuth) through pure helpers — never fabricated — and
 * signing out goes through the existing useLogout()/useAuth().signOut() flow, so
 * this component adds no auth logic and never touches Supabase directly. It adapts
 * to the collapsed rail (avatar + icon-only logout, with tooltips/labels) and to
 * the expanded rail / mobile drawer (avatar + name + email + a labelled logout).
 */
function SidebarUser({ collapsed }: SidebarUserProps) {
  const { user } = useAuth()
  const { signOut, signingOut, error } = useLogout()

  const email = user?.email
  const metaName = user?.user_metadata?.full_name
  const fullName = typeof metaName === 'string' ? metaName : undefined
  const name = displayName(fullName, email)
  const mono = initials(fullName, email)

  if (collapsed) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-2 border-t border-border p-3">
        <span role="img" aria-label={name} title={name} className={avatarClasses}>
          {mono}
        </span>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          aria-label={signingOut ? 'Signing out…' : 'Log out'}
          title="Log out"
          className={iconButtonClasses}
        >
          <SignOutIcon className="h-5 w-5" />
        </button>
        {error ? (
          <span role="alert" className="sr-only">
            {error}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="shrink-0 space-y-2 border-t border-border p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
        <span aria-hidden="true" className={avatarClasses}>
          {mono}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          {email ? (
            <p className="truncate text-xs text-muted-foreground" title={email}>
              {email}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SignOutIcon className="h-5 w-5 shrink-0" />
        <span>{signingOut ? 'Signing out…' : 'Log out'}</span>
      </button>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger-fg"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default SidebarUser
