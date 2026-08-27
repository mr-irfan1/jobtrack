import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  /** Icon glyph rendered inside the accent chip (e.g. <BriefcaseIcon />). */
  icon?: ReactNode
  /** Color classes for the icon chip (bg + text), e.g. "bg-blue-100 text-blue-700". */
  iconClassName?: string
  /** Small supporting line under the value (e.g. "32% of total"). */
  hint?: ReactNode
}

/**
 * A premium KPI tile: a label + large value with an accented icon chip and an
 * optional supporting hint. Presentational only — every value is supplied by
 * the caller (read from the ViewModel), never computed here. Lifts subtly on
 * hover for a polished, interactive feel.
 */
function StatCard({ label, value, icon, iconClassName, hint }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
              iconClassName ?? 'bg-muted text-muted-foreground'
            }`}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default StatCard
