import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/** Exact hero video source provided for the JobTrack auth experience. */
const HERO_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4'

interface AuthShellProps {
  /** Left-column hero content (brand, headline, steps). Rendered over the video. */
  hero: ReactNode
  /** Right-column content (the auth form / success panel). */
  children: ReactNode
}

/**
 * Full-screen, two-column authentication layout shared by Login and Signup.
 *
 * Left (desktop only, ~52%): a background video that fills the rounded panel
 * edge-to-edge with NO overlay, tint, gradient, or blur — the footage stays
 * visually pure per the brand direction — with the hero content layered above
 * it via z-index. Right: a clean, black, centered column that holds the form
 * and grows/scrolls on short viewports so nothing is pushed off-screen.
 *
 * Presentation only: it renders whatever `hero`/`children` it's given and owns
 * no auth state. The right column fades up once on mount (CSS transition, not a
 * keyframe/animation library), and honors `prefers-reduced-motion`.
 */
function AuthShell({ hero, children }: AuthShellProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Flip on the next frame so the initial (hidden) state paints first and the
    // CSS transition actually runs; deferring also keeps this out of the render
    // pass. Cleanup cancels a pending frame if we unmount immediately.
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-screen w-full flex-col lg:flex-row lg:p-4">
        {/* Hero — hidden below lg (mobile + smaller tablets). */}
        <div className="relative hidden overflow-hidden rounded-3xl lg:flex lg:w-[52%] lg:flex-col lg:justify-end">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src={HERO_VIDEO_SRC} type="video/mp4" />
          </video>
          <div className="relative z-10 w-full max-w-[420px] p-10 xl:p-12">
            {hero}
          </div>
        </div>

        {/* Auth form column. */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-[480px]">
            <div
              className={`transition duration-700 ease-out motion-reduce:transition-none ${
                mounted
                  ? 'translate-y-0 opacity-100'
                  : 'motion-safe:translate-y-2 motion-safe:opacity-0'
              }`}
            >
              {children}
            </div>
            <p className="mt-12 text-center text-[11px] text-muted-foreground">
              Built for better job searches.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthShell
