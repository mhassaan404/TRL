// // src/components/rent/PaymentModal/TenantSelector.jsx
// import React from 'react';
// import { CCol } from '@coreui/react';

// const TenantSelector = ({ tenantId, tenants, onChange, disabled }) => {
//   return (
//     <CCol md={3}>
//       <label className="form-label">Tenant</label>
//       <select
//         className="form-select"
//         value={tenantId}
//         disabled={disabled}
//         onChange={(e) => onChange(e.target.value)}
//       >
//         <option value="">Select tenant...</option>
//         {tenants.map((t) => (
//           <option key={t.TenantId} value={t.TenantId}>
//             {t.TenantName}
//           </option>
//         ))}
//       </select>
//     </CCol>
//   );
// };

// export default TenantSelector;





// src/components/rent/PaymentModal/TenantSelector.jsx
import React from 'react'
import { CFormLabel, CFormSelect } from '@coreui/react'

const TenantSelector = ({ tenantId, tenants, onChange, disabled }) => {
  return (
    <div>
      <CFormLabel className="fw-medium mb-2">Tenant</CFormLabel>
      <CFormSelect
        value={tenantId || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="border-secondary"
      >
        <option value="">Select a tenant...</option>
        {tenants.map((tenant) => (
          <option key={tenant.TenantId} value={tenant.TenantId}>
            {tenant.TenantName}
          </option>
        ))}
      </CFormSelect>
    </div>
  )
}

export default TenantSelector