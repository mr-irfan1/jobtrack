import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ExtractedJobData } from '../../services/jobExtractorService.ts'
import type { ApplicationDraft, JobApplication } from '../../types/application.ts'
import {
  findDuplicateApplication,
  mapExtractedJobToDraft,
  processJobImport,
} from './jobUrlImportLogic.ts'

const sampleExtractedJob: ExtractedJobData = {
  title: 'Staff Cloud Architect',
  company: 'CloudCorp International',
  location: 'Austin, TX',
  description: 'Design distributed cloud infrastructure across regions.',
  jobUrl: 'https://cloudcorp.com/careers/arch-123',
  source: 'cloudcorp.com',
  employmentType: 'Full time',
  datePosted: '2026-08-01',
  salary: '$180,000 - $220,000',
}

const mockExistingApp: JobApplication = {
  id: 'app-uuid-1',
  company: 'CloudCorp International',
  jobTitle: 'Staff Cloud Architect',
  location: 'Austin, TX',
  jobUrl: 'https://cloudcorp.com/careers/arch-123',
  applicationDate: '2026-08-20',
  status: 'Applied',
  notes: 'Existing application notes',
}

test('1. Successfully creating imported application - processJobImport calls save function and returns created object', async () => {
  let saveCount = 0
  const saveFn = async (draft: ApplicationDraft): Promise<JobApplication> => {
    saveCount++
    return {
      id: 'new-app-id',
      ...draft,
    }
  }

  const result = await processJobImport(sampleExtractedJob, [], saveFn)

  assert.equal(result.success, true)
  assert.equal(saveCount, 1)
  assert.ok(result.application)
  assert.equal(result.application.id, 'new-app-id')
  assert.equal(result.application.jobTitle, 'Staff Cloud Architect')
})

test('2. Correct field mapping - maps extracted fields onto ApplicationDraft correctly', () => {
  const draft = mapExtractedJobToDraft(sampleExtractedJob, '2026-08-28')

  assert.equal(draft.jobTitle, 'Staff Cloud Architect')
  assert.equal(draft.company, 'CloudCorp International')
  assert.equal(draft.location, 'Austin, TX')
  assert.equal(draft.jobUrl, 'https://cloudcorp.com/careers/arch-123')
  assert.equal(draft.notes, 'Design distributed cloud infrastructure across regions.')
  assert.equal(draft.applicationDate, '2026-08-28')
})

test('3. Existing default status is used - draft uses "Applied" as default status', () => {
  const draft = mapExtractedJobToDraft(sampleExtractedJob)
  assert.equal(draft.status, 'Applied')
})

test('4. Duplicate job URL is detected - findDuplicateApplication matches exact and case-insensitive URLs', () => {
  const duplicate = findDuplicateApplication(
    'HTTPS://CLOUDCORP.COM/careers/arch-123',
    [mockExistingApp],
  )
  assert.ok(duplicate)
  assert.equal(duplicate?.id, 'app-uuid-1')
})

test('5. Duplicate application is not created - processJobImport blocks saving when URL is duplicated', async () => {
  let saveCalled = false
  const saveFn = async (draft: ApplicationDraft): Promise<JobApplication> => {
    saveCalled = true
    return { id: 'should-not-be-created', ...draft }
  }

  const result = await processJobImport(sampleExtractedJob, [mockExistingApp], saveFn)

  assert.equal(result.success, false)
  assert.equal(result.isDuplicate, true)
  assert.equal(saveCalled, false)
  assert.equal(result.duplicateApp?.id, 'app-uuid-1')
  assert.equal(result.error, 'This job is already in your tracker.')
})

test('6. Double submission does not create duplicates - second attempt detects added item in list', async () => {
  const appsList: JobApplication[] = []

  const saveFn = async (draft: ApplicationDraft): Promise<JobApplication> => {
    const created: JobApplication = { id: `id-${appsList.length + 1}`, ...draft }
    appsList.push(created)
    return created
  }

  // First import succeeds
  const res1 = await processJobImport(sampleExtractedJob, appsList, saveFn)
  assert.equal(res1.success, true)
  assert.equal(appsList.length, 1)

  // Second import with updated appsList is blocked as duplicate
  const res2 = await processJobImport(sampleExtractedJob, appsList, saveFn)
  assert.equal(res2.success, false)
  assert.equal(res2.isDuplicate, true)
  assert.equal(appsList.length, 1)
})

test('7. Database failure is handled - returns friendly error message on save rejection', async () => {
  const failingSaveFn = async (): Promise<JobApplication> => {
    throw new Error('Database connection failed')
  }

  const result = await processJobImport(sampleExtractedJob, [], failingSaveFn)

  assert.equal(result.success, false)
  assert.equal(result.error, 'Database connection failed')
})

test('8. Missing session is handled - surfaces auth requirement gracefully', async () => {
  const noAuthSaveFn = async (): Promise<JobApplication> => {
    throw new Error('No authenticated user session')
  }

  const result = await processJobImport(sampleExtractedJob, [], noAuthSaveFn)

  assert.equal(result.success, false)
  assert.equal(result.error, 'No authenticated user session')
})

test('9. Existing Applications list refreshes correctly - appending created item retains previous items', async () => {
  const existingApps: JobApplication[] = [
    {
      id: 'existing-1',
      company: 'Google',
      jobTitle: 'Software Engineer',
      location: 'Mountain View, CA',
      jobUrl: 'https://careers.google.com/jobs/1',
      applicationDate: '2026-08-01',
      status: 'Applied',
      notes: '',
    },
  ]

  const saveFn = async (draft: ApplicationDraft): Promise<JobApplication> => {
    return { id: 'new-2', ...draft }
  }

  const result = await processJobImport(sampleExtractedJob, existingApps, saveFn)
  assert.equal(result.success, true)

  const updatedAppsList = [...existingApps, result.application!]
  assert.equal(updatedAppsList.length, 2)
  assert.equal(updatedAppsList[0].id, 'existing-1')
  assert.equal(updatedAppsList[1].id, 'new-2')
})
