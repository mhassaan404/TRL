import { describe, expect, test } from 'vitest'
import {
  canReverse,
  isReversal,
  isReversed,
  paymentType,
  PAYMENT_TYPE_COLOR,
  REVERSE_BLOCK_TEXT,
  reversalEffects,
} from '../payments'

describe('paymentType', () => {
  test('labels every kind of payment record', () => {
    expect(paymentType({ paymentAmount: 100 })).toBe('Payment')
    expect(paymentType({ paymentAmount: -100, reversalOfPaymentId: 4 })).toBe('Reversal')
    expect(
      paymentType({
        paymentAmount: 0,
        discountAmount: 0,
        isLateFeeWaived: 0,
        reversalOfPaymentId: 4,
      }),
    ).toBe('Reversal')
    expect(paymentType({ paymentAmount: -100 })).toBe('Adjustment')
    expect(paymentType({ paymentAmount: 0, isLateFeeWaived: true })).toBe('Late fee waived')
    expect(paymentType({ paymentAmount: 0, isLateFeeWaived: 1 })).toBe('Late fee waived')
    expect(paymentType({ paymentAmount: 0, discountAmount: 5 })).toBe('Discount')
    expect(paymentType({ paymentAmount: 5, paymentMethod: 'Security Deposit' })).toBe(
      'From deposit',
    )
    expect(paymentType({ paymentAmount: 5, paymentMethod: 'Credit to Deposit' })).toBe(
      'Credit moved',
    )
  })

  test('every type has a badge colour', () => {
    for (const t of [
      'Payment',
      'Reversal',
      'Adjustment',
      'Discount',
      'Late fee waived',
      'From deposit',
      'Credit moved',
    ]) {
      expect(PAYMENT_TYPE_COLOR[t]).toBeTruthy()
    }
  })
})

describe('reversal flags', () => {
  test('reversal / reversed / can reverse', () => {
    expect(isReversal({ reversalOfPaymentId: null })).toBe(false)
    expect(isReversal({ reversalOfPaymentId: 3 })).toBe(true)
    expect(isReversed({ reversedByPaymentId: 9 })).toBe(true)
    expect(isReversed({})).toBe(false)
    expect(canReverse({ reverseBlock: null })).toBe(true)
    expect(canReverse({ reverseBlock: 'ADJUSTMENT' })).toBe(false)
    expect(canReverse(null)).toBe(false)
  })

  test('every API block code has a text', () => {
    for (const c of [
      'IS_REVERSAL',
      'ALREADY_REVERSED',
      'SETTLEMENT',
      'ADJUSTMENT',
      'NOTHING',
      'CANCELLED',
      'NEGATIVE',
    ]) {
      expect(REVERSE_BLOCK_TEXT[c]).toBeTruthy()
    }
  })
})

describe('reversalEffects', () => {
  const inv = { balance: 0, dueDate: '2026-08-05T00:00:00', lateFeeCharged: 0, lateFeePerDay: 500 }

  test('whole row is taken back and the late fee warning shows on an overdue invoice', () => {
    expect(
      reversalEffects(
        { paymentAmount: 45000, discountAmount: 5000, isLateFeeWaived: true },
        inv,
        '2026-10-09',
      ),
    ).toEqual({
      cash: 45000,
      disc: 5000,
      waived: true,
      balanceAfter: 50000,
      lateFeeWarning: true,
    })
    const e = reversalEffects(
      { paymentAmount: 0, discountAmount: 0, isLateFeeWaived: 1 },
      { ...inv, balance: 40000 },
      '2026-10-09',
    )
    expect(e.lateFeeWarning).toBe(true)
    expect(e.balanceAfter).toBe(40000)
  })

  test('no late fee warning when not overdue, already charged or no late fee rule', () => {
    const p = { paymentAmount: 100 }
    expect(reversalEffects(p, { ...inv, dueDate: '2026-10-25' }, '2026-10-09').lateFeeWarning).toBe(
      false,
    )
    expect(reversalEffects(p, { ...inv, dueDate: '2026-10-09' }, '2026-10-09').lateFeeWarning).toBe(
      false,
    )
    expect(reversalEffects(p, { ...inv, lateFeeCharged: 2000 }, '2026-10-09').lateFeeWarning).toBe(
      false,
    )
    expect(reversalEffects(p, { ...inv, lateFeePerDay: 0 }, '2026-10-09').lateFeeWarning).toBe(
      false,
    )
  })

  test('balance after is rounded to paisa', () => {
    expect(
      reversalEffects(
        { paymentAmount: 0.1, discountAmount: 0.2 },
        { ...inv, balance: 0 },
        '2026-10-09',
      ).balanceAfter,
    ).toBe(0.3)
  })
})
