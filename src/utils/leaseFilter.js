// "Current / Moved out" filter for Rent History and Payment Records. The API marks each row with leaseCurrent:
// true = that tenant + unit still has an active lease (running or booked), false = moved out of that unit.
export const LEASE_FILTERS = [
  { key: '', label: 'All tenants' },
  { key: 'current', label: 'Current tenants' },
  { key: 'moved', label: 'Moved out' },
]

const isCurrent = (row) => row?.leaseCurrent === true || row?.leaseCurrent === 1

// Rows without the flag (should not happen) are never hidden
export const matchesLeaseFilter = (row, key) => {
  if (!key || row?.leaseCurrent == null) return true
  return key === 'current' ? isCurrent(row) : !isCurrent(row)
}
