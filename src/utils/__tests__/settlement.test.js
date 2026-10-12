import { describe, expect, test } from 'vitest'
import { computeSettlement, settlementNo, settlementStatusOf } from '../settlement'

describe('computeSettlement (same calculation as SettlementRepository.FinalizeAsync)', () => {
  test('deposit covers dues and deductions, rest is refunded', () => {
    const s = computeSettlement({
      invoices: [{ balance: 30000 }, { balance: 5000 }],
      held: 100000,
      deductions: [{ amount: 10000 }, { amount: 2500 }],
    })
    expect(s.credit === 0).toBe(true) // -0 when there is no credit: shown only when > 0, sent as 0 in JSON
    expect(s).toMatchObject({
      outstanding: 35000,
      deductionsTotal: 12500,
      pool: 100000,
      owed: 47500,
      applied: 47500,
      tenantOwes: 0,
      refundDue: 52500,
    })
  })

  test('deposit too small: tenant owes the difference, final payment reduces it', () => {
    const s = computeSettlement({ invoices: [{ balance: 80000 }], held: 50000, finalAmount: 10000 })
    expect(s).toMatchObject({
      applied: 50000,
      tenantOwes: 30000,
      refundDue: 0,
      owesAfterPayment: 20000,
    })
  })

  test('overpaid invoice credit joins the deposit pool', () => {
    const s = computeSettlement({
      invoices: [{ balance: -4000 }, { balance: 10000 }],
      held: 20000,
      refundAmount: 4000,
    })
    expect(s).toMatchObject({
      outstanding: 10000,
      credit: 4000,
      pool: 24000,
      applied: 10000,
      refundDue: 14000,
      refundStillDue: 10000,
    })
  })

  test('nothing held and nothing owed', () => {
    const s = computeSettlement({})
    expect(s.credit === 0).toBe(true)
    expect(s).toMatchObject({
      outstanding: 0,
      pool: 0,
      owed: 0,
      applied: 0,
      tenantOwes: 0,
      refundDue: 0,
    })
  })

  test('decimal amounts are rounded to paisa', () => {
    const s = computeSettlement({ invoices: [{ balance: 0.1 }, { balance: 0.2 }], held: 0.3 })
    expect(s.outstanding).toBe(0.3)
    expect(s.tenantOwes).toBe(0)
  })
})

describe('settlement status and number', () => {
  test('status', () => {
    expect(settlementStatusOf({ stillOwedNow: 5 })).toBe('Tenant owes')
    expect(settlementStatusOf({ stillOwedNow: 0, refundDue: 100, refundPaid: 40 })).toBe(
      'Refund pending',
    )
    expect(settlementStatusOf({ stillOwedNow: 0, refundDue: 100, refundPaid: 100 })).toBe('Closed')
  })
  test('number', () => expect(settlementNo(12)).toBe('SET-000012'))
})
