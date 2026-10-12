import { describe, expect, test } from 'vitest'
import { groupPayments, isReversalRow, monthLabel, presetRange, totalsOf } from '../collections'

describe('presetRange', () => {
  test('ranges relative to today, both days included', () => {
    expect(presetRange('This Month', '2026-10-09')).toEqual({
      from: '2026-10-01',
      to: '2026-10-09',
    })
    expect(presetRange('Last Month', '2026-10-09')).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    })
    expect(presetRange('Last 30 Days', '2026-10-09')).toEqual({
      from: '2026-09-10',
      to: '2026-10-09',
    })
    expect(presetRange('Last 3 Months', '2026-10-09')).toEqual({
      from: '2026-08-01',
      to: '2026-10-09',
    })
    expect(presetRange('This Year', '2026-10-09')).toEqual({ from: '2026-01-01', to: '2026-10-09' })
    expect(presetRange('Last Year', '2026-10-09')).toEqual({ from: '2025-01-01', to: '2025-12-31' })
    expect(presetRange('All Time', '2026-10-09')).toEqual({ from: '2000-01-01', to: '2026-10-09' })
    expect(presetRange('Custom', '2026-10-09')).toBeNull()
  })

  test('crosses year boundaries and month lengths', () => {
    expect(presetRange('Last Month', '2026-01-15')).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    })
    expect(presetRange('Last Month', '2024-03-10')).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    })
    expect(presetRange('Last 3 Months', '2026-02-10')).toEqual({
      from: '2025-12-01',
      to: '2026-02-10',
    })
  })

  test('monthLabel', () => {
    expect(monthLabel('2026-10')).toBe('Oct 2026')
    expect(monthLabel('')).toBe('')
  })
})

describe('totals with reversals', () => {
  const rows = [
    {
      paymentId: 1,
      tenantId: 1,
      tenantName: 'A',
      amount: 45000,
      discount: 5000,
      lateFeeWaived: true,
      method: 'Cash',
      paymentDate: '2026-10-09',
    },
    {
      paymentId: 2,
      tenantId: 1,
      tenantName: 'A',
      amount: -45000,
      discount: -5000,
      lateFeeWaived: false,
      reversalOfPaymentId: 1,
      reversesWaiver: true,
      method: 'Cash',
      paymentDate: '2026-10-09',
    },
    {
      paymentId: 3,
      tenantId: 2,
      tenantName: 'B',
      amount: 0,
      discount: -2000,
      lateFeeWaived: false,
      reversalOfPaymentId: 9,
      reversesWaiver: false,
      method: 'Cash',
      paymentDate: '2026-10-10',
    },
    {
      paymentId: 4,
      tenantId: 2,
      tenantName: 'B',
      amount: 10000,
      discount: 0,
      lateFeeWaived: false,
      method: 'Bank Transfer',
      paymentDate: '2026-10-10',
    },
  ]

  test('reversals reduce received / discount and are counted separately', () => {
    expect(isReversalRow(rows[1])).toBe(true)
    expect(isReversalRow(rows[0])).toBe(false)
    expect(totalsOf(rows)).toEqual({
      count: 2,
      reversals: 2,
      amount: 10000,
      discount: -2000,
      waived: 0,
      tenants: 2,
    })
  })

  test('no reversals: unchanged behaviour', () => {
    expect(totalsOf([{ amount: 5, discount: 1, lateFeeWaived: 1, tenantId: 1 }])).toEqual({
      count: 1,
      reversals: 0,
      amount: 5,
      discount: 1,
      waived: 1,
      tenants: 1,
    })
    expect(totalsOf([])).toEqual({
      count: 0,
      reversals: 0,
      amount: 0,
      discount: 0,
      waived: 0,
      tenants: 0,
    })
  })

  test('grouping keeps totals and orders days by date, others by amount', () => {
    const byDay = groupPayments(rows, 'Day')
    expect(byDay.map((g) => g.key)).toEqual(['2026-10-09', '2026-10-10'])
    expect(byDay.reduce((s, g) => s + g.amount, 0)).toBe(10000)
    expect(byDay[0].amount).toBe(0)
    const byMethod = groupPayments(rows, 'Method')
    expect(byMethod[0].label).toBe('Bank Transfer')
    expect(byMethod.find((g) => g.key === 'Cash').share).toBe(0)
  })
})
