import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './JobTrackFooter.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * JobTrack product footer.
 *
 * Presentation only — it holds no application data and touches no ViewModel,
 * service, auth, or storage. Internal destinations use react-router <Link> so
 * client-side routing is preserved; only the two confirmed routes ("/" and
 * "/applications") are linked, and non-existent destinations fall back to "#"
 * rather than inventing routes. Styling is isolated in JobTrackFooter.css via
 * `jobtrack-footer-*` class names. Rendered once inside the app shell's <main>,
 * so it appears beneath every in-app page.
 */
function JobTrackFooter() {
  const svgRef = useRef<SVGSVGElement>(null)
  const textRef = useRef<SVGTextElement>(null)

  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [invalid, setInvalid] = useState(false)

  // Fit the watermark's viewBox tightly to the rendered glyphs so the wordmark
  // stretches flush to the container. Runs on mount, again once web fonts load
  // (glyph metrics change), and on resize. No animation.
  useEffect(() => {
    const fit = () => {
      const svg = svgRef.current
      const text = textRef.current
      if (!svg || !text) return
      try {
        const bbox = text.getBBox()
        svg.setAttribute(
          'viewBox',
          `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`,
        )
      } catch {
        // getBBox can throw if the element isn't laid out yet; a later
        // fonts.ready / resize pass will retry.
      }
    }

    fit()
    if (document.fonts?.ready) {
      document.fonts.ready.then(fit).catch(() => {})
    }
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // UI-only: validate shape, then show a friendly confirmation. No request is
    // made, nothing is stored, and no auth/Supabase/localStorage is touched.
    if (!EMAIL_PATTERN.test(email.trim())) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setSubscribed(true)
  }

  return (
    <footer className="jobtrack-footer-section">
      <div className="jobtrack-footer-wrapper">
        {/* ===================== LEFT CARD ===================== */}
        <section className="jobtrack-footer-left" aria-label="JobTrack">
          <div className="jobtrack-footer-logo">
            <span className="jobtrack-footer-logo-mark" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="7.5" width="18" height="12.5" rx="2.5" />
                <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
                <path d="M8.4 13.3l2.4 2.3 4.3-4.5" />
              </svg>
            </span>
            <span className="jobtrack-footer-logo-name">JobTrack</span>
          </div>

          <div className="jobtrack-footer-tagline-container">
            <p className="jobtrack-footer-tagline">
              Track applications,
              <span className="jobtrack-footer-tagline-sub">
                land opportunities.
              </span>
            </p>
          </div>

          <div className="jobtrack-footer-social-row">
            <span className="jobtrack-footer-social-label">Stay connected!</span>
            <div className="jobtrack-footer-social-icons">
              <a
                href="#"
                className="jobtrack-footer-social-btn"
                aria-label="JobTrack on LinkedIn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="#"
                className="jobtrack-footer-social-btn"
                aria-label="JobTrack on GitHub"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a
                href="#"
                className="jobtrack-footer-social-btn"
                aria-label="JobTrack on X"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="jobtrack-footer-social-btn"
                aria-label="JobTrack on Discord"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ===================== RIGHT CARD ===================== */}
        <section className="jobtrack-footer-right" aria-label="JobTrack links">
          {/* Floating decorative badge */}
          <div className="jobtrack-footer-career-graphic" aria-hidden="true">
            <div className="jobtrack-footer-cube">
              <span className="jobtrack-footer-cube-mark">JT</span>
            </div>
            <div className="jobtrack-footer-cube-text-row">
              <svg
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 21C5.5 9 15 5.5 21 6.5" />
                <path d="M15.5 4.5 21.5 6.5 19 12" />
              </svg>
              <span className="jobtrack-footer-cube-text">Keep applying!</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="jobtrack-footer-right-top">
            <nav className="jobtrack-footer-nav-cols" aria-label="Footer">
              <div className="jobtrack-footer-nav-col">
                <h2 className="jobtrack-footer-nav-title">Product</h2>
                <Link className="jobtrack-footer-nav-link" to="/">
                  Dashboard
                </Link>
                <Link className="jobtrack-footer-nav-link" to="/applications">
                  Applications
                </Link>
              </div>
              <div className="jobtrack-footer-nav-col">
                <h2 className="jobtrack-footer-nav-title">Company</h2>
                <a className="jobtrack-footer-nav-link" href="#">
                  About
                </a>
                <a className="jobtrack-footer-nav-link" href="#">
                  Blog
                </a>
                <Link className="jobtrack-footer-nav-link" to="/privacy-policy">
                  Privacy Policy
                </Link>
                <Link className="jobtrack-footer-nav-link" to="/terms">
                  Terms &amp; Conditions
                </Link>
              </div>
            </nav>
          </div>

          {/* Copyright + CTA + subscribe */}
          <div className="jobtrack-footer-bottom">
            <p className="jobtrack-footer-copyright">
              © 2026 JobTrack. All rights reserved.
            </p>

            <div className="jobtrack-footer-cta-mini">
              <p className="jobtrack-footer-cta-text">
                Your job search moves fast.
                <span className="jobtrack-footer-cta-strong">
                  Stay organized with JobTrack.
                </span>
              </p>

              <div className="jobtrack-footer-subscribe" aria-live="polite">
                {subscribed ? (
                  <p className="jobtrack-footer-subscribe-success">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    You’re on the list ✓
                  </p>
                ) : (
                  <>
                    <form
                      className={
                        invalid
                          ? 'jobtrack-footer-subscribe-row is-invalid'
                          : 'jobtrack-footer-subscribe-row'
                      }
                      onSubmit={handleSubscribe}
                      noValidate
                    >
                      <input
                        type="email"
                        className="jobtrack-footer-subscribe-input"
                        placeholder="Enter email address"
                        aria-label="Email address"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value)
                          if (invalid) setInvalid(false)
                        }}
                        aria-invalid={invalid || undefined}
                        aria-describedby={
                          invalid ? 'jobtrack-footer-subscribe-error' : undefined
                        }
                      />
                      <button
                        type="submit"
                        className="jobtrack-footer-subscribe-btn"
                      >
                        Subscribe
                      </button>
                    </form>
                    {invalid ? (
                      <p
                        id="jobtrack-footer-subscribe-error"
                        className="jobtrack-footer-subscribe-msg"
                      >
                        Please enter a valid email address.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ===================== WATERMARK ===================== */}
      <div className="jobtrack-footer-watermark" aria-hidden="true">
        <svg
          ref={svgRef}
          viewBox="62 95 876 175"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <text
            ref={textRef}
            x="500"
            y="240"
            textAnchor="middle"
            fontSize="320"
          >
            JobTrack
          </text>
        </svg>
      </div>
    </footer>
  )
}

export default JobTrackFooter
