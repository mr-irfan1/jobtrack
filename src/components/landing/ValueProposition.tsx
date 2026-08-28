import { Reveal } from './Reveal'

/**
 * The value proposition: a single editorial statement of the problem JobTrack
 * solves. Deliberately sparse — large type, generous whitespace, one restrained
 * serif accent — to give the page a breath between the product preview and the
 * feature detail below.
 */
function ValueProposition() {
  return (
    <section className="px-4 py-24 sm:py-32">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="lp-eyebrow">Job search, without the chaos</span>
        <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--lp-cream)] sm:text-5xl">
          Stop scattering your search across{' '}
          <span className="lp-serif text-[var(--lp-muted)]">
            spreadsheets, inboxes, and sticky notes.
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--lp-muted)] sm:text-lg">
          JobTrack gives every application a home — its status, its details, and
          its next step — so nothing slips through the cracks and you always know
          what to do next.
        </p>
      </Reveal>
    </section>
  )
}

export default ValueProposition
