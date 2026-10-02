import React from 'react'
import { CCol, CRow } from '@coreui/react'
import PaymentRecords from '../../components/rent/PaymentRecords'

// All payment records (payments, discounts, waivers, adjustments) across invoices, with their own filters.
// Per-invoice details are in the History window on Rent History.
const Payments = () => (
  <CRow>
    <CCol xs={12}>
      <PaymentRecords />
    </CCol>
  </CRow>
)

export default Payments
