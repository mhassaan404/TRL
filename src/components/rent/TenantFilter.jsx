import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import SearchableSelect from './SearchableSelect'

// Tenant / Company filter (Rent Collection, Rent History, Payment Records, Lease Management, Property Dashboard).
// The choices are the names found in the loaded records, so tenants that have moved out still appear
// in their history. value '' = all; otherwise the exact tenant / company name. The current choice stays
// in the list even when the records no longer contain it (e.g. after changing the date range).
const ALL = ''

const TenantFilter = ({ names, value, onChange }) => {
  const options = useMemo(() => {
    const unique = [...new Set([...names, value].filter(Boolean).map((n) => String(n)))].sort(
      (a, b) => a.localeCompare(b),
    )
    return [
      { value: ALL, label: 'All Tenants' },
      ...unique.map((n) => ({ value: n, label: n })),
    ]
  }, [names, value])

  return <SearchableSelect options={options} value={value} onChange={(v) => onChange(String(v))} />
}

TenantFilter.propTypes = {
  names: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default TenantFilter
