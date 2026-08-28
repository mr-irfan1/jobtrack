import type { CSSProperties, ReactNode } from 'react'
import { useInView } from './useInView'

/**
 * Fade-and-rise wrapper: renders in its hidden pre-animation state, then
 * transitions in the first time it scrolls into view. `delay` (ms) offsets a
 * single element; for lists of siblings prefer <Stagger> instead.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const style = delay
    ? ({ transitionDelay: `${delay}ms` } as CSSProperties)
    : undefined
  return (
    <div
      ref={ref}
      style={style}
      className={`lp-reveal ${inView ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Slide-in-from-the-right wrapper — used where an element should enter from the
 * side (e.g. the interview card) rather than rising. Same reduced-motion and
 * fallback guarantees as <Reveal>.
 */
export function RevealX({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`lp-reveal-x ${inView ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Container whose direct children cascade in one after another. Mark each child
 * with `className="lp-item"` and `style={staggerIndex(i)}` (from ./staggerStyle)
 * to set its order.
 */
export function Stagger({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`lp-stagger ${inView ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
