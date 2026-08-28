import type { ReactNode } from 'react'
import type { ApplicationStatus } from '../../types/application'
import {
  CalendarIcon,
  CloseIcon,
  PlusIcon,
  SendIcon,
  TrophyIcon,
} from '../icons/Icons'
import { PIPELINE_STAGES, STATUS_META } from './landingData'
import { Reveal, Stagger } from './Reveal'
import { staggerIndex } from './staggerStyle'
import { StatusChip } from './StatusChip'

/** Glyph per real status — added, submitted, scheduled, won, closed. */
const STAGE_ICON: Record<ApplicationStatus, ReactNode> = {
  Wishlist: <PlusIcon className="h-5 w-5" />,
  Applied: <SendIcon className="h-5 w-5" />,
  Interview: <CalendarIcon className="h-5 w-5" />,
  Offer: <TrophyIcon className="h-5 w-5" />,
  Rejected: <CloseIcon className="h-5 w-5" />,
}

/**
 * The application pipeline: the five real statuses laid out as an ordered flow.
 * Copy is explicit that the user moves applications between stages themselves —
 * JobTrack keeps the whole picture in view but automates nothing.
 */
function PipelineSection() {
  return (
    <section id="pipeline" className="scroll-mt-28 px-4 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <span className="lp-eyebrow">The pipeline</span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--lp-cream)] sm:text-4xl">
            From saved opportunity to signed offer.
          </h2>
          <p className="mt-5 text-base text-[var(--lp-muted)] sm:text-lg">
            Move each application through the stages that matter. You decide when
            something advances — JobTrack keeps your whole search in view at every
            step.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PIPELINE_STAGES.map((stage, index) => (
            <div
              key={stage.status}
              className="lp-item lp-card p-5"
              style={staggerIndex(index)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--lp-muted)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span style={{ color: STATUS_META[stage.status].dot }}>
                  {STAGE_ICON[stage.status]}
                </span>
              </div>
              <div className="mt-6">
                <StatusChip status={stage.status} />
              </div>
              <p className="mt-3 text-sm text-[var(--lp-muted)]">{stage.blurb}</p>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export default PipelineSection
