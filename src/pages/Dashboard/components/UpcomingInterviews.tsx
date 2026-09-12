import { Link } from 'react-router-dom'
import {
  CalendarIcon,
  ExternalLinkIcon,
  SparklesIcon,
} from '../../../components/icons/Icons'
import type { JobApplication } from '../../../types/application'

interface UpcomingInterviewsProps {
  interviews: JobApplication[]
}

function isJoinableMeetingLink(link: string | undefined): link is string {
  return (
    typeof link === 'string' &&
    (link.startsWith('https://') || link.startsWith('http://'))
  )
}

/**
 * Editorial Upcoming Interviews section on the Dashboard.
 * Modeled after the Learning list card in the Google Developer Program reference.
 */
function UpcomingInterviews({ interviews }: UpcomingInterviewsProps) {
  return (
    <section aria-labelledby="upcoming-interviews-heading" className="space-y-3">
      {/* SECTION HEADER WITH CIRCULAR BADGE & CALENDAR LINK */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/12 text-sky-600 dark:text-sky-400"
          >
            <CalendarIcon className="h-4 w-4" />
          </span>
          <h2
            id="upcoming-interviews-heading"
            className="text-sm font-semibold tracking-normal text-foreground"
          >
            Upcoming Interviews
          </h2>
        </div>

        <Link
          to="/interviews"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
        >
          <span>Calendar</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* QUIET CONTENT CARD */}
      <div className="rounded-2xl border border-border/40 bg-surface dark:bg-surface-elevated/60 shadow-2xs overflow-hidden transition-colors">
        {interviews.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No upcoming interviews</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              When an interview is scheduled, it appears here with instant AI preparation questions.
            </p>
            <div className="mt-4">
              <Link
                to="/applications"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
              >
                <span>View Applications</span>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/30" aria-label="Upcoming interviews list">
            {interviews.map((application) => {
              const metaParts = [
                application.interviewDate,
                application.interviewTime,
                application.interviewType,
              ].filter(Boolean)

              return (
                <li
                  key={application.id}
                  className="group flex flex-col gap-3 p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                    >
                      <CalendarIcon className="h-4.5 w-4.5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        <Link
                          to={`/applications/${application.id}`}
                          className="hover:text-primary transition-colors hover:underline"
                        >
                          {application.jobTitle}
                        </Link>
                      </p>
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {application.company}
                      </p>

                      {/* QUIET META ROW (Google reference style) */}
                      <p className="mt-1 text-[11px] font-medium tracking-wide uppercase text-muted-foreground/80">
                        {metaParts.join(' · ')}
                      </p>
                    </div>
                  </div>

                  {/* ACTION ROW */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/20 pl-12.5">
                    {isJoinableMeetingLink(application.meetingLink) ? (
                      <a
                        href={application.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <span>Join Meeting</span>
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Scheduled</span>
                    )}

                    <Link
                      to="/interviews"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/70 hover:border-primary/40 transition-colors"
                    >
                      <SparklesIcon className="h-3 w-3 text-primary" />
                      <span>Prepare with AI</span>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

export default UpcomingInterviews
