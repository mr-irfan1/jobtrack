import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../../types/application.ts'
import type { InterviewNotification, NotificationContext } from './notifications.ts'
import {
  buildNotifications,
  categorize,
  countUnread,
  formatBadgeCount,
  formatRelativeDay,
  formatTime12,
  isJoinableMeetingLink,
  notificationId,
  readIdsWith,
  readIdsWithAll,
} from './notifications.ts'

const TODAY = '2026-08-27'
const TOMORROW = '2026-08-28'

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 'app-1',
    company: 'Google',
    jobTitle: 'Software Engineer',
    location: 'Remote',
    jobUrl: '',
    applicationDate: '2026-08-01',
    status: 'Interview',
    notes: '',
    ...overrides,
  }
}

function makeContext(
  overrides: Partial<NotificationContext> = {},
): NotificationContext {
  return {
    todayISO: TODAY,
    tomorrowISO: TOMORROW,
    currentYear: 2026,
    readIds: new Set<string>(),
    ...overrides,
  }
}

// §16.1 — an application without an interview date yields no notification.
test('application without an interview date produces no notification', () => {
  const application = makeApplication({ interviewDate: undefined })
  assert.deepEqual(buildNotifications([application], makeContext()), [])
})

test('application with a blank/invalid interview date produces no notification', () => {
  assert.deepEqual(
    buildNotifications(
      [makeApplication({ interviewDate: '' }), makeApplication({ interviewDate: 'soon' })],
      makeContext(),
    ),
    [],
  )
})

// §16.2 — an application with an interview date yields exactly one notification.
test('application with an interview date produces one notification', () => {
  const application = makeApplication({ interviewDate: '2026-09-01' })
  const result = buildNotifications([application], makeContext())
  assert.equal(result.length, 1)
  assert.equal(result[0]?.applicationId, 'app-1')
})

// §16.3 — an interview dated today is categorized TODAY_INTERVIEW.
test('interview dated today is a TODAY_INTERVIEW', () => {
  const result = buildNotifications(
    [makeApplication({ interviewDate: TODAY })],
    makeContext(),
  )
  assert.equal(result[0]?.category, 'TODAY_INTERVIEW')
  assert.match(result[0]?.title ?? '', /^Interview today with Google$/)
})

// §16.4 — a future interview is categorized UPCOMING_INTERVIEW.
test('future interview is an UPCOMING_INTERVIEW', () => {
  const result = buildNotifications(
    [makeApplication({ interviewDate: '2026-09-15' })],
    makeContext(),
  )
  assert.equal(result[0]?.category, 'UPCOMING_INTERVIEW')
  assert.equal(result[0]?.title, 'Interview scheduled with Google')
})

// §16.5 — a past interview is categorized PAST_INTERVIEW.
test('past interview is a PAST_INTERVIEW', () => {
  const result = buildNotifications(
    [makeApplication({ interviewDate: '2026-08-01' })],
    makeContext(),
  )
  assert.equal(result[0]?.category, 'PAST_INTERVIEW')
  assert.equal(result[0]?.title, 'Past interview with Google')
})

// §16.6 — ordering: today → nearest upcoming → later upcoming → recent past → older past.
test('notifications are ordered today, then upcoming (asc), then past (desc)', () => {
  const applications = [
    makeApplication({ id: 'past-old', interviewDate: '2026-08-01' }),
    makeApplication({ id: 'up-far', interviewDate: '2026-09-15' }),
    makeApplication({ id: 'today-pm', interviewDate: TODAY, interviewTime: '14:00' }),
    makeApplication({ id: 'past-recent', interviewDate: '2026-08-25' }),
    makeApplication({ id: 'today-am', interviewDate: TODAY, interviewTime: '09:00' }),
    makeApplication({ id: 'up-soon', interviewDate: '2026-08-29' }),
  ]
  const order = buildNotifications(applications, makeContext()).map(
    (n) => n.applicationId,
  )
  assert.deepEqual(order, [
    'today-am',
    'today-pm',
    'up-soon',
    'up-far',
    'past-recent',
    'past-old',
  ])
})

// §16.7 — stable, deterministic id from applicationId + date + time.
test('notificationId is deterministic and composed of id + date + time', () => {
  const application = makeApplication({
    id: 'abc',
    interviewDate: '2026-09-01',
    interviewTime: '10:30',
  })
  assert.equal(notificationId(application), 'abc::2026-09-01::10:30')
  // Same input → same id (no randomness).
  assert.equal(notificationId(application), notificationId(application))
})

