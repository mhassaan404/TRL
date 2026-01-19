// src/components/rent/PaymentModal/TenantSelector.jsx
import React from 'react';
import { CCol } from '@coreui/react';

const TenantSelector = ({ tenantId, tenants, onChange, disabled }) => {
  return (
    <CCol md={3}>
      <label className="form-label">Tenant</label>
      <select
        className="form-select"
        value={tenantId}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select tenant...</option>
        {tenants.map((t) => (
          <option key={t.TenantId} value={t.TenantId}>
            {t.TenantName}
          </option>
        ))}
      </select>
    </CCol>
  );
};

export default TenantSelector;