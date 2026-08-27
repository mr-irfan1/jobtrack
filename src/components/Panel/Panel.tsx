import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  /** id for the heading, wired to the section's aria-labelledby for a11y. */
  titleId?: string
  /** Optional icon chip shown before the title. */
  icon?: ReactNode
  /** Optional trailing control in the header (e.g. a "View all" link). */
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Overrides the default body padding (e.g. for edge-to-edge content). */
  bodyClassName?: string
}

/**
 * A titled section card: a header row (optional icon + title + optional action)
 * above a padded body. Presentational only — pages/shell compose these. Used for
 * the dashboard sections (activity, pipeline, upcoming interviews, recent
 * applications, quick actions). Large rounded corners and a soft shadow give it
 * the premium SaaS feel.
 */
function Panel({
  title,
  titleId,
  icon,
  action,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <section
      aria-labelledby={titleId}
      className={`rounded-2xl border border-border bg-surface shadow-sm ${className ? className : ''}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {icon}
            </span>
          ) : null}
          <h2
            id={titleId}
            className="truncate text-sm font-semibold text-foreground"
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className={bodyClassName ?? 'p-5'}>{children}</div>
    </section>
  )
}

export default Panel
