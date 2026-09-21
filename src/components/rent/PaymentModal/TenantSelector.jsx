// // src/components/rent/PaymentModal/TenantSelector.jsx
// import React from 'react'
// import { CFormLabel, CFormSelect } from '@coreui/react'

// const TenantSelector = ({ tenantId, tenants, onChange, disabled }) => {
//   return (
//     <div>
//       <CFormLabel className="fw-medium mb-2">Tenant</CFormLabel>
//       <CFormSelect
//         value={tenantId || ''}
//         disabled={disabled}
//         onChange={(e) => onChange(e.target.value)}
//         className="border-secondary"
//       >
//         <option value="">Select a tenant...</option>
//         {tenants.map((tenant) => (
//           <option key={tenant.TenantId} value={tenant.TenantId}>
//             {tenant.TenantName}
//           </option>
//         ))}
//       </CFormSelect>
//     </div>
//   )
// }

// export default TenantSelector


// src/components/rent/PaymentModal/TenantSelector.jsx
import React, { useEffect, useRef, useState } from 'react'
import { CFormLabel, CFormInput } from '@coreui/react'

const TenantSelector = ({ tenantId, tenants, onChange, disabled }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedTenant = tenants.find((t) => String(t.TenantId) === String(tenantId))
  const filtered = tenants.filter((t) =>
    (t.TenantName || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <CFormLabel className="fw-medium mb-2">Tenant</CFormLabel>
      <button
        type="button"
        className="form-select text-start border-secondary"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {selectedTenant ? selectedTenant.TenantName : 'Select a tenant...'}
      </button>

      {open && !disabled && (
        <div
          className="border rounded shadow-sm bg-body"
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1060,
            marginTop: '4px', maxHeight: '260px', overflowY: 'auto', padding: '8px',
          }}
        >
          <CFormInput
            size="sm"
            autoFocus
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />
          {filtered.length === 0 ? (
            <div className="text-muted small px-1">No tenants found.</div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.TenantId}
                className="px-2 py-1 rounded"
                style={{ cursor: 'pointer' }}
                onMouseDown={() => {
                  onChange(t.TenantId)
                  setOpen(false)
                  setSearch('')
                }}
              >
                {t.TenantName}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default TenantSelector