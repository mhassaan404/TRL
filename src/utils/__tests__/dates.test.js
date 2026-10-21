import { describe, expect, it, test } from 'vitest'
import { addMonths, formatTime } from '../dates'

describe('addMonths (same as SQL DATEADD MONTH, used for lease end dates)', () => {
  test.each([
    ['2026-01-15', 1, '2026-02-15'],
    ['2026-01-31', 1, '2026-02-28'], // shorter month: last day, not 3 March
    ['2024-01-31', 1, '2024-02-29'], // leap year
    ['2026-03-31', 1, '2026-04-30'],
    ['2026-08-31', 6, '2027-02-28'],
    ['2026-10-01', 12, '2027-10-01'],
    ['2026-12-31', 2, '2027-02-28'],
    ['2026-10-12T00:00:00', '3', '2027-01-12'], // ISO date-time and a string month count (select value)
  ])('%s + %s months = %s', (start, months, end) => expect(addMonths(start, months)).toBe(end))
})

describe('formatTime (12-hour, e.g. "4:47 PM")', () => {
  it('afternoon, morning, noon and midnight', () => {
    expect(formatTime(new Date(2026, 9, 19, 16, 47))).toBe('4:47 PM')
    expect(formatTime(new Date(2026, 9, 19, 9, 5))).toBe('9:05 AM')
    expect(formatTime(new Date(2026, 9, 19, 12, 0))).toBe('12:00 PM')
    expect(formatTime(new Date(2026, 9, 19, 0, 30))).toBe('12:30 AM')
  })
  it('API timestamps (no time zone) and empty values', () => {
    expect(formatTime('2026-10-19T16:47:12.123')).toBe('4:47 PM')
    expect(formatTime(null)).toBe('')
    expect(formatTime('not a date')).toBe('')
  })
})
