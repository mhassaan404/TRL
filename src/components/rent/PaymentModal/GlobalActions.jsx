// // src/components/rent/PaymentModal/GlobalActionsSection.jsx
// import React from 'react'
// import {
//   CCol,
//   CFormLabel,
//   CFormSelect,
//   CFormInput,
//   CFormTextarea,
//   CFormCheck,
//   CButton,
// } from '@coreui/react'

// const GlobalActionsSection = ({
//   rentForm,
//   setRentForm,
//   handleApplyGlobalDiscountAmount,
//   handleApplyGlobalDiscountPercent,
//   handleGlobalWaveChange,

//   handleApplyGlobalPaymentMethod,
//   handleApplyGlobalPaymentDate,
//   handleApplyGlobalNotes,
// }) => {
//   return (
//     <>
//       {/* <CCol md={3}>
//         <CFormLabel>Global Payment Method</CFormLabel>
//         <CFormSelect value={rentForm.globalPaymentMethod} onChange={e => setRentForm(prev => ({ ...prev, globalPaymentMethod: e.target.value }))}>
//           <option value="">Select Method</option>
//           <option value="Cash">Cash</option>
//           <option value="Bank Transfer">Bank Transfer</option>
//           <option value="Cheque">Cheque</option>
//           <option value="Online">Online</option>
//         </CFormSelect>
//       </CCol>
//       <CCol md={3}>
//         <CFormLabel>Global Payment Date</CFormLabel>
//         <div className="d-flex gap-2">
//           <CFormInput type="date" value={rentForm.globalPaymentDate} onChange={e => setRentForm(prev => ({ ...prev, globalPaymentDate: e.target.value }))} />
//           <CButton color="secondary" onClick={() => setRentForm(prev => ({ ...prev, globalPaymentDate: "" }))}>Clear</CButton>
//         </div>
//       </CCol>
//       <CCol md={6}>
//         <CFormLabel>Global Notes</CFormLabel>
//         <CFormTextarea value={rentForm.globalNotes} onChange={e => setRentForm(prev => ({ ...prev, globalNotes: e.target.value }))} placeholder="Optional global notes" />
//       </CCol> */}

//       <CCol md={3}>
//         <CFormLabel>Global Payment Method</CFormLabel>
//         <div className="d-flex gap-2 align-items-start">
//           <CFormSelect
//             value={rentForm.globalPaymentMethod}
//             onChange={(e) =>
//               setRentForm((prev) => ({ ...prev, globalPaymentMethod: e.target.value }))
//             }
//           >
//             <option value="">Select</option>
//             <option value="Cash">Cash</option>
//             <option value="Bank Transfer">Bank Transfer</option>
//             <option value="Cheque">Cheque</option>
//             <option value="Online">Online</option>
//           </CFormSelect>
//           <CButton
//             color="info"
//             size="sm"
//             onClick={handleApplyGlobalPaymentMethod}
//             disabled={!rentForm.globalPaymentMethod}
//           >
//             Apply
//           </CButton>
//         </div>
//       </CCol>

//       <CCol md={3}>
//         <CFormLabel>Global Payment Date</CFormLabel>
//         <div className="d-flex gap-2 align-items-start">
//           <CFormInput
//             type="date"
//             value={rentForm.globalPaymentDate}
//             onChange={(e) =>
//               setRentForm((prev) => ({ ...prev, globalPaymentDate: e.target.value }))
//             }
//           />
//           <CButton
//             color="info"
//             size="sm"
//             onClick={handleApplyGlobalPaymentDate}
//             disabled={!rentForm.globalPaymentDate}
//           >
//             Apply
//           </CButton>
//           <CButton
//             color="secondary"
//             size="sm"
//             onClick={() => setRentForm((prev) => ({ ...prev, globalPaymentDate: '' }))}
//           >
//             Clear
//           </CButton>
//         </div>
//       </CCol>

//       <CCol md={3}>
//         <CFormLabel>Global Discount Amount (Oldest → first)</CFormLabel>
//         <div className="d-flex gap-2 align-items-start">
//           <CFormInput
//             type="number"
//             value={rentForm.globalDiscountAmount || ''}
//             onChange={(e) =>
//               setRentForm((prev) => ({
//                 ...prev,
//                 globalDiscountAmount: Math.max(0, Number(e.target.value) || 0),
//               }))
//             }
//             placeholder="Global discount amount"
//           />
//           <CButton
//             color="info"
//             size="sm"
//             onClick={handleApplyGlobalDiscountAmount}
//             disabled={!rentForm.globalDiscountAmount}
//           >
//             Apply
//           </CButton>
//         </div>
//       </CCol>

