import type { CSSProperties } from 'react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '../icons/Icons'

/**
 * Cinematic background footage for the hero. Streamed directly from the CDN —
 * intentionally NOT vendored into the repo. It is muted, decorative, and carries
 * no essential information, so it is hidden from assistive tech and never
 * focusable; the dark panel and treatment layers below stand in if it never
 * loads.
 */
const HERO_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4'

/** Word-by-word rise. Each word animates in on load, offset by its position. */
function Words({
  text,
  startDelay,
  className = '',
}: {
  text: string
  startDelay: number
  className?: string
}) {
  return (
    <>
      {text.split(' ').map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span
            className={`lp-word ${className}`}
            style={
              { animationDelay: `${startDelay + index * 90}ms` } as CSSProperties
            }
          >
            {word}
          </span>{' '}
        </Fragment>
      ))}
    </>
  )
}

/**
 * Hero: a full-height, rounded cinematic panel with the background video living
 * behind the type. The panel matches the site's inset-card language (same
 * rounded-2rem / hairline-border treatment as the closing CTA and product
 * preview). Layered back-to-front inside the panel:
 *   1. the video itself, object-cover, breathing in scale so it feels alive;
 *   2. a top-to-bottom dark gradient plus a diagonal one for text legibility;
 *   3. a faint brand wash (primary blue + warm cream) to tie it to the palette;
 *   4. two slow-drifting radial glows — the only "atmosphere" is moving light;
 *   5. the faint blueprint grid the rest of the page already uses.
 * The headline rises word-by-word on load; the eyebrow, subhead, and CTAs fade
 * up after it. Every one of these motions is stilled under prefers-reduced-motion
 * (see landing.css), while the video is left playing.
 */
function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] flex-col ">
      <div className="lp-hero-panel relative flex flex-1 items-center justify-center overflow-hidden">
        {/* 1 — base footage */}
        <video
          className="lp-hero-video pointer-events-none absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>

        {/* 2 — cinematic darkening for contrast */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/80"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/70 via-black/20 to-transparent"
          aria-hidden="true"
        />

        {/* 3 — brand wash · 4 — drifting glow · 5 — blueprint grid */}
        <div className="lp-hero-tint pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="lp-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="lp-grid-lines pointer-events-none absolute inset-0 opacity-50"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-center">
          <span
            className="lp-fade-up inline-flex items-center gap-2 rounded-full border border-[var(--lp-line-strong)] bg-black/30 px-3.5 py-1.5 backdrop-blur-sm"
            style={{ animationDelay: '100ms' } as CSSProperties}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--lp-accent)]"
              aria-hidden="true"
            />
            <span className="lp-eyebrow">Organize your job search</span>
          </span>

          <h1 className="mt-7 text-[2.75rem] font-extrabold leading-[1.02] tracking-tight text-[var(--lp-cream)] sm:text-6xl lg:text-7xl">
            <Words text="Track every application." startDelay={180} />
            <span className="mt-2 block">
              <span className="lp-serif text-[var(--lp-cream-2)]">
                <Words text="Land your next opportunity." startDelay={460} />
              </span>
            </span>
          </h1>

          <p
            className="lp-fade-up mx-auto mt-7 max-w-xl text-base text-[var(--lp-cream-2)] sm:text-lg"
            style={{ animationDelay: '900ms' } as CSSProperties}
          >
            JobTrack brings your applications, interviews, and offers into a
            single organized workspace — so you always know exactly where you
            stand.
          </p>

          <div
            className="lp-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: '1120ms' } as CSSProperties}
          >
            <Link to="/signup" className="lp-btn lp-btn-accent">
              Get Started
              <ArrowRightIcon className="lp-arrow h-4 w-4" />
            </Link>
            <Link to="/login" className="lp-btn lp-btn-ghost">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
