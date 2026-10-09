import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert, CBadge, CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormCheck, CFormFeedback, CFormInput, CFormLabel,
  CFormSelect, CFormText, CFormTextarea, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CRow, CSpinner, CTable,
  CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { toast } from 'react-toastify'
import { settlementService } from '../../services/settlement.service'
import CurrencyInput from '../../components/common/CurrencyInput'
import { fmt } from '../../utils/rentUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay } from '../../utils/reminders'
import { DEPOSIT_METHODS } from '../../utils/deposits'
import { invoiceTitle, openReceipts } from '../../utils/documents'
import { DEDUCTION_TYPES, computeSettlement, openSettlementStatement, settlementNo } from '../../utils/settlement'

// Settle one ended tenancy: review what is owed and the deposit held, add justified deductions, and record only the
// money that really changes hands now. The API re-checks every figure and refuses if anything changed meanwhile.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthText = (d) => { const [y, m] = String(d).slice(0, 7).split('-'); return `${MONTHS[Number(m) - 1]} ${y}` }
const day = (d) => String(d || '').slice(0, 10)
const emptyMoney = { amount: '', method: '', reference: '' }

const moneyErrors = (m, max, what) => {
  if (!m.amount) return {}
  const v = Number(m.amount)
  return {
    amount: !(v > 0) ? `The ${what} must be greater than 0.` : v > max ? `The ${what} can be at most PKR ${fmt(max)}.` : null,
    method: m.method ? null : `Please choose the payment method for the ${what}.`,
  }
}

