// // src/components/rent/PaymentModal/InvoicePaymentTable.jsx
// import React, { useState } from 'react'
// import { toast } from 'react-toastify'
// import { CFormCheck, CFormInput, CFormSelect, CButton } from '@coreui/react'

// import InvoiceHistoryModal from '../InvoiceHistoryModal'
// import AdjustmentModal from '../AdjustmentModal'
// import { fmt, formatDate, getRemainingRent } from '../../../utils/rentUtils'
// import { rentService } from '../../../services/rent.service'

// const InvoicePaymentTable = ({
//   invoices,
//   rentForm,
//   openFrom,
//   toggleSelectAll,
//   toggleInvoiceSelect,
//   updateInvoiceField,
//   handleTenantChange,
//   setRentForm
// }) => {
//   const [historyState, setHistoryState] = useState({
//     visible: false,
//     invoice: null,
//     data: [],
//     loading: false,
//   })

//   const [adjustmentState, setAdjustmentState] = useState({
//     visible: false,
//     invoiceId: null,
//   })

//   const [maxAdjustment, setMaxAdjustment] = useState(0)

//   if (!invoices?.length) {
//     return <div className="text-center py-5 text-muted">Select a tenant to view invoices</div>
//   }

//   const openPaymentHistory = async (invoice) => {
//     setHistoryState((prev) => ({ ...prev, loading: true, visible: true, invoice }))

//     try {
//       const history = await rentService.getPaymentHistory(invoice.invoiceId)
//       setHistoryState((prev) => ({ ...prev, data: history ?? [], loading: false }))
//       // setMaxAdjustment(Number(invoice.paidAmount || 0))
//       // history[0] = latest payment (because SQL orders DESC)
//       // const latestPayment = history?.[0]
//       // const currentTotalPaid = latestPayment?.totalPaid ?? 0
//       // setMaxAdjustment(Number(currentTotalPaid))
//     } catch (err) {
//       console.error('Failed to load payment history:', err)
//       setHistoryState((prev) => ({ ...prev, data: [], loading: false }))
//       toast.error(err.response?.data?.message || 'Could not load payment history')
//     }
//   }

//   const handleOpenAdjustment = () => {
//     if (historyState.invoice) {
//       setAdjustmentState({
//         visible: true,
//         invoiceId: historyState.invoice.invoiceId,
//       })
//       // setMaxAdjustment(Number(historyState.invoice.paidAmount || 0))

//       // Use FRESH data from reloaded history (not the stale invoice object)
//       const latestRow = historyState.data?.[0] // latest payment row
//       const currentMax = latestRow?.totalPaid ?? historyState.invoice.paidAmount ?? 0

//       setMaxAdjustment(Number(currentMax))
//     }
//   }