test('notificationId changes when the date or time changes', () => {
  const base = makeApplication({ id: 'abc', interviewDate: '2026-09-01', interviewTime: '10:30' })
  const laterDay = makeApplication({ id: 'abc', interviewDate: '2026-09-02', interviewTime: '10:30' })
  const laterTime = makeApplication({ id: 'abc', interviewDate: '2026-09-01', interviewTime: '11:30' })
  assert.notEqual(notificationId(base), notificationId(laterDay))
  assert.notEqual(notificationId(base), notificationId(laterTime))
})

test('notificationId is stable when the interview time is missing', () => {
  const application = makeApplication({ id: 'abc', interviewDate: '2026-09-01', interviewTime: undefined })
  assert.equal(notificationId(application), 'abc::2026-09-01::')
})

// §16.8 — read/unread state is reflected from the context's readIds.
test('read state reflects the ids in the context', () => {
  const read = makeApplication({ id: 'read', interviewDate: '2026-09-01' })
  const unread = makeApplication({ id: 'unread', interviewDate: '2026-09-02' })
  const context = makeContext({ readIds: new Set([notificationId(read)]) })
  const result = buildNotifications([read, unread], context)
  const byId = new Map(result.map((n) => [n.applicationId, n]))
  assert.equal(byId.get('read')?.read, true)
  assert.equal(byId.get('unread')?.read, false)
  assert.equal(countUnread(result), 1)
})

// §16.9 — "mark all as read" marks every shown notification read.
test('readIdsWithAll marks every notification read, driving unread to zero', () => {
  const applications = [
    makeApplication({ id: 'a', interviewDate: '2026-09-01' }),
    makeApplication({ id: 'b', interviewDate: '2026-09-02' }),
  ]
  const initial = buildNotifications(applications, makeContext())
  assert.equal(countUnread(initial), 2)

  const allRead = readIdsWithAll(new Set<string>(), initial)
  const rebuilt = buildNotifications(applications, makeContext({ readIds: allRead }))
  assert.equal(countUnread(rebuilt), 0)
})

test('readIdsWith marks a single notification read without touching others', () => {
  const current = new Set<string>(['x'])
  const next = readIdsWith(current, 'y')
  assert.deepEqual([...next].sort(), ['x', 'y'])
  // Pure: the original set is unchanged.
  assert.deepEqual([...current], ['x'])
})

// §16.10 — a missing interview time is handled gracefully (no crash, no time shown).
test('missing interview time is omitted from the meta line', () => {
  const result = buildNotifications(
    [makeApplication({ interviewDate: '2026-08-30', interviewTime: undefined })],
    makeContext(),
  )
  assert.equal(result[0]?.meta, 'Software Engineer • Aug 30')
})

test('present interview time and type appear in the meta line', () => {
  const result = buildNotifications(
    [
      makeApplication({
        interviewDate: '2026-08-30',
        interviewTime: '10:00',
        interviewType: 'Video',
      }),
    ],
    makeContext(),
  )
  assert.equal(result[0]?.meta, 'Software Engineer • Aug 30 • 10:00 AM • Video')
})

// §16.11 — meeting link: shown only when safe; absent/unsafe values yield no link.
test('a safe https meeting link is surfaced', () => {
  const result = buildNotifications(
    [makeApplication({ interviewDate: '2026-09-01', meetingLink: 'https://meet.google.com/xyz' })],
    makeContext(),
  )
  assert.equal(result[0]?.meetingLink, 'https://meet.google.com/xyz')
})

test('a missing meeting link yields no link', () => {
  const result = buildNotifications(
    [makeApplication({ interviewDate: '2026-09-01', meetingLink: undefined })],
    makeContext(),
  )
  assert.equal(result[0]?.meetingLink, undefined)
})

test('an unsafe or scheme-less meeting link yields no link', () => {
  const unsafe = buildNotifications(
    [makeApplication({ interviewDate: '2026-09-01', meetingLink: 'javascript:alert(1)' })],
    makeContext(),
  )
  const schemeless = buildNotifications(
    [makeApplication({ interviewDate: '2026-09-01', meetingLink: 'meet.google.com/xyz' })],
    makeContext(),
  )
  assert.equal(unsafe[0]?.meetingLink, undefined)
  assert.equal(schemeless[0]?.meetingLink, undefined)
})

// §16.12 — multiple applications produce multiple notifications.
test('multiple applications produce a notification each, with distinct ids', () => {
  const applications = [
    makeApplication({ id: 'a', company: 'Google', interviewDate: '2026-09-01' }),
    makeApplication({ id: 'b', company: 'Meta', interviewDate: '2026-09-02' }),
    makeApplication({ id: 'c', company: 'Amazon', interviewDate: '2026-09-03' }),
  ]
  const result = buildNotifications(applications, makeContext())
  assert.equal(result.length, 3)
  assert.equal(new Set(result.map((n) => n.id)).size, 3)
})

