import { LANDING_SEO } from '../../seo/seo'
import { useDocumentMeta } from '../../seo/useDocumentMeta'
import FeaturesSection from './FeaturesSection'
import FinalCTA from './FinalCTA'
import HeroSection from './HeroSection'
import HowItWorks from './HowItWorks'
import InterviewSection from './InterviewSection'
import LandingFooter from './LandingFooter'
import LandingNavbar from './LandingNavbar'
import PipelineSection from './PipelineSection'
import ProductPreview from './ProductPreview'
import ValueProposition from './ValueProposition'
import './landing.css'

/**
 * Public marketing landing page, shown at "/" to signed-out visitors and
 * crawlers (HomeRoute renders the authenticated dashboard instead when a session
 * is present — this component is never shown to signed-in users). It is a
 * self-contained, always-dark cinematic surface: the `.landing` root paints its
 * own palette and never reads the app's light/dark theme tokens.
 *
 * Route-level SEO (title, description, canonical) is applied imperatively via
 * useDocumentMeta so the homepage keeps its intended metadata; the static
 * JSON-LD and Open Graph tags in index.html are left untouched.
 */
function LandingView() {
  useDocumentMeta(LANDING_SEO)

  return (
    <div className="landing relative min-h-screen overflow-x-hidden">
      <div className="lp-grain" aria-hidden="true" />

      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-[var(--lp-accent)] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <LandingNavbar />

      <main id="main">
        <HeroSection />
        <ProductPreview />
        <ValueProposition />
        <PipelineSection />
        <FeaturesSection />
        <InterviewSection />
        <HowItWorks />
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  )
}

export default LandingView
