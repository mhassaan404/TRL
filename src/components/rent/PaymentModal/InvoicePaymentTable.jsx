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
  handleChargeLateFee,
  handleReverseLateFee
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

  const handleReverseLateFee = async (inv) => {
    const reason = window.prompt('Reason for reversing the late fee:')
    if (!reason?.trim()) return
    try {
      const res = await rentService.reverseLateFee(inv.invoiceId, reason.trim())
      toast.success(res?.message || 'Late fee reversed')
      await handleTenantChange(rentForm.tenantId)
      setRentForm((latest) => {
        if (openFrom !== 'ROW_CLICK') return latest
        const u = latest.invoices.find((i) => i.invoiceId === inv.invoiceId)
        return { ...latest, invoices: u ? [u] : [] }
      })
    } catch { /* toast shown by service */ }
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
                  {/* <CTableDataCell className="text-end text-danger fw-bold">
                    {fmt(inv.lateFee)}
                  </CTableDataCell> */}
                  <CTableDataCell className="text-end text-danger fw-bold">
                    {fmt(inv.lateFee)}
                    
                    {/* {Number(inv.lateFeeCharged) > 0 && (
                      <div>
                        <span className="badge bg-secondary me-1">Charged {fmt(inv.lateFeeCharged)}</span>
                        <CButton color="link" size="sm" className="p-0 text-danger" onClick={() => handleReverseLateFee(inv)}>
                          Reverse
                        </CButton>
                      </div>
                    )} */}

                    {Number(inv.lateFeeCharged) > 0 && (
                      <div>
                        <span className="badge bg-secondary me-1">Charged {fmt(inv.lateFeeCharged)}</span>
                        <CButton
                          color="link" size="sm" className="p-0 text-danger"
                          disabled={!!inv.reversing}
                          onClick={() => {
                            const reason = window.prompt('Reason for reversing the late fee:')
                            if (reason?.trim()) handleReverseLateFee(inv, reason.trim())
                          }}
                        >
                          {inv.reversing ? '...' : 'Reverse'}
                        </CButton>
                      </div>
                    )}
                  </CTableDataCell>

                  {/* Waive + Charge button - center */}
                  <CTableDataCell className="text-center">
                    <div className="d-flex flex-column align-items-center gap-1">
                      <CFormCheck
                        checked={!!inv.waveLateFee}
                        disabled={!!rentForm.globalWaveLateFee}
                        onChange={(e) =>
                          updateInvoiceField(inv.invoiceId, 'waveLateFee', e.target.checked)
                        }
                      />
                      {Number(inv.lateFee) > 0 && !inv.waveLateFee && (
                        // <CButton
                        //   color="warning"
                        //   size="sm"
                        //   variant="outline"
                        //   style={{ fontSize: '0.7rem', padding: '1px 6px' }}
                        //   onClick={() => handleChargeLateFee(inv)}
                        // >
                        //   Charge
                        // </CButton>

                        <CButton
                          color="warning"
                          size="sm"
                          variant="outline"
                          disabled={!!inv.charging}
                          style={{ fontSize: '0.7rem', padding: '1px 6px' }}
                          onClick={() => handleChargeLateFee(inv)}
                        >
                          {inv.charging ? '...' : 'Charge'}
                        </CButton>
                      )}
                    </div>
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

                  {/* Pay Amt - right. NOTE: capped at `remaining` (rent only) on
                      purpose — late fee is never part of this number since it's
                      not a persisted balance; charge it separately via "Charge" above. */}
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