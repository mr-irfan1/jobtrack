import { useMemo, useState } from 'react'
import {
  CalendarIcon,
  ExternalLinkIcon,
  PlusIcon,
} from '../../components/icons/Icons'
import type { JobApplication } from '../../types/application'
import { useApplicationsViewModel } from '../Applications/useApplicationsViewModel'
import { formatLongDate, formatTime12 } from './calendarHelpers'
import InterviewCalendar from './components/InterviewCalendar'
import InterviewFormModal from './components/InterviewFormModal'
import { hasInterviewDate } from './interviewsHelpers'

function localTodayISO(): string {
  return new Date().toLocaleDateString('en-CA')
}

function InterviewsView() {
  const { applications, loading, error, editApplication } =
    useApplicationsViewModel()

  const [selectedDate, setSelectedDate] = useState<string>(localTodayISO)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null)

  // Applications with an interview scheduled on the currently selected date
  const selectedDateInterviews = useMemo(() => {
    return applications
      .filter(hasInterviewDate)
      .filter((app) => app.interviewDate === selectedDate)
      .sort((a, b) => (a.interviewTime || '').localeCompare(b.interviewTime || ''))
  }, [applications, selectedDate])

  function handleScheduleClick(): void {
    setEditingApp(null)
    setIsFormOpen(true)
  }

  function handleEditClick(app: JobApplication): void {
    setEditingApp(app)
    setIsFormOpen(true)
  }

  async function handleFormSubmit(
    updatedApp: JobApplication,
  ): Promise<void> {
    await editApplication(updatedApp)
    setIsFormOpen(false)
    setEditingApp(null)
  }

  async function handleRemoveInterview(app: JobApplication): Promise<void> {
    const updated: JobApplication = {
      ...app,
      interviewDate: undefined,
      interviewTime: undefined,
      interviewType: undefined,
      meetingLink: undefined,
    }
    await editApplication(updated)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* HEADER SECTION */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Interviews
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep track of your upcoming interviews and stay prepared.
          </p>
        </div>

        <button
          type="button"
          onClick={handleScheduleClick}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PlusIcon className="h-4 w-4" />
          Schedule interview
        </button>
      </header>

      {/* ERROR OR LOADING STATE */}
      {error ? (
        <div className="mb-6 rounded-xl bg-danger/10 p-4 text-sm text-danger-fg">
          {error}
        </div>
      ) : null}

      {loading && applications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-xs">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Loading interview calendar...
          </p>
        </div>
      ) : (
        /* WORKSPACE GRID: CALENDAR + SELECTED DATE PANEL */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* MAIN CALENDAR COLUMN (8 COLS ON DESKTOP) */}
          <div className="lg:col-span-8">
            <InterviewCalendar
              applications={applications}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* SELECTED DATE DETAILS SIDE PANEL (4 COLS ON DESKTOP) */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Selected: {formatLongDate(selectedDate)}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedDateInterviews.length}{' '}
                    {selectedDateInterviews.length === 1
                      ? 'interview scheduled'
                      : 'interviews scheduled'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleScheduleClick}
                  aria-label="Add interview for this date"
                  title="Add interview for this date"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {/* INTERVIEW CARDS LIST FOR SELECTED DATE */}
              <div className="mt-4 space-y-3">
                {selectedDateInterviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
                    <CalendarIcon className="mx-auto h-6 w-6 text-muted-foreground/60" />
                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                      No interviews scheduled on this date.
                    </p>
                  </div>
                ) : (
                  selectedDateInterviews.map((app) => (
                    <article
                      key={app.id}
                      className="flex flex-col rounded-xl border border-border bg-surface p-4 shadow-xs transition-all hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary"
                          >
                            {app.company.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-foreground">
                              {app.company}
                            </h3>
                            <p className="truncate text-xs text-muted-foreground">
                              {app.jobTitle}
                            </p>
                          </div>
                        </div>

                        {app.interviewType ? (
                          <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {app.interviewType}
                          </span>
                        ) : null}
                      </div>

                      {app.interviewTime ? (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
                          <span>🕒 {formatTime12(app.interviewTime)}</span>
                        </div>
                      ) : null}

                      {app.notes ? (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {app.notes}
                        </p>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                        {app.meetingLink ? (
                          <a
                            href={app.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                            Join interview
                          </a>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(app)}
                            className="rounded-md text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveInterview(app)}
                            className="rounded-md text-xs font-semibold text-danger-fg transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE / EDIT INTERVIEW MODAL */}
      {isFormOpen ? (
        <InterviewFormModal
          applications={applications}
          initialValue={editingApp}
          defaultDate={selectedDate}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingApp(null)
          }}
        />
      ) : null}
    </section>
  )
}

export default InterviewsView
