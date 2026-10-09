// Security deposit status of a tenancy. Self-contained (no React or API imports) so the rules are easy to test.

const num = (v) => Number(v) || 0

export const DEPOSIT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online']
export const depositNo = (id) => `DEP-${String(id).padStart(6, '0')}`

// What is still to be received: agreed - held (never below 0); null when no agreed deposit is set
export const outstandingOf = (t) => (t.agreedAmount == null ? null : Math.max(0, num(t.agreedAmount) - num(t.held)))

// One status per tenancy:
//  Lease ended  - the lease is over but a deposit is still held (to settle)
//  Not set      - no agreed deposit and nothing received
//  Held         - received, no agreed amount to compare with
//  Not received - agreed, nothing received yet
//  Partial      - agreed, part received
//  Held in full - agreed amount received
export const depositStatusOf = (t) => {
  const held = num(t.held)
  if (!t.hasCurrentLease) return 'Lease ended'
  if (t.agreedAmount == null) return held > 0 ? 'Held' : 'Not set'
  if (held <= 0) return 'Not received'
  return held >= num(t.agreedAmount) ? 'Held in full' : 'Partial'
}

export const DEPOSIT_STATUS_COLOR = {
  'Lease ended': 'warning',
  'Not set': 'secondary',
  Held: 'info',
  'Not received': 'danger',
  Partial: 'warning',
  'Held in full': 'success',
}

export const depositTotals = (rows) =>
  rows.reduce(
    (t, r) => {
      t.held += num(r.held)
      const o = outstandingOf(r)
      if (o != null && r.hasCurrentLease) t.outstanding += o
      if (num(r.held) > 0) t.tenanciesHolding += 1
      return t
    },
    { held: 0, outstanding: 0, tenanciesHolding: 0 },
  )
