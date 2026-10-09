import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CCol, CRow } from '@coreui/react'
import PrintShell from '../../components/print/PrintShell'
import CompanyHeader from '../../components/common/CompanyHeader'
import { DocFooter, PartyBlock, PropertyBlock } from '../../components/print/DocParts'
import { depositService } from '../../services/deposit.service'
import { fmt } from '../../utils/rentUtils'
import { formatDay } from '../../utils/reminders'
import { todayLocal } from '../../utils/dates'
import { amountInWords } from '../../utils/documents'
import { depositNo } from '../../utils/deposits'

// Printable security deposit receipt (/print/deposit/12). States clearly that the money is a refundable deposit,
// not rent.
const DepositReceiptPrint = () => {
  const { id } = useParams()
  const [d, setD] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    depositService
      .getReceipt(id)
      .then((r) => { if (alive) setD(r) })
      .catch((e) => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  return (
    <PrintShell title={d ? `Deposit Receipt ${depositNo(d.depositId)}` : 'Deposit Receipt'} loading={loading} error={error}>
      {d && (
        <div className="print-sheet">
          <CompanyHeader />
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div className="doc-title">Security Deposit Receipt</div>
            <table className="doc-meta">
              <tbody>
                <tr><th>Receipt No.</th><td className="fw-bold">{depositNo(d.depositId)}</td></tr>
                <tr><th>Received Date</th><td>{formatDay(d.entryDate)}</td></tr>
                <tr><th>Printed</th><td>{formatDay(todayLocal())}</td></tr>
              </tbody>
            </table>
          </div>

          <CRow className="g-3 mb-3">
            <CCol xs={6}><PartyBlock heading="Received From" doc={d} /></CCol>
            <CCol xs={6}>
              <PropertyBlock doc={d}>
                {d.leaseId && (
                  <div>
                    Lease #{d.leaseId}
                    {d.leaseStartDate && ` · ${formatDay(d.leaseStartDate)} – ${formatDay(d.leaseEndDate)}`}
                  </div>
                )}
              </PropertyBlock>
            </CCol>
          </CRow>

          <CRow className="g-3 align-items-stretch">
            <CCol xs={7}>
              <div className="doc-box h-100">
                <div className="doc-label">Deposit Details</div>
                <table className="doc-kv">
                  <tbody>
                    <tr><th>Payment Method</th><td>{d.paymentMethod}</td></tr>
                    {d.reference && <tr><th>Reference</th><td>{d.reference}</td></tr>}
                    {d.agreedAmount != null && <tr><th>Agreed Deposit</th><td>PKR {fmt(d.agreedAmount)}</td></tr>}
                    <tr><th>Total Held</th><td>PKR {fmt(d.heldAfter)} (after this receipt)</td></tr>
                    {d.agreedAmount != null && Number(d.agreedAmount) > Number(d.heldAfter) && (
                      <tr><th>Still Due</th><td>PKR {fmt(Number(d.agreedAmount) - Number(d.heldAfter))}</td></tr>
                    )}
                    {d.notes && <tr><th>Notes</th><td className="text-pre-line">{d.notes}</td></tr>}
                  </tbody>
                </table>
              </div>
            </CCol>
            <CCol xs={5}>
              <div className="doc-total h-100">
                <div className="doc-label">Deposit Received</div>
                <div className="doc-total-amount">PKR {fmt(d.amount)}</div>
                <div className="small fst-italic">{amountInWords(d.amount)}</div>
              </div>
            </CCol>
          </CRow>

          <div className="doc-box mt-3 small">
            This is a refundable security deposit held against the tenancy above. It is not rent and is not adjusted
            against monthly rent; it will be settled at the end of the tenancy as per the lease terms.
          </div>

          <DocFooter
            leftSignature={<>Received by{d.recordedBy ? `: ${d.recordedBy}` : ''}</>}
            rightSignature="Authorised Signature"
          />
        </div>
      )}
    </PrintShell>
  )
}

export default DepositReceiptPrint