//       <CCol md={3}>
//         <CFormLabel>Global Notes</CFormLabel>
//         <div className="d-flex gap-2 align-items-start">
//           <CFormInput
//             value={rentForm.globalNotes}
//             onChange={(e) => setRentForm((prev) => ({ ...prev, globalNotes: e.target.value }))}
//             placeholder="Optional global notes"
//           />
//           <CButton
//             color="info"
//             size="sm"
//             onClick={handleApplyGlobalNotes}
//             disabled={!rentForm.globalNotes?.trim()}
//           >
//             Apply
//           </CButton>
//         </div>
//       </CCol>

//       <CCol md={3}>
//         <CFormLabel>Global Waive Late Fee</CFormLabel>
//         <div className="d-flex gap-2 align-items-start">
//           <CFormCheck
//             label="Waive Late Fee"
//             checked={rentForm.globalWaveLateFee}
//             onChange={(e) => handleGlobalWaveChange(e.target.checked)}
//           />
//         </div>
//       </CCol>
//     </>
//   )
// }

// export default GlobalActionsSection

// src/components/rent/PaymentModal/GlobalActionsSection.jsx
import React from 'react'
import { CFormLabel, CFormSelect, CFormInput, CFormCheck, CButton, CRow, CCol } from '@coreui/react'

const GlobalActionsSection = ({
  rentForm,
  setRentForm,
  handleApplyGlobalDiscountAmount,
  handleApplyGlobalDiscountPercent,
  handleGlobalWaveChange,
  handleApplyGlobalPaymentMethod,
  handleApplyGlobalPaymentDate,
  handleApplyGlobalNotes,
}) => {
  return (
    <>
      <CRow className="g-3 align-items-end">
        {/* Payment Method */}
        <CCol md={3}>
          <CFormLabel className="fw-medium mb-2">Payment Method</CFormLabel>
          <div className="input-group">
            <CFormSelect
              value={rentForm.globalPaymentMethod || ''}
              onChange={(e) =>
                setRentForm((prev) => ({ ...prev, globalPaymentMethod: e.target.value }))
              }
            >
              <option value="">Select method...</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Online">Online</option>
            </CFormSelect>
            <CButton
              color="primary"
              size="sm"
              onClick={handleApplyGlobalPaymentMethod}
              disabled={!rentForm.globalPaymentMethod}
            >
              Apply
            </CButton>
          </div>
        </CCol>

        {/* Payment Date */}
        <CCol md={3}>
          <CFormLabel className="fw-medium mb-2">Payment Date</CFormLabel>
          <div className="input-group">
            <CFormInput
              type="date"
              value={rentForm.globalPaymentDate || ''}
              onChange={(e) =>
                setRentForm((prev) => ({ ...prev, globalPaymentDate: e.target.value }))
              }
            />
            <CButton
              color="primary"
              size="sm"
              onClick={handleApplyGlobalPaymentDate}
              disabled={!rentForm.globalPaymentDate}
            >
              Apply
            </CButton>
            <CButton
              color="secondary"
              size="sm"
              onClick={() => setRentForm((prev) => ({ ...prev, globalPaymentDate: '' }))}
            >
              Clear
            </CButton>
          </div>
        </CCol>

        {/* Discount Amount */}
        <CCol md={3}>
          <CFormLabel className="fw-medium mb-2">Discount Amount</CFormLabel>
          <div className="input-group">
            <CFormInput
              type="number"
              min="0"
              value={rentForm.globalDiscountAmount || ''}
              onChange={(e) =>
                setRentForm((prev) => ({
                  ...prev,
                  globalDiscountAmount: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              placeholder="0"
            />
            <CButton
              color="primary"
              size="sm"
              onClick={handleApplyGlobalDiscountAmount}
              disabled={!rentForm.globalDiscountAmount}
            >
              Apply
            </CButton>
          </div>
        </CCol>

        {/* Waive Late Fee – same row */}
        <CCol md={3} className="d-flex align-items-end pb-2">
          <CFormCheck
            id="global-waive-late-fee"
            label="Waive Late Fee Globally"
            checked={rentForm.globalWaveLateFee || false}
            onChange={(e) => handleGlobalWaveChange(e.target.checked)}
          />
        </CCol>
      </CRow>

      {/* Global Notes – next row */}
      <CRow className="g-3 mt-2">
        <CCol md={6}>
          <CFormLabel className="fw-medium mb-2">Global Notes</CFormLabel>
          <div className="input-group">
            <CFormInput
              value={rentForm.globalNotes || ''}
              onChange={(e) => setRentForm((prev) => ({ ...prev, globalNotes: e.target.value }))}
              placeholder="Optional notes..."
            />
            <CButton
              color="primary"
              size="sm"
              onClick={handleApplyGlobalNotes}
              disabled={!rentForm.globalNotes?.trim()}
            >
              Apply
            </CButton>
          </div>
        </CCol>
      </CRow>
    </>
  )
}

export default GlobalActionsSection
