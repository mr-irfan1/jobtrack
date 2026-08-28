import type { MouseEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CloseIcon, MenuIcon } from '../icons/Icons'
import { NAV_SECTIONS, scrollToSection } from './smoothScroll'

/**
 * Floating landing navbar: brand + in-page section links + auth actions. It is
 * purely marketing chrome — the auth CTAs are ordinary <Link>s to the unchanged
 * /login and /signup routes; nothing here touches the session. Section links
 * smooth-scroll (respecting reduced motion) instead of navigating.
 */
function LandingNavbar() {
  const [open, setOpen] = useState(false)

  function handleSectionClick(
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    event.preventDefault()
    setOpen(false)
    scrollToSection(id)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-[var(--lp-line)] bg-[rgba(16,16,16,0.72)] px-4 py-2.5 backdrop-blur-md sm:px-5"
      >
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

        <div className="hidden items-center gap-1 md:flex">
          {NAV_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(event) => handleSectionClick(event, section.id)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-cream)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)]"
            >
              {section.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login" className="lp-btn lp-btn-ghost">
            Log in
          </Link>
          <Link to="/signup" className="lp-btn lp-btn-accent">
            Start tracking
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--lp-cream)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="lp-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <CloseIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </nav>

      {open ? (
        <div
          id="lp-mobile-menu"
          className="mx-auto mt-2 max-w-6xl rounded-2xl border border-[var(--lp-line)] bg-[rgba(16,16,16,0.96)] p-3 backdrop-blur-md md:hidden"
        >
          <div className="flex flex-col">
            {NAV_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(event) => handleSectionClick(event, section.id)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-[var(--lp-cream)] transition-colors hover:bg-white/5"
              >
                {section.label}
              </a>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="lp-btn lp-btn-ghost w-full"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="lp-btn lp-btn-accent w-full"
            >
              Start tracking
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default LandingNavbar
