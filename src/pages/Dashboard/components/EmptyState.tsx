import type { ReactNode } from 'react'

interface EmptyStateProps {
  /** Decorative icon shown in the accent chip. */
  icon?: ReactNode
  title: string
  description: string
  /** Optional call-to-action (e.g. an "Add application" link). */
  action?: ReactNode
  className?: string
}

/**
 * A polished, centered empty state: an icon chip above a title, a short
 * description, and an optional action. Presentational only — used for the
 * whole-dashboard empty state and for individual sections (e.g. no upcoming
 * interviews) so they read as intentional rather than broken.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className ? className : ''}`}
    >
      {icon ? (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export default EmptyState
