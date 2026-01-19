// src/components/rent/PaymentModal/InvoicePaymentTable.jsx
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { CFormCheck, CFormInput, CFormSelect, CButton } from '@coreui/react'

import InvoiceHistoryModal from '../InvoiceHistoryModal'
import AdjustmentModal from '../AdjustmentModal'
import { fmt, formatDate, getRemainingRent } from '../../../utils/rentUtils'
import { rentService } from '../../../services/rent.service'

const InvoicePaymentTable = ({
  invoices,
  rentForm,
  openFrom,
  toggleSelectAll,
  toggleInvoiceSelect,
  updateInvoiceField,
  handleTenantChange,
  setRentForm
}) => {
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
    return <div className="text-center py-5 text-muted">Select a tenant to view invoices</div>
  }

  const openPaymentHistory = async (invoice) => {
    setHistoryState((prev) => ({ ...prev, loading: true, visible: true, invoice }))

    try {
      const history = await rentService.getPaymentHistory(invoice.invoiceId)
      setHistoryState((prev) => ({ ...prev, data: history ?? [], loading: false }))
      // setMaxAdjustment(Number(invoice.paidAmount || 0))
      // history[0] = latest payment (because SQL orders DESC)
      // const latestPayment = history?.[0]
      // const currentTotalPaid = latestPayment?.totalPaid ?? 0
      // setMaxAdjustment(Number(currentTotalPaid))
    } catch (err) {
      console.error('Failed to load payment history:', err)
      setHistoryState((prev) => ({ ...prev, data: [], loading: false }))
      toast.error(err.response?.data?.message || 'Could not load payment history')
    }
  }

  const handleOpenAdjustment = () => {
    if (historyState.invoice) {
      setAdjustmentState({
        visible: true,
        invoiceId: historyState.invoice.invoiceId,
      })
      // setMaxAdjustment(Number(historyState.invoice.paidAmount || 0))

      // Use FRESH data from reloaded history (not the stale invoice object)
      const latestRow = historyState.data?.[0] // latest payment row
      const currentMax = latestRow?.totalPaid ?? historyState.invoice.paidAmount ?? 0

      setMaxAdjustment(Number(currentMax))
    }
  }

  return (
    <>
      <div style={{ maxHeight: '380px', overflowY: 'auto', marginTop: '8px' }}>
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <CFormCheck
                  checked={invoices.length > 0 && invoices.every((i) => i.selected)}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
              <th>Inv#</th>
              <th>Inv Date</th>
              <th>Due Date</th>
              <th>Monthly Rent</th>
              <th>Paid</th>
              <th>Disc.</th>
              <th>Remaining</th>
              <th>Late Fee</th>
              <th>Waive</th>
              <th>Disc Amt</th>
              <th>Disc %</th>
              <th>Pay Amt</th>
              <th>Pay Date</th>
              <th>Method</th>
              <th>Notes</th>
              <th>Hist</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const remaining = getRemainingRent(inv)
              return (
                <tr key={inv.invoiceId}>
                  <td>
                    <CFormCheck
                      checked={!!inv.selected}
                      disabled={remaining <= 0 && !inv.selected}
                      onChange={(e) => toggleInvoiceSelect(inv.invoiceId, e.target.checked)}
                    />
                  </td>
                  <td>{inv.invoiceId}</td>
                  <td>{formatDate(inv.invoiceDate)}</td>
                  <td>{formatDate(inv.dueDate)}</td>
                  <td>{fmt(inv.monthlyRent)}</td>
                  <td>{fmt(inv.paidAmount)}</td>
                  <td>{fmt(inv.appliedDiscount)}</td>
                  {/* <td>{fmt(remaining)}</td> */}
                  <td>{fmt(inv.remainingAmount)}</td>
                  <td>{fmt(inv.lateFee)}</td>
                  <td>
                    <CFormCheck
                      checked={!!inv.waveLateFee}
                      disabled={!!rentForm.globalWaveLateFee}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'waveLateFee', e.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <CFormInput
                      type="number"
                      min="0"
                      value={inv.discountAmount || 0}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'discountAmount', Number(e.target.value))
                      }
                    />
                  </td>
                  <td>{fmt(inv.discountPercent || 0)}%</td>
                  <td>
                    <CFormInput
                      type="number"
                      min="0"
                      max={remaining}
                      value={inv.payAmount || 0}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'payAmount', Number(e.target.value))
                      }
                    />
                  </td>
                  <td>
                    <CFormInput
                      type="date"
                      value={inv.paymentDate || ''}
                      disabled={!!rentForm.globalPaymentDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'paymentDate', e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <CFormSelect
                      value={inv.paymentMethod || ''}
                      disabled={!!rentForm.globalPaymentMethod}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'paymentMethod', e.target.value)
                      }
                    >
                      <option value="">—</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online</option>
                    </CFormSelect>
                  </td>
                  <td>
                    <CFormInput
                      value={inv.invoiceNotes || ''}
                      disabled={!!rentForm.globalNotes}
                      onChange={(e) =>
                        updateInvoiceField(inv.invoiceId, 'invoiceNotes', e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <CButton color="info" variant="outline" onClick={() => openPaymentHistory(inv)}>
                      Hist
                    </CButton>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 2nd Modal: Payment History */}
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
        // Only this callback — very simple and safe
        // onAdjustmentSuccess={async () => {
        //   // Refresh history first (most important for user)
        //   if (historyState.invoice) {
        //     try {
        //       await openPaymentHistory(historyState.invoice)
        //     }
        //     catch (err) {
        //       console.warn('History refresh failed after adjustment')
        //     }
        //   }

        //   // Then try to refresh main table — using the existing working function
        //   try {
        //     await handleTenantChange(rentForm.tenantId)
        //   } catch (err) {
        //     console.warn('Main table refresh failed')
        //   }
        // }}

        onAdjustmentSuccess={async () => {
          // 1. Refresh history (already good)
          if (historyState.invoice) {
            await openPaymentHistory(historyState.invoice)
          }

          // 2. Reload data from backend (guaranteed correct values)
          await handleTenantChange(rentForm.tenantId)

          // 3. If in single-invoice mode → keep only the updated invoice
          if (openFrom === 'ROW_CLICK') {
            const targetId = historyState.invoice?.invoiceId
            if (targetId) {
              const updatedInvoice = rentForm.invoices.find((i) => i.invoiceId === targetId)
              if (updatedInvoice) {
                // Restore single row view
                setRentForm((prev) => ({
                  ...prev,
                  invoices: [updatedInvoice], // ← only keep this one
                }))
              }
            }
          }
        }}
      />
    </>
  )
}

export default InvoicePaymentTable
