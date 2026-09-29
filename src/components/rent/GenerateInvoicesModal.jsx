// src/components/rent/GenerateInvoicesModal.jsx
import React from 'react'
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormSelect,
  CFormLabel,
} from '@coreui/react'
import TenantMultiSelect from './TenantMultiSelect'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const GenerateInvoicesModal = ({
  visible,
  onClose,
  month,
  year,
  onMonthChange,
  onYearChange,
  tenants,
  selectedTenants,
  onSelectedTenantsChange,
  onSubmit,
  isSubmitting,
  isDark,
}) => {
  // Billing window (enforced by the API too): last month, this month and next month
  const now = new Date()
  const allowedMonths = [-1, 0, 1].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    return { month: d.getMonth() + 1, year: d.getFullYear() }
  })
  // An empty selection must not be sent: the API treats "no tenants" as "all tenants".
  const noneSelected = Array.isArray(selectedTenants) && selectedTenants.length === 0

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'}>
        <strong>Generate Invoices</strong>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div className="mb-3">
            <CFormLabel>Rent Month</CFormLabel>
            <CFormSelect
              value={`${year}-${month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number)
                onYearChange(y)
                onMonthChange(m)
              }}
            >
              {allowedMonths.map(({ month: m, year: y }) => (
                <option key={`${y}-${m}`} value={`${y}-${m}`}>{monthNames[m - 1]} {y}</option>
              ))}
            </CFormSelect>
          </div>

          <div className="mb-2">
            <CFormLabel>Tenants</CFormLabel>
            <TenantMultiSelect
              tenants={tenants}
              selected={selectedTenants}
              onChange={onSelectedTenantsChange}
              isDark={isDark}
            />
          </div>

          <small className="text-muted">
            Creates an invoice for each selected tenant for this month, skipping anyone who already has one. Safe to run more than once.
          </small>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Cancel</CButton>
        <CButton color="primary" disabled={isSubmitting || noneSelected} onClick={onSubmit}>
          {isSubmitting ? 'Generating...' : 'Generate Invoices'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default GenerateInvoicesModal