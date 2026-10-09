import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { toast } from 'react-toastify'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
  CFormLabel,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { rentService } from '../../services/rent.service'
import { fmt, formatDate } from '../../utils/rentUtils'
import { hasReceipt, invoiceNo, openInvoice, openReceipts, receiptNo } from '../../utils/documents'
import { todayLocal } from '../../utils/dates'
import {
  canReverse,
  isReversal,
  isReversed,
  paymentType,
  PAYMENT_TYPE_COLOR as TYPE_COLOR,
  REVERSE_BLOCK_TEXT,
  reversalEffects,
} from '../../utils/payments'

// History window for one invoice (Rent History): the invoice, its totals, every payment record and every
// recorded event. The only change made here is reversing a payment record entered by mistake (with a reason);
// records are never edited or deleted.

// InvoiceAudit actions
const EVENT_LABEL = {
  CANCELLED: 'Invoice cancelled',
  REINSTATED: 'Invoice reinstated',
  RENT_ADJUSTED: 'Rent amount adjusted',
  DISCOUNT_REDUCED: 'Discount reduced',
  LATE_FEE_REVERSED: 'Late fee reversed',
}
const EVENT_AMOUNT_LABEL = {
  RENT_ADJUSTED: 'New amount',
  DISCOUNT_REDUCED: 'Reduced by',
  LATE_FEE_REVERSED: 'Amount',
}

const STATUS_COLOR = {
  Paid: 'success',
  Partial: 'warning',
  Unpaid: 'danger',
  Pending: 'info',
  Overpaid: 'dark',
  Cancelled: 'secondary',
}

