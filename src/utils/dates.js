// Dates as YYYY-MM-DD in the user's local time zone.
// Don't use toISOString() for this: it converts to UTC, so in Pakistan (UTC+5) any time before 05:00
// (and local-midnight dates such as "the 1st of this month") come out as the previous day.
const pad = (n) => String(n).padStart(2, '0')

export const toLocalDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const todayLocal = () => toLocalDateString(new Date())
