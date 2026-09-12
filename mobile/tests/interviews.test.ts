import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JobApplication } from '../types/application'

test('Interviews: calendar month days generation', () => {
  // Test generating days for August 2026 (Aug 1, 2026 is a Saturday -> day 6)
  const year = 2026
  const month = 7 // 0-indexed: August is 7

  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  assert.equal(daysInMonth, 31)
  assert.equal(firstDayIndex, 6) // Saturday

  const days: { dayNumber: number | null; dateStr: string | null }[] = []
  for (let i = 0; i < firstDayIndex; i++) {
    days.push({ dayNumber: null, dateStr: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(d).padStart(2, '0')
    days.push({
      dayNumber: d,
      dateStr: `${year}-${monthStr}-${dayStr}`,
    })
  }

  assert.equal(days.length, 6 + 31) // 37 cells total
  assert.equal(days[6].dayNumber, 1)
  assert.equal(days[6].dateStr, '2026-08-01')
  assert.equal(days[36].dayNumber, 31)
  assert.equal(days[36].dateStr, '2026-08-31')
})

test('Interviews: upcoming interviews date filter and chronological sorting', () => {
  const apps: JobApplication[] = [
    {
      id: '1',
      company: 'Datadog',
      jobTitle: 'Site Reliability Eng',
      location: 'New York',
      jobUrl: 'https://datadog.com/jobs/1',
      applicationDate: '2026-08-01',
      status: 'Interview',
      notes: '',
      interviewDate: '2026-08-30',
      interviewTime: '15:00',
    },
    {
      id: '2',
      company: 'Airbnb',
      jobTitle: 'Fullstack Eng',
      location: 'San Francisco',
      jobUrl: 'https://airbnb.com/jobs/2',
      applicationDate: '2026-08-05',
      status: 'Interview',
      notes: '',
      interviewDate: '2026-08-29',
      interviewTime: '10:00',
    },
    {
      id: '3',
      company: 'Past Corp',
      jobTitle: 'Engineer',
      location: 'Austin',
      jobUrl: 'https://pastcorp.com/jobs/3',
      applicationDate: '2026-07-01',
      status: 'Interview',
      notes: '',
      interviewDate: '2026-08-01',
    },
  ]

  const referenceDate = '2026-08-28'
  const upcoming = apps
    .filter((a) => Boolean(a.interviewDate) && a.interviewDate! >= referenceDate)
    .sort(
      (a, b) =>
        new Date(a.interviewDate!).getTime() -
        new Date(b.interviewDate!).getTime(),
    )

  assert.equal(upcoming.length, 2)
  assert.equal(upcoming[0].company, 'Airbnb') // Aug 29 comes before Aug 30
  assert.equal(upcoming[1].company, 'Datadog')
})
