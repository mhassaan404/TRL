// Payment record types and reversal rules shared by the invoice History, Payments, Collections and printouts.
// Self-contained (no React or API imports) so the rules are easy to test.
//
// A payment record entered by mistake is never edited or deleted: it is reversed as a whole (cash, discount and
// late-fee waiver together) by a new linked record with the same amounts as negatives. A reversal means "entered
// by mistake"; it is not money paid back to the tenant.

const isTrue = (v) => v === true || v === 1

export const isReversal = (p) => p?.reversalOfPaymentId != null // the reversing record
export const isReversed = (p) => p?.reversedByPaymentId != null // an original that was reversed

export const paymentType = (p) =>
  isReversal(p)
    ? 'Reversal'
    : p.paymentMethod === 'Security Deposit'
      ? 'From deposit'
      : p.paymentMethod === 'Credit to Deposit'
        ? 'Credit moved'
        : Number(p.paymentAmount) > 0
          ? 'Payment'
          : isTrue(p.isLateFeeWaived)
            ? 'Late fee waived'
            : Number(p.discountAmount) > 0
              ? 'Discount'
              : 'Adjustment'

// Badge colour per type, so adjustments and reversals (money taken back) stand out from normal payments
export const PAYMENT_TYPE_COLOR = {
  Payment: 'success',
  Adjustment: 'warning',
  Reversal: 'danger',
  Discount: 'info',
  'Late fee waived': 'secondary',
  'From deposit': 'primary',
  'Credit moved': 'dark',
}

// Why the Reverse button is unavailable (codes from the API's ReverseBlock; null = can be reversed)
export const REVERSE_BLOCK_TEXT = {
  IS_REVERSAL: 'This record is a reversal.',
  ALREADY_REVERSED: 'Already reversed.',
  SETTLEMENT: 'Part of a finalized move-out settlement.',
  ADJUSTMENT: 'Adjustments can’t be reversed; record a new adjustment instead.',
  NOTHING: 'Nothing to reverse.',
  CANCELLED: 'The invoice is cancelled.',
  NEGATIVE: 'An adjustment already took back part of this payment.',
}
export const canReverse = (p) => !!p && !p.reverseBlock

// What reversing the record will do, for the confirmation window.
// inv: the invoice (balance, dueDate, lateFeeCharged, lateFeePerDay); today: YYYY-MM-DD
export const reversalEffects = (p, inv, today) => {
  const cash = Number(p?.paymentAmount) || 0
  const disc = Number(p?.discountAmount) || 0
  const waived = isTrue(p?.isLateFeeWaived)
  const balanceAfter = Math.round(((Number(inv?.balance) || 0) + cash + disc) * 100) / 100
  const overdue = !!inv?.dueDate && String(inv.dueDate).slice(0, 10) < today
  // The late fee builds up again from the original due date when rent is owed again on an overdue invoice
  // (not when a fee was already charged, or the invoice has no late fee)
  const lateFeeWarning =
    overdue && Number(inv?.lateFeeCharged) === 0 && Number(inv?.lateFeePerDay) > 0 && (cash > 0 || disc > 0 || waived)
  return { cash, disc, waived, balanceAfter, lateFeeWarning }
}
