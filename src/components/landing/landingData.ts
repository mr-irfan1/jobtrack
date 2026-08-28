import type { ApplicationStatus } from '../../types/application'

/**
 * Presentation-only accent colors for each REAL application status, tuned for
 * the always-dark landing palette. This mirrors the product's status vocabulary
 * (Wishlist → Applied → Interview → Offer, plus the Rejected outcome) without
 * reusing the app's StatusBadge, whose theme-reactive tokens would render
 * against light surfaces and break the cinematic look. Values are illustrative
 * styling only — no data is implied.
 */
export const STATUS_META: Record<
  ApplicationStatus,
  { dot: string; text: string; tint: string }
> = {
  Wishlist: { dot: '#94a3b8', text: '#cbd5e1', tint: 'rgba(148, 163, 184, 0.12)' },
  Applied: { dot: '#60a5fa', text: '#93c5fd', tint: 'rgba(96, 165, 250, 0.12)' },
  Interview: { dot: '#fbbf24', text: '#fcd34d', tint: 'rgba(251, 191, 36, 0.12)' },
  Offer: { dot: '#34d399', text: '#86efac', tint: 'rgba(52, 211, 153, 0.12)' },
  Rejected: { dot: '#f87171', text: '#fca5a5', tint: 'rgba(248, 113, 113, 0.12)' },
}

/**
 * The four forward stages plus the closed outcome, in real product order. Each
 * blurb describes only what the status actually means in JobTrack — the user
 * moves applications between stages themselves; nothing is automated.
 */
export const PIPELINE_STAGES: { status: ApplicationStatus; blurb: string }[] = [
  {
    status: 'Wishlist',
    blurb: 'Roles you have saved and want to pursue.',
  },
  {
    status: 'Applied',
    blurb: 'Applications submitted and waiting to hear back.',
  },
  {
    status: 'Interview',
    blurb: 'Conversations scheduled, with date, time, and type.',
  },
  {
    status: 'Offer',
    blurb: 'Offers on the table and ready for your decision.',
  },
  {
    status: 'Rejected',
    blurb: 'Closed opportunities, kept for a complete record.',
  },
]
