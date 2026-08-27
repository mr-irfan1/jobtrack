import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ApplicationDraft } from '../../types/application.ts'
import { buildApplication } from './applicationFactory.ts'

function makeDraft(overrides: Partial<ApplicationDraft> = {}): ApplicationDraft {
  return {
    company: 'Acme',
    jobTitle: 'Frontend Engineer',
    location: 'Remote',
    jobUrl: 'https://example.com/job',
    applicationDate: '2026-08-26',
    status: 'Applied',
    notes: '',
    ...overrides,
  }
}

test('buildApplication copies every draft field and adds a non-empty string id', () => {
  const draft = makeDraft({ company: 'Globex', status: 'Interview' })
  const application = buildApplication(draft)

  assert.equal(typeof application.id, 'string')
  assert.ok(application.id.length > 0)
  for (const key of Object.keys(draft) as (keyof ApplicationDraft)[]) {
    assert.deepEqual(application[key], draft[key])
  }
})

test('buildApplication generates a distinct id per call', () => {
  const draft = makeDraft()
  assert.notEqual(buildApplication(draft).id, buildApplication(draft).id)
})

test('buildApplication carries through optional interview fields when present', () => {
  const draft = makeDraft({
    status: 'Interview',
    interviewDate: '2026-08-30',
    interviewTime: '11:00',
    interviewType: 'Technical Interview',
    meetingLink: 'https://meet.example.com/abc',
  })
  const application = buildApplication(draft)

  assert.equal(application.interviewDate, '2026-08-30')
  assert.equal(application.interviewTime, '11:00')
  assert.equal(application.interviewType, 'Technical Interview')
  assert.equal(application.meetingLink, 'https://meet.example.com/abc')
})

test('buildApplication omits interview fields when the draft has none (backward compatible)', () => {
  const application = buildApplication(makeDraft())

  assert.equal(application.interviewDate, undefined)
  assert.equal(application.interviewTime, undefined)
  assert.equal(application.interviewType, undefined)
  assert.equal(application.meetingLink, undefined)
})
