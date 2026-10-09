import React from 'react'
import { toast } from 'react-toastify'
import { CButton } from '@coreui/react'
import { openReceipts, receiptNo } from '../../utils/documents'

// Success message after recording payments, with a button that opens the receipt(s) for printing.
// Discount-, waiver- or adjustment-only records have no receipt (no money received), so then it's a plain message.
export const showPaymentRecorded = (receiptIds) => {
  const ids = Array.isArray(receiptIds) ? receiptIds.filter((id) => Number(id) > 0) : []
  if (!ids.length) {
    toast.success('Payment recorded successfully')
    return
  }
  toast.success(
    <div>
      <div>Payment recorded successfully</div>
      <div className="small">{ids.length === 1 ? receiptNo(ids[0]) : `${ids.length} receipts`}</div>
      <CButton size="sm" color="success" variant="outline" className="mt-1" onClick={() => openReceipts(ids)}>
        Print Receipt{ids.length > 1 ? 's' : ''}
      </CButton>
    </div>,
    { autoClose: 12000, closeOnClick: false },
  )
}