//   return (
//     <>
//       <div style={{ maxHeight: '380px', overflowY: 'auto', marginTop: '8px' }}>
//         <table className="table table-bordered table-hover">
//           <thead>
//             <tr>
//               <th style={{ width: 40 }}>
//                 <CFormCheck
//                   checked={invoices.length > 0 && invoices.every((i) => i.selected)}
//                   onChange={(e) => toggleSelectAll(e.target.checked)}
//                 />
//               </th>
//               <th>Inv#</th>
//               <th>Inv Date</th>
//               <th>Due Date</th>
//               <th>Monthly Rent</th>
//               <th>Paid</th>
//               <th>Disc.</th>
//               <th>Remaining</th>
//               <th>Late Fee</th>
//               <th>Waive</th>
//               <th>Disc Amt</th>
//               <th>Disc %</th>
//               <th>Pay Amt</th>
//               <th>Pay Date</th>
//               <th>Method</th>
//               <th>Notes</th>
//               <th>Hist</th>
//             </tr>
//           </thead>
//           <tbody>
//             {invoices.map((inv) => {
//               const remaining = getRemainingRent(inv)
//               return (
//                 <tr key={inv.invoiceId}>
//                   <td>
//                     <CFormCheck
//                       checked={!!inv.selected}
//                       disabled={remaining <= 0 && !inv.selected}
//                       onChange={(e) => toggleInvoiceSelect(inv.invoiceId, e.target.checked)}
//                     />
//                   </td>
//                   <td>{inv.invoiceId}</td>
//                   <td>{formatDate(inv.invoiceDate)}</td>
//                   <td>{formatDate(inv.dueDate)}</td>
//                   <td>{fmt(inv.monthlyRent)}</td>
//                   <td>{fmt(inv.paidAmount)}</td>
//                   <td>{fmt(inv.appliedDiscount)}</td>
//                   {/* <td>{fmt(remaining)}</td> */}
//                   <td>{fmt(inv.remainingAmount)}</td>
//                   <td>{fmt(inv.lateFee)}</td>
//                   <td>
//                     <CFormCheck
//                       checked={!!inv.waveLateFee}
//                       disabled={!!rentForm.globalWaveLateFee}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'waveLateFee', e.target.checked)
//                       }
//                     />
//                   </td>
//                   <td>
//                     <CFormInput
//                       type="number"
//                       min="0"
//                       value={inv.discountAmount || 0}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'discountAmount', Number(e.target.value))
//                       }
//                     />
//                   </td>
//                   <td>{fmt(inv.discountPercent || 0)}%</td>
//                   <td>
//                     <CFormInput
//                       type="number"
//                       min="0"
//                       max={remaining}
//                       value={inv.payAmount || 0}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'payAmount', Number(e.target.value))
//                       }
//                     />
//                   </td>
//                   <td>
//                     <CFormInput
//                       type="date"
//                       value={inv.paymentDate || ''}
//                       disabled={!!rentForm.globalPaymentDate}
//                       max={new Date().toISOString().split('T')[0]}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'paymentDate', e.target.value)
//                       }
//                     />
//                   </td>
//                   <td>
//                     <CFormSelect
//                       value={inv.paymentMethod || ''}
//                       disabled={!!rentForm.globalPaymentMethod}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'paymentMethod', e.target.value)
//                       }
//                     >
//                       <option value="">—</option>
//                       <option value="Cash">Cash</option>
//                       <option value="Bank Transfer">Bank</option>
//                       <option value="Cheque">Cheque</option>
//                       <option value="Online">Online</option>
//                     </CFormSelect>
//                   </td>
//                   <td>
//                     <CFormInput
//                       value={inv.invoiceNotes || ''}
//                       disabled={!!rentForm.globalNotes}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'invoiceNotes', e.target.value)
//                       }
//                     />
//                   </td>
//                   <td>
//                     <CButton color="info" variant="outline" onClick={() => openPaymentHistory(inv)}>
//                       Hist
//                     </CButton>
//                   </td>
//                 </tr>
//               )
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* 2nd Modal: Payment History */}
//       <InvoiceHistoryModal
//         visible={historyState.visible}
//         invoice={historyState.invoice}
//         data={historyState.data}
//         loading={historyState.loading}
//         onClose={() => setHistoryState((prev) => ({ ...prev, visible: false }))}
//         onOpenAdjustment={handleOpenAdjustment}
//       />

//       <AdjustmentModal
//         visible={adjustmentState.visible}
//         onClose={() => setAdjustmentState({ visible: false, invoiceId: null })}
//         invoiceId={adjustmentState.invoiceId}
//         maxAdjustment={maxAdjustment}
//         tenantId={rentForm.tenantId}
//         // Only this callback — very simple and safe
//         // onAdjustmentSuccess={async () => {
//         //   // Refresh history first (most important for user)
//         //   if (historyState.invoice) {
//         //     try {
//         //       await openPaymentHistory(historyState.invoice)
//         //     }
//         //     catch (err) {
//         //       console.warn('History refresh failed after adjustment')
//         //     }
//         //   }

//         //   // Then try to refresh main table — using the existing working function
//         //   try {
//         //     await handleTenantChange(rentForm.tenantId)
//         //   } catch (err) {
//         //     console.warn('Main table refresh failed')
//         //   }
//         // }}

//         onAdjustmentSuccess={async () => {
//           // 1. Refresh history (already good)
//           if (historyState.invoice) {
//             await openPaymentHistory(historyState.invoice)
//           }

//           // 2. Reload data from backend (guaranteed correct values)
//           await handleTenantChange(rentForm.tenantId)

//           // 3. If in single-invoice mode → keep only the updated invoice
//           if (openFrom === 'ROW_CLICK') {
//             const targetId = historyState.invoice?.invoiceId
//             if (targetId) {
//               const updatedInvoice = rentForm.invoices.find((i) => i.invoiceId === targetId)
//               if (updatedInvoice) {
//                 // Restore single row view
//                 setRentForm((prev) => ({
//                   ...prev,
//                   invoices: [updatedInvoice], // ← only keep this one
//                 }))
//               }
//             }
//           }
//         }}
//       />
//     </>
//   )
// }

