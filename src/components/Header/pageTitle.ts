/**
 * Resolve a short page title for the current route so the header can show the
 * active section. It only reads the pathname — it never navigates and adds no
 * routing logic. Kept icon-free and self-contained (not importing the sidebar's
 * icon-bearing nav list) so it stays a pure, unit-testable module.
 *
 * The entries mirror the primary in-app routes in App.tsx / the sidebar nav; keep
 * them in sync if those routes change. Index routes match exactly; others match
 * the path or any nested sub-path. Unknown routes fall back to the app name.
 */
interface PageTitle {
  path: string
  title: string
  /** Match the path exactly (used for the index route so it isn't a prefix of all). */
  exact?: boolean
}

const PAGE_TITLES: readonly PageTitle[] = [
  { path: '/', title: 'Dashboard', exact: true },
  { path: '/applications', title: 'Applications' },
]

export function pageTitleForPath(pathname: string): string {
  for (const item of PAGE_TITLES) {
    const matches = item.exact
      ? pathname === item.path
      : pathname === item.path || pathname.startsWith(`${item.path}/`)
    if (matches) return item.title
  }
  return 'JobTrack'
}
