// Arrears ageing: buckets and per-tenant totals.
// Self-contained (no React or API imports) so the rules are easy to test.

// Days past the due date. "Current" = not overdue yet (due today or later).
export const BUCKETS = [
  { key: 'current', label: 'Current', min: 0, max: 0 },
  { key: 'd30', label: '1–30 days', min: 1, max: 30 },
  { key: 'd60', label: '31–60 days', min: 31, max: 60 },
  { key: 'd90', label: '61–90 days', min: 61, max: 90 },
  { key: 'd90plus', label: '90+ days', min: 91, max: Infinity },
]

const num = (v) => Number(v) || 0
const round2 = (v) => Math.round(v * 100) / 100

export const bucketOf = (daysOverdue) => {
  const d = Math.max(0, num(daysOverdue))
  return BUCKETS.find((b) => d >= b.min && d <= b.max).key
}

const emptyTotals = () => ({ ...Object.fromEntries(BUCKETS.map((b) => [b.key, 0])), total: 0, credit: 0, net: 0 })

// Owed > 0 goes into its bucket; owed < 0 (overpaid invoice) is a credit, shown separately and taken off in Net.
const addInvoice = (t, inv) => {
  const owed = num(inv.owed)
  if (owed > 0) {
    t[inv.bucket] = round2(t[inv.bucket] + owed)
    t.total = round2(t.total + owed)
  } else {
    t.credit = round2(t.credit - owed)
  }
  t.net = round2(t.total - t.credit)
}

// One row per tenant: bucket amounts, total, credit, net, oldest overdue days, units and the invoices
export const groupArrears = (rows) => {
  const map = new Map()
  rows.forEach((r) => {
    if (!map.has(r.tenantId)) {
      map.set(r.tenantId, {
        tenantId: r.tenantId, tenantName: r.tenantName, phone: r.phone,
        units: new Set(), buildings: new Set(), invoices: [], oldestDays: 0, ...emptyTotals(),
      })
    }
    const g = map.get(r.tenantId)
    const inv = { ...r, bucket: bucketOf(r.daysOverdue) }
    g.invoices.push(inv)
    if (r.unitNumber) g.units.add(`${r.buildingName ? `${r.buildingName} – ` : ''}${r.unitNumber}`)
    if (r.buildingName) g.buildings.add(r.buildingName)
    if (num(inv.owed) > 0) g.oldestDays = Math.max(g.oldestDays, num(r.daysOverdue))
    addInvoice(g, inv)
  })
  return [...map.values()]
}

// Column totals over a list of tenant groups
export const totalsOf = (groups) => {
  const t = emptyTotals()
  groups.forEach((g) => {
    BUCKETS.forEach((b) => { t[b.key] = round2(t[b.key] + g[b.key]) })
    t.total = round2(t.total + g.total)
    t.credit = round2(t.credit + g.credit)
  })
  t.net = round2(t.total - t.credit)
  return t
}
