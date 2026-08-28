import type { JobApplication } from '../../types/application'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function hasInterviewDate(
  application: JobApplication,
): application is JobApplication & { interviewDate: string } {
  return (
    typeof application.interviewDate === 'string' &&
    ISO_DATE.test(application.interviewDate)
  )
}

export function getUpcomingInterviewsList(
  applications: JobApplication[],
  today: string,
): JobApplication[] {
  return applications
    .filter(hasInterviewDate)
    .filter((app) => app.interviewDate >= today)
    .sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))
}

export function getPastInterviewsList(
  applications: JobApplication[],
  today: string,
): JobApplication[] {
  return applications
    .filter(hasInterviewDate)
    .filter((app) => app.interviewDate < today)
    .sort((a, b) => b.interviewDate.localeCompare(a.interviewDate))
}
