import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HISTORY_RANGE,
  HISTORY_RANGES,
  customRangeError,
  inRange,
  rangeOf,
} from '../historyRange'

describe('rent history date ranges', () => {
  const today = '2026-05-31' // month end: the old setMonth code skipped to 3 March here

  it('calendar months, no skipped days', () => {
    expect(rangeOf('thisMonth', today)).toEqual({ from: '2026-05-01', to: '2026-05-31' })
    expect(rangeOf('lastMonth', today)).toEqual({ from: '2026-04-01', to: '2026-04-30' })
    expect(rangeOf('last3', today)).toEqual({ from: '2026-03-01', to: '' })
    expect(rangeOf('last6', today)).toEqual({ from: '2025-12-01', to: '' })
    expect(rangeOf('last12', today)).toEqual({ from: '2025-06-01', to: '' })
  })
  it('years, all time, custom', () => {
    expect(rangeOf('thisYear', today)).toEqual({ from: '2026-01-01', to: '2026-12-31' })
    expect(rangeOf('lastYear', today)).toEqual({ from: '2025-01-01', to: '2025-12-31' })
    expect(rangeOf('all', today)).toEqual({ from: '', to: '' })
    expect(rangeOf('custom', today)).toBeNull()
  })
  it('February and leap years', () => {
    expect(rangeOf('lastMonth', '2028-03-15')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
    expect(rangeOf('thisMonth', '2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })
  it('"last N months" keep invoices made ahead of time', () => {
    const r = rangeOf('last3', '2026-10-28')
    expect(inRange('2026-11-01', r)).toBe(true) // next month's invoice, generated early
    expect(inRange('2026-07-31', r)).toBe(false)
    expect(inRange('2026-08-01T00:00:00', r)).toBe(true)
  })
  it('rows without a date are always shown', () => {
    expect(inRange(null, { from: '2026-01-01', to: '2026-01-31' })).toBe(true)
  })
  it('custom range check', () => {
    expect(customRangeError('2026-05-10', '2026-05-01')).not.toBe('')
    expect(customRangeError('2026-05-01', '2026-05-01')).toBe('')
    expect(customRangeError('', '2026-05-01')).toBe('')
  })
  it('default is a known preset', () => {
    expect(HISTORY_RANGES.some((r) => r.key === DEFAULT_HISTORY_RANGE)).toBe(true)
  })
})
