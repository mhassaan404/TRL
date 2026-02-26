// // src/components/rent/PaymentModal/index.jsx
// import React from 'react'
// import {
//   CModal,
//   CModalBody,
//   CModalHeader,
//   CModalTitle,
//   CForm,
//   CCol,
//   CRow,
// } from '@coreui/react'

// import TenantSelector from './TenantSelector'
// import SummaryCards from './SummaryCards'
// import GlobalActionsSection from './GlobalActions'  // corrected import name
// import InvoicePaymentTable from './InvoicePaymentTable'
// import TotalsFooter from './TotalsFooter'
// import Loader from '../../../components/Loader'
// import { useIsDarkMode } from '../../../hooks/useIsDarkMode'

// const PaymentModal = ({
//   visible,
//   onClose,
//   rentForm,
//   setRentForm,
//   tenants,
//   isEditMode,
//   openFrom,
//   totals,
//   handleTenantChange,
//   handleToggleSelectAll,
//   handleToggleInvoiceSelect,
//   handleUpdateInvoiceField,
//   handleApplyGlobalDiscountAmount,
//   handleApplyGlobalDiscountPercent,
//   handleGlobalWaveChange,
//   handleSubmitPayments,
//   handleApplyGlobalPaymentMethod,
//   handleApplyGlobalPaymentDate,
//   handleApplyGlobalNotes,
// }) => {
//   const isDark = useIsDarkMode()  // ← now correctly inside the component

//   return (
//     <CModal
//       visible={visible}
//       onClose={onClose}
//       alignment="center"
//       scrollable
//       // size="xl"          // commented out - using fullscreen as you set
//       fullscreen              // your current preference
//       className="payment-modal"
//     >
//       <CModalHeader closeButton>
//         <CModalTitle>
//           {isEditMode ? 'Edit Payment' : 'New Rent Payment'}
//         </CModalTitle>
//       </CModalHeader>

//       <CModalBody className="p-4">
//         <CForm>
//           <CRow className="g-4">
//             {/* Tenant & Summary Row */}
//             <CCol xs={12}>
//               <div className="d-flex flex-wrap gap-4 align-items-start">
//                 <div style={{ minWidth: '280px', flex: '1 1 280px' }}>
//                   <TenantSelector
//                     tenantId={rentForm.tenantId}
//                     tenants={tenants}
//                     onChange={handleTenantChange}
//                     disabled={isEditMode}
//                   />
//                 </div>

//                 <div style={{ flex: '2 1 400px', minWidth: '400px' }}>
//                   <SummaryCards rentForm={rentForm} />
//                 </div>
//               </div>
//             </CCol>

//             {/* Global Actions */}
//             <CCol xs={12}>
//               <div
//                 className={`rounded p-3 border ${
//                   isDark ? 'bg-dark-subtle text-white' : 'bg-light text-dark'
//                 }`}
//               >
//                 <h6 className="mb-3 fw-semibold">Global Actions</h6>
//                 <CRow className="g-3">
//                   <GlobalActionsSection
//                     rentForm={rentForm}
//                     setRentForm={setRentForm}
//                     handleApplyGlobalDiscountAmount={handleApplyGlobalDiscountAmount}
//                     handleApplyGlobalDiscountPercent={handleApplyGlobalDiscountPercent}
//                     handleGlobalWaveChange={handleGlobalWaveChange}
//                     handleApplyGlobalPaymentMethod={handleApplyGlobalPaymentMethod}
//                     handleApplyGlobalPaymentDate={handleApplyGlobalPaymentDate}
//                     handleApplyGlobalNotes={handleApplyGlobalNotes}
//                   />
//                 </CRow>
//               </div>
//             </CCol>

//             {/* Invoice Table */}
//             <CCol xs={12}>
//               <div className="border rounded overflow-hidden">
//                 <InvoicePaymentTable
//                   invoices={rentForm.invoices || []}
//                   rentForm={rentForm}
//                   openFrom={openFrom}
//                   toggleSelectAll={handleToggleSelectAll}
//                   toggleInvoiceSelect={handleToggleInvoiceSelect}
//                   updateInvoiceField={handleUpdateInvoiceField}
//                   handleTenantChange={handleTenantChange}
//                   setRentForm={setRentForm}
//                 />
//               </div>
//             </CCol>

