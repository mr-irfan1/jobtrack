import type { ApplicationStatus } from '../../types/application'
import { STATUS_META } from './landingData'

/**
 * Small pill showing a real application status, styled for the dark landing
 * palette. Decorative within product mock-ups; the surrounding container carries
 * the accessible description.
 */
export function StatusChip({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: meta.tint, color: meta.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.dot }}
      />
      {status}
    </span>
  )
}
