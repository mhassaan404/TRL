import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CCol, CRow, CTable, CTableBody, CTableDataCell, CTableFoot, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react'
import PrintShell from '../../components/print/PrintShell'
import CompanyHeader from '../../components/common/CompanyHeader'
import { DocFooter, PartyBlock, PropertyBlock } from '../../components/print/DocParts'
import { documentService } from '../../services/document.service'
import { fmt } from '../../utils/rentUtils'
import { formatDay } from '../../utils/reminders'
import { todayLocal } from '../../utils/dates'
import { amountInWords, invoiceNo, invoiceTitle, receiptNo } from '../../utils/documents'

// Printable rent / extra-charge invoice (/print/invoice/45): charges, everything recorded against it and the
// balance due today. A cancelled invoice prints with a CANCELLED mark.
const CANCELLED = 6
const isTrue = (v) => v === true || v === 1

const paymentLabel = (p) => {
  if (p.paymentMethod === 'Security Deposit') return 'Paid from security deposit (move-out settlement)'
  if (p.paymentMethod === 'Credit to Deposit') return 'Credit moved to security deposit (move-out settlement)'
  if (Number(p.paymentAmount) < 0) return 'Adjustment (reversal)'
  if (Number(p.paymentAmount) > 0) return `Payment – ${p.paymentMethod || '—'} (${receiptNo(p.paymentId)})`
  if (Number(p.discountAmount) > 0) return 'Discount'
  return isTrue(p.isLateFeeWaived) ? 'Late fee waived' : 'Record'
}

