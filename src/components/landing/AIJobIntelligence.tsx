import type { ReactNode } from 'react'
import {
  BoltIcon,
  ChatBubbleIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  SparklesIcon,
  TargetIcon,
} from '../icons/Icons'
import { Reveal, Stagger } from './Reveal'
import { staggerIndex } from './staggerStyle'

/**
 * The six AI-powered tools in JobTrack. Each card describes a real product
 * capability — no vapourware, no unreleased features.
 */
const AI_TOOLS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <TargetIcon className="h-5 w-5" />,
    title: 'Job Match',
    body: 'Instant AI analysis of how well you fit each role — skill overlap, gaps, and an honest match score.',
  },
  {
    icon: <BoltIcon className="h-5 w-5" />,
    title: 'ATS Analysis',
    body: 'Score your resume against applicant tracking systems before you hit submit.',
  },
  {
    icon: <DocumentTextIcon className="h-5 w-5" />,
    title: 'Resume Tailoring',
    body: 'AI-guided optimization that highlights the right skills and keywords for each specific job.',
  },
  {
    icon: <EnvelopeIcon className="h-5 w-5" />,
    title: 'Cover Letter',
    body: 'Generate personalized, role-specific cover letters grounded in your actual experience.',
  },
  {
    icon: <ChatBubbleIcon className="h-5 w-5" />,
    title: 'Interview Prep',
    body: 'Practice questions and strategy tailored to the role, the company, and your background.',
  },
  {
    icon: <SparklesIcon className="h-5 w-5" />,
    title: 'Application Copilot',
    body: 'Smart suggestions throughout your application workflow — so nothing gets missed.',
  },
]

/**
 * AI Job Intelligence section — showcasing the six AI-powered tools that make
 * JobTrack more than a tracker. Uses the same card + stagger pattern as the rest
 * of the landing page. 3-column on desktop, 2-column on tablet, stacked on
 * mobile.
 */
function AIJobIntelligence() {
  return (
    <section id="ai-intelligence" className="scroll-mt-28 px-4 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <span className="lp-eyebrow">AI-Powered Intelligence</span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--lp-cream)] sm:text-4xl">
            Your AI copilot for every step{' '}
            <span className="lp-serif text-[var(--lp-cream-2)]">
              of the job search.
            </span>
          </h2>
          <p className="mt-5 text-base text-[var(--lp-muted)] sm:text-lg">
            Six purpose-built AI tools that analyze, optimize, and prepare — so
            you can focus on landing the role, not the paperwork.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_TOOLS.map((tool, index) => (
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

export default AIJobIntelligence
