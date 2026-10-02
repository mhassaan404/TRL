// A unit's current status, used by every property card, badge and filter so they always agree:
// - "Under Maintenance" when the unit is marked so (it is out of use, leased or not)
// - "Occupied" when it has an active lease (isOccupied comes from the server)
// - "Reserved" when marked reserved and not leased
// - otherwise "Available"
// The hand-set "Rented" status is not used: occupancy follows the leases.
export const UNIT_STATUS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Under Maintenance',
  RESERVED: 'Reserved',
}

export const unitStatusOf = (unit) => {
  const marked = String(unit?.status || '').toLowerCase()
  if (marked.includes('maintenance')) return UNIT_STATUS.MAINTENANCE
  if (unit?.isOccupied) return UNIT_STATUS.OCCUPIED
  if (marked === 'reserved') return UNIT_STATUS.RESERVED
  return UNIT_STATUS.AVAILABLE
}

// CoreUI colour names for badges
export const unitStatusColor = {
  [UNIT_STATUS.AVAILABLE]: 'success',
  [UNIT_STATUS.OCCUPIED]: 'primary',
  [UNIT_STATUS.MAINTENANCE]: 'warning',
  [UNIT_STATUS.RESERVED]: 'info',
}

// Counts for a list of units
export const countUnitStatuses = (units) => {
  const counts = { total: units.length, occupied: 0, available: 0, maintenance: 0, reserved: 0 }
  units.forEach((u) => {
    const s = unitStatusOf(u)
    if (s === UNIT_STATUS.OCCUPIED) counts.occupied++
    else if (s === UNIT_STATUS.MAINTENANCE) counts.maintenance++
    else if (s === UNIT_STATUS.RESERVED) counts.reserved++
    else counts.available++
  })
  return counts
}
