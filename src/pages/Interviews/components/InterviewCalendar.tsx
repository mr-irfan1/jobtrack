import { useMemo, useState } from 'react'
import type { JobApplication } from '../../../types/application'
import {
  buildMonthGrid,
  formatMonthYear,
  formatTime12,
} from '../calendarHelpers'

interface InterviewCalendarProps {
  applications: JobApplication[]
  selectedDate: string
  onSelectDate: (dateISO: string) => void
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function localTodayISO(): string {
  return new Date().toLocaleDateString('en-CA')
}

function InterviewCalendar({
  applications,
  selectedDate,
  onSelectDate,
}: InterviewCalendarProps) {
  const todayISO = localTodayISO()
  const todayDateObj = new Date()

  const [currentYear, setCurrentYear] = useState<number>(
    todayDateObj.getFullYear(),
  )
  const [currentMonth, setCurrentMonth] = useState<number>(
    todayDateObj.getMonth(),
  )

  function handlePrevMonth(): void {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function handleNextMonth(): void {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  function handleToday(): void {
    const now = new Date()
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth()
    const nowTodayISO = localTodayISO()
    setCurrentYear(nowYear)
    setCurrentMonth(nowMonth)
    onSelectDate(nowTodayISO)
  }

  // Build grid cells for current month
  const cells = useMemo(
    () => buildMonthGrid(currentYear, currentMonth, todayISO),
    [currentYear, currentMonth, todayISO],
  )

  // Map applications to date strings
  const interviewsByDate = useMemo(() => {
    const map = new Map<string, JobApplication[]>()
    for (const app of applications) {
      if (app.interviewDate) {
        const list = map.get(app.interviewDate) || []
        list.push(app)
        map.set(app.interviewDate, list)
      }
    }
    return map
  }, [applications])

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface shadow-sm">
      {/* CALENDAR TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {formatMonthYear(currentYear, currentMonth)}
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Today
          </button>
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              &larr;
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* WEEK DAY HEADERS */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-bold text-muted-foreground">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="py-2.5">
            {day}
          </div>
        ))}
      </div>

      {/* MONTH DATE CELLS GRID */}
      <div className="grid flex-1 grid-cols-7 gap-px bg-border">
        {cells.map((cell) => {
          const dateApps = interviewsByDate.get(cell.dateISO) || []
          const isSelected = cell.dateISO === selectedDate

          return (
            <div
              key={cell.dateISO}
              onClick={() => onSelectDate(cell.dateISO)}
              className={`group flex min-h-[90px] flex-col justify-between bg-surface p-2 text-left transition-colors cursor-pointer hover:bg-muted/40 ${
                !cell.isCurrentMonth ? 'opacity-40 bg-muted/20' : ''
              } ${isSelected ? 'ring-2 ring-primary ring-inset z-10' : ''}`}
            >
              {/* CELL HEADER */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    cell.isToday
                      ? 'bg-primary font-bold text-primary-foreground shadow-xs'
                      : 'font-medium text-foreground'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {dateApps.length > 0 ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ) : null}
              </div>

              {/* EVENT CHIPS LIST */}
              <div className="mt-1 space-y-1 overflow-hidden">
                {dateApps.slice(0, 2).map((app) => (
                  <div
                    key={app.id}
                    className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary transition-colors group-hover:bg-primary/20"
                  >
                    <span className="truncate">{app.company}</span>
                    {app.interviewTime ? (
                      <span className="ml-1 font-normal opacity-80">
                        {formatTime12(app.interviewTime)}
                      </span>
                    ) : null}
                  </div>
                ))}

                {dateApps.length > 2 ? (
                  <div className="text-[10px] font-semibold text-muted-foreground">
                    +{dateApps.length - 2} more
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InterviewCalendar
