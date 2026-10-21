// Dates as YYYY-MM-DD in the user's local time zone.
// Don't use toISOString() for this: it converts to UTC, so in Pakistan (UTC+5) any time before 05:00
// (and local-midnight dates such as "the 1st of this month") come out as the previous day.
const pad = (n) => String(n).padStart(2, '0')

export const toLocalDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const todayLocal = () => toLocalDateString(new Date())

// Time of day in 12-hour form, e.g. "4:47 PM" (the app shows times this way everywhere). '' for a missing/bad value.
export const formatTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const h = d.getHours()
  return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`
}

// YYYY-MM-DD plus whole months, kept on the last day of a shorter month (31 Jan + 1 month = 28/29 Feb), the same as
// SQL Server's DATEADD(MONTH, ...) that computes a lease's end date
export const addMonths = (ymd, months) => {
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number)
  const first = new Date(y, m - 1 + Number(months), 1)
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return toLocalDateString(new Date(first.getFullYear(), first.getMonth(), Math.min(d, lastDay)))
}
