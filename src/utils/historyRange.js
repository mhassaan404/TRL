// Date ranges for the Rent History filter (on the invoice date). Calendar months, so no days are skipped at month
// ends. The "last N months" ranges have no end date, so invoices generated ahead of time are never hidden.
import { addMonths } from './dates'

export const HISTORY_RANGES = [
  { key: 'last3', label: 'Last 3 months' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'last6', label: 'Last 6 months' },
  { key: 'last12', label: 'Last 12 months' },
  { key: 'thisYear', label: 'This year' },
  { key: 'lastYear', label: 'Last year' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom range…' },
]

export const DEFAULT_HISTORY_RANGE = 'last3'

const day = (d) => String(d || '').slice(0, 10)
const monthStart = (ymd, n = 0) => `${addMonths(`${day(ymd).slice(0, 7)}-01`, n).slice(0, 7)}-01`
const lastDayOf = (ymd, n = 0) => {
  const start = monthStart(ymd, n)
  const [y, m] = start.split('-').map(Number)
  return `${start.slice(0, 8)}${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
}

// { from, to } as YYYY-MM-DD; '' = no limit on that side. null for 'custom' (the page supplies the dates).
export const rangeOf = (key, today) => {
  const y = day(today).slice(0, 4)
  switch (key) {
    case 'thisMonth':
      return { from: monthStart(today), to: lastDayOf(today) }
    case 'lastMonth':
      return { from: monthStart(today, -1), to: lastDayOf(today, -1) }
    case 'last3':
      return { from: monthStart(today, -2), to: '' }
    case 'last6':
      return { from: monthStart(today, -5), to: '' }
    case 'last12':
      return { from: monthStart(today, -11), to: '' }
    case 'thisYear':
      return { from: `${y}-01-01`, to: `${y}-12-31` }
    case 'lastYear':
      return { from: `${Number(y) - 1}-01-01`, to: `${Number(y) - 1}-12-31` }
    case 'custom':
      return null
    default:
      return { from: '', to: '' } // all time
  }
}

// Message for a custom range that can't be used ('' = fine). Either side may be left empty.
export const customRangeError = (from, to) =>
  from && to && day(from) > day(to) ? 'The From date must be on or before the To date.' : ''

// Is this date inside the range? Rows without a date are always shown.
export const inRange = (date, { from, to }) => {
  const d = day(date)
  if (!d) return true
  return !(from && d < from) && !(to && d > to)
}
