import { useEffect } from 'react'
import type { RouteSeo } from './seo'

/**
 * Find an existing `<meta name="...">` in <head>, or create and append one.
 * index.html already ships name="description", so on the public routes this
 * updates that single tag in place rather than adding a duplicate.
 */
function ensureNamedMeta(name: string): HTMLMetaElement {
  const existing = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`,
  )
  if (existing) return existing
  const created = document.createElement('meta')
  created.setAttribute('name', name)
  document.head.appendChild(created)
  return created
}

/** Find the existing `<link rel="canonical">`, or create and append one. */
function ensureCanonicalLink(): HTMLLinkElement {
  const existing = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )
  if (existing) return existing
  const created = document.createElement('link')
  created.setAttribute('rel', 'canonical')
  document.head.appendChild(created)
  return created
}

/**
 * Route-aware document metadata for this client-rendered SPA.
 *
 * A React + Vite app serves one static index.html for every route, whose
 * <title>, description and canonical describe the default (the landing page).
 * A public route calls this hook to override those three tags while it is
 * mounted, editing the EXISTING tags in place (never appending duplicates) and
 * restoring the previous values on unmount — so, for example, the /login title
 * never lingers on the authenticated dashboard the user lands on after signing
 * in. Googlebot executes JS and picks up these updates.
 *
 * Deliberately imperative (a tiny useEffect over the DOM) instead of React 19's
 * tag hoisting, which would render a SECOND <title>/<meta> next to index.html's.
 * No SEO dependency is introduced. This is a browser-only concern; there is no
 * SSR in this app, so running inside an effect is correct.
 */
export function useDocumentMeta({ title, description, canonical }: RouteSeo) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    const descriptionMeta = ensureNamedMeta('description')
    const previousDescription = descriptionMeta.getAttribute('content')
    descriptionMeta.setAttribute('content', description)

    const canonicalLink = ensureCanonicalLink()
    const previousCanonical = canonicalLink.getAttribute('href')
    canonicalLink.setAttribute('href', canonical)

    return () => {
      document.title = previousTitle
      if (previousDescription !== null) {
        descriptionMeta.setAttribute('content', previousDescription)
      }
      if (previousCanonical !== null) {
        canonicalLink.setAttribute('href', previousCanonical)
      }
    }
  }, [title, description, canonical])
}
