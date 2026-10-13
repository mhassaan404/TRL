// src/components/rent/InvoiceHistoryModal.jsx
import React from 'react'
import { CBadge, CModal, CModalHeader, CModalBody, CModalFooter, CButton } from '@coreui/react'
import { useIsDarkMode } from '../../hooks/useIsDarkMode'
import { fmt, formatDate } from '../../utils/rentUtils'
import { isReversed, paymentType, PAYMENT_TYPE_COLOR } from '../../utils/payments'

// This list uses older field names (paidAmount, waveLateFee): map them for the shared payment-type rule
const rowFor = (item) => ({
  ...item,
  paymentAmount: item.paidAmount,
  isLateFeeWaived: item.waveLateFee,
})

const InvoiceHistoryModal = ({ visible, invoice, data, loading, onClose }) => {
  const isDark = useIsDarkMode()

  return (
    <CModal size="xl" visible={visible} onClose={onClose} backdrop="static">
      {/* <CModalHeader className="bg-body-tertiary"> */}
      <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'}>
        <strong>Payment History ({invoice?.invoiceId || '—'})</strong>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="text-center py-5">Loading payment history...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-5 text-muted">No payment history found</div>
        ) : (
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table className="table table-bordered table-hover table-sm">
              <thead className={isDark ? 'table-head-dark' : 'table-light'}>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-end">Rent</th>
                  <th className="text-end">Paid</th>
                  <th className="text-end">Disc</th>
                  <th className="text-end">%</th>
                  <th className="text-end">Rem</th>
                  <th className="text-center">Waive</th>
                  <th>Method</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr
                    key={item.paymentId ?? index}
                    className={isReversed(item) ? 'text-body-secondary' : ''}
                  >
                    <td>{formatDate(item.paymentDate)}</td>
                    <td>
                      <CBadge color={PAYMENT_TYPE_COLOR[paymentType(rowFor(item))]}>
                        {paymentType(rowFor(item))}
                      </CBadge>
                      {isReversed(item) && (
                        <CBadge color="danger" className="ms-1">
                          Reversed
                        </CBadge>
                      )}
                    </td>
                    <td className="text-end">{fmt(item.monthlyRent)}</td>
                    <td className="text-end">
                      <span className={item.paidAmount < 0 ? 'text-danger' : ''}>
                        {fmt(item.paidAmount)}
                      </span>
                    </td>
                    <td className="text-end">{fmt(item.discountAmount || 0)}</td>
                    <td className="text-end">{item.discountPercent || 0}%</td>
                    <td className="text-end fw-medium">{fmt(item.remainingAmount || 0)}</td>
                    <td className="text-center">{item.waveLateFee ? '✓' : '—'}</td>
                    <td>{item.paymentMethod || '—'}</td>
                    <td className="text-truncate" style={{ maxWidth: '200px' }}>
                      {item.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default InvoiceHistoryModal