// §16.13 — derivation is pure over the provided applications: it fetches nothing
// and invents nothing, so it can only ever reflect the (already user-scoped) list
// the data layer hands it. Empty in → empty out; the exact set in → that set out.
test('notifications derive strictly from the provided applications', () => {
  assert.deepEqual(buildNotifications([], makeContext()), [])

  const mine = [
    makeApplication({ id: 'mine-1', interviewDate: '2026-09-01' }),
    makeApplication({ id: 'mine-2', interviewDate: '2026-09-02' }),
  ]
  const result = buildNotifications(mine, makeContext())
  assert.deepEqual(
    result.map((n) => n.applicationId).sort(),
    ['mine-1', 'mine-2'],
  )
})

test('buildNotifications does not mutate its input array', () => {
  const applications = [
    makeApplication({ id: 'a', interviewDate: '2026-09-02' }),
    makeApplication({ id: 'b', interviewDate: '2026-09-01' }),
  ]
  const snapshot = applications.map((a) => a.id)
  buildNotifications(applications, makeContext())
  assert.deepEqual(applications.map((a) => a.id), snapshot)
})

// --- Formatter units -------------------------------------------------------

test('categorize classifies today, future and past', () => {
  assert.equal(categorize(TODAY, TODAY), 'TODAY_INTERVIEW')
  assert.equal(categorize('2026-09-01', TODAY), 'UPCOMING_INTERVIEW')
  assert.equal(categorize('2026-01-01', TODAY), 'PAST_INTERVIEW')
})

test('formatTime12 converts 24-hour times to 12-hour, and drops invalid input', () => {
  assert.equal(formatTime12('09:00'), '9:00 AM')
  assert.equal(formatTime12('00:00'), '12:00 AM')
  assert.equal(formatTime12('12:00'), '12:00 PM')
  assert.equal(formatTime12('13:05'), '1:05 PM')
  assert.equal(formatTime12('23:59'), '11:59 PM')
  assert.equal(formatTime12(undefined), '')
  assert.equal(formatTime12(''), '')
  assert.equal(formatTime12('nonsense'), '')
  assert.equal(formatTime12('24:00'), '')
})

test('formatRelativeDay uses Today/Tomorrow and omits the year only for the current year', () => {
  const context = makeContext()
  assert.equal(formatRelativeDay(TODAY, context), 'Today')
  assert.equal(formatRelativeDay(TOMORROW, context), 'Tomorrow')
  assert.equal(formatRelativeDay('2026-08-30', context), 'Aug 30')
  assert.equal(formatRelativeDay('2026-12-25', context), 'Dec 25')
  assert.equal(formatRelativeDay('2027-01-05', context), 'Jan 5, 2027')
})

test('formatBadgeCount hides at zero, shows exact up to 99, then 99+', () => {
  assert.equal(formatBadgeCount(0), '')
  assert.equal(formatBadgeCount(-3), '')
  assert.equal(formatBadgeCount(1), '1')
  assert.equal(formatBadgeCount(99), '99')
  assert.equal(formatBadgeCount(100), '99+')
  assert.equal(formatBadgeCount(500), '99+')
})

test('isJoinableMeetingLink accepts only absolute http(s) URLs', () => {
  assert.equal(isJoinableMeetingLink('https://x.test'), true)
  assert.equal(isJoinableMeetingLink('http://x.test'), true)
  assert.equal(isJoinableMeetingLink('meet.google.com'), false)
  assert.equal(isJoinableMeetingLink('javascript:alert(1)'), false)
  assert.equal(isJoinableMeetingLink(undefined), false)
})

// Sanity: unread items sort exactly as the built list (no reordering by read state)
// and the built notification carries a stable id usable as a React key.
test('built notifications expose a stable id matching notificationId', () => {
  const application = makeApplication({ interviewDate: '2026-09-01', interviewTime: '10:30' })
  const [notification] = buildNotifications([application], makeContext())
  assert.equal(notification?.id, notificationId(application))
})

function idsOf(notifications: InterviewNotification[]): string[] {
  return notifications.map((n) => n.id)
}

test('read state does not change ordering', () => {
  const applications = [
    makeApplication({ id: 'a', interviewDate: TODAY, interviewTime: '09:00' }),
    makeApplication({ id: 'b', interviewDate: '2026-09-01' }),
  ]
  const unread = buildNotifications(applications, makeContext())
  const readContext = makeContext({
    readIds: readIdsWithAll(new Set<string>(), unread),
  })
  const read = buildNotifications(applications, readContext)
  assert.deepEqual(idsOf(read), idsOf(unread))
})
