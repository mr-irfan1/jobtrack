import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '../icons/Icons'
import { Reveal } from './Reveal'

/**
 * Closing call to action: one editorial line and the two primary routes into the
 * product. Rendered on a rounded ambient panel to echo the hero and bookend the
 * page. No pricing or urgency claims.
 */
function FinalCTA() {
  return (
    <section className="px-3 pb-20 sm:px-4">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--lp-line)] bg-[var(--lp-surface)] px-6 py-20 text-center sm:py-28">
          <div
            className="lp-ambient pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--lp-cream)] sm:text-6xl">
              Take control of your{' '}
              <span className="lp-serif text-[var(--lp-cream-2)]">
                job search.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base text-[var(--lp-muted)] sm:text-lg">
              One place for every application, interview, and opportunity. Start
              organizing today.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="lp-btn lp-btn-accent">
                Start tracking
                <ArrowRightIcon className="lp-arrow h-4 w-4" />
              </Link>
              <Link to="/login" className="lp-btn lp-btn-ghost">
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default FinalCTA
