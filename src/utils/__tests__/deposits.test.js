import { describe, expect, test } from 'vitest'
import {
  DEPOSIT_STATUS_COLOR,
  depositNo,
  depositStatusOf,
  depositTotals,
  outstandingOf,
} from '../deposits'

describe('deposit status per tenancy', () => {
  test.each([
    [{ hasCurrentLease: false, held: 5000, agreedAmount: 10000 }, 'Lease ended'],
    [{ hasCurrentLease: true, held: 0, agreedAmount: null }, 'Not set'],
    [{ hasCurrentLease: true, held: 5000, agreedAmount: null }, 'Held'],
    [{ hasCurrentLease: true, held: 0, agreedAmount: 10000 }, 'Not received'],
    [{ hasCurrentLease: true, held: 4000, agreedAmount: 10000 }, 'Partial'],
    [{ hasCurrentLease: true, held: 10000, agreedAmount: 10000 }, 'Held in full'],
  ])('%o -> %s', (t, status) => {
    expect(depositStatusOf(t)).toBe(status)
    expect(DEPOSIT_STATUS_COLOR[status]).toBeTruthy()
  })

  test('outstanding never below zero, null without an agreed amount', () => {
    expect(outstandingOf({ agreedAmount: 10000, held: 4000 })).toBe(6000)
    expect(outstandingOf({ agreedAmount: 10000, held: 12000 })).toBe(0)
    expect(outstandingOf({ agreedAmount: null, held: 4000 })).toBeNull()
  })

  test('totals count outstanding only for current leases', () => {
    expect(
      depositTotals([
        { held: 4000, agreedAmount: 10000, hasCurrentLease: true },
        { held: 3000, agreedAmount: 10000, hasCurrentLease: false },
        { held: 0, agreedAmount: null, hasCurrentLease: true },
      ]),
    ).toEqual({ held: 7000, outstanding: 6000, tenanciesHolding: 2 })
  })

  test('number', () => expect(depositNo(7)).toBe('DEP-000007'))
})
