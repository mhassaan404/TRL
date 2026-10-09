// Move-out settlement figures, the same calculation as the API (SettlementRepository.FinalizeAsync), so the form
// shows exactly what will be recorded. Self-contained so the rules are easy to test.
const num = (v) => Number(v) || 0
const round2 = (v) => Math.round(v * 100) / 100

export const DEDUCTION_TYPES = ['Damage', 'Cleaning', 'Maintenance', 'Utility', 'Other']
export const settlementNo = (id) => `SET-${String(id).padStart(6, '0')}`

// invoices: open invoices (balance > 0 owed, < 0 credit); held: deposit held; deductions: [{ amount }]
export const computeSettlement = ({ invoices = [], held = 0, deductions = [], finalAmount = 0, refundAmount = 0 }) => {
  const outstanding = round2(invoices.filter((i) => num(i.balance) > 0).reduce((s, i) => s + num(i.balance), 0))
  const credit = round2(-invoices.filter((i) => num(i.balance) < 0).reduce((s, i) => s + num(i.balance), 0))
  const deductionsTotal = round2(deductions.reduce((s, d) => s + num(d.amount), 0))
  const pool = round2(num(held) + credit)
  const owed = round2(outstanding + deductionsTotal)
  const applied = Math.min(pool, owed)
  const tenantOwes = round2(owed - applied)
  const refundDue = round2(pool - applied)
  return {
    outstanding, credit, deductionsTotal, held: num(held), pool, owed, applied, tenantOwes, refundDue,
    owesAfterPayment: round2(tenantOwes - num(finalAmount)),
    refundStillDue: round2(refundDue - num(refundAmount)),
  }
}

// Status of a recorded settlement
export const settlementStatusOf = (s) => {
  if (num(s.stillOwedNow) > 0) return 'Tenant owes'
  if (num(s.refundDue) - num(s.refundPaid) > 0) return 'Refund pending'
  return 'Closed'
}
export const SETTLEMENT_STATUS_COLOR = { 'Tenant owes': 'danger', 'Refund pending': 'warning', Closed: 'success' }

export const openSettlementStatement = (id) => window.open(`#/print/settlement/${id}`, '_blank', 'noopener')
