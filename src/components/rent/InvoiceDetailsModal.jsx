import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
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

// History window for one invoice (Rent History): the invoice, its totals, every payment record and every
// recorded event. Read only.

// Same wording as Payments (PaymentRecords)
const paymentType = (p) =>
  Number(p.paymentAmount) > 0
    ? 'Payment'
    : p.isLateFeeWaived
      ? 'Late fee waived'
      : Number(p.discountAmount) > 0
        ? 'Discount'
        : 'Adjustment'

// Same badge colours as Payments (PaymentRecords)
const TYPE_COLOR = { Payment: 'success', Adjustment: 'warning', Discount: 'info', 'Late fee waived': 'secondary' }

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

const InvoiceDetailsModal = ({ invoiceId, onClose }) => {
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    if (!invoiceId) return undefined
    let alive = true
    setState({ loading: true, error: '', data: null })
    rentService
      .getInvoiceDetails(invoiceId)
      .then((data) => alive && setState({ loading: false, error: '', data }))
      .catch((err) => alive && setState({ loading: false, error: err.message, data: null }))
    return () => {
      alive = false
    }
  }, [invoiceId])

  const inv = state.data?.invoice
  const payments = state.data?.payments || []

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

  return (
    <CModal size="xl" visible={!!invoiceId} onClose={onClose} scrollable>
      <CModalHeader>
        <strong>
          Invoice #{invoiceId} History{inv ? ` — ${inv.tenantName}` : ''}
        </strong>
      </CModalHeader>
      <CModalBody>
        {state.loading && (
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
                  {fmt(inv.lateFeePerDay)} per day after the due date, up to{' '}
                  {Number(inv.lateFeeMaxMultiplier)} × the invoice amount
                </Field>
              </CCol>
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
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {payments.map((p) => (
                  <CTableRow key={p.paymentId}>
                    <CTableDataCell>{formatDate(p.paymentDate)}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={TYPE_COLOR[paymentType(p)]}>{paymentType(p)}</CBadge>
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
                    <CTableDataCell style={{ maxWidth: 220 }}>{p.notes || '—'}</CTableDataCell>
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
                  </CTableRow>
                ))}
                {!payments.length && (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center text-body-secondary py-3">
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
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

InvoiceDetailsModal.propTypes = {
  invoiceId: PropTypes.number, // null = closed
  onClose: PropTypes.func.isRequired,
}

export default InvoiceDetailsModal
