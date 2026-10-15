// Dashboard figures, built only from data the app already loads (Billing vs Collection, arrears ageing, rent roll,
// collections, security deposits). Self-contained (no React or API imports) so the rules are easy to test.
// Month figures (billed, collected, cash received, chart) follow the chosen month; the rest are as of today.
import { groupArrears, totalsOf as arrearsTotals } from './arrears'
import { daysToExpiry, summarize } from './rentRoll'
import { isReversalRow } from './collections'
import { depositTotals } from './deposits'

const num = (v) => Number(v) || 0
const round2 = (v) => Math.round(v * 100) / 100
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// 'yyyy-MM' moved by n months (n may be negative)
export const shiftMonth = (ym, n) => {
  const [y, m] = String(ym).split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 'Oct 2026'
export const monthName = (ym) => {
  const [y, m] = String(ym).split('-').map(Number)
  return y && m ? `${MONTHS[m - 1]} ${y}` : ''
}

// Rows of one building only ('' = all buildings), matched by building name
export const inBuilding = (rows, buildingName) =>
  buildingName ? rows.filter((r) => r.buildingName === buildingName) : rows

// Chart series from Billing vs Collection rows (one per month, oldest first)
export const chartSeries = (bvc) => {
  const rows = [...bvc].sort((a, b) => String(a.monthStart).localeCompare(String(b.monthStart)))
  return {
    labels: rows.map((r) => monthName(String(r.monthStart).slice(0, 7))),
    billed: rows.map((r) => num(r.totalBilled)),
    collected: rows.map((r) => num(r.collected)),
    outstanding: rows.map((r) => num(r.outstanding)),
  }
}

// Headline numbers. bvc = Billing vs Collection rows ({ monthStart, totalBilled, collected, cashReceived, ... });
// month = 'yyyy-MM' chosen on the dashboard.
export const kpis = ({ bvc = [], month, arrears = [], roll = [], deposits = [], today }) => {
  const m = bvc.find((r) => String(r.monthStart).slice(0, 7) === month) || {}
  const billed = num(m.totalBilled)
  const collected = num(m.collected)
  const tenants = groupArrears(arrears)
  const owed = arrearsTotals(tenants)
  const occ = summarize(roll, today)
  return {
    billed,
    collected,
    // That month's invoices only: billed - paid - discounts = still owed - credit (overpaid)
    discounts: num(m.discounts),
    monthOwed: num(m.outstanding),
    monthCredit: num(m.credit),
    collectionRate: billed > 0 ? round2((collected / billed) * 100) : null,
    outstanding: owed.total,
    overdueTenants: tenants.filter((t) => t.oldestDays > 0 && t.total > 0).length,
    occupancy: occ.occupancy,
    units: occ.units,
    occupied: occ.occupied,
    vacant: occ.units - occ.occupied,
    cashReceived: num(m.cashReceived),
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
