// src/components/rent/ExtraChargeModal.jsx
import React, { useEffect, useState } from 'react'
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
  CFormCheck,
  CFormText,
  CInputGroup,
  CInputGroupText,
  CRow,
  CCol,
} from '@coreui/react'
import TenantMultiSelect from './TenantMultiSelect'
import CurrencyInput from '../common/CurrencyInput'
import { rentService } from '../../services/rent.service'
import { fmt, formatDate } from '../../utils/rentUtils'

// Same list as the API (RentService.ExtraChargeTypes)
const chargeTypes = ['Maintenance', 'Utility', 'Damage', 'Rent Correction', 'Other']
const NEEDS_DESCRIPTION = ['Rent Correction', 'Other']

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
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))
  const selectedIds = form.tenantIds === 'ALL' ? tenants.map((t) => t.id) : form.tenantIds || []
  const singleTenantId = selectedIds.length === 1 ? selectedIds[0] : null

  // The invoice the charge relates to can only be chosen for one tenant: load that tenant's invoices
  const [tenantInvoices, setTenantInvoices] = useState([])
  useEffect(() => {
    let alive = true
    setTenantInvoices([])
    if (visible && singleTenantId) {
      rentService
        .getInvoicesByTenant(singleTenantId)
        .then((rows) => alive && setTenantInvoices(rows))
    }
    return () => {
      alive = false
    }
  }, [visible, singleTenantId])
  // Changing the tenant clears a related invoice of the previous tenant
  useEffect(() => {
    if (
      form.relatedInvoiceId &&
      !tenantInvoices.some((i) => String(i.invoiceId) === String(form.relatedInvoiceId))
    ) {
      setForm((prev) => ({ ...prev, relatedInvoiceId: '' }))
    }
  }, [tenantInvoices]) // eslint-disable-line react-hooks/exhaustive-deps

  const due = form.dueInDays === '' ? null : Number(form.dueInDays)
  const errors = {
    tenants: selectedIds.length ? '' : 'Select at least one tenant.',
    chargeType: form.chargeType ? '' : 'Select the charge type.',
    amount: Number(form.amount) > 0 ? '' : 'Enter an amount greater than 0.',
    description:
      NEEDS_DESCRIPTION.includes(form.chargeType) && !form.description.trim()
        ? `Please describe the ${form.chargeType} charge.`
        : form.description.length > 255
          ? 'At most 255 characters.'
          : '',
    chargeDate: form.chargeDate ? '' : 'Choose the charge date.',
    dueInDays:
      due === null || (Number.isInteger(due) && due >= 0 && due <= 90)
        ? ''
        : 'Whole number of days from 0 to 90.',
  }
  const isValid = Object.values(errors).every((e) => !e)

  const invoiceLabel = (i) =>
    `#${i.invoiceId} · ${formatDate(i.invoiceDate)} · ${i.chargeType ? i.chargeType : 'Rent'} ${fmt(i.totalRent)} · ${i.status}`

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'}>
        <strong>Add Extra Charge</strong>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={(e) => e.preventDefault()}>
          <div className="mb-3">
            <CFormLabel>Tenants</CFormLabel>
            <TenantMultiSelect
              tenants={tenants}
              selected={form.tenantIds}
              onChange={(val) => setForm((prev) => ({ ...prev, tenantIds: val }))}
              isDark={isDark}
            />
          </div>

          <CRow className="mb-3 g-2">
            <CCol sm={7}>
              <CFormLabel htmlFor="xc-type">Charge Type</CFormLabel>
              <CFormSelect
                id="xc-type"
                value={form.chargeType}
                onChange={(e) => set('chargeType')(e.target.value)}
              >
                <option value="">Select type...</option>
                {chargeTypes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol sm={5}>
              <CFormLabel htmlFor="xc-amount">Amount</CFormLabel>
              <CInputGroup>
                <CInputGroupText>PKR</CInputGroupText>
                <CurrencyInput
                  id="xc-amount"
                  placeholder="2,500"
                  value={form.amount}
                  onValueChange={set('amount')}
                />
              </CInputGroup>
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel htmlFor="xc-desc">
              Description
              {NEEDS_DESCRIPTION.includes(form.chargeType) ? (
                <span className="text-danger"> *</span>
              ) : (
                ''
              )}
            </CFormLabel>
            <CFormInput
              id="xc-desc"
              maxLength={255}
              placeholder={
                form.chargeType === 'Rent Correction'
                  ? 'e.g. Rent 01–04 Oct (start date corrected)'
                  : 'e.g. AC repair'
              }
              value={form.description}
              invalid={!!form.description && !!errors.description}
              onChange={(e) => set('description')(e.target.value)}
            />
          </div>

          <CRow className="mb-3 g-2">
            <CCol sm={6}>
              <CFormLabel htmlFor="xc-date">Charge Date</CFormLabel>
              <CFormInput
                id="xc-date"
                type="date"
                value={form.chargeDate}
                onChange={(e) => set('chargeDate')(e.target.value)}
              />
            </CCol>
            <CCol sm={6}>
              <CFormLabel htmlFor="xc-due">Due In (days)</CFormLabel>
              <CFormInput
                id="xc-due"
                type="number"
                min={0}
                max={90}
                placeholder="Default setting"
                value={form.dueInDays}
                invalid={!!errors.dueInDays}
                onChange={(e) => set('dueInDays')(e.target.value)}
              />
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel htmlFor="xc-related">Related Invoice (optional)</CFormLabel>
            <CFormSelect
              id="xc-related"
              value={form.relatedInvoiceId}
              disabled={!singleTenantId}
              onChange={(e) => set('relatedInvoiceId')(e.target.value)}
            >
              <option value="">
                {singleTenantId ? 'None' : 'Select one tenant to link an invoice'}
              </option>
              {tenantInvoices.map((i) => (
                <option key={i.invoiceId} value={i.invoiceId}>
                  {invoiceLabel(i)}
                </option>
              ))}
            </CFormSelect>
            <CFormText>
              For a Rent Correction, link the original invoice. The original invoice and its
              payments are not changed.
            </CFormText>
          </div>

          <CFormCheck
            id="xc-latefee"
            label="Apply late fee if paid after the due date"
            checked={form.applyLateFee}
            onChange={(e) => set('applyLateFee')(e.target.checked)}
          />

          <div className="small text-body-secondary mt-3">
            {selectedIds.length > 0 && Number(form.amount) > 0
              ? selectedIds.length === 1
                ? `Creates 1 separate invoice of PKR ${fmt(form.amount)}. Monthly rent invoices are not affected.`
                : `Creates ${selectedIds.length} separate invoices of PKR ${fmt(form.amount)} each. Monthly rent invoices are not affected.`
              : 'Creates a separate invoice per selected tenant. Monthly rent invoices are not affected.'}
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="primary" disabled={!isValid || isSubmitting} onClick={onSubmit}>
          {isSubmitting ? 'Adding...' : 'Add Charge'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ExtraChargeModal
