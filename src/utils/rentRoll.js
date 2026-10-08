// Occupancy / rent roll: lease state, expiry windows and totals for the rent roll rows.
// Unit status uses unitStatusOf, so it always matches the Properties pages.
import { UNIT_STATUS, unitStatusOf } from './unitStatus'

const num = (v) => Number(v) || 0
const round2 = (v) => Math.round(v * 100) / 100
const day = (d) => String(d || '').slice(0, 10) // YYYY-MM-DD

// Whole days from a to b (YYYY-MM-DD)
export const daysBetween = (a, b) => {
  const [ay, am, ad] = day(a).split('-').map(Number)
  const [by, bm, bd] = day(b).split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000)
}

export const statusOfRow = (r) => unitStatusOf({ status: r.markedStatus, isOccupied: r.isOccupied })

// State of the lease in force today:
//  Active   - running, end date not passed
//  Holdover - end date passed, not renewed or ended (still billed month to month)
//  Renewed  - this term is still running and the next term is already booked
//  No lease - an active tenant is on the unit without a lease (old data)
//  Booked   - no lease today, but one starts later
//  ''       - vacant
export const leaseStateOf = (r, today) => {
  if (r.leaseId) {
    if (!r.leaseIsActive) return 'Renewed'
    return day(r.endDate) < today ? 'Holdover' : 'Active'
  }
  if (r.tenantName) return 'No lease'
  if (r.nextLeaseId) return 'Booked'
  return ''
}

// Days until the current lease ends, only when that matters: an active lease with no next term booked.
// Negative = already past its end date (holdover). null = not applicable.
export const daysToExpiry = (r, today) => {
  if (!r.leaseId || !r.leaseIsActive || r.nextLeaseId || !r.endDate) return null
  return daysBetween(today, r.endDate)
}

export const EXPIRY_FILTERS = [
  { key: 'holdover', label: 'Past end date', test: (d) => d != null && d < 0 },
  { key: '30', label: 'Ends in 30 days', test: (d) => d != null && d >= 0 && d <= 30 },
  { key: '60', label: 'Ends in 60 days', test: (d) => d != null && d >= 0 && d <= 60 },
  { key: '90', label: 'Ends in 90 days', test: (d) => d != null && d >= 0 && d <= 90 },
]

// Totals for a list of rows. Occupancy % = occupied / all units; economic occupancy = contracted / potential rent.
export const summarize = (rows, today) => {
  const s = {
    units: rows.length, occupied: 0, available: 0, reserved: 0, maintenance: 0,
    contractedRent: 0, potentialRent: 0, vacancyLoss: 0, arrears: 0, holdover: 0, ends30: 0, ends60: 0, ends90: 0,
  }
  rows.forEach((r) => {
    const st = statusOfRow(r)
    if (st === UNIT_STATUS.OCCUPIED) s.occupied += 1
    else if (st === UNIT_STATUS.RESERVED) s.reserved += 1
    else if (st === UNIT_STATUS.MAINTENANCE) s.maintenance += 1
    else s.available += 1
    s.potentialRent = round2(s.potentialRent + num(r.baseRent))
    if (r.leaseId || r.tenantName) s.contractedRent = round2(s.contractedRent + num(r.currentRent))
    if (st !== UNIT_STATUS.OCCUPIED) s.vacancyLoss = round2(s.vacancyLoss + num(r.baseRent))
    s.arrears = round2(s.arrears + num(r.arrears))
    const d = daysToExpiry(r, today)
    if (d != null && d < 0) s.holdover += 1
    if (d != null && d >= 0 && d <= 30) s.ends30 += 1
    if (d != null && d >= 0 && d <= 60) s.ends60 += 1
    if (d != null && d >= 0 && d <= 90) s.ends90 += 1
  })
  s.occupancy = s.units ? round2((s.occupied / s.units) * 100) : null
  s.economicOccupancy = s.potentialRent ? round2((s.contractedRent / s.potentialRent) * 100) : null
  return s
}

// One summary per building, in name order
export const byBuilding = (rows, today) => {
  const map = new Map()
  rows.forEach((r) => {
    const k = r.buildingName || '—'
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(r)
  })
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([buildingName, list]) => ({ buildingName, ...summarize(list, today) }))
}
