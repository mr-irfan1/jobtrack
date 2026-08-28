import type { CSSProperties } from 'react'

/**
 * Per-item CSS custom property that drives the staggered transition-delay for a
 * child of a <Stagger> container (see landing.css `.lp-stagger > .lp-item`).
 * Kept in its own module so Reveal.tsx exports only components.
 */
export function staggerIndex(index: number): CSSProperties {
  return { ['--i']: index } as CSSProperties
}
