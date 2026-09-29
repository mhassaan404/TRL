// src/components/rent/TenantMultiSelect.jsx
import React, { useEffect, useRef, useState } from 'react'
import { CFormCheck, CFormInput } from '@coreui/react'

// selectedIds: array of tenant ids, OR the string 'ALL' meaning every tenant.
const TenantMultiSelect = ({ tenants = [], selected, onChange, isDark }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isAll = selected === 'ALL'
  const selectedIds = isAll ? [] : selected

  const filteredTenants = tenants.filter((t) =>
    (t.name || '').toLowerCase().includes(search.toLowerCase()),
  )

  const toggleAll = () => {
    onChange(isAll ? [] : 'ALL')
  }

  const toggleTenant = (id) => {
    if (isAll) return // "All" already covers everyone; ignore individual clicks
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id]
    onChange(next)
  }

  const label = isAll
    ? 'All Tenants'
    : selectedIds.length === 0
      ? 'Select tenants...'
      : selectedIds.length === 1
        ? tenants.find((t) => t.id === selectedIds[0])?.name || '1 tenant selected'
        : `${selectedIds.length} tenants selected`

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="form-select text-start"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>

      {open && (
        <div
          className={`border rounded shadow-sm ${isDark ? 'bg-dark text-white' : 'bg-white'}`}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1060,
            marginTop: '4px',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          <CFormInput
            size="sm"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />

          <CFormCheck
            label={<strong>All Tenants</strong>}
            checked={isAll}
            onChange={toggleAll}
            className="mb-2 pb-2 border-bottom"
          />

          {filteredTenants.length === 0 ? (
            <div className="text-muted small px-1">No tenants found.</div>
          ) : (
            filteredTenants.map((t) => (
              <CFormCheck
                key={t.id}
                label={t.name}
                checked={isAll || selectedIds.includes(t.id)}
                disabled={isAll}
                onChange={() => toggleTenant(t.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default TenantMultiSelect