import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CCol, CRow, CTable, CTableBody, CTableDataCell, CTableFoot, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react'
import PrintShell from '../../components/print/PrintShell'
import CompanyHeader from '../../components/common/CompanyHeader'
import { DocFooter, PartyBlock, PropertyBlock } from '../../components/print/DocParts'
import { settlementService } from '../../services/settlement.service'
import { fmt } from '../../utils/rentUtils'
import { formatDay } from '../../utils/reminders'
import { todayLocal } from '../../utils/dates'
import { amountInWords, invoiceNo, invoiceTitle, receiptNo } from '../../utils/documents'
import { settlementNo } from '../../utils/settlement'

// Printable move-out settlement statement (/print/settlement/3). Figures come from the snapshot taken at settlement;
// "still owed now" and refunds paid since are shown separately so the statement stays true later.
const money = (v) => (Number(v) ? fmt(v) : '—')

const SettlementPrint = () => {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    settlementService
      .get(id)
      .then((d) => { if (alive) setData(d) })
      .catch((e) => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  const s = data?.settlement
  const lines = data?.lines || []
  const owedLines = lines.filter((l) => l.lineType !== 'Credit')
  const credits = lines.filter((l) => l.lineType === 'Credit')
  const refunds = data?.refunds || []
  const owesAfterSettlement = s ? Number(s.tenantOwes) - Number(s.finalPaymentReceived) : 0
  const refundLeft = s ? Number(s.refundDue) - Number(s.refundPaid) : 0

  return (
    <PrintShell title={s ? `Settlement ${settlementNo(s.settlementId)}` : 'Settlement'} loading={loading} error={error}>
      {s && (
        <div className="print-sheet">
          <CompanyHeader />
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div className="doc-title">Move-out Settlement</div>
            <table className="doc-meta">
              <tbody>
                <tr><th>Settlement No.</th><td className="fw-bold">{settlementNo(s.settlementId)}</td></tr>
                <tr><th>Settlement Date</th><td>{formatDay(s.settlementDate)}</td></tr>
                <tr><th>Move-out Date</th><td>{formatDay(s.moveOutDate || s.leaseEndDate)}</td></tr>
                <tr><th>Printed</th><td>{formatDay(todayLocal())}</td></tr>
              </tbody>
            </table>
          </div>

          <CRow className="g-3 mb-3">
            <CCol xs={6}><PartyBlock heading="Tenant" doc={s} /></CCol>
            <CCol xs={6}>
              <PropertyBlock doc={s}>
                <div>Lease #{s.leaseId}{s.leaseStartDate && ` · ${formatDay(s.leaseStartDate)} – ${formatDay(s.leaseEndDate)}`}</div>
              </PropertyBlock>
            </CCol>
          </CRow>

          <div className="doc-label mb-1">Amounts Owed at Settlement</div>
          <CTable bordered small className="doc-table mb-3">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Invoice</CTableHeaderCell>
                <CTableHeaderCell>Description</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Owed</CTableHeaderCell>
                <CTableHeaderCell className="text-end">From Deposit</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Paid at Settlement</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Remaining</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {owedLines.map((l) => (
                <CTableRow key={l.invoiceId}>
                  <CTableDataCell className="text-nowrap">{invoiceNo(l.invoiceId)}</CTableDataCell>
                  <CTableDataCell>
                    {l.lineType === 'Deduction' ? <b>Deduction – {l.chargeType}</b> : invoiceTitle(l)}
                    {(l.deductionReason || l.description) && <div className="small text-body-secondary">{l.deductionReason || l.description}</div>}
                    {l.cashPaymentId && <div className="small text-body-secondary">Receipt {receiptNo(l.cashPaymentId)}</div>}
                  </CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(l.balanceBefore)}</CTableDataCell>
                  <CTableDataCell className="text-end">{money(l.depositApplied)}</CTableDataCell>
                  <CTableDataCell className="text-end">{money(l.cashReceived)}</CTableDataCell>
                  <CTableDataCell className="text-end fw-semibold">{fmt(Number(l.balanceBefore) - Number(l.depositApplied) - Number(l.cashReceived))}</CTableDataCell>
                </CTableRow>
              ))}
              {!owedLines.length && (
                <CTableRow><CTableDataCell colSpan={6} className="text-center text-body-secondary">Nothing was owed</CTableDataCell></CTableRow>
              )}
            </CTableBody>
            {owedLines.length > 0 && (
              <CTableFoot>
                <CTableRow className="fw-bold">
                  <CTableDataCell colSpan={2} className="text-end">Total</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(Number(s.outstandingBefore) + Number(s.deductionsTotal))}</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(s.depositApplied)}</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(s.finalPaymentReceived)}</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(owesAfterSettlement)}</CTableDataCell>
                </CTableRow>
              </CTableFoot>
            )}
          </CTable>

          <CRow className="g-3 align-items-stretch">
            <CCol xs={6}>
              <div className="doc-box h-100">
                <div className="doc-label">Security Deposit</div>
                <table className="doc-kv">
                  <tbody>
                    <tr><th>Deposit held</th><td>PKR {fmt(s.depositHeldBefore)}</td></tr>
                    {Number(s.creditBefore) > 0 && (
                      <tr><th>Tenant credit</th><td>PKR {fmt(s.creditBefore)} ({credits.map((c) => invoiceNo(c.invoiceId)).join(', ')})</td></tr>
                    )}
                    {Number(s.deductionsTotal) > 0 && <tr><th>Deductions</th><td>PKR {fmt(s.deductionsTotal)}</td></tr>}
                    <tr><th>Used for amounts owed</th><td>PKR {fmt(s.depositApplied)}</td></tr>
                    <tr><th>Refundable</th><td>PKR {fmt(s.refundDue)}</td></tr>
                    {refunds.map((r) => (
                      <tr key={r.depositId}>
                        <th>Refunded {formatDay(r.entryDate)}</th>
                        <td>PKR {fmt(r.amount)} · {r.paymentMethod}{r.reference ? ` (${r.reference})` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CCol>
            <CCol xs={6}>
              <table className="doc-kv doc-summary w-100">
                <tbody>
                  <tr><th>Total owed (incl. deductions)</th><td>{fmt(Number(s.outstandingBefore) + Number(s.deductionsTotal))}</td></tr>
                  <tr><th>Less: deposit / credit used</th><td>{fmt(s.depositApplied)}</td></tr>
                  <tr><th>Less: paid at settlement</th><td>{fmt(s.finalPaymentReceived)}</td></tr>
                  <tr className="doc-summary-total">
                    <th>{owesAfterSettlement > 0 ? 'Balance owed by tenant' : refundLeft > 0 ? 'Refund still due to tenant' : 'Balance'}</th>
                    <td>PKR {fmt(owesAfterSettlement > 0 ? owesAfterSettlement : refundLeft)}</td>
                  </tr>
                </tbody>
              </table>
              {(owesAfterSettlement > 0 || refundLeft > 0) && (
                <div className="small fst-italic text-end mt-1">{amountInWords(owesAfterSettlement > 0 ? owesAfterSettlement : refundLeft)}</div>
              )}
              {owesAfterSettlement > 0 && Number(s.stillOwedNow) !== owesAfterSettlement && (
                <div className="small text-end mt-1">Still owed as of today: PKR {fmt(s.stillOwedNow)}</div>
              )}
            </CCol>
          </CRow>

          {s.notes && <div className="doc-box mt-3 small"><span className="doc-label">Notes</span><div className="text-pre-line">{s.notes}</div></div>}
          <div className="small text-body-secondary mt-3">
            Amounts paid from the security deposit are shown on the invoices as &quot;Paid from security deposit&quot;; no new money was received for them.
            {s.settledBy && ` Settled by ${s.settledBy}.`}
          </div>
          <DocFooter leftSignature="Tenant Signature" rightSignature="Authorised Signature" />
        </div>
      )}
    </PrintShell>
  )
}

export default SettlementPrint
