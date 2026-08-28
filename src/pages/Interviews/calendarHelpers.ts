export interface CalendarCell {
  dateISO: string // 'YYYY-MM-DD'
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Generate ISO 'YYYY-MM-DD' from year, 0-indexed month, and 1-indexed day */
export function toISOString(year: number, month: number, day: number): string {
  const y = year
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Formats year and 0-indexed month to "August 2026" */
export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month] ?? ''} ${year}`
}

/** Formats 'YYYY-MM-DD' to "August 15, 2026" */
export function formatLongDate(dateISO: string): string {
  if (!dateISO) return ''
  const parts = dateISO.split('-')
  if (parts.length !== 3) return dateISO
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  return `${MONTH_NAMES[month] ?? ''} ${day}, ${year}`
}

/** Formats 'YYYY-MM-DD' to "Aug 15" */
export function formatShortDate(dateISO: string): string {
  if (!dateISO) return ''
  const parts = dateISO.split('-')
  if (parts.length !== 3) return dateISO
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  return `${SHORT_MONTHS[month] ?? ''} ${day}`
}

/** Format a 24-hour HH:mm string as 12-hour "10:30 AM" */
export function formatTime12(time?: string): string {
  if (!time) return ''
  const [hh = '0', mm = '00'] = time.split(':')
  const hours = Number(hh)
  const period = hours < 12 ? 'AM' : 'PM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${mm} ${period}`
}

/** Build the 7-column month grid cells (including prev/next month padding days) */
export function buildMonthGrid(
  year: number,
  month: number,
  todayISO: string,
): CalendarCell[] {
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const grid: CalendarCell[] = []

  // 1. Previous month padding days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const dateISO = toISOString(prevYear, prevMonth, prevDay)
    grid.push({
      dateISO,
      dayNumber: prevDay,
      isCurrentMonth: false,
      isToday: dateISO === todayISO,
    })
  }

  // 2. Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateISO = toISOString(year, month, day)
    grid.push({
      dateISO,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateISO === todayISO,
    })
  }

  // 3. Next month padding days to complete 7-day grid rows
  const remaining = (7 - (grid.length % 7)) % 7
  for (let day = 1; day <= remaining; day++) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const dateISO = toISOString(nextYear, nextMonth, day)
    grid.push({
      dateISO,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateISO === todayISO,
    })
  }

  return grid
}
