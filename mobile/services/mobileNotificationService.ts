import AsyncStorage from '@react-native-async-storage/async-storage'
import type { JobApplication } from '../types/application'

export type NotificationCategory =
  | 'TODAY_INTERVIEW'
  | 'UPCOMING_INTERVIEW'
  | 'APPLICATION_UPDATE'
  | 'STATUS_CHANGE'
  | 'SYSTEM_WELCOME'

export interface MobileNotification {
  id: string
  applicationId?: string
  category: NotificationCategory
  title: string
  company?: string
  jobTitle?: string
  meta: string
  description?: string
  meetingLink?: string
  read: boolean
  createdAt: string
}

const STORAGE_KEY = 'jobtrack_mobile_read_notifications_v1'

export async function getReadNotificationIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw) as string[]
    return new Set(parsed)
  } catch {
    return new Set<string>()
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const current = await getReadNotificationIds()
    current.add(id)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)))
  } catch (err) {
    console.error(err)
  }
}

export async function markAllNotificationsAsRead(ids: string[]): Promise<void> {
  try {
    const current = await getReadNotificationIds()
    ids.forEach((id) => current.add(id))
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)))
  } catch (err) {
    console.error(err)
  }
}

export function buildMobileNotifications(
  applications: JobApplication[],
  readIds: Set<string>,
): MobileNotification[] {
  const notifications: MobileNotification[] = []
  const todayISO = new Date().toISOString().slice(0, 10)

  // 1. SYSTEM WELCOME NOTIFICATION
  const welcomeId = 'welcome-system-notification'
  notifications.push({
    id: welcomeId,
    category: 'SYSTEM_WELCOME',
    title: 'Welcome to JobTrack Mobile',
    meta: 'Account & Device Setup',
    description:
      'Manage applications, track pipeline milestones, and join scheduled interviews all in one native mobile workspace.',
    read: readIds.has(welcomeId),
    createdAt: todayISO,
  })

  // 2. INTERVIEW REMINDERS
  applications.forEach((app) => {
    if (app.interviewDate) {
      const isToday = app.interviewDate === todayISO
      const isUpcoming = app.interviewDate > todayISO
      const id = `interview-${app.id}-${app.interviewDate}-${app.interviewTime || ''}`

      if (isToday) {
        notifications.push({
          id,
          applicationId: app.id,
          category: 'TODAY_INTERVIEW',
          title: `Interview Today with ${app.company}`,
          company: app.company,
          jobTitle: app.jobTitle,
          meta: `${app.jobTitle} • Today ${app.interviewTime ? `at ${app.interviewTime}` : ''} • ${app.interviewType || 'Interview'}`,
          description: app.notes || `Scheduled round for ${app.jobTitle} role.`,
          meetingLink: app.meetingLink,
          read: readIds.has(id),
          createdAt: app.interviewDate,
        })
      } else if (isUpcoming) {
        notifications.push({
          id,
          applicationId: app.id,
          category: 'UPCOMING_INTERVIEW',
          title: `Upcoming Interview: ${app.company}`,
          company: app.company,
          jobTitle: app.jobTitle,
          meta: `${app.jobTitle} • ${app.interviewDate} ${app.interviewTime ? `at ${app.interviewTime}` : ''}`,
          description: app.notes || `Upcoming interview round for ${app.jobTitle}.`,
          meetingLink: app.meetingLink,
          read: readIds.has(id),
          createdAt: app.interviewDate,
        })
      }
    }

    // 3. APPLICATION & STATUS UPDATES
    if (app.status === 'Interview' || app.status === 'Offer' || app.status === 'Rejected') {
      const id = `status-${app.id}-${app.status}`
      notifications.push({
        id,
        applicationId: app.id,
        category: 'STATUS_CHANGE',
        title: `Status: ${app.status} at ${app.company}`,
        company: app.company,
        jobTitle: app.jobTitle,
        meta: `${app.jobTitle} • Updated to ${app.status}`,
        description: `Application for ${app.jobTitle} at ${app.company} is currently in ${app.status} status.`,
        read: readIds.has(id),
        createdAt: app.updatedAt || app.applicationDate,
      })
    } else {
      const id = `app-${app.id}`
      notifications.push({
        id,
        applicationId: app.id,
        category: 'APPLICATION_UPDATE',
        title: `Application Added: ${app.company}`,
        company: app.company,
        jobTitle: app.jobTitle,
        meta: `${app.jobTitle} • Applied on ${app.applicationDate}`,
        description: `Tracking ${app.jobTitle} application at ${app.company}.`,
        read: readIds.has(id),
        createdAt: app.applicationDate,
      })
    }
  })

  // Sort: Unread first, then by date descending
  return notifications.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1
    return b.createdAt.localeCompare(a.createdAt)
  })
}