const dateTime = (d) =>
  d
    ? `${formatDate(d)} ${new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : '—'

const Field = ({ label, children }) => (
  <div className="mb-2">
    <div className="small text-body-secondary">{label}</div>
    <div>{children}</div>
  </div>
)
Field.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node }

const InvoiceDetailsModal = ({ invoiceId, onClose, onOpenInvoice, onChanged }) => {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const [reloadKey, setReloadKey] = useState(0)
  const [reversing, setReversing] = useState(null) // payment record in the Reverse window
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false) // blocks a double click before the button re-renders as disabled

  useEffect(() => {
    if (!invoiceId) return undefined
    let alive = true
    // Reloading the same invoice (after a reversal) keeps showing it until the new data arrives
    setState((s) => ({ loading: true, error: '', data: s.data?.invoice?.invoiceId === invoiceId ? s.data : null }))
    rentService
      .getInvoiceDetails(invoiceId)
      .then((data) => alive && setState({ loading: false, error: '', data }))
      .catch((err) => alive && setState({ loading: false, error: err.message, data: null }))
    return () => {
      alive = false
    }
  }, [invoiceId, reloadKey])

  // A different invoice opened (or closed): no Reverse window left open
  useEffect(() => {
    setReversing(null)
  }, [invoiceId])

  const openReverse = (p) => {
    setReason('')
    setReversing(p)
  }

  const confirmReverse = useCallback(async () => {
    if (!reversing || savingRef.current) return
    if (!reason.trim()) {
      toast.warn('Please enter a reason for the reversal.')
      return
    }
    savingRef.current = true
    setSaving(true)
    try {
      const res = await rentService.reversePayment(reversing.paymentId, reason.trim())
      toast.success(res?.message || 'Payment reversed.')
      setReversing(null)
      setReloadKey((k) => k + 1)
      onChanged?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [reversing, reason, onChanged])

  const inv = state.data?.invoice
  const payments = state.data?.payments || []
  const linkedCharges = state.data?.linkedCharges || []

  // Activity: invoice created, late fee charged (stored on the invoice) and the recorded events, oldest first
  const activity = inv
    ? [
        {
          key: 'created',
          at: inv.createdAt,
          label: 'Invoice created',
          amountLabel: 'Amount',
          amount: null,
          reason: inv.description || '',
          by: '',
        },
        ...(Number(inv.lateFeeCharged) > 0
          ? [
              {
                key: 'fee',
                at: inv.lateFeeChargedAt,
                label: 'Late fee charged',
                amountLabel: 'Amount',
                amount: inv.lateFeeCharged,
                reason: '',
                by: '',
              },
            ]
          : []),
        ...(state.data.events || []).map((e) => ({
          key: `e${e.eventId}`,
          at: e.createdAt,
          label: EVENT_LABEL[e.action] || e.action,
          amountLabel: EVENT_AMOUNT_LABEL[e.action] || 'Amount',
          amount: e.action === 'CANCELLED' || e.action === 'REINSTATED' ? null : e.amount,
          reason: e.reason || '',
          by: e.createdBy || '',
        })),
      ].sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0))
    : []

  const balance = Number(inv?.balance || 0)
  const cancelled = inv?.status === 'Cancelled'
  const effects = reversing && inv ? reversalEffects(reversing, inv, todayLocal()) : null

  return (
    <>
    <CModal size="xl" visible={!!invoiceId} onClose={onClose} scrollable>
      <CModalHeader>
        <strong>
          Invoice #{invoiceId} ({invoiceNo(invoiceId)}) History{inv ? ` — ${inv.tenantName}` : ''}
        </strong>
      </CModalHeader>
      <CModalBody>
        {state.loading && !inv && (
          <div className="text-center py-5">
            <CSpinner color="primary" />
          </div>
        )}
        {state.error && (
          <CAlert color="danger" className="mb-0">
            {state.error}
          </CAlert>
        )}

        {inv && (
          <>
            <CRow className="mb-2">
              <CCol md={3}>
                <Field label="Tenant">{inv.tenantName}</Field>
              </CCol>
              <CCol md={3}>
                <Field label="Unit">
                  {[
                    inv.buildingName,
                    inv.floorNumber && `Floor ${inv.floorNumber}`,
                    inv.unitNumber && `Unit ${inv.unitNumber}`,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </Field>
              </CCol>
              <CCol md={3}>
                <Field label="Type">
                  {inv.chargeType ? `${inv.chargeType} (extra charge)` : 'Monthly rent'}
                  {inv.description ? (
                    <div className="small text-body-secondary">{inv.description}</div>
                  ) : null}
                </Field>
              </CCol>
              <CCol md={3}>
                <Field label="Status">
                  <CBadge color={STATUS_COLOR[inv.status] || 'secondary'}>{inv.status}</CBadge>
                </Field>
              </CCol>
              <CCol md={3}>
                <Field label="Invoice date">{formatDate(inv.invoiceDate)}</Field>
              </CCol>
              <CCol md={3}>
                <Field label="Due date">{formatDate(inv.dueDate)}</Field>
              </CCol>
              <CCol md={6}>
                <Field label="Late fee rule">
                  {Number(inv.lateFeePerDay) === 0
                    ? 'No late fee'
                    : <>{fmt(inv.lateFeePerDay)} per day after the due date, up to{' '}{Number(inv.lateFeeMaxMultiplier)} × the invoice amount</>}
                </Field>
              </CCol>
              {inv.relatedInvoiceId ? (
                <CCol md={12}>
                  <Field label="Related invoice">
                    <CButton color="link" size="sm" className="p-0 align-baseline" onClick={() => onOpenInvoice?.(inv.relatedInvoiceId)}>
                      #{inv.relatedInvoiceId}
                    </CButton>{' '}
                    · {inv.relatedChargeType ? `${inv.relatedChargeType} (extra charge)` : 'Monthly rent'} ·{' '}
                    {formatDate(inv.relatedInvoiceDate)} · {fmt(inv.relatedAmount)} · {inv.relatedStatus}
                    <span className="small text-body-secondary"> (not changed by this charge)</span>
                  </Field>
                </CCol>
              ) : null}
              {linkedCharges.length > 0 && (
                <CCol md={12}>
                  <Field label="Extra charges for this invoice">
                    {linkedCharges.map((c) => (
                      <div key={c.invoiceId}>
                        <CButton color="link" size="sm" className="p-0 align-baseline" onClick={() => onOpenInvoice?.(c.invoiceId)}>
                          #{c.invoiceId}
                        </CButton>{' '}
                        · {c.chargeType} · {formatDate(c.invoiceDate)} · {fmt(c.totalRent)} · {c.status}
                        {c.description ? <span className="small text-body-secondary"> · {c.description}</span> : null}
                      </div>
                    ))}
                  </Field>
                </CCol>
              )}
            </CRow>

            <div className="border rounded p-3 mb-4 bg-body-tertiary">
              <CRow className="text-center g-2">
                <CCol xs={6} md={2}>
                  <div className="small text-body-secondary">Amount</div>
                  <div className="fw-semibold">{fmt(inv.totalRent)}</div>
                </CCol>
                <CCol xs={6} md={2}>
                  <div className="small text-body-secondary">Paid</div>
                  <div className="fw-semibold">{fmt(inv.paid)}</div>
                </CCol>
                <CCol xs={6} md={2}>
                  <div className="small text-body-secondary">Discounts</div>
                  <div className="fw-semibold">{fmt(inv.discount)}</div>
                </CCol>
                <CCol xs={6} md={3}>
                  <div className="small text-body-secondary">Late fee</div>
                  <div className="fw-semibold">
                    {Number(inv.lateFeeCharged) > 0
                      ? `${fmt(inv.lateFeeCharged)} charged`
                      : cancelled
                        ? 'None (cancelled)' // a cancelled invoice is never charged a late fee
                        : inv.lateFeeWaived
                          ? 'Waived'
                          : Number(inv.openLateFee) > 0
                            ? `${fmt(inv.openLateFee)} due (not charged yet)`
                            : 'None'}
                  </div>
                </CCol>
                <CCol xs={12} md={3}>
                  <div className="small text-body-secondary">Balance</div>
                  <div
                    className={`fw-semibold ${balance > 0 && !cancelled ? 'text-danger' : balance < 0 ? 'text-success' : ''}`}
                  >
                    {cancelled
                      ? 'Cancelled (not owed)'
                      : balance < 0
                        ? `${fmt(-balance)} credit (overpaid)`
                        : fmt(balance)}
                  </div>
                </CCol>
              </CRow>
            </div>

            <div className="fw-semibold mb-2">Payments, discounts and waivers</div>
            <CTable small bordered responsive className="mb-4">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Type</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Paid</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Discount</CTableHeaderCell>
                  <CTableHeaderCell>Method</CTableHeaderCell>
                  <CTableHeaderCell>Notes</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Balance after</CTableHeaderCell>
                  <CTableHeaderCell>Recorded by</CTableHeaderCell>
                  <CTableHeaderCell>Receipt</CTableHeaderCell>
                  <CTableHeaderCell />
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {payments.map((p) => (
                  <CTableRow key={p.paymentId} className={isReversed(p) ? 'text-body-secondary' : ''}>
                    <CTableDataCell>{formatDate(p.paymentDate)}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={TYPE_COLOR[paymentType(p)]}>{paymentType(p)}</CBadge>
                      {isReversed(p) && (
                        <div className="small mt-1">
                          <CBadge color="danger">Reversed</CBadge>{' '}
                          {formatDate(p.reversedAt)}
                          {p.reversedBy ? ` by ${p.reversedBy}` : ''}
                        </div>
                      )}
                      {isReversal(p) && <div className="small mt-1">of record #{p.reversalOfPaymentId}</div>}
                    </CTableDataCell>
                    <CTableDataCell
                      className={`text-end ${Number(p.paymentAmount) < 0 ? 'text-danger' : ''}`}
                    >
                      {fmt(p.paymentAmount)}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      {fmt(p.discountAmount)}
                      {Number(p.discountPercent) > 0 ? (
                        <span className="small text-body-secondary">
                          {' '}
                          ({Number(p.discountPercent)}%)
                        </span>
                      ) : null}
                    </CTableDataCell>
                    <CTableDataCell>{p.paymentMethod || '—'}</CTableDataCell>
                    <CTableDataCell style={{ maxWidth: 220 }}>
                      {isReversal(p) ? <span className="text-body-secondary">Reason: </span> : null}
                      {p.notes || '—'}
                      {isReversed(p) && p.reversalReason ? (
                        <div className="small">Reversal reason: {p.reversalReason}</div>
                      ) : null}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">{fmt(p.balanceAfter)}</CTableDataCell>
                    <CTableDataCell className="small">
                      {p.createdBy || '—'}
                      {p.updatedAt ? (
                        <div className="text-body-secondary">
                          edited {formatDate(p.updatedAt)}
                          {p.updatedBy ? ` by ${p.updatedBy}` : ''}
                        </div>
                      ) : null}
                    </CTableDataCell>
                    <CTableDataCell>
                      {hasReceipt(p) ? (
                        <CButton color="link" size="sm" className="p-0" title="Print receipt" onClick={() => openReceipts(p.paymentId)}>
                          {receiptNo(p.paymentId)}
                        </CButton>
                      ) : '—'}
                    </CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      {canReverse(p) ? (
                        <CButton color="danger" variant="outline" size="sm" onClick={() => openReverse(p)}>
                          Reverse
                        </CButton>
                      ) : !isReversal(p) && !isReversed(p) ? (
                        <span title={REVERSE_BLOCK_TEXT[p.reverseBlock] || ''} style={{ cursor: 'not-allowed' }}>
                          <CButton color="secondary" variant="outline" size="sm" disabled style={{ pointerEvents: 'none' }}>
                            Reverse
                          </CButton>
                        </span>
                      ) : null}
                    </CTableDataCell>
                  </CTableRow>
                ))}
                {!payments.length && (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center text-body-secondary py-3">
                      No payments recorded
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>

            <div className="fw-semibold mb-2">Activity</div>
            <CTable small bordered responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: 170 }}>When</CTableHeaderCell>
                  <CTableHeaderCell>Event</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>
                  <CTableHeaderCell>Reason</CTableHeaderCell>
                  <CTableHeaderCell>By</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {activity.map((a) => (
                  <CTableRow key={a.key}>
                    <CTableDataCell>{dateTime(a.at)}</CTableDataCell>
                    <CTableDataCell>{a.label}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      {a.amount != null ? (
                        <>
                          <span className="small text-body-secondary">{a.amountLabel} </span>
                          {fmt(a.amount)}
                        </>
                      ) : (
                        '—'
                      )}
                    </CTableDataCell>
                    <CTableDataCell style={{ maxWidth: 260 }}>{a.reason || '—'}</CTableDataCell>
                    <CTableDataCell>{a.by || '—'}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </>
        )}
      </CModalBody>
      <CModalFooter>
        {inv && (
          <CButton color="primary" variant="outline" onClick={() => openInvoice(invoiceId)}>
            Print Invoice
          </CButton>
        )}
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>

    {/* Reverse a payment record: the whole record (cash, discount and waiver together), reason required */}
    <CModal visible={!!reversing} onClose={() => !saving && setReversing(null)} backdrop="static" alignment="center">
      <CModalHeader closeButton={!saving}>
        <CModalTitle>Reverse record #{reversing?.paymentId}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {reversing && effects && (
          <>
            <p className="mb-2">
              {paymentType(reversing)} of {formatDate(reversing.paymentDate)} on invoice #{invoiceId}. The whole record
              is taken back; it is <strong>not deleted</strong> and stays in the history, marked Reversed.
            </p>
            <ul className="mb-3">
              {effects.cash > 0 && <li>Paid {fmt(effects.cash)} ({reversing.paymentMethod || '—'}) is taken back</li>}
              {effects.disc > 0 && <li>Discount {fmt(effects.disc)} is taken back</li>}
              {effects.waived && <li>The late fee waiver is taken back</li>}
              <li>
                Invoice balance after: <strong>{fmt(effects.balanceAfter)}</strong>
                {effects.lateFeeWarning ? ' plus any late fee' : ''}
              </li>
            </ul>
            {effects.lateFeeWarning && (
              <CAlert color="warning" className="py-2">
                This invoice is overdue (due {formatDate(inv.dueDate)}). After the reversal the late fee may be
                recalculated from the original due date, so the amount owed can increase.
              </CAlert>
            )}
            {effects.cash > 0 && (
              <div className="small text-body-secondary mb-3">
                A reversal means this payment was entered by mistake. It does not record money paid back to the tenant.
                If the payment was real but on the wrong invoice or amount, record the correct payment afterwards.
              </div>
            )}
            <CFormLabel htmlFor="reverse-reason">Reason (required)</CFormLabel>
            <CFormTextarea
              id="reverse-reason"
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Entered on the wrong invoice"
              disabled={saving}
            />
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" disabled={saving} onClick={() => setReversing(null)}>
          Keep Record
        </CButton>
        <CButton color="danger" disabled={saving || !reason.trim()} onClick={confirmReverse}>
          {saving ? <CSpinner size="sm" /> : 'Reverse Record'}
        </CButton>
      </CModalFooter>
    </CModal>
    </>
  )
}

InvoiceDetailsModal.propTypes = {
  invoiceId: PropTypes.number, // null = closed
  onClose: PropTypes.func.isRequired,
  onOpenInvoice: PropTypes.func, // opens another invoice's history (related invoice / linked charge)
  onChanged: PropTypes.func, // a record was reversed (refresh the list behind)
}

export default InvoiceDetailsModal