const InvoicePrint = () => {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    documentService
      .getInvoice(id)
      .then((d) => { if (alive) setData(d) })
      .catch((e) => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  const inv = data?.invoice
  const payments = data?.payments || []
  const cancelled = inv && Number(inv.statusId) === CANCELLED
  const total = inv ? Number(inv.totalRent) + Number(inv.lateFeeCharged) : 0
  const balance = inv ? Number(inv.balance) : 0
  const paid = inv ? Number(inv.paid) : 0
  const discount = inv ? Number(inv.discount) : 0
  const title = inv ? `Invoice ${invoiceNo(inv.invoiceId)}` : 'Invoice'

  return (
    <PrintShell title={title} loading={loading} error={error}>
      {inv && (
        <div className="print-sheet">
          {cancelled && <div className="print-watermark">CANCELLED</div>}
          <CompanyHeader />
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <div className="doc-title">{inv.chargeType ? 'Invoice' : 'Rent Invoice'}</div>
              <div className="text-body-secondary">{invoiceTitle(inv)}</div>
            </div>
            <table className="doc-meta">
              <tbody>
                <tr><th>Invoice No.</th><td className="fw-bold">{invoiceNo(inv.invoiceId)}</td></tr>
                <tr><th>Invoice Date</th><td>{formatDay(inv.invoiceDate)}</td></tr>
                <tr><th>Due Date</th><td className="fw-semibold">{inv.dueDate ? formatDay(inv.dueDate) : '—'}</td></tr>
                <tr><th>Status</th><td>{inv.status}</td></tr>
              </tbody>
            </table>
          </div>

          <CRow className="g-3 mb-3">
            <CCol xs={6}><PartyBlock heading="Bill To" doc={inv} /></CCol>
            <CCol xs={6}>
              <PropertyBlock doc={inv}>
                {inv.leaseId && (
                  <div>
                    Lease #{inv.leaseId}
                    {inv.leaseStartDate && ` · ${formatDay(inv.leaseStartDate)} – ${formatDay(inv.leaseEndDate)}`}
                  </div>
                )}
                {inv.relatedInvoiceId && (
                  <div>
                    Relates to {invoiceNo(inv.relatedInvoiceId)}
                    {` (${inv.relatedChargeType || invoiceTitle({ invoiceMonth: inv.relatedInvoiceMonth })})`}
                  </div>
                )}
              </PropertyBlock>
            </CCol>
          </CRow>

          <CTable bordered small className="doc-table mb-3">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: 40 }}>#</CTableHeaderCell>
                <CTableHeaderCell>Description</CTableHeaderCell>
                <CTableHeaderCell className="text-end" style={{ width: 160 }}>Amount (PKR)</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow>
                <CTableDataCell>1</CTableDataCell>
                <CTableDataCell>
                  <div className="fw-semibold">{invoiceTitle(inv)}</div>
                  {inv.description && <div className="small text-body-secondary">{inv.description}</div>}
                </CTableDataCell>
                <CTableDataCell className="text-end">{fmt(inv.totalRent)}</CTableDataCell>
              </CTableRow>
              {Number(inv.lateFeeCharged) > 0 && (
                <CTableRow>
                  <CTableDataCell>2</CTableDataCell>
                  <CTableDataCell>
                    Late fee{inv.lateFeeChargedAt ? ` (charged ${formatDay(inv.lateFeeChargedAt)})` : ''}
                  </CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(inv.lateFeeCharged)}</CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
            <CTableFoot>
              <CTableRow className="fw-bold">
                <CTableDataCell colSpan={2} className="text-end">Invoice Total</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(total)}</CTableDataCell>
              </CTableRow>
            </CTableFoot>
          </CTable>

          {payments.length > 0 && (
            <>
              <div className="doc-label mb-1">Payments & Credits</div>
              <CTable bordered small className="doc-table mb-3">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 110 }}>Date</CTableHeaderCell>
                    <CTableHeaderCell>Details</CTableHeaderCell>
                    <CTableHeaderCell className="text-end" style={{ width: 120 }}>Paid</CTableHeaderCell>
                    <CTableHeaderCell className="text-end" style={{ width: 120 }}>Discount</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {payments.map((p) => (
                    <CTableRow key={p.paymentId}>
                      <CTableDataCell>{formatDay(p.paymentDate)}</CTableDataCell>
                      <CTableDataCell>
                        {paymentLabel(p)}
                        {isTrue(p.isLateFeeWaived) && Number(p.paymentAmount) !== 0 && <span> · late fee waived</span>}
                      </CTableDataCell>
                      <CTableDataCell className="text-end">{Number(p.paymentAmount) ? fmt(p.paymentAmount) : '—'}</CTableDataCell>
                      <CTableDataCell className="text-end">{Number(p.discountAmount) ? fmt(p.discountAmount) : '—'}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </>
          )}

          <CRow className="g-3 align-items-stretch">
            <CCol xs={7}>
              <div className="doc-box h-100 small">
                <div className="doc-label">Notes</div>
                {cancelled ? (
                  <div className="fw-semibold">This invoice has been cancelled and is not payable.</div>
                ) : (
                  <>
                    {inv.dueDate && balance > 0 && <div>Please pay by {formatDay(inv.dueDate)}.</div>}
                    {Number(inv.lateFeePerDay) > 0 && (
                      <div>
                        Late fee: PKR {fmt(inv.lateFeePerDay)} per day after the due date, up to{' '}
                        {Number(inv.lateFeeMaxMultiplier)} × the invoice amount.
                      </div>
                    )}
                    {isTrue(inv.lateFeeWaived) && <div>The late fee on this invoice has been waived.</div>}
                    {Number(inv.openLateFee) > 0 && (
                      <div className="fw-semibold">
                        Late fee of PKR {fmt(inv.openLateFee)} has built up as of {formatDay(inv.asOfDate)} (not yet charged,
                        not included above).
                      </div>
                    )}
                  </>
                )}
              </div>
            </CCol>
            <CCol xs={5}>
              <table className="doc-kv doc-summary w-100">
                <tbody>
                  <tr><th>Invoice Total</th><td>{fmt(total)}</td></tr>
                  <tr><th>Less: Paid</th><td>{fmt(paid)}</td></tr>
                  {discount > 0 && <tr><th>Less: Discount</th><td>{fmt(discount)}</td></tr>}
                  <tr className="doc-summary-total">
                    <th>{balance < 0 ? 'Credit' : 'Balance Due'}</th>
                    <td>PKR {fmt(Math.abs(cancelled ? 0 : balance))}</td>
                  </tr>
                </tbody>
              </table>
              {!cancelled && balance > 0 && <div className="small fst-italic text-end mt-1">{amountInWords(balance)}</div>}
            </CCol>
          </CRow>

          <div className="small text-body-secondary mt-3">Printed {formatDay(todayLocal())}</div>
          <DocFooter leftSignature="Prepared by" rightSignature="Authorised Signature" />
        </div>
      )}
    </PrintShell>
  )
}

export default InvoicePrint
