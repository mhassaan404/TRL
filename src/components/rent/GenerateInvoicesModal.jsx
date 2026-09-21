// // src/components/rent/GenerateInvoicesModal.jsx
// import React from 'react'
// import {
//   CModal,
//   CModalHeader,
//   CModalBody,
//   CModalFooter,
//   CButton,
//   CForm,
//   CFormSelect,
// } from '@coreui/react'

// const monthNames = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December',
// ]

// const GenerateInvoicesModal = ({
//   visible,
//   onClose,
//   month,
//   year,
//   onMonthChange,
//   onYearChange,
//   onSubmit,
//   isSubmitting,
//   isDark,
// }) => {
//   const currentYear = new Date().getFullYear()
//   const years = [currentYear - 1, currentYear, currentYear + 1]

//   return (
//     <CModal visible={visible} onClose={onClose} backdrop="static">
//       <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'}>
//         <strong>Generate Monthly Invoices</strong>
//       </CModalHeader>
//       <CModalBody>
//         <CForm>
//           <div className="mb-3">
//             <label className="form-label">Month</label>
//             <CFormSelect value={month} onChange={(e) => onMonthChange(Number(e.target.value))}>
//               {monthNames.map((name, i) => (
//                 <option key={name} value={i + 1}>{name}</option>
//               ))}
//             </CFormSelect>
//           </div>

//           <div className="mb-2">
//             <label className="form-label">Year</label>
//             <CFormSelect value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
//               {years.map((y) => (
//                 <option key={y} value={y}>{y}</option>
//               ))}
//             </CFormSelect>
//           </div>

//           <small className="text-muted">
//             Creates one invoice for every active tenant who doesn't already have one for this month. Existing invoices are never duplicated or overwritten.
//           </small>
//         </CForm>
//       </CModalBody>
//       <CModalFooter>
//         <CButton color="secondary" onClick={onClose}>Cancel</CButton>
//         <CButton color="primary" disabled={isSubmitting} onClick={onSubmit}>
//           {isSubmitting ? 'Generating...' : 'Generate Invoices'}
//         </CButton>
//       </CModalFooter>
//     </CModal>
//   )
// }

// export default GenerateInvoicesModal



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
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'}>
        <strong>Generate Invoices</strong>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div className="mb-3">
            <CFormLabel>Rent Month</CFormLabel>
            <div className="d-flex gap-2">
              <CFormSelect value={month} onChange={(e) => onMonthChange(Number(e.target.value))}>
                {monthNames.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </CFormSelect>
              <CFormSelect
                style={{ maxWidth: '180px' }}
                value={year}
                onChange={(e) => onYearChange(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </CFormSelect>
            </div>
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
        <CButton color="primary" disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? 'Generating...' : 'Generate Invoices'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default GenerateInvoicesModal