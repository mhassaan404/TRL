// Billing vs Collection report: month presets, collection rate and totals.
// Self-contained (no React or API imports) so the rules are easy to test.

const num = (v) => Number(v) || 0
const round2 = (v) => Math.round(v * 100) / 100
const ym = (y, m) => {
  const dt = new Date(y, m - 1, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

export const MONTH_PRESETS = ['This Year', 'Last Year', 'Last 12 Months', 'Last 6 Months']

// { from, to } as YYYY-MM for a preset, relative to today (YYYY-MM-DD)
export const monthPresetRange = (preset, today) => {
  const [y, m] = today.split('-').map(Number)
  switch (preset) {
    case 'This Year': return { from: ym(y, 1), to: ym(y, m) }
    case 'Last Year': return { from: ym(y - 1, 1), to: ym(y - 1, 12) }
    case 'Last 12 Months': return { from: ym(y, m - 11), to: ym(y, m) }
    case 'Last 6 Months': return { from: ym(y, m - 5), to: ym(y, m) }
    default: return null
  }
}

// Months from..to inclusive (YYYY-MM); 0 if the range is reversed or incomplete
export const monthCount = (from, to) => {
  if (!from || !to) return 0
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return Math.max(0, (ty - fy) * 12 + tm - fm + 1)
}

// % of what was due (billed - discounts) that has been collected; null when nothing was due
export const collectionRate = (row) => {
  const due = num(row.totalBilled) - num(row.discounts)
  return due > 0 ? round2((num(row.collected) / due) * 100) : null
}

const SUM_FIELDS = [
  'invoices', 'rentBilled', 'extraBilled', 'lateFeesCharged', 'totalBilled', 'discounts', 'collected', 'outstanding',
  'credit', 'waivedInvoices', 'accruingLateFee', 'cancelledInvoices', 'cancelledAmount', 'cashReceived',
]

export const totalsOf = (rows) => {
  const t = Object.fromEntries(SUM_FIELDS.map((f) => [f, 0]))
  rows.forEach((r) => SUM_FIELDS.forEach((f) => { t[f] = round2(t[f] + num(r[f])) }))
  return t
}