//             {/* Totals & Submit */}
//             <CCol xs={12} className="d-flex justify-content-end">
//               <TotalsFooter
//                 totals={totals}
//                 isEditMode={isEditMode}
//                 onSubmit={handleSubmitPayments}
//               />
//             </CCol>
//           </CRow>
//         </CForm>
//       </CModalBody>
//     </CModal>
//   )
// }

// export default PaymentModal


// src/components/rent/PaymentModal/index.jsx
import React from 'react'
import {
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CForm,
  CCol,
  CRow,
} from '@coreui/react'

import TenantSelector from './TenantSelector'
import SummaryCards from './SummaryCards'
import GlobalActionsSection from './GlobalActions' // ← corrected import (assuming file name)
import InvoicePaymentTable from './InvoicePaymentTable'
import TotalsFooter from './TotalsFooter'
import Loader from '../../../components/Loader'
import { useIsDarkMode } from '../../../hooks/useIsDarkMode'

const PaymentModal = ({
  visible,
  onClose,
  rentForm,
  setRentForm,
  tenants,
  isEditMode,
  openFrom,
  totals,
  handleTenantChange,
  handleToggleSelectAll,
  handleToggleInvoiceSelect,
  handleUpdateInvoiceField,
  handleApplyGlobalDiscountAmount,
  handleApplyGlobalDiscountPercent,
  handleGlobalWaveChange,
  handleSubmitPayments,
  handleApplyGlobalPaymentMethod,
  handleApplyGlobalPaymentDate,
  handleApplyGlobalNotes,
}) => {
  const isDark = useIsDarkMode()

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      alignment="center"
      scrollable
      fullscreen
      className="payment-modal"
    >
      <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'} closeButton>
        <CModalTitle>
          {isEditMode ? 'Edit Payment' : 'New Rent Payment'}
        </CModalTitle>
      </CModalHeader>

      <CModalBody className="p-4">
        <CForm>
          <CRow className="g-4">
            {/* Tenant & Summary Row */}
            <CCol xs={12}>
              <div className="d-flex flex-wrap gap-4 align-items-start">
                <div style={{ minWidth: '280px', flex: '1 1 280px' }}>
                  <TenantSelector
                    tenantId={rentForm.tenantId}
                    tenants={tenants}
                    onChange={handleTenantChange}
                    disabled={isEditMode}
                  />
                </div>

                <div style={{ flex: '2 1 400px', minWidth: '400px' }}>
                  <SummaryCards rentForm={rentForm} />
                </div>
              </div>
            </CCol>

            {/* Global Actions */}
            <CCol xs={12}>
              <div
                className={`rounded p-4 border shadow-sm ${
                  isDark ? 'bg-dark-subtle text-white' : 'bg-white text-dark'
                }`}
              >
                <h5 className="mb-4 fw-semibold">Global Actions</h5>
                <GlobalActionsSection
                  rentForm={rentForm}
                  setRentForm={setRentForm}
                  handleApplyGlobalDiscountAmount={handleApplyGlobalDiscountAmount}
                  handleApplyGlobalDiscountPercent={handleApplyGlobalDiscountPercent}
                  handleGlobalWaveChange={handleGlobalWaveChange}
                  handleApplyGlobalPaymentMethod={handleApplyGlobalPaymentMethod}
                  handleApplyGlobalPaymentDate={handleApplyGlobalPaymentDate}
                  handleApplyGlobalNotes={handleApplyGlobalNotes}
                />
              </div>
            </CCol>

            {/* Invoice Table */}
            <CCol xs={12}>
              <div className={`border rounded overflow-hidden ${isDark ? 'bg-dark' : 'bg-white'}`}>
                <InvoicePaymentTable
                  invoices={rentForm.invoices || []}
                  rentForm={rentForm}
                  openFrom={openFrom}
                  toggleSelectAll={handleToggleSelectAll}
                  toggleInvoiceSelect={handleToggleInvoiceSelect}
                  updateInvoiceField={handleUpdateInvoiceField}
                  handleTenantChange={handleTenantChange}
                  setRentForm={setRentForm}
                />
              </div>
            </CCol>

            {/* Totals & Submit */}
            <CCol xs={12} className="d-flex justify-content-end">
              <TotalsFooter
                totals={totals}
                isEditMode={isEditMode}
                onSubmit={handleSubmitPayments}
              />
            </CCol>
          </CRow>
        </CForm>
      </CModalBody>
    </CModal>
  )
}

export default PaymentModal