// export default InvoicePaymentTable

// import React, { useState } from 'react'
// import { toast } from 'react-toastify'
// import { CFormCheck, CFormInput, CFormSelect, CButton } from '@coreui/react'

// import InvoiceHistoryModal from '../InvoiceHistoryModal'
// import AdjustmentModal from '../AdjustmentModal'
// import { fmt, formatDate, getRemainingRent } from '../../../utils/rentUtils'
// import { rentService } from '../../../services/rent.service'

// const InvoicePaymentTable = ({
//   invoices,
//   rentForm,
//   openFrom,
//   toggleSelectAll,
//   toggleInvoiceSelect,
//   updateInvoiceField,
//   handleTenantChange,
//   setRentForm,
// }) => {
//   const [historyState, setHistoryState] = useState({
//     visible: false,
//     invoice: null,
//     data: [],
//     loading: false,
//   })

//   const [adjustmentState, setAdjustmentState] = useState({
//     visible: false,
//     invoiceId: null,
//   })

//   const [maxAdjustment, setMaxAdjustment] = useState(0)

//   if (!invoices?.length) {
//     return <div className="text-center py-5 text-muted">Select a tenant to view invoices</div>
//   }

//   const openPaymentHistory = async (invoice) => {
//     setHistoryState((prev) => ({ ...prev, loading: true, visible: true, invoice }))

//     try {
//       const history = await rentService.getPaymentHistory(invoice.invoiceId)
//       setHistoryState((prev) => ({ ...prev, data: history ?? [], loading: false }))
//     } catch (err) {
//       console.error('Failed to load payment history:', err)
//       setHistoryState((prev) => ({ ...prev, data: [], loading: false }))
//       toast.error(err.response?.data?.message || 'Could not load payment history')
//     }
//   }

//   const handleOpenAdjustment = () => {
//     if (historyState.invoice) {
//       // const remaining = Number(historyState.invoice.remainingAmount || 0)
//       // setMaxAdjustment(remaining)  // ← CHANGED: Use remainingAmount as max

//       const maxFromPaid = Number(
//         historyState.data?.[0]?.totalPaid ?? historyState.invoice?.paidAmount ?? 0,
//       )
//       setMaxAdjustment(maxFromPaid)

//       setAdjustmentState({
//         visible: true,
//         invoiceId: historyState.invoice.invoiceId,
//       })
//     }
//   }

