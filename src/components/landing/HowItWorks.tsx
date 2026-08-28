import { Reveal, Stagger } from './Reveal'
import { staggerIndex } from './staggerStyle'

/** Three honest steps — add, track, stay ready. No setup or imports implied. */
const STEPS: { title: string; body: string }[] = [
  {
    title: 'Add your applications',
    body: 'Save any role you are chasing with its company, title, location, and link — then set where it stands.',
  },
  {
    title: 'Track every stage',
    body: 'Advance each application through Applied, Interview, and Offer as your search moves forward.',
  },
  {
    title: 'Stay ready for what is next',
    body: 'Check your dashboard for upcoming interviews, recent activity, and what needs your attention.',
  },
]

/**
 * How it works: three numbered steps in the product's own language. Large serif
 * numerals, minimal chrome, staggered reveal.
 */
function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 px-4 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <span className="lp-eyebrow">How it works</span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--lp-cream)] sm:text-4xl">
            Up and running in minutes.
          </h2>
          <p className="mt-5 text-base text-[var(--lp-muted)] sm:text-lg">
            No setup, no imports, no learning curve. Add your first application
            and JobTrack does the organizing.
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="lp-item"
              style={staggerIndex(index)}
            >
              <div className="lp-serif text-5xl font-normal text-[var(--lp-accent)]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div
                className="mt-5 h-px w-full bg-[var(--lp-line)]"
                aria-hidden="true"
              />
              <h3 className="mt-5 text-xl font-semibold text-[var(--lp-cream)]">
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
