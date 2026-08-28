import type { ApplicationStatus } from './application'

export type WorkPreference = 'Remote' | 'Hybrid' | 'On-site' | 'Any'
export type EmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Internship'
  | 'Contract'
  | 'Freelance'
  | 'Any'

export interface UserPreferences {
  // Notification preferences
  emailNotifications?: boolean
  interviewReminders?: boolean
  applicationUpdates?: boolean
  weeklySummary?: boolean

  // Job search preferences
  preferredJobTitle?: string
  preferredLocation?: string
  workPreference?: WorkPreference
  employmentType?: EmploymentType

  // Application preferences
  defaultApplicationStatus?: ApplicationStatus
}

export const WORK_PREFERENCES: WorkPreference[] = [
  'Any',
  'Remote',
  'Hybrid',
  'On-site',
]

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Any',
  'Full-time',
  'Part-time',
  'Internship',
  'Contract',
  'Freelance',
]

export const DEFAULT_PREFERENCES: Required<UserPreferences> = {
  emailNotifications: true,
  interviewReminders: true,
  applicationUpdates: true,
  weeklySummary: false,
  preferredJobTitle: '',
  preferredLocation: '',
  workPreference: 'Any',
  employmentType: 'Any',
  defaultApplicationStatus: 'Wishlist',
}
