import { Link } from 'react-router-dom'
import Panel from '../../../components/Panel/Panel'
import StatusBadge from '../../../components/StatusBadge/StatusBadge'
import { BriefcaseIcon } from '../../../components/icons/Icons'
import type { JobApplication } from '../../../types/application'

interface RecentApplicationsProps {
  applications: JobApplication[]
}

/**
 * The most recent applications as a compact list: company, job title, status
 * (via the shared StatusBadge, so styling stays consistent app-wide) and the
 * application date. Presentational only — the (already sorted + limited) list is
 * supplied by the ViewModel via getRecentApplications. A "View all" link jumps
 * to the existing Applications route.
 */
function RecentApplications({ applications }: RecentApplicationsProps) {
  return (
    <Panel
      title="Recent Applications"
      titleId="recent-applications-heading"
      icon={<BriefcaseIcon className="h-4 w-4" />}
      action={
        <Link
          to="/applications"
          className="rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          View all
        </Link>
      }
    >
      {applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {applications.map((application) => (
            <li
              key={application.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  <Link
                    to={`/applications/${application.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {application.company}
                  </Link>
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  <Link
                    to={`/applications/${application.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {application.jobTitle}
                  </Link>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={application.status} />
                <span className="text-xs tabular-nums text-muted-foreground/70">
                  {application.applicationDate}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export default RecentApplications
