import { describe, expect, test } from 'vitest'
import {
  groupPayments,
  groupUnits,
  isRefundRow,
  isReversalRow,
  refundEntry,
  dayHeading,
  entryStatus,
  inGroup,
  listOrder,
  monthLabel,
  paymentsLabel,
  sectionsByDay,
  presetRange,
  totalsOf,
} from '../collections'

describe('Payments list', () => {
  // 14 Oct as in company BC: #3 paid, #4 reverses it, #5 paid again (reversed later by #7 on 15 Oct)
  const day14 = [
    {
      paymentId: 5,
      paymentDate: '2026-10-14T00:00:00',
      enteredAt: '2026-10-14T11:30:00',
      reversedByPaymentId: 7,
      reversedAt: '2026-10-15T09:00:00',
      reversalReason: 'wrong',
    },
    {
      paymentId: 4,
      paymentDate: '2026-10-14T00:00:00',
      enteredAt: '2026-10-14T11:15:00',
      reversalOfPaymentId: 3,
      notes: 'no',
    },
    {
      paymentId: 3,
      paymentDate: '2026-10-14T00:00:00',
      enteredAt: '2026-10-14T11:02:00',
      reversedByPaymentId: 4,
    },
    { paymentId: 9, paymentDate: '2026-10-15T00:00:00', enteredAt: '2026-10-15T08:00:00' },
    { paymentId: 1, paymentDate: '2026-10-14T00:00:00', enteredAt: null },
  ]

  test('days newest first, each day in the order the entries were made; the input is not changed', () => {
    expect(listOrder(day14).map((p) => p.paymentId)).toEqual([9, 1, 3, 4, 5])
    expect(day14.map((p) => p.paymentId)).toEqual([5, 4, 3, 9, 1])
  })

  test('one clear status per entry', () => {
    const [p5, p4, p3, p9] = day14
    expect(entryStatus(p9)).toEqual({ kind: 'ok', text: 'Counted' })
    expect(entryStatus(p3)).toMatchObject({ kind: 'cancelled', text: 'Reversed by #4' })
    expect(entryStatus(p5)).toEqual({
      kind: 'cancelled',
      text: 'Reversed by #7',
      at: '2026-10-15T09:00:00',
      reason: 'wrong',
    })
    expect(entryStatus(p4)).toEqual({ kind: 'reversal', text: 'Reverses payment #3', reason: 'no' })
  })

  test('cuts a page into days and names them', () => {
    const s = sectionsByDay(listOrder(day14))
    expect(s.map((x) => [x.day, x.rows.length])).toEqual([
      ['2026-10-15', 1],
      ['2026-10-14', 4],
    ])
    expect(dayHeading('2026-10-14')).toBe('Wed, 14 Oct 2026')
    expect(dayHeading('')).toBe('')
  })

  test('a Summary row picks its payments', () => {
    const p = { paymentDate: '2026-10-14T00:00:00', method: 'Cash', tenantName: 'A' }
    expect(inGroup(p, 'Day', '2026-10-14')).toBe(true)
    expect(inGroup(p, 'Month', '2026-10')).toBe(true)
    expect(inGroup(p, 'Method', 'Bank Transfer')).toBe(false)
    expect(inGroup(p, 'Nope', 'x')).toBe(false)
  })
})

