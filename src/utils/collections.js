// Collections report: date presets, totals and grouping of payments.
// Self-contained (no React or API imports) so the rules are easy to test.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const num = (v) => Number(v) || 0
const round2 = (v) => Math.round(v * 100) / 100
const pad = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => {
  const dt = new Date(y, m - 1, d)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}
const day = (d) => String(d || '').slice(0, 10) // YYYY-MM-DD

export const PRESETS = ['This Month', 'Last Month', 'Last 30 Days', 'This Year', 'Last Year']
export const STATEMENT_PRESETS = ['This Month', 'Last Month', 'Last 3 Months', 'This Year', 'Last Year', 'All Time']
export const ALL_TIME_FROM = '2000-01-01' // earliest date the API accepts

// { from, to } (YYYY-MM-DD, both included) for a preset, relative to today (YYYY-MM-DD)
export const presetRange = (preset, today) => {
  const [y, m, d] = today.split('-').map(Number)
  switch (preset) {
    case 'This Month': return { from: ymd(y, m, 1), to: today }
    case 'Last Month': return { from: ymd(y, m - 1, 1), to: ymd(y, m, 0) }
    case 'Last 30 Days': return { from: ymd(y, m, d - 29), to: today }
    case 'Last 3 Months': return { from: ymd(y, m - 2, 1), to: today }
    case 'This Year': return { from: ymd(y, 1, 1), to: today }
    case 'All Time': return { from: ALL_TIME_FROM, to: today }
    case 'Last Year': return { from: ymd(y - 1, 1, 1), to: ymd(y - 1, 12, 31) }
    default: return null
  }
}

// "2026-10" -> "Oct 2026"
export const monthLabel = (ym) => {
  const [y, m] = String(ym || '').split('-')
  return y && m ? `${MONTHS[Number(m) - 1]} ${y}` : ''
}

export const GROUP_BY = {
  Day: { key: (p) => day(p.paymentDate), label: (k) => k, sortByKey: true },
  Month: { key: (p) => day(p.paymentDate).slice(0, 7), label: monthLabel, sortByKey: true },
  Method: { key: (p) => p.method || 'Unknown', label: (k) => k },
  Building: { key: (p) => p.buildingName || 'No building', label: (k) => k },
  Tenant: { key: (p) => p.tenantName || 'Unknown', label: (k) => k },
}

export const isReversalRow = (p) => p?.reversalOfPaymentId != null

// Totals over a list of payments. A reversal (payment entered by mistake, taken back on its own date) has negative
// amounts, so it lowers Received / Discount by exactly its cash / discount; it is counted under "reversals", not
// as a payment, and takes one off "waived" when the reversed record had waived the late fee.
export const totalsOf = (payments) => {
  const t = { count: 0, reversals: 0, amount: 0, discount: 0, waived: 0, tenants: new Set() }
  payments.forEach((p) => {
    if (isReversalRow(p)) {
      t.reversals += 1
      if (p.reversesWaiver === true || p.reversesWaiver === 1) t.waived -= 1
    } else {
      t.count += 1
      if (p.lateFeeWaived === true || p.lateFeeWaived === 1) t.waived += 1
    }
    t.amount = round2(t.amount + num(p.amount))
    t.discount = round2(t.discount + num(p.discount))
    t.tenants.add(p.tenantId)
  })
  return { ...t, tenants: t.tenants.size }
}

// One row per group: { key, label, count, amount, discount, waived, tenants, share (% of amount) }.
// Day/Month in date order; the others by amount received, largest first.
export const groupPayments = (payments, by) => {
  const g = GROUP_BY[by]
  const map = new Map()
  payments.forEach((p) => {
    const k = g.key(p)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(p)
  })
  const total = payments.reduce((s, p) => s + num(p.amount), 0)
  const rows = [...map.entries()].map(([k, list]) => {
    const t = totalsOf(list)
    return { key: k, label: g.label(k), ...t, share: total ? round2((t.amount / total) * 100) : 0 }
  })
  return rows.sort((a, b) => (g.sortByKey ? a.key.localeCompare(b.key) : b.amount - a.amount || a.label.localeCompare(b.label)))
}
