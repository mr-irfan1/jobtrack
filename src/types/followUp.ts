import type { JobApplication } from './application'

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled'

export interface FollowUp {
  id: string
  applicationId: string
  /** Scheduled date in local 'YYYY-MM-DD' format */
  scheduledDate: string
  /** Optional scheduled time in 24-hour 'HH:mm' format */
  scheduledTime?: string
  /** Combined ISO string or date-time representation (e.g. YYYY-MM-DDTHH:mm:00) */
  scheduledFor: string
  /** User notes or objectives for this follow-up */
  note?: string
  status: FollowUpStatus
  /** ISO timestamp when the follow-up was created */
  createdAt: string
  /** ISO timestamp when marked completed */
  completedAt?: string
}

export type FollowUpDraft = Omit<
  FollowUp,
  'id' | 'createdAt' | 'status' | 'completedAt' | 'scheduledFor'
> & {
  status?: FollowUpStatus
  scheduledFor?: string
}

export interface FollowUpWithApplication extends FollowUp {
  application?: JobApplication
}

export type FollowUpTabFilter = 'all' | 'upcoming' | 'overdue' | 'completed'
