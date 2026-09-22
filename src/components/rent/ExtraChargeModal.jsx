// src/components/rent/ExtraChargeModal.jsx
import React from 'react'
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormSelect,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import TenantMultiSelect from './TenantMultiSelect'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const chargeTypes = ['Maintenance', 'Security Deposit', 'Utility', 'Other']

const ExtraChargeModal = ({
  visible,
  onClose,
  form,
  setForm,
  tenants,
  onSubmit,
  isSubmitting,
  isDark,
}) => {
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  const isValid =
    form.tenantIds &&
    (form.tenantIds === 'ALL' || form.tenantIds.length > 0) &&
    form.chargeType &&
    Number(form.amount) > 0

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'}>
        <strong>Add Extra Charge</strong>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div className="mb-3">
            <CFormLabel>Tenants</CFormLabel>
            <TenantMultiSelect
              tenants={tenants}
              selected={form.tenantIds}
              onChange={(val) => setForm((prev) => ({ ...prev, tenantIds: val }))}
              isDark={isDark}
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Rent Month</CFormLabel>
            <div className="d-flex gap-2">
              <CFormSelect
                value={form.month}
                onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
              >
                {monthNames.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </CFormSelect>
              <CFormSelect
                style={{ maxWidth: '180px' }}
                value={form.year}
                onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </CFormSelect>
            </div>
          </div>

          <div className="mb-3">
            <CFormLabel>Charge Type</CFormLabel>
            <CFormSelect
              value={form.chargeType}
              onChange={(e) => setForm((prev) => ({ ...prev, chargeType: e.target.value }))}
            >
              <option value="">Select type...</option>
              {chargeTypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormLabel>Description</CFormLabel>
            <CFormInput
              placeholder="e.g. AC repair"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="mb-2">
            <CFormLabel>Amount</CFormLabel>
            <CInputGroup>
              <CInputGroupText>PKR</CInputGroupText>
              <CFormInput
                type="number"
                min="0"
                placeholder="2,500"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </CInputGroup>
          </div>

          <small className="text-muted">
            Creates a separate invoice per selected tenant for this charge — it will not affect their regular monthly rent invoice.
          </small>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Cancel</CButton>
        <CButton color="primary" disabled={!isValid || isSubmitting} onClick={onSubmit}>
          {isSubmitting ? 'Adding...' : 'Add Charge'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ExtraChargeModal