// Dashboard figures, built only from data the app already loads (dashboard months, arrears ageing, rent roll,
// collections, security deposits). Self-contained (no React or API imports) so the rules are easy to test.
import { groupArrears, totalsOf as arrearsTotals } from './arrears'
import { daysToExpiry, summarize } from './rentRoll'
import { isReversalRow, totalsOf as paymentTotals } from './collections'
import { depositTotals } from './deposits'

const num = (v) => Number(v) || 0
const round2 = (v) => Math.round(v * 100) / 100

// Headline numbers. months = Dashboard rows ({ monthYear: 'yyyy-MM', totalRentDue, collectedAmount, ... }).
export const kpis = ({
  months = [],
  arrears = [],
  roll = [],
  payments = [],
  deposits = [],
  today,
}) => {
  const thisMonth = months.find((m) => m.monthYear === String(today).slice(0, 7)) || {}
  const billed = num(thisMonth.totalRentDue)
  const collected = num(thisMonth.collectedAmount)
  const tenants = groupArrears(arrears)
  const owed = arrearsTotals(tenants)
  const occ = summarize(roll, today)
  return {
    billed,
    collected,
    collectionRate: billed > 0 ? round2((collected / billed) * 100) : null,
    outstanding: owed.total,
    overdueTenants: tenants.filter((t) => t.oldestDays > 0 && t.total > 0).length,
    occupancy: occ.occupancy,
    units: occ.units,
    occupied: occ.occupied,
    vacant: occ.units - occ.occupied,
    cashReceived: paymentTotals(payments).amount,
    depositsHeld: round2(depositTotals(deposits).held),
  }
}

// Tenants with overdue money (past due date), largest amount first
export const topOverdue = (arrears, limit = 5) =>
  groupArrears(arrears)
    .filter((t) => t.oldestDays > 0 && t.total > 0)
    .sort((a, b) => b.total - a.total || b.oldestDays - a.oldestDays)
    .slice(0, limit)
    .map((t) => ({
      tenantId: t.tenantId,
      tenantName: t.tenantName,
      units: [...t.units].join(', '),
      days: t.oldestDays,
      owed: t.total,
    }))

// Leases past their end date (holdover) or ending within `days`, soonest first
export const leasesEndingSoon = (roll, today, days = 60, limit = 5) =>
  roll
    .map((r) => ({ r, d: daysToExpiry(r, today) }))
    .filter(({ d }) => d != null && d <= days)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ r, d }) => ({
      leaseId: r.leaseId,
      tenantName: r.tenantName,
      unit: `${r.buildingName ? `${r.buildingName} – ` : ''}${r.unitNumber}`,
      endDate: String(r.endDate || '').slice(0, 10),
      days: d,
    }))

// Latest money received (reversals and reversed payments left out), newest first
export const recentPayments = (payments, limit = 5) =>
  payments
    .filter((p) => !isReversalRow(p) && p.reversedByPaymentId == null && num(p.amount) > 0)
    .sort(
      (a, b) =>
        String(b.paymentDate).localeCompare(String(a.paymentDate)) ||
        num(b.paymentId) - num(a.paymentId),
    )
    .slice(0, limit)
