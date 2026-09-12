import type { ReactNode } from 'react'
import {
  BellAlertIcon,
  CompassIcon,
  SearchIcon,
} from '../icons/Icons'
import { Reveal, Stagger } from './Reveal'
import { staggerIndex } from './staggerStyle'

/**
 * The three pillars of intelligent job discovery in JobTrack.
 */
const DISCOVERY_FEATURES: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <CompassIcon className="h-5 w-5" />,
    title: 'Personalized Recommendations',
    body: 'Jobs ranked by your skills, preferences, and search history — the best matches surface first.',
  },
  {
    icon: <SearchIcon className="h-5 w-5" />,
    title: 'Advanced Search',
    body: 'Multi-term search with field-weighted relevance, progressive filters, and instant results.',
  },
  {
    icon: <BellAlertIcon className="h-5 w-5" />,
    title: 'Job Alerts',
    body: 'Get notified when new opportunities match your criteria — so you never miss the right role.',
  },
]

/**
 * Job Discovery section — three cards for the discovery layer of JobTrack.
 * 3-column on desktop, stacked on mobile.
 */
function JobDiscovery() {
  return (
    <section id="discovery" className="scroll-mt-28 px-4 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <span className="lp-eyebrow">Job Discovery</span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--lp-cream)] sm:text-4xl">
            Find the right opportunities,{' '}
            <span className="lp-serif text-[var(--lp-cream-2)]">faster.</span>
          </h2>
          <p className="mt-5 text-base text-[var(--lp-muted)] sm:text-lg">
            Stop scrolling job boards. JobTrack surfaces the roles that actually
            match what you are looking for — and tells you why.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
          {DISCOVERY_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="lp-item group lp-card p-6 transition-transform duration-300 hover:-translate-y-1"
              style={staggerIndex(index)}
            >
              <span className="lp-icon-badge h-11 w-11">{feature.icon}</span>
              <h3 className="mt-5 text-lg font-semibold text-[var(--lp-cream)]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--lp-muted)]">
                {feature.body}
              </p>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export default JobDiscovery