const SettlementForm = () => {
  const { tenantId, unitId } = useParams()
  const navigate = useNavigate()
  const [pv, setPv] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [deductions, setDeductions] = useState([])
  const [finalPay, setFinalPay] = useState(emptyMoney)
  const [refund, setRefund] = useState(emptyMoney)
  const [date, setDate] = useState(todayLocal())
  const [notes, setNotes] = useState('')
  const [ack, setAck] = useState(false)
  const [touched, setTouched] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  const load = () => {
    setPv(null)
    settlementService.getPreview(tenantId, unitId).then(setPv).catch((e) => setLoadError(e.message))
  }
  useEffect(() => { load() }, [tenantId, unitId]) // eslint-disable-line react-hooks/exhaustive-deps -- reload when the tenancy changes

  const h = pv?.header
  const owedInvoices = useMemo(() => (pv?.invoices || []).filter((i) => Number(i.balance) > 0), [pv])
  const creditInvoices = useMemo(() => (pv?.invoices || []).filter((i) => Number(i.balance) < 0), [pv])
  const calc = computeSettlement({
    invoices: pv?.invoices || [], held: h?.held, deductions, finalAmount: Number(finalPay.amount) || 0, refundAmount: Number(refund.amount) || 0,
  })
  const openLateFee = owedInvoices.reduce((s, i) => s + Number(i.openLateFee || 0), 0)
  const moveOut = day(h?.moveOutDate || h?.leaseEndDate)

  const dedErrors = deductions.map((d) => ({
    amount: !(Number(d.amount) > 0) ? 'Enter an amount.' : null,
    reason: !d.reason.trim() ? 'Enter the reason.' : d.reason.length > 255 ? 'At most 255 characters.' : null,
  }))
  const finalErr = moneyErrors(finalPay, calc.tenantOwes, 'payment received')
  const refundErr = moneyErrors(refund, calc.refundDue, 'refund paid')
  const dateErr = !date ? 'Please enter the settlement date.' : date > todayLocal() ? "The settlement date can't be in the future."
    : moveOut && date < moveOut ? `The settlement date can't be before the move-out date (${formatDay(moveOut)}).` : null
  const unbilledErr = pv?.unbilled?.length && !ack ? 'Please confirm the rent months without an invoice.' : null
  const valid = !dateErr && !unbilledErr && dedErrors.every((e) => !e.amount && !e.reason)
    && ![finalErr.amount, finalErr.method, refundErr.amount, refundErr.method].some(Boolean) && notes.length <= 500

  const blocked = !!(h && (h.hasCurrentLease || h.existingSettlementId))

  const review = (e) => {
    e.preventDefault()
    setTouched(true)
    if (valid) setConfirming(true)
  }

  const finalize = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const money = (m) => (m.amount ? { Amount: Number(m.amount), PaymentMethod: m.method, Reference: m.reference.trim() || null } : null)
      const res = await settlementService.finalize({
        TenantId: h.tenantId, UnitId: h.unitId, LeaseId: h.leaseId,
        ExpectedOutstanding: calc.outstanding, ExpectedCredit: calc.credit, ExpectedHeld: Number(h.held),
        SettlementDate: date, AcknowledgeUnbilled: ack, Notes: notes.trim() || null,
        Deductions: deductions.map((d) => ({ ChargeType: d.type, Amount: Number(d.amount), Reason: d.reason.trim() })),
        FinalPayment: money(finalPay), Refund: money(refund),
      })
      const receipts = res.receiptIds || []
      toast.success(
        <div>
          <div>{res.message}</div>
          <div className="d-flex gap-1 flex-wrap mt-1">
            <CButton size="sm" color="success" variant="outline" onClick={() => openSettlementStatement(res.id)}>Print {settlementNo(res.id)}</CButton>
            {receipts.length > 0 && (
              <CButton size="sm" color="success" variant="outline" onClick={() => openReceipts(receipts)}>Payment Receipt</CButton>
            )}
          </div>
        </div>,
        { autoClose: 15000, closeOnClick: false },
      )
      navigate('/rent/settlements')
    } catch (err) {
      toast.error(err.message)
      setConfirming(false)
      if (/changed|already been settled/i.test(err.message)) load()
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const setDed = (i, k, v) => setDeductions((ds) => ds.map((d, n) => (n === i ? { ...d, [k]: v } : d)))

  if (loadError) return <CAlert color="danger">{loadError}</CAlert>
  if (!pv) return <div className="text-center py-5"><CSpinner color="primary" /></div>

  return (
    <CForm onSubmit={review} noValidate>
      <CCard className="border-0 shadow-sm mb-3">
        <CCardHeader className="py-3 px-4 d-flex flex-wrap align-items-center gap-2">
          <div className="me-auto">
            <div className="fw-semibold fs-5">Move-out Settlement</div>
            <div className="small text-body-secondary">
              {h.tenantName} · {h.buildingName} – Unit {h.unitNumber} · Lease #{h.leaseId}
              {h.leaseStartDate && ` (${formatDay(h.leaseStartDate)} – ${formatDay(h.leaseEndDate)})`}
              {moveOut && <> · Moved out <b>{formatDay(moveOut)}</b></>}
            </div>
          </div>
          <CButton color="secondary" variant="outline" size="sm" onClick={() => navigate('/rent/settlements')}>Back</CButton>
        </CCardHeader>
        <CCardBody>
          {h.hasCurrentLease && (
            <CAlert color="warning">This tenancy still has a current or upcoming lease. End the lease in Lease Management first.</CAlert>
          )}
          {h.existingSettlementId && (
            <CAlert color="info" className="d-flex justify-content-between align-items-center">
              <span>This tenancy has already been settled ({settlementNo(h.existingSettlementId)}).</span>
              <CButton size="sm" color="info" variant="outline" onClick={() => openSettlementStatement(h.existingSettlementId)}>View Statement</CButton>
            </CAlert>
          )}

          <div className="fw-semibold mb-2">Owed by the Tenant</div>
          <CTable small bordered responsive className="align-middle mb-2">
            <CTableHead>
              <CTableRow>
                {['Invoice #', 'For', 'Due Date', 'Invoice Total', 'Paid / Discount', 'Owed'].map((c) => (
                  <CTableHeaderCell key={c} className={['Invoice Total', 'Paid / Discount', 'Owed'].includes(c) ? 'text-end' : ''}>{c}</CTableHeaderCell>
                ))}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {owedInvoices.map((i) => (
                <CTableRow key={i.invoiceId}>
                  <CTableDataCell>#{i.invoiceId}</CTableDataCell>
                  <CTableDataCell>{invoiceTitle(i)}{i.description && <div className="small text-body-secondary">{i.description}</div>}</CTableDataCell>
                  <CTableDataCell className="small">{formatDay(i.dueDate)}</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(Number(i.totalRent) + Number(i.lateFeeCharged))}</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(Number(i.paid) + Number(i.discount))}</CTableDataCell>
                  <CTableDataCell className="text-end fw-semibold">{fmt(i.balance)}</CTableDataCell>
                </CTableRow>
              ))}
              {!owedInvoices.length && (
                <CTableRow><CTableDataCell colSpan={6} className="text-center text-body-secondary py-2">Nothing owed on invoices</CTableDataCell></CTableRow>
              )}
            </CTableBody>
          </CTable>
          {openLateFee > 0 && (
            <div className="small text-warning mb-2">
              PKR {fmt(openLateFee)} of late fee is building up on these invoices but is not charged, so it is not included. Charge it
              in Rent Collection first if it should be part of the settlement.
            </div>
          )}
          {creditInvoices.length > 0 && (
            <div className="small mb-2">
              Tenant credit (overpaid): {creditInvoices.map((i) => `#${i.invoiceId} PKR ${fmt(-i.balance)}`).join(', ')}. It is moved into the deposit and used below.
            </div>
          )}
          {pv.unbilled.length > 0 && (
            <CAlert color="warning" className="small">
              <div className="fw-semibold">Rent months without an invoice</div>
              <div>
                The lease covers these months but no rent invoice exists:{' '}
                {pv.unbilled.map((u) => `${monthText(u.monthStart)} (PKR ${fmt(u.amount)})`).join(', ')}. They are not part of this
                settlement. Bill them first if they are owed.
              </div>
              <CFormCheck className="mt-2" id="ack" label="I have checked these months and want to settle without them" checked={ack}
                invalid={touched && !!unbilledErr} onChange={(e) => setAck(e.target.checked)} />
            </CAlert>
          )}

          <div className="d-flex align-items-center mt-3 mb-2">
            <div className="fw-semibold me-auto">Deductions from the Deposit</div>
            <CButton size="sm" color="secondary" variant="outline" disabled={deductions.length >= 20 || blocked}
              onClick={() => setDeductions((d) => [...d, { type: 'Damage', amount: '', reason: '' }])}>+ Add Deduction</CButton>
          </div>
          {deductions.length === 0 && <div className="small text-body-secondary mb-2">No deductions. Add one for damage, cleaning, etc. A reason is required.</div>}
          {deductions.map((d, i) => (
            <CRow key={i} className="g-2 mb-2 align-items-start">
              <CCol sm={3}>
                <CFormSelect size="sm" value={d.type} aria-label="Deduction type" onChange={(e) => setDed(i, 'type', e.target.value)}>
                  {DEDUCTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </CFormSelect>
              </CCol>
              <CCol sm={3}>
                <CurrencyInput size="sm" placeholder="Amount" aria-label="Deduction amount" value={d.amount} allowDecimal={false}
                  invalid={touched && !!dedErrors[i].amount} onValueChange={(v) => setDed(i, 'amount', v)} />
                <CFormFeedback invalid>{dedErrors[i].amount}</CFormFeedback>
              </CCol>
              <CCol sm={5}>
                <CFormInput size="sm" placeholder="Reason (required)" aria-label="Deduction reason" value={d.reason} maxLength={255}
                  invalid={touched && !!dedErrors[i].reason} onChange={(e) => setDed(i, 'reason', e.target.value)} />
                <CFormFeedback invalid>{dedErrors[i].reason}</CFormFeedback>
              </CCol>
              <CCol sm={1}>
                <CButton size="sm" color="danger" variant="ghost" title="Remove" onClick={() => setDeductions((ds) => ds.filter((_, n) => n !== i))}>✕</CButton>
              </CCol>
            </CRow>
          ))}
          {deductions.length > 0 && <CFormText>Each deduction is billed to the tenant as an extra-charge invoice and paid from the deposit.</CFormText>}
        </CCardBody>
      </CCard>

      <CRow className="g-3 mb-4">
        <CCol lg={5}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="fw-semibold">Settlement</CCardHeader>
            <CCardBody>
              <table className="table table-sm mb-0">
                <tbody>
                  <tr><td>Owed on invoices</td><td className="text-end">{fmt(calc.outstanding)}</td></tr>
                  <tr><td>Deductions</td><td className="text-end">{fmt(calc.deductionsTotal)}</td></tr>
                  <tr className="fw-semibold"><td>Total owed</td><td className="text-end">{fmt(calc.owed)}</td></tr>
                  <tr><td>Deposit held</td><td className="text-end">{fmt(calc.held)}</td></tr>
                  {calc.credit > 0 && <tr><td>Tenant credit</td><td className="text-end">{fmt(calc.credit)}</td></tr>}
                  <tr><td>Used from deposit{calc.credit > 0 ? ' / credit' : ''}</td><td className="text-end">{fmt(calc.applied)}</td></tr>
                  <tr className="fw-bold fs-6">
                    <td>{calc.tenantOwes > 0 ? 'Tenant owes' : 'Refundable to tenant'}</td>
                    <td className={`text-end ${calc.tenantOwes > 0 ? 'text-danger' : 'text-success'}`}>PKR {fmt(calc.tenantOwes > 0 ? calc.tenantOwes : calc.refundDue)}</td>
                  </tr>
                </tbody>
              </table>
              {calc.tenantOwes === 0 && calc.refundDue === 0 && <div className="small text-body-secondary mt-2">Nothing owed and nothing to refund.</div>}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={7}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="fw-semibold">Money Changing Hands Now <span className="small fw-normal text-body-secondary">(optional)</span></CCardHeader>
            <CCardBody>
              <fieldset disabled={!!blocked}>
                {calc.tenantOwes > 0 && (
                  <>
                    <div className="small mb-2">
                      Enter only money <b>actually received now</b>. If the tenant will pay later, leave it empty: the unpaid invoices stay open in Rent Collection.
                    </div>
                    <CRow className="g-2 mb-3">
                      <CCol sm={4}>
                        <CFormLabel className="small mb-0" htmlFor="fp-amount">Received (max {fmt(calc.tenantOwes)})</CFormLabel>
                        <CurrencyInput id="fp-amount" size="sm" value={finalPay.amount} allowDecimal={false} invalid={touched && !!finalErr.amount}
                          onValueChange={(v) => setFinalPay((m) => ({ ...m, amount: v }))} />
                        <CFormFeedback invalid>{finalErr.amount}</CFormFeedback>
                      </CCol>
                      <CCol sm={4}>
                        <CFormLabel className="small mb-0" htmlFor="fp-method">Method</CFormLabel>
                        <CFormSelect id="fp-method" size="sm" value={finalPay.method} invalid={touched && !!finalErr.method}
                          onChange={(e) => setFinalPay((m) => ({ ...m, method: e.target.value }))}>
                          <option value="">Select...</option>
                          {DEPOSIT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </CFormSelect>
                        <CFormFeedback invalid>{finalErr.method}</CFormFeedback>
                      </CCol>
                      <CCol sm={4}>
                        <CFormLabel className="small mb-0" htmlFor="fp-ref">Reference</CFormLabel>
                        <CFormInput id="fp-ref" size="sm" value={finalPay.reference} maxLength={100}
                          onChange={(e) => setFinalPay((m) => ({ ...m, reference: e.target.value }))} />
                      </CCol>
                    </CRow>
                  </>
                )}
                {calc.refundDue > 0 && (
                  <>
                    <div className="small mb-2">
                      Enter only money <b>actually paid back now</b>. If the refund will be paid later, leave it empty and record it from the settlements list.
                    </div>
                    <CRow className="g-2 mb-3">
                      <CCol sm={4}>
                        <CFormLabel className="small mb-0" htmlFor="rf-amount">Refunded (max {fmt(calc.refundDue)})</CFormLabel>
                        <CurrencyInput id="rf-amount" size="sm" value={refund.amount} allowDecimal={false} invalid={touched && !!refundErr.amount}
                          onValueChange={(v) => setRefund((m) => ({ ...m, amount: v }))} />
                        <CFormFeedback invalid>{refundErr.amount}</CFormFeedback>
                      </CCol>
                      <CCol sm={4}>
                        <CFormLabel className="small mb-0" htmlFor="rf-method">Method</CFormLabel>
                        <CFormSelect id="rf-method" size="sm" value={refund.method} invalid={touched && !!refundErr.method}
                          onChange={(e) => setRefund((m) => ({ ...m, method: e.target.value }))}>
                          <option value="">Select...</option>
                          {DEPOSIT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </CFormSelect>
                        <CFormFeedback invalid>{refundErr.method}</CFormFeedback>
                      </CCol>
                      <CCol sm={4}>
                        <CFormLabel className="small mb-0" htmlFor="rf-ref">Reference</CFormLabel>
                        <CFormInput id="rf-ref" size="sm" value={refund.reference} maxLength={100}
                          onChange={(e) => setRefund((m) => ({ ...m, reference: e.target.value }))} />
                      </CCol>
                    </CRow>
                  </>
                )}
                <CRow className="g-2">
                  <CCol sm={4}>
                    <CFormLabel className="small mb-0" htmlFor="st-date">Settlement Date</CFormLabel>
                    <CFormInput id="st-date" type="date" size="sm" value={date} min={moveOut || undefined} max={todayLocal()}
                      invalid={touched && !!dateErr} onChange={(e) => setDate(e.target.value)} />
                    <CFormFeedback invalid>{dateErr}</CFormFeedback>
                  </CCol>
                  <CCol sm={8}>
                    <CFormLabel className="small mb-0" htmlFor="st-notes">Notes</CFormLabel>
                    <CFormTextarea id="st-notes" rows={1} value={notes} maxLength={500} placeholder="e.g. Keys returned, meter reading"
                      onChange={(e) => setNotes(e.target.value)} />
                  </CCol>
                </CRow>
              </fieldset>
              <div className="d-flex justify-content-end mt-3">
                <CButton type="submit" color="primary" disabled={!!blocked || saving}>Review &amp; Finalize</CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal visible={confirming} onClose={() => !saving && setConfirming(false)} backdrop="static">
        <CModalHeader><CModalTitle>Finalize Settlement?</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="mb-2">{h.tenantName} · {h.buildingName} – Unit {h.unitNumber}</div>
          <ul className="small mb-2">
            <li>PKR {fmt(calc.applied)} of the deposit{calc.credit > 0 ? ' and credit' : ''} pays what is owed{deductions.length ? ` (incl. ${deductions.length} deduction${deductions.length > 1 ? 's' : ''})` : ''}.</li>
            {calc.tenantOwes > 0 && <li>Tenant owes PKR {fmt(calc.tenantOwes)}{Number(finalPay.amount) ? `; PKR ${fmt(finalPay.amount)} received now, PKR ${fmt(calc.owesAfterPayment)} stays open` : ' (stays open in Rent Collection)'}.</li>}
            {calc.refundDue > 0 && <li>Refundable PKR {fmt(calc.refundDue)}{Number(refund.amount) ? `; PKR ${fmt(refund.amount)} paid now, PKR ${fmt(calc.refundStillDue)} still to refund` : ' (refund to be recorded when paid)'}.</li>}
          </ul>
          <CBadge color="warning" className="text-wrap">This can&apos;t be undone. Invoices, payments and lease history are kept.</CBadge>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" disabled={saving} onClick={() => setConfirming(false)}>Back</CButton>
          <CButton color="primary" disabled={saving} onClick={finalize}>{saving ? 'Saving...' : 'Finalize Settlement'}</CButton>
        </CModalFooter>
      </CModal>
    </CForm>
  )
}

export default SettlementForm
