import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router-dom'
import { CCol, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react'
import PrintShell from '../../components/print/PrintShell'
import CompanyHeader from '../../components/common/CompanyHeader'
import { DocFooter, PartyBlock, PropertyBlock } from '../../components/print/DocParts'
import { documentService } from '../../services/document.service'
import { fmt } from '../../utils/rentUtils'
import { formatDay } from '../../utils/reminders'
import { todayLocal } from '../../utils/dates'
import { amountInWords, invoiceNo, invoiceTitle, receiptNo } from '../../utils/documents'

// Payment receipt(s): one A4 sheet per payment. /print/receipts/12 or /print/receipts/12,13 (paid together).
const Receipt = ({ r }) => {
  const invoiceTotal = Number(r.totalRent) + Number(r.lateFeeCharged)
  const after = Number(r.balanceAfter)
  const reversed = r.reversedByPaymentId != null // entered by mistake and reversed later: the receipt is void
  return (
    <div className="print-sheet">
      {reversed && <div className="print-watermark">REVERSED</div>}
      <CompanyHeader />
      {reversed && (
        <div className="doc-box mb-3 border-danger">
          <div className="fw-bold text-danger">This receipt is void: the payment was reversed.</div>
          <div className="small">
            Reversed on {formatDay(r.reversedAt)}
            {r.reversedBy ? ` by ${r.reversedBy}` : ''} (record #{r.reversedByPaymentId}). Reason: {r.reversalReason || '—'}
          </div>
          <div className="small">A reversal means the payment was entered by mistake; it is not a refund.</div>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div className="doc-title">Payment Receipt</div>
        <table className="doc-meta">
          <tbody>
            <tr><th>Receipt No.</th><td className="fw-bold">{receiptNo(r.paymentId)}</td></tr>
            <tr><th>Payment Date</th><td>{formatDay(r.paymentDate)}</td></tr>
            <tr><th>Printed</th><td>{formatDay(todayLocal())}</td></tr>
          </tbody>
        </table>
      </div>

      <CRow className="g-3 mb-3">
        <CCol xs={6}><PartyBlock heading="Received From" doc={r} /></CCol>
        <CCol xs={6}>
          <PropertyBlock doc={r}>{r.leaseId && <div>Lease #{r.leaseId}</div>}</PropertyBlock>
        </CCol>
      </CRow>

      <CTable bordered small className="doc-table mb-3">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Payment For</CTableHeaderCell>
            <CTableHeaderCell>Invoice No.</CTableHeaderCell>
            <CTableHeaderCell>Due Date</CTableHeaderCell>
            <CTableHeaderCell className="text-end">Invoice Amount</CTableHeaderCell>
            <CTableHeaderCell className="text-end">Amount Received</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <CTableRow>
            <CTableDataCell>
              <div className="fw-semibold">{invoiceTitle(r)}</div>
              {r.description && <div className="small text-body-secondary">{r.description}</div>}
              {Number(r.lateFeeCharged) > 0 && (
                <div className="small text-body-secondary">Includes late fee PKR {fmt(r.lateFeeCharged)}</div>
              )}
            </CTableDataCell>
            <CTableDataCell>{invoiceNo(r.invoiceId)}</CTableDataCell>
            <CTableDataCell>{r.dueDate ? formatDay(r.dueDate) : '—'}</CTableDataCell>
            <CTableDataCell className="text-end">{fmt(invoiceTotal)}</CTableDataCell>
            <CTableDataCell className="text-end fw-bold">{fmt(r.paymentAmount)}</CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>

      <CRow className="g-3 align-items-stretch">
        <CCol xs={7}>
          <div className="doc-box h-100">
            <div className="doc-label">Payment Details</div>
            <table className="doc-kv">
              <tbody>
                <tr><th>Payment Method</th><td>{r.paymentMethod || '—'}</td></tr>
                {Number(r.discountAmount) > 0 && <tr><th>Discount Given</th><td>PKR {fmt(r.discountAmount)}</td></tr>}
                {(r.isLateFeeWaived === true || r.isLateFeeWaived === 1) && <tr><th>Late Fee</th><td>Waived</td></tr>}
                {r.notes && <tr><th>Notes</th><td className="text-pre-line">{r.notes}</td></tr>}
                <tr>
                  <th>Invoice Balance</th>
                  <td>
                    {after > 0 ? `PKR ${fmt(after)} remaining after this payment` : after < 0 ? `Paid in full (PKR ${fmt(-after)} credit)` : 'Paid in full'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CCol>
        <CCol xs={5}>
          <div className="doc-total h-100">
            <div className="doc-label">Amount Received</div>
            <div className="doc-total-amount">PKR {fmt(r.paymentAmount)}</div>
            <div className="small fst-italic">{amountInWords(r.paymentAmount)}</div>
          </div>
        </CCol>
      </CRow>

      <DocFooter
        leftSignature={<>Received by{r.recordedBy ? `: ${r.recordedBy}` : ''}</>}
        rightSignature="Authorised Signature"
      />
    </div>
  )
}

Receipt.propTypes = { r: PropTypes.object.isRequired }

const ReceiptPrint = () => {
  const { ids } = useParams()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const list = String(ids || '').split(',').filter(Boolean)
    documentService
      .getReceipts(list)
      .then((d) => { if (alive) setRows(Array.isArray(d) ? d : []) })
      .catch((e) => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [ids])

  const title = rows.length === 1 ? `Receipt ${receiptNo(rows[0].paymentId)}` : rows.length ? `${rows.length} Receipts` : 'Receipt'
  return (
    <PrintShell title={title} loading={loading} error={error}>
      {rows.map((r) => <Receipt key={r.paymentId} r={r} />)}
    </PrintShell>
  )
}

export default ReceiptPrint
