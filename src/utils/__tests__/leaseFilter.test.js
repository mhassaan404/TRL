import { describe, expect, it } from 'vitest'
import { LEASE_FILTERS, matchesLeaseFilter } from '../leaseFilter'

describe('current / moved-out filter', () => {
  const current = { leaseCurrent: true }
  const moved = { leaseCurrent: false }

  it('All shows everything', () => {
    expect([current, moved].every((r) => matchesLeaseFilter(r, ''))).toBe(true)
  })
  it('Current and Moved out split the rows', () => {
    expect(matchesLeaseFilter(current, 'current')).toBe(true)
    expect(matchesLeaseFilter(moved, 'current')).toBe(false)
    expect(matchesLeaseFilter(moved, 'moved')).toBe(true)
    expect(matchesLeaseFilter(current, 'moved')).toBe(false)
  })
  it('1 / 0 from the API work the same as true / false', () => {
    expect(matchesLeaseFilter({ leaseCurrent: 1 }, 'current')).toBe(true)
    expect(matchesLeaseFilter({ leaseCurrent: 0 }, 'moved')).toBe(true)
  })
  it('a row without the flag is never hidden', () => {
    expect(matchesLeaseFilter({}, 'moved')).toBe(true)
    expect(matchesLeaseFilter({}, 'current')).toBe(true)
  })
  it('default option is All', () => {
    expect(LEASE_FILTERS[0].key).toBe('')
  })
})
