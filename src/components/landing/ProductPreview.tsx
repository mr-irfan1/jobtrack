import type { ReactNode } from 'react'
import type { ApplicationStatus } from '../../types/application'
import {
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
  SendIcon,
  TrophyIcon,
} from '../icons/Icons'
import { Reveal } from './Reveal'
import { StatusChip } from './StatusChip'

/**
 * A framed, presentation-only mock of the JobTrack dashboard. Everything inside
 * is illustrative — placeholder companies and round numbers — so the whole frame
 * is exposed to assistive tech as a single labelled image rather than as data.
 * It uses the real product vocabulary (the five statuses; interview date/time/
 * type/link) but reuses none of the app's live components or theme tokens.
 */

const STATS: { label: string; value: string; icon: ReactNode }[] = [
  { label: 'Total', value: '24', icon: <BriefcaseIcon className="h-4 w-4" /> },
  { label: 'In progress', value: '12', icon: <SendIcon className="h-4 w-4" /> },
  { label: 'Interviews', value: '4', icon: <CalendarIcon className="h-4 w-4" /> },
  { label: 'Offers', value: '2', icon: <TrophyIcon className="h-4 w-4" /> },
]

const COLUMNS: {
  status: ApplicationStatus
  count: number
  cards: { company: string; title: string }[]
}[] = [
  {
    status: 'Wishlist',
    count: 6,
    cards: [{ company: 'Umbrella Co.', title: 'Product Designer' }],
  },
  {
    status: 'Applied',
    count: 12,
    cards: [
      { company: 'Globex', title: 'Backend Engineer' },
      { company: 'Initech', title: 'Data Analyst' },
    ],
  },
  {
    status: 'Interview',
    count: 4,
    cards: [{ company: 'Northwind', title: 'Frontend Engineer' }],
  },
  {
    status: 'Offer',
    count: 2,
    cards: [{ company: 'Soylent', title: 'UX Engineer' }],
  },
  {
    status: 'Rejected',
    count: 3,
    cards: [{ company: 'Acme', title: 'iOS Engineer' }],
  },
]

function InterviewRow({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[var(--lp-cream-2)]">
      <span className="text-[var(--lp-muted)]">{icon}</span>
      {value}
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="px-3 sm:px-4">
      <Reveal className="relative z-10 mx-auto -mt-4 max-w-5xl sm:-mt-8">
        <div
          role="img"
          aria-label="Preview of the JobTrack dashboard: application stats, a status pipeline across Wishlist, Applied, Interview, Offer and Rejected, and an upcoming interview with its date, time, type and meeting link."
          className="overflow-hidden rounded-2xl border border-[var(--lp-line-strong)] bg-[var(--lp-surface)] shadow-2xl shadow-black/60"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--lp-line)] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#f87171]/70" />
            <span className="h-3 w-3 rounded-full bg-[#fbbf24]/70" />
            <span className="h-3 w-3 rounded-full bg-[#34d399]/70" />
            <span className="mx-auto hidden rounded-md border border-[var(--lp-line)] px-3 py-1 text-xs text-[var(--lp-muted)] sm:block">
              app.jobtrack.co.in/dashboard
            </span>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="lp-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--lp-muted)]">
                      {stat.label}
                    </span>
                    <span className="text-[var(--lp-accent)]">{stat.icon}</span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-[var(--lp-cream)]">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {/* Pipeline */}
              <div className="lp-card p-4 lg:col-span-2">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--lp-muted)]">
                  Pipeline
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {COLUMNS.map((column) => (
                    <div key={column.status} className="min-w-[150px] flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <StatusChip status={column.status} />
                        <span className="text-xs text-[var(--lp-muted)]">
                          {column.count}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {column.cards.map((card) => (
                          <div
                            key={card.company}
                            className="rounded-lg border border-[var(--lp-line)] bg-black/30 p-3"
                          >
                            <div className="text-sm font-semibold text-[var(--lp-cream)]">
                              {card.company}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--lp-muted)]">
                              {card.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming interview */}
              <div className="lp-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--lp-muted)]">
                  Upcoming interview
                </div>
                <div className="mt-3 text-sm font-semibold text-[var(--lp-cream)]">
                  Northwind
                </div>
                <div className="text-xs text-[var(--lp-muted)]">
                  Senior Frontend Engineer
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <InterviewRow
                    icon={<CalendarIcon className="h-4 w-4" />}
                    value="Thu, Sep 4"
                  />
                  <InterviewRow
                    icon={<ClockIcon className="h-4 w-4" />}
                    value="2:30 PM"
                  />
                  <InterviewRow
                    icon={<BriefcaseIcon className="h-4 w-4" />}
                    value="Technical Interview"
                  />
                  <InterviewRow
                    icon={<ExternalLinkIcon className="h-4 w-4" />}
                    value="Meeting link"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

export default ProductPreview
