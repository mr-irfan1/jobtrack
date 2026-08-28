export type AchievementType =
  | 'Certification'
  | 'Award'
  | 'Hackathon'
  | 'Course'
  | 'Competition'
  | 'Recognition'
  | 'Other'

export const ACHIEVEMENT_TYPES: AchievementType[] = [
  'Certification',
  'Award',
  'Hackathon',
  'Course',
  'Competition',
  'Recognition',
  'Other',
]

export interface Achievement {
  id: string
  title: string
  issuer: string
  type: AchievementType
  date?: string
  description?: string
  credentialUrl?: string
  createdAt: string
}
