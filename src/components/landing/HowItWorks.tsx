import type { ReactNode } from 'react'
import {
  CalendarIcon,
  ChatBubbleIcon,
  ClockArrowIcon,
  SearchIcon,
  SendIcon,
  TargetIcon,
} from '../icons/Icons'
import { Reveal, Stagger } from './Reveal'
import { staggerIndex } from './staggerStyle'

/**
 * The six-step JobTrack flow: Find → Match → Prepare → Apply → Follow Up →
 * Interview. Each step describes a real user action and its outcome — no
 * aspirational language, just what the product does.
 */
const STEPS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <SearchIcon className="h-5 w-5" />,
    title: 'Find',
    body: 'Discover jobs through personalized recommendations and advanced search.',
  },
  {
    icon: <TargetIcon className="h-5 w-5" />,
    title: 'Match',
    body: 'AI analyzes job fit against your skills, experience, and preferences.',
  },
  {
    icon: <ChatBubbleIcon className="h-5 w-5" />,
    title: 'Prepare',
    body: 'Tailor your resume, generate cover letters, and prep for interviews.',
  },
  {
    icon: <SendIcon className="h-5 w-5" />,
    title: 'Apply',
    body: 'Track every application through your organized pipeline.',
  },
  {
    icon: <ClockArrowIcon className="h-5 w-5" />,
    title: 'Follow Up',
    body: 'Set reminders and never let an opportunity go cold.',
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    title: 'Interview',
    body: 'Walk into every conversation prepared and confident.',
  },
]

/**
 * How JobTrack Works: six numbered steps in a horizontal flow. Large serif
 * numerals, connecting divider lines, minimal chrome, staggered reveal.
 * 3-column on desktop (two rows of 3), 2-column on tablet, stacked on mobile.
 */
function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 px-4 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="lp-eyebrow">How JobTrack works</span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--lp-cream)] sm:text-4xl">
            From discovery to offer,{' '}
            <span className="lp-serif text-[var(--lp-cream-2)]">
              in six steps.
            </span>
          </h2>
          <p className="mt-5 text-base text-[var(--lp-muted)] sm:text-lg">
            JobTrack guides you through every stage of your job search with
            intelligent tools and a clear, organized workflow.
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="lp-item lp-card p-6"
              style={staggerIndex(index)}
            >
              <div className="flex items-center justify-between">
                <span className="lp-serif text-4xl font-normal text-[var(--lp-accent)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="lp-icon-badge h-10 w-10">{step.icon}</span>
              </div>
              <div
                className="mt-4 h-px w-full bg-[var(--lp-line)]"
                aria-hidden="true"
              />
              <h3 className="mt-4 text-xl font-semibold text-[var(--lp-cream)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--lp-muted)]">{step.body}</p>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export default HowItWorks
