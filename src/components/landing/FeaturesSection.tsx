import type { ReactNode } from 'react'
import {
  ActivityIcon,
  ApplicationsIcon,
  BriefcaseIcon,
  CalendarIcon,
} from '../icons/Icons'
import { Reveal, Stagger } from './Reveal'
import { staggerIndex } from './staggerStyle'

/**
 * The core feature set. Every card describes a capability that exists in the
 * product today — application records with status and search/filter, the status
 * pipeline, interview details, and the dashboard overview. No invented AI,
 * integrations, or automation.
 */
const FEATURES: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <BriefcaseIcon className="h-5 w-5" />,
    title: 'Application tracking',
    body: 'Capture every role — company, title, location, link, and notes — and update its status as things move. Search and filter to find any application in seconds.',
  },
  {
    icon: <ApplicationsIcon className="h-5 w-5" />,
    title: 'A clear pipeline',
    body: 'See exactly where each opportunity stands across Wishlist, Applied, Interview, Offer, and Rejected — your whole search at a glance.',
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    title: 'Interview tracking',
    body: 'Keep the interview date, time, type, and meeting link attached to the right application, so you are always ready for what is next.',
  },
  {
    icon: <ActivityIcon className="h-5 w-5" />,
    title: 'Dashboard insights',
    body: 'Open to your stats, recent applications, upcoming interviews, and quick actions — the pulse of your whole search on one screen.',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-28 px-4 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <span className="lp-eyebrow">Features</span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--lp-cream)] sm:text-4xl">
            Everything you need to run your search.
          </h2>
          <p className="mt-5 text-base text-[var(--lp-muted)] sm:text-lg">
            Purpose-built for the job hunt, not a generic to-do list. Track
            applications, follow your pipeline, prepare for interviews, and see it
            all on one dashboard.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="lp-item group lp-card p-6 transition-transform duration-300 hover:-translate-y-1"
              style={staggerIndex(index)}
            >
              <span className="lp-icon-badge h-11 w-11">{feature.icon}</span>
              <h3 className="mt-5 text-lg font-semibold text-[var(--lp-cream)]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--lp-muted)]">{feature.body}</p>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export default FeaturesSection
