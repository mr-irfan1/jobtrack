import { Link } from 'react-router-dom'
import { PlusIcon } from '../../../components/icons/Icons'

interface DashboardHeaderProps {
  /** Time-of-day greeting computed by the view (e.g. "Good morning 👋"). */
  greeting: string
}

/**
 * The dashboard welcome hero: a friendly greeting and a prominent "Add
 * Application" call-to-action. Presentational only — the action reuses the
 * existing creation flow by linking to the Applications route (no new route,
 * no new behavior). A soft gradient and blurred accents give it a premium,
 * lightly glassy feel without visual noise.
 */
function DashboardHeader({ greeting }: DashboardHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-muted px-6 py-7 shadow-sm sm:px-8 sm:py-9">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {greeting}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Here’s what’s happening with your job search.
          </p>
        </div>
        <Link
          to="/applications"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <PlusIcon className="h-4 w-4" />
          Add Application
        </Link>
      </div>
    </section>
  )
}

export default DashboardHeader
