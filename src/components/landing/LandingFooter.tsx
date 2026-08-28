import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { NAV_SECTIONS, scrollToSection } from './smoothScroll'

/**
 * Minimal landing footer: brand, the same in-page section links as the navbar,
 * and the two auth routes. Intentionally free of invented content — no social
 * accounts, no fake contact details, no unbuilt legal pages.
 */
function LandingFooter() {
  const year = new Date().getFullYear()

  function handleSectionClick(
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    event.preventDefault()
    scrollToSection(id)
  }

  return (
    <footer className="border-t border-[var(--lp-line)] px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Link
          to="/"
          aria-label="JobTrack home"
          className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
        >
          <img
            src="/assets/logo.png"
            alt=""
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="text-base font-extrabold tracking-tight text-[var(--lp-cream)]">
            JobTrack
          </span>
        </Link>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
        >
          {NAV_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(event) => handleSectionClick(event, section.id)}
              className="rounded text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-cream)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
            >
              {section.label}
            </a>
          ))}
          <Link
            to="/login"
            className="rounded text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-cream)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-cream)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
          >
            Sign up
          </Link>
        </nav>
      </div>

      <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-[var(--lp-muted)] sm:text-left">
        © {year} JobTrack. All rights reserved.
      </p>
    </footer>
  )
}

export default LandingFooter
