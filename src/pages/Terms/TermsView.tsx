import { TERMS_SEO } from '../../seo/seo'
import { useDocumentMeta } from '../../seo/useDocumentMeta'

function TermsView() {
  useDocumentMeta(TERMS_SEO)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <header className="border-b border-border pb-6 sm:pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: August 28, 2026
          </p>
        </header>

        {/* Content */}
        <article className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90 sm:text-base sm:leading-relaxed">
          {/* Section 1: Acceptance of Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using <strong>JobTrack</strong> (&quot;the Service&quot;), available at{' '}
              <a
                href="https://www.jobtrack.co.in"
                className="font-medium text-primary hover:underline"
              >
                https://www.jobtrack.co.in
              </a>, you agree to be bound by these Terms &amp; Conditions (&quot;Terms&quot;). If you do not agree to all of these Terms, you may not access or use JobTrack.
            </p>
          </section>

          {/* Section 2: Description of the Service */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              2. Description of the Service
            </h2>
            <p>
              JobTrack is a job search management platform providing toolsets to track job applications, visualize application pipelines (Kanban boards), schedule and monitor interview events, record professional skills and achievements, and maintain candidate profiles.
            </p>
          </section>

          {/* Section 3: User Accounts */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              3. User Accounts
            </h2>
            <p>
              To access certain features of JobTrack, you must register an account. You agree to provide accurate, current, and complete information during registration and to update your profile information as necessary. You are responsible for safeguarding your login credentials and for all activities that occur under your account.
            </p>
          </section>

          {/* Section 4: User Responsibilities */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              4. User Responsibilities
            </h2>
            <p>
              You agree to use JobTrack in compliance with all applicable laws and regulations. You must not share access to your account with unauthorized third parties or attempt to compromise the security of the platform.
            </p>
          </section>

          {/* Section 5: User-Provided Information */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              5. User-Provided Information
            </h2>
            <p>
              You retain full ownership of all job application records, notes, candidate profile details, and media uploaded to JobTrack. You grant JobTrack a limited, non-exclusive license to host, store, and display your content solely as necessary to provide the Service to you.
            </p>
          </section>

          {/* Section 6: Acceptable Use */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              6. Acceptable Use
            </h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Attempting to probe, scan, or test the vulnerability of the system or network.</li>
              <li>Reverse engineering, decompiling, or disassembling any portion of the application.</li>
              <li>Using automated bots, scrapers, or scripts to extract data from JobTrack without authorization.</li>
              <li>Using the platform to distribute malicious software, spam, or unlawful material.</li>
            </ul>
          </section>

          {/* Section 7: Job Application Data */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              7. Job Application Data
            </h2>
            <p>
              JobTrack is an independent organizational tool designed to help candidate job-seekers manage their applications. JobTrack is not affiliated with, endorsed by, or partnered with third-party employers, recruitment portals, or corporate job boards where applications are submitted.
            </p>
          </section>

          {/* Section 8: Third-Party Services */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              8. Third-Party Services
            </h2>
            <p>
              The Service integrates with third-party providers (such as Supabase for database hosting and Google/GitHub for authentication). Your interaction with third-party services is subject to their respective terms and privacy policies.
            </p>
          </section>

          {/* Section 9: Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              9. Intellectual Property
            </h2>
            <p>
              The JobTrack application, including its source code, design system, user interface, brand assets, and logos, is protected by intellectual property laws. You may not copy, modify, or distribute any part of JobTrack without express written permission.
            </p>
          </section>

          {/* Section 10: Service Availability */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              10. Service Availability
            </h2>
            <p>
              We strive to maintain high uptime and operational stability for JobTrack. However, the Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of uninterrupted availability or faultless performance.
            </p>
          </section>

          {/* Section 11: Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              11. Disclaimer
            </h2>
            <p className="text-muted-foreground">
              JobTrack provides organizational and application tracking tools for job seekers. JobTrack does not guarantee employment outcomes, interview callback rates, or job offers resulting from your use of the platform.
            </p>
          </section>

          {/* Section 12: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              12. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by applicable law, JobTrack shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data or employment opportunities arising out of or related to your use of the Service.
            </p>
          </section>

          {/* Section 13: Account Suspension or Termination */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              13. Account Suspension or Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your access to JobTrack at our discretion, without prior notice, if you violate these Terms or engage in fraudulent or abusive behavior. You may terminate your account at any time by requesting deletion in Settings.
            </p>
          </section>

          {/* Section 14: Changes to Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              14. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Updated versions will be published on this page with a revised effective date. Continued use of JobTrack after changes take effect constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 15: Governing Law / Jurisdiction */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              15. Governing Law / Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without giving effect to any principles of conflicts of law.
            </p>
          </section>

          {/* Contact Section */}
          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Questions &amp; Contact
            </h2>
            <p>
              If you have any questions regarding these Terms &amp; Conditions, please contact us at:
            </p>
            <p className="font-medium text-foreground">
              Email:{' '}
              <a
                href="mailto:support@jobtrack.co.in"
                className="text-primary hover:underline"
              >
                support@jobtrack.co.in
              </a>
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}

export default TermsView
