import React from 'react'
import { CButton, CButtonGroup } from '@coreui/react'
import { LEASE_FILTERS } from '../../utils/leaseFilter'

// Compact "All | Current | Moved out" switch (Rent History, Collections). value: '' | 'current' | 'moved'
const SHORT = { '': 'All', current: 'Current', moved: 'Moved out' }

const LeaseFilterButtons = ({ value, onChange }) => (
  <CButtonGroup role="group" aria-label="Current or moved-out tenants">
    {LEASE_FILTERS.map((f) => (
      <CButton
        key={f.key}
        color="primary"
        variant={value === f.key ? undefined : 'outline'}
        aria-pressed={value === f.key}
        title={f.label}
        onClick={() => onChange(f.key)}
      >
        {SHORT[f.key]}
      </CButton>
    ))}
  </CButtonGroup>
)

export default LeaseFilterButtons