describe('paymentsLabel', () => {
  test('shows reversals next to the payment count', () => {
    expect(paymentsLabel({ count: 2, reversals: 0 })).toBe('2')
    expect(paymentsLabel({ count: 2, reversals: 1 })).toBe('2 (+1 reversal)')
    expect(paymentsLabel({ count: 0, reversals: 3 })).toBe('0 (+3 reversals)')
    expect(paymentsLabel({})).toBe('0')
  })

  test('works on real totals: 2 payments and 1 reversal on one day', () => {
    const rows = [
      { paymentDate: '2026-10-15', amount: 1000, tenantId: 1 },
      { paymentDate: '2026-10-15', amount: 597, tenantId: 1 },
      { paymentDate: '2026-10-15', amount: -12500, reversalOfPaymentId: 3, tenantId: 1 },
    ]
    const [day] = groupPayments(rows, 'Day')
    expect(paymentsLabel(day)).toBe('2 (+1 reversal)')
    expect(paymentsLabel(totalsOf(rows))).toBe('2 (+1 reversal)')
  })
})

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
      refunds: 0,
      amount: 10000,
      refunded: 0,
      net: 10000,
      discount: -2000,
      waived: 0,
      tenants: 2,
    })
  })

  test('no reversals: unchanged behaviour', () => {
    expect(totalsOf([{ amount: 5, discount: 1, lateFeeWaived: 1, tenantId: 1 }])).toEqual({
      count: 1,
      reversals: 0,
      refunds: 0,
      amount: 5,
      refunded: 0,
      net: 5,
      discount: 1,
      waived: 1,
      tenants: 1,
    })
    expect(totalsOf([])).toEqual({
      count: 0,
      reversals: 0,
      refunds: 0,
      amount: 0,
      refunded: 0,
      net: 0,
      discount: 0,
      waived: 0,
      tenants: 0,
    })
  })

  describe('refunds (overpaid rent given back at move-out)', () => {
    // as the API returns them (Reports/CollectionRefunds): 4,000 of a 4,000 refund and 5,000 of a 10,000 refund
    const api = [
      {
        refundId: 7,
        settlementId: 3,
        refundDate: '2026-10-15T00:00:00',
        creditPart: 4000,
        refundTotal: 4000,
        method: 'Bank Transfer',
        tenantId: 9,
        tenantName: 'A',
        enteredAt: '2026-10-15T10:00:00',
        recordedBy: 'admin',
        leaseCurrent: false,
      },
      {
        refundId: 8,
        settlementId: 3,
        refundDate: '2026-10-16T00:00:00',
        creditPart: 5000,
        refundTotal: 10000,
        method: 'Cash',
        tenantId: 9,
        tenantName: 'A',
        enteredAt: '2026-10-16T09:00:00',
        recordedBy: 'admin',
        leaseCurrent: false,
      },
    ]
    const refunds = api.map(refundEntry)
    const pays = [
      {
        paymentId: 1,
        paymentDate: '2026-10-15',
        amount: 50000,
        discount: 0,
        tenantId: 9,
        method: 'Cash',
      },
      {
        paymentId: 2,
        paymentDate: '2026-10-15',
        amount: 20000,
        discount: 500,
        tenantId: 8,
        method: 'Cash',
      },
    ]

    test('a refund is money out on its date, with its own key and no payment #', () => {
      expect(refunds[1]).toMatchObject({
        isRefund: true,
        rowKey: 'r8',
        paymentId: null,
        paymentDate: '2026-10-16T00:00:00',
        amount: -5000,
        discount: 0,
        refundTotal: 10000,
        method: 'Cash',
      })
      expect(isRefundRow(refunds[0])).toBe(true)
      expect(isRefundRow(pays[0])).toBe(false)
      expect(isReversalRow(refunds[0])).toBe(false)
    })

    test('never part of Received or Payments; Net = Received - Refunded', () => {
      const t = totalsOf([...pays, ...refunds])
      expect(t).toMatchObject({
        count: 2,
        refunds: 2,
        amount: 70000,
        refunded: 9000,
        net: 61000,
        discount: 500,
      })
      expect(t.tenants).toBe(2) // tenants of the payments
      expect(totalsOf(refunds)).toMatchObject({
        count: 0,
        amount: 0,
        refunded: 9000,
        net: -9000,
        tenants: 0,
      })
    })

    test('grouped per day, share of Received ignores refunds', () => {
      const byDay = groupPayments([...pays, ...refunds], 'Day')
      expect(byDay.map((g) => [g.key, g.amount, g.refunded, g.net, g.share])).toEqual([
        ['2026-10-16', 0, 5000, -5000, 0],
        ['2026-10-15', 70000, 4000, 66000, 100],
      ])
    })

    test('one clear status: which settlement, and which part is rent', () => {
      expect(entryStatus(refunds[0])).toEqual({
        kind: 'refund',
        text: 'Refund · settlement #3',
        reason: 'Overpaid rent',
      })
      expect(entryStatus(refunds[1]).reason).toBe('Overpaid rent part of a 10,000 refund')
    })
  })

  test('grouping keeps totals and orders days newest first, others by amount', () => {
    const byDay = groupPayments(rows, 'Day')
    expect(byDay.map((g) => g.key)).toEqual(['2026-10-10', '2026-10-09'])
    expect(byDay.reduce((s, g) => s + g.amount, 0)).toBe(10000)
    expect(byDay[1].amount).toBe(0)
    const byMonth = groupPayments(
      [
        { paymentDate: '2026-09-30', amount: 1 },
        { paymentDate: '2026-11-01', amount: 1 },
        { paymentDate: '2026-10-15', amount: 1 },
      ],
      'Month',
    )
    expect(byMonth.map((g) => g.key)).toEqual(['2026-11', '2026-10', '2026-09'])
    const byMethod = groupPayments(rows, 'Method')
    expect(byMethod[0].label).toBe('Bank Transfer')
    expect(byMethod.find((g) => g.key === 'Cash').share).toBe(0)
  })
})

describe('groupUnits', () => {
  test('writes each building once', () => {
    expect(
      groupUnits(
        'Business Center – 101, Business Center – 102, Business Center – 103, Tower A – 5',
      ),
    ).toBe('Business Center: 101, 102, 103 · Tower A: 5')
    expect(groupUnits('Business Center – 101')).toBe('Business Center: 101')
    expect(groupUnits('U1, Tower – 2')).toBe('U1 · Tower: 2')
    expect(groupUnits('')).toBe('')
    expect(groupUnits(null)).toBe('')
  })
})
