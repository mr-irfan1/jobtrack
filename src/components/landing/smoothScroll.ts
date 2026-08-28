/**
 * Smoothly scroll to an in-page section, honoring the visitor's reduced-motion
 * preference (jump instantly when reduce is requested). Used by the landing
 * navbar and footer anchor links; `scroll-mt-*` on each target section offsets
 * the landing point below the fixed navbar.
 */
export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) {
    return
  }

  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  target.scrollIntoView({
    behavior: prefersReduced ? 'auto' : 'smooth',
    block: 'start',
  })
}

/** The in-page sections linked from the navbar and footer, in document order. */
export const NAV_SECTIONS = [
  { id: 'features', label: 'Features' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'how-it-works', label: 'How it works' },
] as const
