import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../types/application'

export interface MobileNotification {
  id: string
  title: string
  message: string
  date: string
  category:
    | 'TODAY_INTERVIEW'
    | 'UPCOMING_INTERVIEW'
    | 'STATUS_CHANGE'
    | 'APPLICATION_UPDATE'
    | 'SYSTEM_WELCOME'
  applicationId?: string
  meetingLink?: string
}

export function deriveMobileNotifications(
  applications: JobApplication[],
  todayStr: string,
): MobileNotification[] {
  const notifs: MobileNotification[] = []

  for (const app of applications) {
    if (app.interviewDate) {
      if (app.interviewDate === todayStr) {
        notifs.push({
          id: `interview-today-${app.id}`,
          title: `Interview Today: ${app.company}`,
          message: `Your interview for ${app.jobTitle} is scheduled today at ${app.interviewTime || 'TBD'}.`,
          date: app.interviewDate,
          category: 'TODAY_INTERVIEW',
          applicationId: app.id,
          meetingLink: app.meetingLink,
        })
      } else if (app.interviewDate > todayStr) {
        notifs.push({
          id: `interview-upcoming-${app.id}`,
          title: `Upcoming Interview: ${app.company}`,
          message: `Interview for ${app.jobTitle} on ${app.interviewDate} at ${app.interviewTime || 'TBD'}.`,
          date: app.interviewDate,
          category: 'UPCOMING_INTERVIEW',
          applicationId: app.id,
          meetingLink: app.meetingLink,
        })
      }
    }

    if (app.status === 'Offer') {
      notifs.push({
        id: `status-offer-${app.id}`,
        title: `Offer Received: ${app.company}!`,
        message: `Congratulations! You received an offer for ${app.jobTitle}.`,
        date: app.updatedAt || app.applicationDate,
        category: 'STATUS_CHANGE',
        applicationId: app.id,
      })
    }
  }

  return notifs
}

test('Notifications: derives interview and status alerts accurately', () => {
  const todayStr = '2026-08-28'
  const apps: JobApplication[] = [
    {
      id: 'app-1',
      company: 'Uber',
      jobTitle: 'Software Engineer II',
      location: 'San Francisco',
      jobUrl: 'https://uber.com/jobs/1',
      applicationDate: '2026-08-20',
      status: 'Interview',
      notes: '',
      interviewDate: todayStr,
      interviewTime: '11:00',
    },
    {
      id: 'app-2',
      company: 'Figma',
      jobTitle: 'Design Technologist',
      location: 'San Francisco',
      jobUrl: 'https://figma.com/jobs/2',
      applicationDate: '2026-08-25',
      status: 'Offer',
      notes: '',
    },
  ]

  const notifs = deriveMobileNotifications(apps, todayStr)

  assert.ok(notifs.length >= 2)
  const todayInterview = notifs.find((n) => n.category === 'TODAY_INTERVIEW')
  assert.ok(todayInterview)
  assert.equal(todayInterview?.title, 'Interview Today: Uber')

  const offerNotif = notifs.find((n) => n.category === 'STATUS_CHANGE')
  assert.ok(offerNotif)
  assert.equal(offerNotif?.title, 'Offer Received: Figma!')
})

test('Notifications: unread tracking calculation with read IDs set', () => {
  const notifIds = ['n-1', 'n-2', 'n-3', 'n-4']
  const readIds = new Set(['n-1', 'n-3'])

  const unreadCount = notifIds.filter((id) => !readIds.has(id)).length
  assert.equal(unreadCount, 2)
})
