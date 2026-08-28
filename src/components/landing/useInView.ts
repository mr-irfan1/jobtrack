import { useEffect, useRef, useState } from 'react'

/** True when the visitor has asked the platform to minimize motion. */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Reveal-on-scroll primitive for the landing page. Returns a ref to attach to an
 * element plus a boolean that flips to true the first time that element enters
 * the viewport — and then stays true, so a revealed section never re-hides.
 *
 * Motion is strictly opt-out: when the visitor prefers reduced motion, or when
 * IntersectionObserver is unavailable, it starts already-visible (via the lazy
 * initializer) so content is never left stuck in its hidden pre-animation state.
 */
export function useInView<T extends Element = HTMLDivElement>() {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === 'undefined' || prefersReducedMotion(),
  )

  useEffect(() => {
    if (inView) {
      return
    }
    const element = ref.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [inView])

  return { ref, inView }
}
