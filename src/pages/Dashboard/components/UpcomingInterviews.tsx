import Panel from '../../../components/Panel/Panel'
import {
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
} from '../../../components/icons/Icons'
import type { JobApplication } from '../../../types/application'
import EmptyState from './EmptyState'

interface UpcomingInterviewsProps {
  interviews: JobApplication[]
}

/**
 * A meeting link is actionable only when it is an absolute http(s) URL — this
 * keeps the "Join meeting" action from rendering for a blank field or an unsafe
 * value (e.g. a javascript: URL or a scheme-less string). Mirrors the guard used
 * elsewhere for external links.
 */
function isJoinableMeetingLink(link: string | undefined): link is string {
  return (
    typeof link === 'string' &&
    (link.startsWith('https://') || link.startsWith('http://'))
  )
}

/**
 * Upcoming interviews as a vertical timeline. Shows company, job title,
 * interview date, and — when present — time, type, and a join-meeting link.
 * Presentational only: the (already filtered + sorted) list is supplied by the
 * ViewModel via getUpcomingInterviews. Renders a polished empty state when there
 * are none.
 */
function UpcomingInterviews({ interviews }: UpcomingInterviewsProps) {
  return (
    <Panel
      title="Upcoming Interviews"
      titleId="upcoming-interviews-heading"
      icon={<CalendarIcon className="h-4 w-4" />}
    >
      {interviews.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-6 w-6" />}
          title="No upcoming interviews"
          description="Interviews you schedule on an application will appear here, nearest first."
        />
      ) : (
        <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
          {interviews.map((application) => (
            <li key={application.id} className="relative pl-7">
              <span
                aria-hidden="true"
                className="absolute left-0 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-surface bg-primary shadow-sm ring-1 ring-border"
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {application.company}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {application.jobTitle}
                  </p>
                </div>
                {application.interviewType ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {application.interviewType}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {application.interviewDate}
                </span>
                {application.interviewTime ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {application.interviewTime}
                  </span>
                ) : null}
              </div>
              {isJoinableMeetingLink(application.meetingLink) ? (
                <a
                  href={application.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Join meeting for ${application.company} (opens in a new tab)`}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary transition-colors hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  Join meeting
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

export default UpcomingInterviews
