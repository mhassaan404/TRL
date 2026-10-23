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
export const STATEMENT_PRESETS = [
  'This Month',
  'Last Month',
  'Last 3 Months',
  'This Year',
  'Last Year',
  'All Time',
]
export const ALL_TIME_FROM = '2000-01-01' // earliest date the API accepts

// { from, to } (YYYY-MM-DD, both included) for a preset, relative to today (YYYY-MM-DD)
export const presetRange = (preset, today) => {
  const [y, m, d] = today.split('-').map(Number)
  switch (preset) {
    case 'This Month':
      return { from: ymd(y, m, 1), to: today }
    case 'Last Month':
      return { from: ymd(y, m - 1, 1), to: ymd(y, m, 0) }
    case 'Last 30 Days':
      return { from: ymd(y, m, d - 29), to: today }
    case 'Last 3 Months':
      return { from: ymd(y, m - 2, 1), to: today }
    case 'This Year':
      return { from: ymd(y, 1, 1), to: today }
    case 'All Time':
      return { from: ALL_TIME_FROM, to: today }
    case 'Last Year':
      return { from: ymd(y - 1, 1, 1), to: ymd(y - 1, 12, 31) }
    default:
      return null
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

// The Payments column: "2", or "2 (+1 reversal)" when reversals are in the group too (their minus amounts are in
// Received, but they are not counted as payments)
export const paymentsLabel = ({ count = 0, reversals = 0 }) =>
  reversals ? `${count} (+${reversals} reversal${reversals === 1 ? '' : 's'})` : String(count)

export const isReversalRow = (p) => p?.reversalOfPaymentId != null

// Overpaid rent given back at a move-out settlement (Reports/CollectionRefunds) as a Collections list entry: money
// out on its refund date, never part of Received; only the rent part of the refund (the deposit was never income)
export const isRefundRow = (p) => p?.isRefund === true
export const refundEntry = (r) => ({
  isRefund: true,
  rowKey: `r${r.refundId}`,
  refundId: r.refundId,
  settlementId: r.settlementId,
  paymentId: null,
  paymentDate: r.refundDate,
  enteredAt: r.enteredAt,
  amount: -num(r.creditPart),
  discount: 0,
  refundTotal: num(r.refundTotal),
  method: r.method,
  reference: r.reference || '',
  recordedBy: r.recordedBy,
  tenantId: r.tenantId,
  tenantName: r.tenantName,
  buildingName: r.buildingName,
  floorNumber: r.floorNumber,
  unitNumber: r.unitNumber,
  leaseCurrent: r.leaseCurrent,
  notes: '',
})

// Totals over a list of payments (and refunds). A reversal (payment entered by mistake, taken back on its own date)
// has negative amounts, so it lowers Received / Discount by exactly its cash / discount; it is counted under
// "reversals", not as a payment, and takes one off "waived" when the reversed record had waived the late fee.
// A refund (overpaid rent given back) is money out: counted under refunds / refunded, never in Received;
// net = received - refunded.
export const totalsOf = (payments) => {
  const t = {
    count: 0,
    reversals: 0,
    refunds: 0,
    amount: 0,
    refunded: 0,
    discount: 0,
    waived: 0,
    tenants: new Set(),
  }
  payments.forEach((p) => {
    if (isRefundRow(p)) {
      t.refunds += 1
      t.refunded = round2(t.refunded - num(p.amount))
      return
    }
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
  return { ...t, tenants: t.tenants.size, net: round2(t.amount - t.refunded) }
}

// One row per group: { key, label, count, amount, refunded, net, discount, waived, tenants, share (% of received) }.
// Day/Month newest first; the others by amount received, largest first.
export const groupPayments = (payments, by) => {
  const g = GROUP_BY[by]
  const map = new Map()
  payments.forEach((p) => {
    const k = g.key(p)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(p)
  })
  const total = payments.reduce((s, p) => s + (isRefundRow(p) ? 0 : num(p.amount)), 0)
  const rows = [...map.entries()].map(([k, list]) => {
    const t = totalsOf(list)
    return { key: k, label: g.label(k), ...t, share: total ? round2((t.amount / total) * 100) : 0 }
  })
  return rows.sort((a, b) =>
    g.sortByKey
      ? b.key.localeCompare(a.key)
      : b.amount - a.amount || a.label.localeCompare(b.label),
  )
}

// The Payments list: days newest first; within a day in the order the entries were made (time entered, then #), so
// a day reads like a story: a payment, then the reversal that took it back
const enteredAt = (p) => String(p.enteredAt || '')
export const listOrder = (payments) =>
  [...payments].sort(
    (a, b) =>
      day(b.paymentDate).localeCompare(day(a.paymentDate)) ||
      enteredAt(a).localeCompare(enteredAt(b)) ||
      num(a.paymentId) - num(b.paymentId),
  )

// One status per entry, instead of several labels:
//   ok        - a normal entry that counts
//   cancelled - an entry reversed later (by #reversedByPaymentId); it and its reversal add up to zero
//   reversal  - the entry that reverses #reversalOfPaymentId (minus amounts); reason = what was typed
export const entryStatus = (p) => {
  if (isRefundRow(p))
    return {
      kind: 'refund',
      text: `Refund · settlement #${p.settlementId}`,
      // a refund that also returned deposit money: say which part is rent (the deposit part isn't counted)
      reason:
        p.refundTotal > -num(p.amount)
          ? `Overpaid rent part of a ${p.refundTotal.toLocaleString('en-US')} refund`
          : 'Overpaid rent',
    }
  if (isReversalRow(p))
    return {
      kind: 'reversal',
      text: `Reverses payment #${p.reversalOfPaymentId}`,
      reason: p.notes || '',
    }
  if (p.reversedByPaymentId != null)
    return {
      kind: 'cancelled',
      text: `Reversed by #${p.reversedByPaymentId}`,
      at: p.reversedAt || null,
      reason: p.reversalReason || '',
    }
  return { kind: 'ok', text: 'Counted' }
}

// Does a payment belong to a Summary row (e.g. by 'Day', key '2026-10-14')?
export const inGroup = (p, by, key) => !!GROUP_BY[by] && GROUP_BY[by].key(p) === key

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// "2026-10-14" -> "Wed, 14 Oct 2026"
export const dayHeading = (d) => {
  const [y, m, dd] = day(d).split('-').map(Number)
  if (!y || !m || !dd) return ''
  return `${WEEKDAYS[new Date(y, m - 1, dd).getDay()]}, ${pad(dd)} ${MONTHS[m - 1]} ${y}`
}

// Rows of one page cut into days: [{ day, rows }], in list order
export const sectionsByDay = (rows) => {
  const out = []
  rows.forEach((p) => {
    const d = day(p.paymentDate)
    let s = out[out.length - 1]
    if (!s || s.day !== d) out.push((s = { day: d, rows: [] }))
    s.rows.push(p)
  })
  return out
}

// Tenant Statement header: "Business Center – 101, Business Center – 102, Tower – 5" (as the API lists a tenant's
// units) -> "Business Center: 101, 102 · Tower: 5", so many units stay short. Units without a building stay as they are.
export const groupUnits = (text) => {
  const order = []
  const byBuilding = new Map()
  String(text || '')
    .split(', ')
    .map((u) => u.trim())
    .filter(Boolean)
    .forEach((u) => {
      const i = u.lastIndexOf(' – ')
      const [b, unit] = i > 0 ? [u.slice(0, i), u.slice(i + 3)] : ['', u]
      if (!byBuilding.has(b)) {
        byBuilding.set(b, [])
        order.push(b)
      }
      byBuilding.get(b).push(unit)
    })
  return order.map((b) => (b ? `${b}: ` : '') + byBuilding.get(b).join(', ')).join(' · ')
}
