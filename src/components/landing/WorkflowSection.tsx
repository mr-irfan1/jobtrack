import type { ReactNode } from 'react'
import {
  ApplicationsIcon,
  BookmarkIcon,
  CalendarIcon,
  ClockArrowIcon,
  DocumentDuplicateIcon,
} from '../icons/Icons'
import { Reveal, Stagger } from './Reveal'
import { staggerIndex } from './staggerStyle'

/**
 * The five core workflow tools that every JobTrack user interacts with daily.
 */
const WORKFLOW_TOOLS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <ApplicationsIcon className="h-5 w-5" />,
    title: 'Applications',
    body: 'Track every role from wishlist to offer with status, notes, and a complete history of where you stand.',
  },
  {
    icon: <BookmarkIcon className="h-5 w-5" />,
    title: 'Saved Jobs',
    body: 'Bookmark opportunities you want to come back to — and see them scored against your profile.',
  },
  {
    icon: <DocumentDuplicateIcon className="h-5 w-5" />,
    title: 'Resumes',
    body: 'Manage multiple resume versions with AI analysis, tailoring suggestions, and ATS scoring.',
  },
  {
    icon: <ClockArrowIcon className="h-5 w-5" />,
    title: 'Follow-ups',
    body: 'Set reminders and deadlines so you never let an opportunity go cold or a conversation die.',
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    title: 'Interviews',
    body: 'Keep date, time, type, and meeting links organized per application — always know what is next.',
  },
]

/**
 * Workflow section — the five everyday tools that make up the JobTrack
 * workspace. 3+2 grid on desktop (last two cards centre), stacked on mobile.
 */
function WorkflowSection() {
  return (
    <section id="workflow" className="scroll-mt-28 px-4 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <span className="lp-eyebrow">Your Complete Workflow</span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--lp-cream)] sm:text-4xl">
            Everything you need{' '}
            <span className="lp-serif text-[var(--lp-cream-2)]">
              in one place.
            </span>
          </h2>
          <p className="mt-5 text-base text-[var(--lp-muted)] sm:text-lg">
            Purpose-built for the job hunt, not a generic to-do list. Track
            applications, follow your pipeline, and stay prepared — without
            jumping between tools.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_TOOLS.map((tool, index) => (
            <div
              key={tool.title}
              className="lp-item group lp-card p-6 transition-transform duration-300 hover:-translate-y-1"
              style={staggerIndex(index)}
            >
              <span className="lp-icon-badge h-11 w-11">{tool.icon}</span>
              <h3 className="mt-5 text-lg font-semibold text-[var(--lp-cream)]">
                {tool.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--lp-muted)]">{tool.body}</p>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export default WorkflowSection
