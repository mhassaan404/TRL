// src/components/rent/PaymentModal/index.jsx
import React from 'react'
import { CModal, CModalBody, CModalHeader, CModalTitle, CForm, CCol } from '@coreui/react'

import TenantSelector from './TenantSelector'
import SummaryCards from './SummaryCards'
import GlobalActionsSection from './GlobalActions' // or GlobalActions if you didn't rename
import InvoicePaymentTable from './InvoicePaymentTable'
import TotalsFooter from './TotalsFooter'
import Loader from '../../../components/Loader'

const PaymentModal = ({
  visible,
  onClose,
  rentForm,
  setRentForm,
  tenants,
  loading,
  openFrom,
  isEditMode,
  totals,
  handleTenantChange,
  handleToggleSelectAll,
  handleToggleInvoiceSelect,
  handleUpdateInvoiceField,
  handleApplyGlobalDiscountAmount,
  handleApplyGlobalDiscountPercent,
  handleGlobalWaveChange,
  handleSubmitPayments,
}) => {
  return (
    <CModal visible={visible} fullscreen onClose={onClose} aria-labelledby="payment-modal-title">
      <CModalHeader closeButton>
        <CModalTitle id="payment-modal-title">
          {isEditMode ? 'Edit Payment' : 'New Rent Payment'}
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        {loading && <Loader />}

        {/* Guard message if edit mode data is still loading */}
        {isEditMode && rentForm?.invoices?.length === 0 && (
          <div className="alert alert-warning m-3">Loading edit data... Please wait a moment.</div>
        )}

        <CForm className="row g-3">
          {/* Tenant Section */}
          {/* <CCol md={3}>
            <label className="form-label">Tenant</label>
            {isEditMode ? (
              <div className="border p-2 bg-light fw-bold">
                {tenants.find(t => t.TenantId === rentForm.tenantId)?.TenantName ||
                 rentForm.invoices?.[0]?.tenantName ||
                 `Tenant ID: ${rentForm.tenantId || 'Unknown'}`}
              </div>
            ) : (
              <TenantSelector 
                tenantId={rentForm.tenantId} 
                tenants={tenants} 
                onChange={handleTenantChange} 
                disabled={false}
              />
            )}
          </CCol> */}

          <TenantSelector
            tenantId={rentForm.tenantId}
            tenants={tenants}
            onChange={handleTenantChange}
            disabled={isEditMode}
          />

          {/* Summary Cards */}
          <SummaryCards rentForm={rentForm} />

          {/* Global Actions */}
          <GlobalActionsSection
            rentForm={rentForm}
            setRentForm={setRentForm}
            handleApplyGlobalDiscountAmount={handleApplyGlobalDiscountAmount}
            handleApplyGlobalDiscountPercent={handleApplyGlobalDiscountPercent}
            handleGlobalWaveChange={handleGlobalWaveChange}
          />

          {/* Invoice Table */}
          <CCol md={12}>
            {/* <InvoicePaymentTable 
              invoices={rentForm.invoices || []} 
              rentForm={rentForm} 
              openFrom={openFrom} 
              toggleSelectAll={handleToggleSelectAll} 
              toggleInvoiceSelect={handleToggleInvoiceSelect} 
              updateInvoiceField={handleUpdateInvoiceField} 
              handleTenantChange={handleTenantChange}
            /> */}
            
            <InvoicePaymentTable
              invoices={rentForm.invoices || []}
              rentForm={rentForm}
              openFrom={openFrom}
              toggleSelectAll={handleToggleSelectAll}
              toggleInvoiceSelect={handleToggleInvoiceSelect}
              updateInvoiceField={handleUpdateInvoiceField}
              handleTenantChange={handleTenantChange}
              // ── Only this line is new/changed ──
              onAdjustmentComplete={() => {}} // empty default — will be overridden in InvoicePaymentTable
            />
          </CCol>

          {/* Totals & Submit */}
          <TotalsFooter totals={totals} isEditMode={isEditMode} onSubmit={handleSubmitPayments} />
        </CForm>
      </CModalBody>
    </CModal>
  )
}

export default PaymentModal
