import { ExternalLinkIcon, PencilIcon, TrashIcon } from '../../../components/icons/Icons'
import type { Achievement, AchievementType } from '../../../types/achievement'

interface AchievementCardProps {
  achievement: Achievement
  onEdit: (achievement: Achievement) => void
  onDelete: (id: string) => void
}

function getTypeIcon(type: AchievementType): string {
  switch (type) {
    case 'Certification':
      return '🏆'
    case 'Award':
      return '🎖'
    case 'Hackathon':
      return '💻'
    case 'Course':
      return '📚'
    case 'Competition':
      return '🎯'
    case 'Recognition':
      return '⭐'
    default:
      return '🏷'
  }
}

function isOpenableUrl(url: string | undefined): url is string {
  return (
    typeof url === 'string' &&
    (url.startsWith('https://') || url.startsWith('http://'))
  )
}

function AchievementCard({
  achievement,
  onEdit,
  onDelete,
}: AchievementCardProps) {
  const { id, title, issuer, type, date, description, credentialUrl } =
    achievement

  const typeIcon = getTypeIcon(type)

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-md space-y-4">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span aria-hidden="true" className="text-xl shrink-0">
              {typeIcon}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-foreground">
                {title}
              </h3>
              <p className="truncate text-xs font-semibold text-muted-foreground">
                {issuer}
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
            {type}
          </span>
        </div>

        {date ? (
          <p className="text-xs text-muted-foreground/80 font-medium">
            Completed · {date}
          </p>
        ) : null}

        {description ? (
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        {isOpenableUrl(credentialUrl) ? (
          <a
            href={credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View credential for ${title} (opens in a new tab)`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>View Credential</span>
            <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
          </a>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(achievement)}
            aria-label={`Edit ${title}`}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(id)}
            aria-label={`Delete ${title}`}
            className="inline-flex items-center gap-1 rounded-lg border border-danger/30 bg-surface px-2.5 py-1.5 text-xs font-semibold text-danger-fg transition-all hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default AchievementCard
