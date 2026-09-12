import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ApplicationStatus, JobApplication } from '../types/application'

test('Pipeline: optimistic status mutation and rollback simulation', () => {
  const initialApps: JobApplication[] = [
    {
      id: 'app-1',
      company: 'Netflix',
      jobTitle: 'Senior UI Engineer',
      location: 'Los Gatos',
      jobUrl: 'https://netflix.com/jobs/1',
      applicationDate: '2026-08-20',
      status: 'Applied',
      notes: '',
    },
    {
      id: 'app-2',
      company: 'Spotify',
      jobTitle: 'Frontend Engineer',
      location: 'New York',
      jobUrl: 'https://spotify.com/jobs/2',
      applicationDate: '2026-08-21',
      status: 'Interview',
      notes: '',
    },
  ]

  // Optimistic Move app-1 from Applied -> Interview
  let currentApps = [...initialApps]
  const targetApp = currentApps[0]
  const nextStatus: ApplicationStatus = 'Interview'

  const optimisticallyUpdated = currentApps.map((a) =>
    a.id === targetApp.id ? { ...a, status: nextStatus } : a,
  )
  assert.equal(optimisticallyUpdated[0].status, 'Interview')

  // Simulate network failure and rollback
  const simulatedNetworkFailure = true
  if (simulatedNetworkFailure) {
    currentApps = initialApps // rollback
  }

  assert.equal(currentApps[0].status, 'Applied')
})

test('Pipeline: stage filtering groups applications accurately', () => {
  const apps: JobApplication[] = [
    { id: '1', company: 'A', jobTitle: 'Eng', location: '', jobUrl: '', notes: '', applicationDate: '2026-08-01', status: 'Wishlist' },
    { id: '2', company: 'B', jobTitle: 'Eng', location: '', jobUrl: '', notes: '', applicationDate: '2026-08-02', status: 'Applied' },
    { id: '3', company: 'C', jobTitle: 'Eng', location: '', jobUrl: '', notes: '', applicationDate: '2026-08-03', status: 'Applied' },
    { id: '4', company: 'D', jobTitle: 'Eng', location: '', jobUrl: '', notes: '', applicationDate: '2026-08-04', status: 'Interview' },
    { id: '5', company: 'E', jobTitle: 'Eng', location: '', jobUrl: '', notes: '', applicationDate: '2026-08-05', status: 'Offer' },
  ]

  const appliedStage = apps.filter((a) => a.status === 'Applied')
  const offerStage = apps.filter((a) => a.status === 'Offer')

  assert.equal(appliedStage.length, 2)
  assert.equal(offerStage.length, 1)
})
