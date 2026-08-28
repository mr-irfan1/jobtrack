import { PRIVACY_POLICY_SEO } from '../../seo/seo'
import { useDocumentMeta } from '../../seo/useDocumentMeta'

function PrivacyPolicyView() {
  useDocumentMeta(PRIVACY_POLICY_SEO)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <header className="border-b border-border pb-6 sm:pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: August 28, 2026
          </p>
        </header>

        {/* Content */}
        <article className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90 sm:text-base sm:leading-relaxed">
          {/* Section 1: Introduction */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              1. Introduction
            </h2>
            <p>
              Welcome to <strong>JobTrack</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
              JobTrack is a job application tracking platform designed to help candidates
              organize job searches, track application pipelines, schedule interviews, maintain
              professional achievements, and manage candidate profile data in one place.
            </p>
            <p>
              We are committed to protecting your personal information and your right to privacy.
              This Privacy Policy explains how we collect, use, store, and safeguard your data
              when you use our web application at{' '}
              <a
                href="https://www.jobtrack.co.in"
                className="font-medium text-primary hover:underline"
              >
                https://www.jobtrack.co.in
              </a>.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              2. Information We Collect
            </h2>
            <p>
              We only collect information that is strictly necessary to provide and operate the JobTrack service. This includes data explicitly provided by you during account creation and platform usage:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong className="text-foreground">Account &amp; Profile Information:</strong> Your full name, email address, job headline, bio summary, location, and avatar preferences.
              </li>
              <li>
                <strong className="text-foreground">Authentication Information:</strong> Account credentials, hashed password data, and OAuth session tokens managed securely via Supabase Auth.
              </li>
              <li>
                <strong className="text-foreground">Job Application Data:</strong> Information you enter regarding target applications, including company name, job title, application stage, compensation details, job descriptions, and custom notes.
              </li>
              <li>
                <strong className="text-foreground">Skills &amp; Achievements:</strong> Professional skill tags, certifications, hackathon awards, courses, and completion dates.
              </li>
              <li>
                <strong className="text-foreground">Professional &amp; Social Links:</strong> Portfolio URLs, LinkedIn profile links, and GitHub handles added to your account.
              </li>
              <li>
                <strong className="text-foreground">Interview Schedule:</strong> Interview dates, times, interview types, interviewer names, and preparation notes.
              </li>
              <li>
                <strong className="text-foreground">Preferences &amp; Notifications:</strong> Theme choices (Light/Dark mode), notification read states, and target application defaults.
              </li>
              <li>
                <strong className="text-foreground">Technical Log Data:</strong> Basic browser metadata, operating system type, and IP address necessary for authentication diagnostics and system stability.
              </li>
            </ul>
          </section>

          {/* Section 3: How We Use Information */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              3. How We Use Information
            </h2>
            <p>We use your information exclusively for legitimate service delivery purposes, including:</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Providing, operating, and maintaining the JobTrack application.</li>
              <li>Managing user accounts, session authentication, and security checks.</li>
              <li>Displaying your job application pipeline, interview calendar, and notifications.</li>
              <li>Persisting your profile, skills, achievements, and account settings.</li>
              <li>Sending essential transactional notifications (such as verification emails and password reset links).</li>
              <li>Improving application reliability, response times, and user experience.</li>
            </ul>
          </section>

          {/* Section 4: Authentication */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              4. Authentication
            </h2>
            <p>
              Authentication on JobTrack is powered securely by <strong>Supabase Authentication</strong>.
              We support standard email/password authentication as well as third-party Social OAuth providers
              such as <strong>Google</strong> and <strong>GitHub</strong>.
            </p>
            <p className="text-muted-foreground">
              When you authenticate using Google or GitHub, JobTrack receives basic profile confirmation
              and email details from the provider. JobTrack <strong>never</strong> receives or stores your Google or GitHub account passwords.
            </p>
          </section>

          {/* Section 5: Data Storage and Security */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              5. Data Storage and Security
            </h2>
            <p>
              We implement industry-standard technical and organizational security measures to protect your personal data, including HTTPS/TLS encryption in transit, secure database Row Level Security (RLS) policies, and encrypted password hashing.
            </p>
            <p className="text-muted-foreground">
              While we follow rigorous security standards, no electronic storage system or internet transmission can be guaranteed to be 100% immune to unauthorized access. We continuously audit and update our infrastructure to maintain maximum security.
            </p>
          </section>

          {/* Section 6: Data Sharing */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              6. Data Sharing
            </h2>
            <p>
              <strong>JobTrack does not sell, rent, or trade your personal data</strong> to advertisers or third parties.
            </p>
            <p className="text-muted-foreground">
              Data is shared only with cloud infrastructure and database service providers (such as Supabase) strictly required to host and execute the application.
            </p>
          </section>

          {/* Section 7: Cookies and Similar Technologies */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              7. Cookies and Similar Technologies
            </h2>
            <p>
              JobTrack uses essential browser local storage and authentication session tokens strictly required for:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Maintaining your authenticated session state across page refreshes.</li>
              <li>Persisting your preferred theme interface selection (Light mode / Dark mode).</li>
            </ul>
            <p className="text-muted-foreground">
              JobTrack does <strong>not</strong> use third-party advertising cookies, behavioral tracking pixels, or cross-site marketing analytics.
            </p>
          </section>

          {/* Section 8: User Rights and Data Control */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              8. User Rights and Data Control
            </h2>
            <p>
              You maintain full control over your personal information within JobTrack:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <strong className="text-foreground">Access &amp; Edit:</strong> You can view, update, or edit your profile details, skills, social links, and applications at any time in Account Settings.
              </li>
              <li>
                <strong className="text-foreground">Account Deletion:</strong> You may permanently delete your account and all associated application data at any time via the Security &amp; Account controls in Settings (`/settings`).
              </li>
            </ul>
          </section>

          {/* Section 9: Data Retention */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              9. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your account remains active. Upon requesting account deletion, your user profile, application entries, interviews, skills, and settings are permanently erased from our database.
            </p>
          </section>

          {/* Section 10: Third-Party Services */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              10. Third-Party Services
            </h2>
            <p>
              JobTrack integrates with trusted infrastructure providers:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong className="text-foreground">Supabase:</strong> Managed database, authentication, and security infrastructure.</li>
              <li><strong className="text-foreground">Google OAuth &amp; GitHub OAuth:</strong> Optional identity provider services for social sign-in.</li>
            </ul>
          </section>

          {/* Section 11: Children's Privacy */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              11. Children&apos;s Privacy
            </h2>
            <p>
              JobTrack is designed for job-seeking professionals and is not directed at children under the age of 13 (or 16 in certain jurisdictions). We do not knowingly collect personal data from children.
            </p>
          </section>

          {/* Section 12: Changes to This Privacy Policy */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              12. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy periodically to reflect platform enhancements or legal requirements. Material changes will be posted on this page with an updated revision date.
            </p>
          </section>

          {/* Section 13: Contact Us */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              13. Contact Us
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please contact us at:
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

export default PrivacyPolicyView