//   return (
//     <>
//       <div style={{ maxHeight: '380px', overflowY: 'auto', marginTop: '8px' }}>
//         <table className="table table-bordered table-hover">
//           <thead>
//             <tr>
//               <th style={{ width: 40 }}>
//                 <CFormCheck
//                   checked={invoices.length > 0 && invoices.every((i) => i.selected)}
//                   onChange={(e) => toggleSelectAll(e.target.checked)}
//                 />
//               </th>
//               <th>Inv#</th>
//               <th>Inv Date</th>
//               <th>Due Date</th>
//               <th>Monthly Rent</th>
//               <th>Paid</th>
//               {/* <th>Disc.</th> */}
//               <th>Remaining</th>
//               <th>Late Fee</th>
//               <th>Waive</th>
//               <th>Disc Amt</th>
//               {/* <th>Disc %</th> */}
//               <th>Pay Amt</th>
//               <th>Pay Date</th>
//               <th>Method</th>
//               <th>Notes</th>
//               <th>Hist</th>
//             </tr>
//           </thead>
//           <tbody>
//             {invoices.map((inv) => {
//               const remaining = getRemainingRent(inv)
//               return (
//                 <tr key={inv.invoiceId}>
//                   <td>
//                     <CFormCheck
//                       checked={!!inv.selected}
//                       disabled={remaining <= 0 && !inv.selected}
//                       onChange={(e) => toggleInvoiceSelect(inv.invoiceId, e.target.checked)}
//                     />
//                   </td>
//                   <td>{inv.invoiceId}</td>
//                   <td>{formatDate(inv.invoiceDate)}</td>
//                   <td>{formatDate(inv.dueDate)}</td>
//                   <td>{fmt(inv.monthlyRent)}</td>
//                   <td>{fmt(inv.paidAmount)}</td>
//                   {/* <td>{fmt(inv.appliedDiscount)}</td> */}
//                   <td>{fmt(inv.remainingAmount)}</td>
//                   <td>{fmt(inv.lateFee)}</td>
//                   <td>
//                     <CFormCheck
//                       checked={!!inv.waveLateFee}
//                       disabled={!!rentForm.globalWaveLateFee}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'waveLateFee', e.target.checked)
//                       }
//                     />
//                   </td>
//                   <td>
//                     <CFormInput
//                       type="number"
//                       min="0"
//                       placeholder='0'
//                       value={inv.discountAmount || ''}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'discountAmount', Number(e.target.value))
//                       }
//                     />
//                   </td>
//                   {/* <td>
//                     <CFormInput
//                       type="text"
//                       min="0"
//                       max="100"
//                       step="0.01"
//                       value={
//                         inv.monthlyRent > 0 && inv.discountAmount > 0
//                           ? ((inv.discountAmount / inv.remainingAmount) * 100).toFixed(2)
//                           : inv.discountPercent || 0
//                       }
//                       onChange={(e) => {
//                         const pct = Number(e.target.value)
//                         if (pct >= 0 && pct <= 100) {
//                           const discAmt = Math.round((inv.monthlyRent || 0) * (pct / 100))
//                           updateInvoiceField(inv.invoiceId, 'discountAmount', discAmt)
//                           // Optional: also store percent if your backend needs it
//                           updateInvoiceField(inv.invoiceId, 'discountPercent', pct)
//                         }
//                       }}
//                       readOnly
//                     />
//                   </td> */}
//                   <td style={{ minWidth: '150px' }}>
//                     <CFormInput
//                       type="number"
//                       min="0"
//                       max={remaining}
//                       placeholder='0'
//                       value={inv.payAmount || ""}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'payAmount', Number(e.target.value))
//                       }
//                     />
//                   </td>
//                   <td>
//                     <CFormInput
//                       type="date"
//                       value={inv.paymentDate || ''}
//                       disabled={!!rentForm.globalPaymentDate}
//                       max={new Date().toISOString().split('T')[0]}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'paymentDate', e.target.value)
//                       }
//                     />
//                   </td>
//                   <td>
//                     <CFormSelect
//                       value={inv.paymentMethod || ''}
//                       disabled={!!rentForm.globalPaymentMethod}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'paymentMethod', e.target.value)
//                       }
//                     >
//                       <option value="">Select</option>
//                       <option value="Cash">Cash</option>
//                       <option value="Bank Transfer">Bank Transfer</option>
//                       <option value="Cheque">Cheque</option>
//                       <option value="Online">Online</option>
//                     </CFormSelect>
//                   </td>
//                   <td style={{ minWidth: '150px' }}>
//                     <CFormInput
//                       value={inv.invoiceNotes || ''}
//                       placeholder='Optional...'
//                       disabled={!!rentForm.globalNotes}
//                       onChange={(e) =>
//                         updateInvoiceField(inv.invoiceId, 'invoiceNotes', e.target.value)
//                       }
//                     />
//                   </td>
//                   <td>
//                     <CButton color="info" variant="outline" onClick={() => openPaymentHistory(inv)}>
//                       Hist
//                     </CButton>
//                   </td>
//                 </tr>
//               )
//             })}
//           </tbody>
//         </table>
//       </div>

//       <InvoiceHistoryModal
//         visible={historyState.visible}
//         invoice={historyState.invoice}
//         data={historyState.data}
//         loading={historyState.loading}
//         onClose={() => setHistoryState((prev) => ({ ...prev, visible: false }))}
//         onOpenAdjustment={handleOpenAdjustment}
//       />

//       <AdjustmentModal
//         visible={adjustmentState.visible}
//         onClose={() => setAdjustmentState({ visible: false, invoiceId: null })}
//         invoiceId={adjustmentState.invoiceId}
//         maxAdjustment={maxAdjustment}
//         tenantId={rentForm.tenantId}
//         // onAdjustmentSuccess={async () => {
//         //   // Refresh history
//         //   if (historyState.invoice) {
//         //     await openPaymentHistory(historyState.invoice)
//         //   }

//         //   // Full reload from API (updates paid/remaining/summary)
//         //   await handleTenantChange(rentForm.tenantId)

//         //   // For single-invoice mode: keep only the updated one
//         //   setRentForm((latest) => {
//         //     if (openFrom !== 'ROW_CLICK') return latest

//         //     const targetId = historyState.invoice?.invoiceId
//         //     if (!targetId) return latest

//         //     const updated = latest.invoices.find((i) => i.invoiceId === targetId)
//         //     return updated ? { ...latest, invoices: [updated] } : { ...latest, invoices: [] }
//         //   })
//         // }}

