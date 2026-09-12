export type AlertFrequency = 'daily' | 'weekly'
export type AlertStatus = 'active' | 'paused'

export interface JobAlertCriteria {
  query?: string
  workplace?: string
  employmentType?: string
  category?: string
  location?: string
  skills?: string[]
}

export interface JobAlert {
  id: string
  userId?: string
  name: string
  criteria: JobAlertCriteria
  frequency: AlertFrequency
  status: AlertStatus
  createdAt: string
  updatedAt: string
  lastCheckedAt?: string
  lastNotifiedAt?: string
  notifiedJobIds: string[]
}

export interface JobAlertDraft {
  name?: string
  criteria: JobAlertCriteria
  frequency?: AlertFrequency
}
