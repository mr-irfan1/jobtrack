import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { BriefcaseIcon } from '../icons/Icons'
import AuthStepItem from './AuthStepItem'

interface Step {
  label: string
}

const STEPS: Step[] = [
  { label: 'Create your profile' },
  { label: 'Track your applications' },
  { label: 'Land your next opportunity' },
]

interface AuthHeroProps {
  /** Headline copy; accepts a fragment with <br /> for the two-line treatment. */
  headline: ReactNode
  subheadline: string
  /**
   * 1-based index of the journey step to highlight for the current page, or
   * null to keep every step neutral (used on Login).
   */
  activeStep: number | null
}

/**
 * Foreground content for the left hero column: JobTrack brand mark, headline,
 * supporting line, and the three-step job-search journey. Purely presentational.
 *
 * Entrance is a subtle staggered fade-up done with CSS transitions (not
 * keyframes and no animation library): each block starts translated down and
 * transparent, then a mount flag flips it to its resting state with an
 * increasing transition-delay. Under `prefers-reduced-motion` the hidden state
 * is skipped and transitions are disabled, so content appears immediately.
 */
function AuthHero({ headline, subheadline, activeStep }: AuthHeroProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Flip on the next frame so the initial (hidden) state paints first and the
    // staggered CSS transition actually runs; deferring also keeps this out of
    // the render pass. Cleanup cancels a pending frame on immediate unmount.
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const enter = (delay: string) =>
    `transition duration-500 ease-out motion-reduce:transition-none ${delay} ${
      mounted
        ? 'opacity-100 translate-y-0'
        : 'motion-safe:translate-y-3 motion-safe:opacity-0'
    }`

  return (
    <div className="flex flex-col gap-8 [text-shadow:0_1px_24px_rgb(0_0_0_/_0.35)]">
      <div className={`flex items-center gap-3 ${enter('delay-200')}`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white">
          <BriefcaseIcon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-xl font-semibold tracking-tight text-white">
          JobTrack
        </span>
      </div>

      <div className={`flex flex-col gap-4 ${enter('delay-300')}`}>
        <h2 className="text-[42px] font-medium leading-[1.05] tracking-[-0.03em] text-white xl:text-[52px]">
          {headline}
        </h2>
        <p className="max-w-[420px] text-[15px] leading-[1.6] text-white/65">
          {subheadline}
        </p>
      </div>

      <ol className={`flex flex-col gap-2 ${enter('delay-500')}`}>
        {STEPS.map((step, position) => (
          <AuthStepItem
            key={step.label}
            index={position + 1}
            label={step.label}
            active={activeStep === position + 1}
          />
        ))}
      </ol>
    </div>
  )
}

export default AuthHero
