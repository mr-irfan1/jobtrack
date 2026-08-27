import type { ApplicationStatus } from '../../types/application'
import { STATUS_BADGE_CLASSES } from './statusStyles'

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

/**
 * A small, presentational status pill. Colors come from the shared
 * STATUS_BADGE_CLASSES map so every status looks the same wherever it appears.
 * Holds no state and never touches storage.
 */
function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE_CLASSES[status]}${className ? ` ${className}` : ''}`}
    >
      {status}
    </span>
  )
}

export default StatusBadge
