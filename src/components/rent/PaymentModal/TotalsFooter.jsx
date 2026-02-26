// // src/components/rent/PaymentModal/TotalsFooter.jsx
// import React from 'react'
// import { CButton } from '@coreui/react'
// import { fmt } from '../../../utils/rentUtils'

// const TotalsFooter = ({ totals, isEditMode, onSubmit }) => {
//   return (
//     <div className="d-flex justify-content-end gap-3 mt-2">
//       <div>
//         <strong>Selected:</strong> {totals.selectedCount}
//       </div>
//       <div>
//         <strong>Pay:</strong> {fmt(totals.sumSelectedPayAmount)}
//       </div>
//       <div>
//         <strong>Late Fees:</strong> {fmt(totals.sumSelectedLateFees)}
//       </div>
//       <div>
//         <strong>Discounts:</strong> {fmt(totals.sumSelectedDiscounts)}
//       </div>
//       <div>
//         <strong>Grand Total:</strong> {fmt(totals.grandTotal)}
//       </div>
//       {/* <CButton
//         color={isEditMode ? 'warning' : 'primary'}
//         disabled={totals.sumSelectedPayAmount <= 0 || totals.selectedCount === 0}
//         onClick={onSubmit}
//       >
//         {isEditMode ? 'Update Payment' : 'Record Payment'}
//       </CButton> */}

//       <CButton
//         // color={isEditMode ? 'warning' : 'primary'}
//         color={isEditMode ? 'info' : 'success'}
//         disabled={
//           totals.selectedCount === 0 || // no selection → disabled
//           (totals.sumSelectedPayAmount <= 0 && // no pay
//             totals.sumSelectedLateFees <= 0 && // no late fee paid
//             totals.sumSelectedDiscounts <= 0) // no discount applied
//         }
//         onClick={onSubmit}
//       >
//         {isEditMode ? 'Update Payment' : 'Record Payment'}
//       </CButton>
//     </div>
//   )
// }

// export default TotalsFooter




// src/components/rent/PaymentModal/TotalsFooter.jsx
import React from 'react'
import { CButton } from '@coreui/react'
import { fmt } from '../../../utils/rentUtils'

const TotalsFooter = ({ totals, isEditMode, onSubmit }) => {
  const isDisabled =
    totals.selectedCount === 0 ||
    (totals.sumSelectedPayAmount <= 0 &&
      totals.sumSelectedLateFees <= 0 &&
      totals.sumSelectedDiscounts <= 0)

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-end gap-4 mt-4 pt-3 border-top">
      <div className="d-flex gap-4 flex-wrap">
        <div>
          <small className="text-muted d-block">Selected</small>
          <strong>{totals.selectedCount}</strong>
        </div>

        <div>
          <small className="text-muted d-block">Pay Amount</small>
          <strong className="text-success">{fmt(totals.sumSelectedPayAmount)}</strong>
        </div>

        <div>
          <small className="text-muted d-block">Late Fees</small>
          <strong className="text-danger">{fmt(totals.sumSelectedLateFees)}</strong>
        </div>

        <div>
          <small className="text-muted d-block">Discounts</small>
          <strong className="text-info">{fmt(totals.sumSelectedDiscounts)}</strong>
        </div>

        <div className="ps-3 border-start">
          <small className="text-muted d-block fw-semibold">Grand Total</small>
          <strong className="fs-5">{fmt(totals.grandTotal)}</strong>
        </div>
      </div>

      <CButton
        color={isEditMode ? 'warning' : 'success'}
        // size="lg"
        disabled={isDisabled}
        onClick={onSubmit}
        className="px-4 py-2"
      >
        {isEditMode ? 'Update Payment' : 'Record Payment'}
      </CButton>
    </div>
  )
}

export default TotalsFooter