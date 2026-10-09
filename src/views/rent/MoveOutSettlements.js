import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import {
  CBadge, CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormFeedback, CFormInput, CFormLabel, CFormSelect, CModal,
  CModalBody, CModalFooter, CModalHeader, CModalTitle, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { toast } from 'react-toastify'
import { settlementService } from '../../services/settlement.service'
import CurrencyInput from '../../components/common/CurrencyInput'
import { fmt } from '../../utils/rentUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay } from '../../utils/reminders'
import { DEPOSIT_METHODS } from '../../utils/deposits'
import { SETTLEMENT_STATUS_COLOR, openSettlementStatement, settlementNo, settlementStatusOf } from '../../utils/settlement'

// Move-out settlements: tenancies whose lease has ended and are waiting to be settled, and the settlements recorded.
// A settlement uses the deposit to pay what is owed; money paid back later is recorded here as a refund.
const money = (v) => (Number(v) ? fmt(v) : '—')

const RefundModal = ({ s, onClose, onSaved }) => {
  const remaining = Number(s.refundDue) - Number(s.refundPaid)
  const [form, setForm] = useState({ amount: String(remaining), date: todayLocal(), method: '', reference: '' })
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const v = Number(form.amount)
  const errors = {
    amount: !form.amount ? 'Please enter the refund amount.' : !(v > 0) ? 'The refund amount must be greater than 0.' : v > remaining ? `At most PKR ${fmt(remaining)} is still refundable.` : null,
    date: !form.date ? 'Please enter the refund date.' : form.date > todayLocal() ? "The refund date can't be in the future." : form.date < String(s.settlementDate).slice(0, 10) ? "The refund date can't be before the settlement date." : null,
    method: form.method ? null : 'Please choose how the refund was paid.',
  }
  const valid = Object.values(errors).every((e) => !e)

  const save = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const res = await settlementService.recordRefund({
        SettlementId: s.settlementId, Amount: v, RefundDate: form.date, PaymentMethod: form.method, Reference: form.reference.trim() || null,
      })
      toast.success(res.message)
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <CModal visible onClose={onClose} backdrop="static">
      <CForm onSubmit={save} noValidate>
        <CModalHeader><CModalTitle>Record Deposit Refund</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="border rounded p-2 mb-3 small bg-body-tertiary">
            <div className="fw-semibold">{s.tenantName} · {s.buildingName} – {s.unitNumber}</div>
            <div>{settlementNo(s.settlementId)} · Refund due PKR {fmt(s.refundDue)} · Paid PKR {fmt(s.refundPaid)} · Remaining <b>PKR {fmt(remaining)}</b></div>
          </div>
          <div className="small text-body-secondary mb-3">Record only money that has actually been paid back to the tenant.</div>
          <fieldset disabled={saving}>
            <CRow className="g-3">
              <CCol sm={6}>
                <CFormLabel htmlFor="rf-amount">Amount (PKR) <span className="text-danger">*</span></CFormLabel>
                <CurrencyInput id="rf-amount" value={form.amount} allowDecimal={false} invalid={touched && !!errors.amount}
                  onValueChange={(x) => setForm((f) => ({ ...f, amount: x }))} />
                <CFormFeedback invalid>{errors.amount}</CFormFeedback>
              </CCol>
              <CCol sm={6}>
                <CFormLabel htmlFor="rf-date">Refund Date <span className="text-danger">*</span></CFormLabel>
                <CFormInput id="rf-date" type="date" value={form.date} max={todayLocal()} invalid={touched && !!errors.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                <CFormFeedback invalid>{errors.date}</CFormFeedback>
              </CCol>
              <CCol sm={6}>
                <CFormLabel htmlFor="rf-method">Paid By <span className="text-danger">*</span></CFormLabel>
                <CFormSelect id="rf-method" value={form.method} invalid={touched && !!errors.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
                  <option value="">Select method...</option>
                  {DEPOSIT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </CFormSelect>
                <CFormFeedback invalid>{errors.method}</CFormFeedback>
              </CCol>
              <CCol sm={6}>
                <CFormLabel htmlFor="rf-ref">Reference</CFormLabel>
                <CFormInput id="rf-ref" value={form.reference} maxLength={100} placeholder="Cheque / transaction no."
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
              </CCol>
            </CRow>
          </fieldset>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={onClose} disabled={saving}>Cancel</CButton>
          <CButton type="submit" color="primary" disabled={saving}>{saving ? 'Saving...' : 'Record Refund'}</CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
RefundModal.propTypes = { s: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired, onSaved: PropTypes.func.isRequired }

const MoveOutSettlements = () => {
  const navigate = useNavigate()
  const [data, setData] = useState({ candidates: [], settlements: [] })
  const [loading, setLoading] = useState(true)
  const [refundFor, setRefundFor] = useState(null)

  const load = () => settlementService.getAll().then((d) => { setData(d); setLoading(false) })
  useEffect(() => { load() }, [])

  return (
    <>
      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="py-3 px-4">
          <div className="fw-semibold fs-5">Move-out Settlements</div>
          <div className="small text-body-secondary">
            Settle a tenancy after its lease has ended: what is owed, the deposit held, deductions, and the final amount owed or refundable.
          </div>
        </CCardHeader>
        <CCardBody>
          <div className="fw-semibold mb-2">Ready to Settle</div>
          <CTable hover responsive small className="align-middle mb-1">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Tenant</CTableHeaderCell>
                <CTableHeaderCell>Unit</CTableHeaderCell>
                <CTableHeaderCell>Lease</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Owed</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Credit</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Deposit Held</CTableHeaderCell>
                <CTableHeaderCell />
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {data.candidates.map((c) => (
                <CTableRow key={`${c.tenantId}-${c.unitId}`}>
                  <CTableDataCell className="fw-semibold">{c.tenantName}</CTableDataCell>
                  <CTableDataCell className="small">{c.buildingName} – {c.unitNumber}</CTableDataCell>
                  <CTableDataCell className="small">
                    #{c.leaseId} · moved out {formatDay(c.billedThrough || c.endDate)}
                    {c.terminationReason && <div className="text-body-secondary">{c.terminationReason}</div>}
                  </CTableDataCell>
                  <CTableDataCell className={`text-end ${Number(c.outstanding) > 0 ? 'text-danger fw-semibold' : ''}`}>{money(c.outstanding)}</CTableDataCell>
                  <CTableDataCell className="text-end">{money(c.credit)}</CTableDataCell>
                  <CTableDataCell className="text-end">{money(c.held)}</CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CButton size="sm" color="primary" onClick={() => navigate(`/rent/settlements/new/${c.tenantId}/${c.unitId}`)}>Settle</CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
              {!data.candidates.length && (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center text-muted py-3">
                    {loading ? 'Loading...' : 'No ended tenancies waiting for settlement. End a lease in Lease Management first.'}
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="py-3 px-4 fw-semibold">Settlements</CCardHeader>
        <CCardBody>
          <CTable hover responsive small className="align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>No.</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell>Tenant</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Owed + Deductions</CTableHeaderCell>
                <CTableHeaderCell className="text-end">From Deposit</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Paid at Settlement</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Still Owed Now</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Refund Due / Paid</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell />
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {data.settlements.map((s) => {
                const status = settlementStatusOf(s)
                return (
                  <CTableRow key={s.settlementId}>
                    <CTableDataCell className="fw-semibold text-nowrap">{settlementNo(s.settlementId)}</CTableDataCell>
                    <CTableDataCell className="small text-nowrap">{formatDay(s.settlementDate)}</CTableDataCell>
                    <CTableDataCell>
                      <div className="fw-semibold">{s.tenantName}</div>
                      <div className="small text-body-secondary">{s.buildingName} – {s.unitNumber} · Lease #{s.leaseId}</div>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">{fmt(Number(s.outstandingBefore) + Number(s.deductionsTotal))}</CTableDataCell>
                    <CTableDataCell className="text-end">{money(s.depositApplied)}</CTableDataCell>
                    <CTableDataCell className="text-end">{money(s.finalPaymentReceived)}</CTableDataCell>
                    <CTableDataCell className={`text-end ${Number(s.stillOwedNow) > 0 ? 'text-danger fw-semibold' : ''}`}>{money(s.stillOwedNow)}</CTableDataCell>
                    <CTableDataCell className="text-end">{money(s.refundDue)} / {money(s.refundPaid)}</CTableDataCell>
                    <CTableDataCell><CBadge color={SETTLEMENT_STATUS_COLOR[status]}>{status}</CBadge></CTableDataCell>
                    <CTableDataCell className="text-end">
                      <div className="d-flex gap-1 justify-content-end flex-wrap">
                        <CButton size="sm" color="primary" variant="outline" onClick={() => openSettlementStatement(s.settlementId)}>Statement</CButton>
                        {Number(s.refundDue) > Number(s.refundPaid) && (
                          <CButton size="sm" color="warning" variant="outline" onClick={() => setRefundFor(s)}>Record Refund</CButton>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
              {!data.settlements.length && (
                <CTableRow>
                  <CTableDataCell colSpan={10} className="text-center text-muted py-3">{loading ? 'Loading...' : 'No settlements recorded yet'}</CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
          <div className="small text-body-secondary">
            Still Owed Now is live: payments recorded later in Rent Collection reduce it. Deposit used at settlement is shown as
            &quot;From deposit&quot; on the invoices and is not counted as cash received.
          </div>
        </CCardBody>
      </CCard>

      {refundFor && <RefundModal s={refundFor} onClose={() => setRefundFor(null)} onSaved={() => { setRefundFor(null); load() }} />}
    </>
  )
}

export default MoveOutSettlements
