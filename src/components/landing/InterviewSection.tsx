import type { ReactNode } from 'react'
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  ExternalLinkIcon,
} from '../icons/Icons'
import { Reveal, RevealX } from './Reveal'
import { StatusChip } from './StatusChip'

/** Real interview details tracked per application (interviewType is free-text). */
const INTERVIEW_POINTS = [
  'Date and time for every scheduled interview',
  'A type label for each round — phone screen, technical, on-site, whatever fits',
  'The meeting link kept right on the application',
  'Upcoming interviews surfaced on your dashboard',
]

function DetailBlock({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-[var(--lp-line)] bg-black/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-[var(--lp-muted)]">
        <span className="text-[var(--lp-accent)]">{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-[var(--lp-cream)]">
        {value}
      </div>
    </div>
  )
}

/**
 * Interview management: an editorial left column with a checklist of the real
 * fields, and a presentation-only interview card that slides in from the right.
 * Copy claims only what exists — details you record and can see; no reminders or
 * automatic notifications are promised.
 */
function InterviewSection() {
  return (
    <section id="interviews" className="scroll-mt-28 px-4 py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <span className="lp-eyebrow">Interviews</span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--lp-cream)] sm:text-4xl">
            Walk into every interview prepared.
          </h2>
          <p className="mt-5 text-base text-[var(--lp-muted)] sm:text-lg">
            When an application reaches the interview stage, JobTrack keeps the
            details that matter — the date, the time, the type, and the meeting
            link — right where you need them.
          </p>
          <ul className="mt-8 space-y-3">
            {INTERVIEW_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-sm text-[var(--lp-cream-2)]"
              >
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--lp-accent)]" />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>

        <RevealX>
          <div
            role="img"
            aria-label="Example interview card showing status, company, role, date, time, type and meeting link."
            className="lp-card p-6"
          >
            <div className="flex items-center justify-between">
              <StatusChip status="Interview" />
              <span className="text-xs text-[var(--lp-muted)]">In 2 days</span>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-[var(--lp-cream)]">
              Northwind
            </h3>
            <p className="text-sm text-[var(--lp-muted)]">
              Senior Frontend Engineer
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <DetailBlock
                icon={<CalendarIcon className="h-4 w-4" />}
                label="Date"
                value="Thu, Sep 4"
              />
              <DetailBlock
                icon={<ClockIcon className="h-4 w-4" />}
                label="Time"
                value="2:30 PM"
              />
              <DetailBlock
                icon={<BriefcaseIcon className="h-4 w-4" />}
                label="Type"
                value="Technical Interview"
              />
              <DetailBlock
                icon={<ExternalLinkIcon className="h-4 w-4" />}
                label="Meeting link"
                value="Join call"
              />
            </div>
          </div>
        </RevealX>
      </div>
    </section>
  )
}

export default InterviewSection