//         onAdjustmentSuccess={async () => {
//           if (!historyState.invoice) return // ← safety

//           await openPaymentHistory(historyState.invoice)

//           await handleTenantChange(rentForm.tenantId)

//           setRentForm((latest) => {
//             if (openFrom !== 'ROW_CLICK') return latest
//             const targetId = historyState.invoice?.invoiceId
//             if (!targetId) return latest
//             const updated = latest.invoices.find((i) => i.invoiceId === targetId)
//             return updated ? { ...latest, invoices: [updated] } : { ...latest, invoices: [] }
//           })
//         }}
//       />
//     </>
//   )
// }

// export default InvoicePaymentTable

// src/components/rent/PaymentModal/InvoicePaymentTable.jsx
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import {
  CFormCheck,
  CFormInput,
  CFormSelect,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import InvoiceHistoryModal from '../InvoiceHistoryModal'
import AdjustmentModal from '../AdjustmentModal'
import { fmt, formatDate, getRemainingRent } from '../../../utils/rentUtils'
import { rentService } from '../../../services/rent.service'
import { useIsDarkMode } from '../../../hooks/useIsDarkMode'

const InvoicePaymentTable = ({
  invoices,
  rentForm,
  openFrom,
  toggleSelectAll,
  toggleInvoiceSelect,
  updateInvoiceField,
  handleTenantChange,
  setRentForm,
}) => {
  const isDark = useIsDarkMode()

  const [historyState, setHistoryState] = useState({
    visible: false,
    invoice: null,
    data: [],
    loading: false,
  })

  const [adjustmentState, setAdjustmentState] = useState({
    visible: false,
    invoiceId: null,
  })

  const [maxAdjustment, setMaxAdjustment] = useState(0)

  if (!invoices?.length) {
    return <div className="text-center py-5 text-muted fs-5">Select a tenant to view invoices</div>
  }

  const openPaymentHistory = async (invoice) => {
    setHistoryState((prev) => ({ ...prev, loading: true, visible: true, invoice }))
    try {
      const history = await rentService.getPaymentHistory(invoice.invoiceId)
      setHistoryState((prev) => ({ ...prev, data: history ?? [], loading: false }))
    } catch (err) {
      console.error('Failed to load payment history:', err)
      setHistoryState((prev) => ({ ...prev, data: [], loading: false }))
      toast.error(err.response?.data?.message || 'Could not load payment history')
    }
  }

  const handleOpenAdjustment = () => {
    if (historyState.invoice) {
      const maxFromPaid = Number(
        historyState.data?.[0]?.totalPaid ?? historyState.invoice?.paidAmount ?? 0,
      )
      setMaxAdjustment(maxFromPaid)
      setAdjustmentState({
        visible: true,
        invoiceId: historyState.invoice.invoiceId,
      })
    }
  }

  return (
    <>
      <div
        style={{
          maxHeight: '420px',
          overflowY: 'auto',
          borderRadius: '0.5rem',
          boxShadow: isDark
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        }}
      >
        <CTable hover responsive bordered className="mb-0 small">
          <CTableHead
            className={`position-sticky top-0 ${isDark ? 'table-head-dark' : 'table-light'}`}
          >
            <CTableRow>
              <CTableHeaderCell className="text-center">
                <CFormCheck
                  checked={invoices.length > 0 && invoices.every((i) => i.selected)}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </CTableHeaderCell>
              <CTableHeaderCell>Inv#</CTableHeaderCell>
              <CTableHeaderCell>Inv Date</CTableHeaderCell>
              <CTableHeaderCell>Due Date</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Monthly Rent</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Paid</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Remaining</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Late Fee</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Waive</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Disc Amt</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Pay Amt</CTableHeaderCell>
              <CTableHeaderCell>Pay Date</CTableHeaderCell>
              <CTableHeaderCell>Method</CTableHeaderCell>
              <CTableHeaderCell>Notes</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Action</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {invoices.map((inv) => {
              const remaining = getRemainingRent(inv)
              return (
                <CTableRow key={inv.invoiceId}>
                  {/* Checkbox - center */}
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      checked={!!inv.selected}
                      disabled={remaining <= 0 && !inv.selected}
                      onChange={(e) => toggleInvoiceSelect(inv.invoiceId, e.target.checked)}
                    />
                  </CTableDataCell>

                  {/* Inv# - left (it's an ID, treat as text) */}
                  <CTableDataCell>{inv.invoiceId}</CTableDataCell>

                  {/* Inv Date - left */}
                  <CTableDataCell>{formatDate(inv.invoiceDate)}</CTableDataCell>

                  {/* Due Date - left */}
                  <CTableDataCell>{formatDate(inv.dueDate)}</CTableDataCell>

                  {/* Monthly Rent - right */}
                  <CTableDataCell className="text-end">{fmt(inv.monthlyRent)}</CTableDataCell>

                  {/* Paid - right + red if negative */}
                  <CTableDataCell className="text-end">
                    <span className={inv.paidAmount < 0 ? 'text-danger' : ''}>
                      {fmt(inv.paidAmount)}
                    </span>
                  </CTableDataCell>

                  {/* Remaining - right + medium weight */}
                  <CTableDataCell className="text-end fw-medium">
                    {fmt(inv.remainingAmount)}
                  </CTableDataCell>

                  {/* Late Fee - right + red */}
                  <CTableDataCell className="text-end text-danger fw-bold">
                    {fmt(inv.lateFee)}
                  </CTableDataCell>

                  {/* Waive - center */}
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      checked={!!inv.waveLateFee}
                      disabled={!!rentForm.globalWaveLateFee}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'waveLateFee', e.target.checked)
                      }
                    />
                  </CTableDataCell>

                  {/* Disc Amt - right */}
                  <CTableDataCell className="text-end">
                    <CFormInput
                      type="number"
                      min="0"
                      size="sm"
                      value={inv.discountAmount || ''}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'discountAmount', Number(e.target.value))
                      }
                      placeholder="0"
                    />
                  </CTableDataCell>

                  {/* Pay Amt - right */}
                  <CTableDataCell className="text-end">
                    <CFormInput
                      type="number"
                      min="0"
                      max={remaining}
                      size="sm"
                      value={inv.payAmount || ''}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'payAmount', Number(e.target.value))
                      }
                      placeholder="0"
                    />
                  </CTableDataCell>

                  {/* Pay Date - left (date input) */}
                  <CTableDataCell>
                    <CFormInput
                      type="date"
                      size="sm"
                      value={inv.paymentDate || ''}
                      disabled={!!rentForm.globalPaymentDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'paymentDate', e.target.value)
                      }
                    />
                  </CTableDataCell>

                  {/* Method - left (select) */}
                  <CTableDataCell>
                    <CFormSelect
                      size="sm"
                      value={inv.paymentMethod || ''}
                      disabled={!!rentForm.globalPaymentMethod}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'paymentMethod', e.target.value)
                      }
                    >
                      <option value="">Select...</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online</option>
                    </CFormSelect>
                  </CTableDataCell>

                  {/* Notes - left */}
                  <CTableDataCell>
                    <CFormInput
                      size="sm"
                      value={inv.invoiceNotes || ''}
                      placeholder="Optional..."
                      disabled={!!rentForm.globalNotes}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'invoiceNotes', e.target.value)
                      }
                    />
                  </CTableDataCell>

                  {/* History button - center */}
                  <CTableDataCell className="text-center">
                    <CButton
                      color="info"
                      size="sm"
                      variant="outline"
                      onClick={() => openPaymentHistory(inv)}
                    >
                      History
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              )
            })}
          </CTableBody>
        </CTable>
      </div>

      <InvoiceHistoryModal
        visible={historyState.visible}
        invoice={historyState.invoice}
        data={historyState.data}
        loading={historyState.loading}
        onClose={() => setHistoryState((prev) => ({ ...prev, visible: false }))}
        onOpenAdjustment={handleOpenAdjustment}
      />

      <AdjustmentModal
        visible={adjustmentState.visible}
        onClose={() => setAdjustmentState({ visible: false, invoiceId: null })}
        invoiceId={adjustmentState.invoiceId}
        maxAdjustment={maxAdjustment}
        tenantId={rentForm.tenantId}
        onAdjustmentSuccess={async () => {
          if (!historyState.invoice) return
          await openPaymentHistory(historyState.invoice)
          await handleTenantChange(rentForm.tenantId)
          setRentForm((latest) => {
            if (openFrom !== 'ROW_CLICK') return latest
            const targetId = historyState.invoice?.invoiceId
            if (!targetId) return latest
            const updated = latest.invoices.find((i) => i.invoiceId === targetId)
            return updated ? { ...latest, invoices: [updated] } : { ...latest, invoices: [] }
          })
        }}
      />
    </>
  )
}

export default InvoicePaymentTable
