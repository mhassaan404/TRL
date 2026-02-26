// // src/components/rent/PaymentModal/SummaryCards.jsx
// import React from 'react'
// import { CCol } from '@coreui/react'
// import { fmt } from '../../../utils/rentUtils'

// const SummaryCards = ({ rentForm }) => {
//   return (
//     <>
//       {/* <CCol md={2}>
//         <label className="form-label">Monthly Rent</label>
//         <div className="border p-2">{fmt(rentForm.monthlyRent)}</div>
//       </CCol>
//       <CCol md={2}>
//         <label className="form-label">Pending</label>
//         <div className="border p-2">{fmt(rentForm.pendingAmount)}</div>
//       </CCol>
//       <CCol md={2}>
//         <label className="form-label">Prev. Balance</label>
//         <div className="border p-2">{fmt(rentForm.previousBalance)}</div>
//       </CCol>
//       <CCol md={2}>
//         <label className="form-label">Total Late Fee</label>
//         <div className="border p-2">{fmt(rentForm.lateFee)}</div>
//       </CCol> */}

//       <CCol md={2}></CCol>
//       <CCol md={6} className="mb-3">
//         <div className="border rounded p-2 w-100 overflow-x-auto">
//           <div className="d-flex text-center w-100">
//             <div className="flex-fill px-3 border-end">
//               <label className="form-label">Monthly Rent</label>
//               <div className="fw-bold">{fmt(rentForm.monthlyRent)}</div>
//             </div>

//             <div className="flex-fill px-3 border-end">
//               <label className="form-label">Pending</label>
//               <div className="fw-bold text-warning">{fmt(rentForm.pendingAmount)}</div>
//             </div>

//             <div className="flex-fill px-3 border-end">
//               <label className="form-label">Prev Balance</label>
//               <div className="fw-bold">{fmt(rentForm.previousBalance)}</div>
//             </div>

//             <div className="flex-fill px-3">
//               <label className="form-label">Total Late Fee</label>
//               <div className="fw-bold text-danger">{fmt(rentForm.lateFee)}</div>
//             </div>
//           </div>
//         </div>
//       </CCol>
//     </>
//   )
// }

// export default SummaryCards





// // src/components/rent/PaymentModal/SummaryCards.jsx
// import React from 'react'
// import { CCard, CCardBody } from '@coreui/react'
// import { fmt } from '../../../utils/rentUtils'

// const SummaryCards = ({ rentForm }) => {
//   const stats = [
//     {
//       label: 'Monthly Rent',
//       value: fmt(rentForm.monthlyRent || 0),
//       // color: 'text-dark',
//     },
//     {
//       label: 'Pending',
//       value: fmt(rentForm.pendingAmount || 0),
//       color: 'text-warning fw-bold',
//     },
//     {
//       label: 'Prev Balance',
//       value: fmt(rentForm.previousBalance || 0),
//       // color: 'text-dark',
//     },
//     {
//       label: 'Total Late Fee',
//       value: fmt(rentForm.lateFee || 0),
//       color: 'text-danger fw-bold',
//     },
//   ]

//   return (
//     <div className="d-flex flex-wrap gap-3">
//       {stats.map((stat, index) => (
//         <CCard
//           key={index}
//           className="flex-grow-1 shadow-sm border-0"
//           style={{ minWidth: '180px', maxWidth: '220px' }}
//         >
//           <CCardBody className="text-center py-3 px-2">
//             <div className="small text-muted mb-1">{stat.label}</div>
//             <div className={`fs-5 ${stat.color}`}>{stat.value}</div>
//           </CCardBody>
//         </CCard>
//       ))}
//     </div>
//   )
// }

// export default SummaryCards







// src/components/rent/PaymentModal/SummaryCards.jsx
import React from 'react'
import { CCard, CCardBody } from '@coreui/react'
import { fmt } from '../../../utils/rentUtils'
import { useIsDarkMode } from '../../../hooks/useIsDarkMode'

const SummaryCards = ({ rentForm }) => {
  const isDark = useIsDarkMode()

  const cardClass = isDark
    ? 'bg-dark border border-secondary shadow'          // dark mode: visible dark bg + subtle border + shadow
    : 'bg-white border-0 shadow'                     // light mode: classic white card + shadow

  const stats = [
    {
      label: 'Monthly Rent',
      value: fmt(rentForm.monthlyRent || 0),
      // color: 'text-dark',
    },
    {
      label: 'Pending',
      value: fmt(rentForm.pendingAmount || 0),
      color: 'text-warning fw-bold',
    },
    {
      label: 'Prev Balance',
      value: fmt(rentForm.previousBalance || 0),
      // color: 'text-dark',
    },
    {
      label: 'Total Late Fee',
      value: fmt(rentForm.lateFee || 0),
      color: 'text-danger fw-bold',
    },
  ]

  return (
    <div className="d-flex flex-wrap gap-3">
      {stats.map((stat, index) => (
        <CCard
          key={index}
          className={`flex-grow-1 ${cardClass}`}
          style={{ minWidth: '180px', maxWidth: '220px' }}
        >
          <CCardBody className="text-center py-3 px-2">
            <div className={`small ${isDark ? 'text-light' : 'text-muted'} mb-1`}>
              {stat.label}
            </div>
            <div className={`fs-5 ${stat.color}`}>{stat.value}</div>
          </CCardBody>
        </CCard>
      ))}
    </div>
  )
}

export default SummaryCards