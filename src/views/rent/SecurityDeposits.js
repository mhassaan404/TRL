import React, { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert, CBadge, CButton, CButtonGroup, CCard, CCardBody, CCardHeader, CCol, CForm, CFormFeedback, CFormInput, CFormLabel,
  CFormSelect, CFormText, CFormTextarea, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CRow, CSpinner, CTable,
  CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { toast } from 'react-toastify'
import { depositService } from '../../services/deposit.service'
import CurrencyInput from '../../components/common/CurrencyInput'
import { PageSizeSelect, TablePagination, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'
import { fmt } from '../../utils/rentUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay } from '../../utils/reminders'
import { DEPOSIT_METHODS, DEPOSIT_STATUS_COLOR, depositNo, depositStatusOf, depositTotals, outstandingOf } from '../../utils/deposits'

// Security deposits: money held for each tenancy (tenant + unit). It is not rent or income: no invoices are created
// and rent balances, reports and late fees are not affected. Entries are never edited or deleted; a wrong entry is
// fixed with a Correction (with a reason). The held balance carries over when a lease is renewed.
const STATUS_FILTERS = ['All', 'Not received', 'Partial', 'Held in full', 'Held', 'Not set', 'Lease ended']
const MAX_AMOUNT = 1000000000
// Ledger entry types: Received / Correction here; Credit Transfer, Applied and Refund come from a move-out settlement
const ENTRY_COLOR = { Received: 'success', Correction: 'warning', 'Credit Transfer': 'info', Applied: 'primary', Refund: 'dark' }
const openDepositReceipt = (id) => window.open(`#/print/deposit/${id}`, '_blank', 'noopener')

const TenancyHeader = ({ t }) => (
  <div className="border rounded p-2 mb-3 small bg-body-tertiary">
    <div className="fw-semibold">{t.tenantName}</div>
    <div>{t.buildingName} – Unit {t.unitNumber} · Lease #{t.leaseId}
      {t.leaseStartDate && ` (${formatDay(t.leaseStartDate)} – ${formatDay(t.leaseEndDate)})`}</div>
    <div className="mt-1">
      Agreed: <b>{t.agreedAmount == null ? 'not set' : `PKR ${fmt(t.agreedAmount)}`}</b> · Held: <b>PKR {fmt(t.held)}</b>
      {outstandingOf(t) != null && <> · Still due: <b>PKR {fmt(outstandingOf(t))}</b></>}
    </div>
  </div>
)
TenancyHeader.propTypes = { t: PropTypes.object.isRequired }

const amountError = (text, what, max) => {
  const v = Number(text)
  if (text === '' || text == null) return `Please enter the ${what}.`
  if (!(v > 0)) return `The ${what} must be greater than 0.`
  if (v > MAX_AMOUNT) return `The ${what} can be at most ${fmt(MAX_AMOUNT)}.`
  if (max != null && v > max) return `The ${what} can be at most PKR ${fmt(max)}.`
  return null
}
const dateError = (d, what) => {
  if (!d) return `Please enter the ${what}.`
  if (d < '2000-01-01') return `The ${what} must be in 2000 or later.`
  if (d > todayLocal()) return `The ${what} can't be in the future.`
  return null
}

// ---- Record a deposit received ----
const RecordModal = ({ t, onClose, onSaved }) => {
  const due = outstandingOf(t)
  const [form, setForm] = useState({ amount: due > 0 ? String(due) : '', entryDate: todayLocal(), paymentMethod: '', reference: '', notes: '' })
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const errors = {
    amount: amountError(form.amount, 'deposit amount', due),
    entryDate: dateError(form.entryDate, 'received date'),
    paymentMethod: form.paymentMethod ? null : 'Please choose the payment method.',
    reference: form.reference.length > 100 ? 'Reference can be at most 100 characters.' : null,
    notes: form.notes.length > 500 ? 'Notes can be at most 500 characters.' : null,
  }
  const valid = Object.values(errors).every((e) => !e)

  const save = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const res = await depositService.record({
        leaseId: t.leaseId, amount: Number(form.amount), entryDate: form.entryDate, paymentMethod: form.paymentMethod,
        reference: form.reference.trim() || null, notes: form.notes.trim() || null,
      })
      toast.success(
        <div>
          <div>{res.message}</div>
          <CButton size="sm" color="success" variant="outline" className="mt-1" onClick={() => openDepositReceipt(res.id)}>
            Print Receipt {depositNo(res.id)}
          </CButton>
        </div>,
        { autoClose: 12000, closeOnClick: false },
      )
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
        <CModalHeader><CModalTitle>Record Security Deposit</CModalTitle></CModalHeader>
        <CModalBody>
          <TenancyHeader t={t} />
          {due === 0 && <CAlert color="success" className="small">The agreed deposit has been received in full.</CAlert>}
          <fieldset disabled={saving}>
            <CRow className="g-3">
              <CCol sm={6}>
                <CFormLabel htmlFor="dep-amount">Amount (PKR) <span className="text-danger">*</span></CFormLabel>
                <CurrencyInput id="dep-amount" value={form.amount} allowDecimal={false} onValueChange={set('amount')}
                  invalid={touched && !!errors.amount} />
                <CFormFeedback invalid>{errors.amount}</CFormFeedback>
                {due > 0 && <CFormText>Partial amounts are allowed. Still due: PKR {fmt(due)}</CFormText>}
              </CCol>
              <CCol sm={6}>
                <CFormLabel htmlFor="dep-date">Received Date <span className="text-danger">*</span></CFormLabel>
                <CFormInput id="dep-date" type="date" value={form.entryDate} max={todayLocal()}
                  invalid={touched && !!errors.entryDate} onChange={(e) => set('entryDate')(e.target.value)} />
                <CFormFeedback invalid>{errors.entryDate}</CFormFeedback>
              </CCol>
              <CCol sm={6}>
                <CFormLabel htmlFor="dep-method">Payment Method <span className="text-danger">*</span></CFormLabel>
                <CFormSelect id="dep-method" value={form.paymentMethod} invalid={touched && !!errors.paymentMethod}
                  onChange={(e) => set('paymentMethod')(e.target.value)}>
                  <option value="">Select method...</option>
                  {DEPOSIT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </CFormSelect>
                <CFormFeedback invalid>{errors.paymentMethod}</CFormFeedback>
              </CCol>
              <CCol sm={6}>
                <CFormLabel htmlFor="dep-ref">Reference</CFormLabel>
                <CFormInput id="dep-ref" value={form.reference} maxLength={100} placeholder="Cheque / transaction no."
                  invalid={touched && !!errors.reference} onChange={(e) => set('reference')(e.target.value)} />
                <CFormFeedback invalid>{errors.reference}</CFormFeedback>
              </CCol>
              <CCol xs={12}>
                <CFormLabel htmlFor="dep-notes">Notes</CFormLabel>
                <CFormTextarea id="dep-notes" rows={2} value={form.notes} maxLength={500}
                  invalid={touched && !!errors.notes} onChange={(e) => set('notes')(e.target.value)} />
                <CFormFeedback invalid>{errors.notes}</CFormFeedback>
              </CCol>
            </CRow>
          </fieldset>
          <div className="small text-body-secondary mt-3">
            A security deposit is held for the tenant and is not rent: no invoice is created and rent balances are not changed.
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={onClose} disabled={saving}>Cancel</CButton>
          <CButton type="submit" color="primary" disabled={saving || due === 0}>{saving ? 'Saving...' : 'Record Deposit'}</CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
RecordModal.propTypes = { t: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired, onSaved: PropTypes.func.isRequired }

// ---- Agreed deposit ----
const AgreedModal = ({ t, onClose, onSaved }) => {
  const [amount, setAmount] = useState(t.agreedAmount == null ? '' : String(Number(t.agreedAmount)))
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const held = Number(t.held) || 0
  const error = amount === '' ? null : amountError(amount, 'agreed deposit') || (Number(amount) < held ? `The agreed deposit can't be less than the deposit already held (PKR ${fmt(held)}).` : null)

  const save = async (agreedAmount) => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const res = await depositService.setAgreed({ tenantId: t.tenantId, unitId: t.unitId, agreedAmount })
      toast.success(res.message)
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (amount === '' || error) return
    save(Number(amount))
  }

  return (
    <CModal visible onClose={onClose} backdrop="static">
      <CForm onSubmit={submit} noValidate>
        <CModalHeader><CModalTitle>Agreed Security Deposit</CModalTitle></CModalHeader>
        <CModalBody>
          <TenancyHeader t={t} />
          <CFormLabel htmlFor="dep-agreed">Agreed Deposit (PKR)</CFormLabel>
          <CurrencyInput id="dep-agreed" value={amount} allowDecimal={false} onValueChange={setAmount}
            invalid={touched && (!!error || amount === '')} disabled={saving} />
          <CFormFeedback invalid>{error || 'Please enter the agreed deposit.'}</CFormFeedback>
          <CFormText>The deposit the tenant agreed to pay for this tenancy. It shows what is still due and stops over-recording.</CFormText>
        </CModalBody>
        <CModalFooter>
          {t.agreedAmount != null && (
            <CButton color="danger" variant="outline" className="me-auto" disabled={saving} onClick={() => save(null)}>Clear</CButton>
          )}
          <CButton color="secondary" variant="outline" onClick={onClose} disabled={saving}>Cancel</CButton>
          <CButton type="submit" color="primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
AgreedModal.propTypes = { t: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired, onSaved: PropTypes.func.isRequired }

// ---- History, with corrections ----
const HistoryModal = ({ t, onClose, onSaved }) => {
  const [rows, setRows] = useState(null)
  const [correcting, setCorrecting] = useState(false)
  const [form, setForm] = useState({ amount: '', entryDate: todayLocal(), reason: '' })
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const held = Number(t.held) || 0

  const load = () => depositService.getHistory(t.tenantId, t.unitId).then(setRows)
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps -- load once when the popup opens

  const errors = {
    amount: amountError(form.amount, 'correction amount', held),
    entryDate: dateError(form.entryDate, 'correction date'),
    reason: !form.reason.trim() ? 'Please enter the reason for the correction.' : form.reason.length > 500 ? 'Reason can be at most 500 characters.' : null,
  }
  const valid = Object.values(errors).every((e) => !e)

  const saveCorrection = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const res = await depositService.correct({ tenantId: t.tenantId, unitId: t.unitId, amount: Number(form.amount), entryDate: form.entryDate, reason: form.reason.trim() })
      toast.success(res.message)
      setCorrecting(false)
      load()
      setForm({ amount: '', entryDate: todayLocal(), reason: '' })
      setTouched(false)
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <CModal visible size="xl" onClose={onClose} scrollable>
      <CModalHeader><CModalTitle>Security Deposit History</CModalTitle></CModalHeader>
      <CModalBody>
        <TenancyHeader t={t} />
        {rows == null ? (
          <div className="text-center py-4"><CSpinner color="primary" /></div>
        ) : (
          <CTable small bordered responsive className="align-middle">
            <CTableHead>
              <CTableRow>
                {['Date', 'Type', 'Amount', 'Method', 'Reference', 'Notes / Reason', 'Held After', 'Recorded By', 'Receipt'].map((h) => (
                  <CTableHeaderCell key={h} className={['Amount', 'Held After'].includes(h) ? 'text-end' : ''}>{h}</CTableHeaderCell>
                ))}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {rows.map((r) => (
                <CTableRow key={r.depositId}>
                  <CTableDataCell className="text-nowrap">{formatDay(r.entryDate)}</CTableDataCell>
                  <CTableDataCell><CBadge color={ENTRY_COLOR[r.entryType] || 'secondary'}>{r.entryType}</CBadge></CTableDataCell>
                  <CTableDataCell className={`text-end fw-semibold ${Number(r.amount) < 0 ? 'text-danger' : ''}`}>{fmt(r.amount)}</CTableDataCell>
                  <CTableDataCell>{r.paymentMethod || '—'}</CTableDataCell>
                  <CTableDataCell>{r.reference || '—'}</CTableDataCell>
                  <CTableDataCell className="small text-pre-line" style={{ maxWidth: 260 }}>{r.notes || '—'}</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(r.heldAfter)}</CTableDataCell>
                  <CTableDataCell className="small">{r.recordedBy || '—'}<div className="text-body-secondary">Lease #{r.leaseId}</div></CTableDataCell>
                  <CTableDataCell>
                    {r.entryType === 'Received' ? (
                      <CButton color="link" size="sm" className="p-0" onClick={() => openDepositReceipt(r.depositId)}>{depositNo(r.depositId)}</CButton>
                    ) : '—'}
                  </CTableDataCell>
                </CTableRow>
              ))}
              {!rows.length && (
                <CTableRow><CTableDataCell colSpan={9} className="text-center text-body-secondary py-3">No deposit recorded yet</CTableDataCell></CTableRow>
              )}
            </CTableBody>
          </CTable>
        )}

        {correcting && (
          <CForm onSubmit={saveCorrection} noValidate className="border rounded p-3 mt-2">
            <div className="fw-semibold mb-2">Record a Correction</div>
            <div className="small text-body-secondary mb-2">
              Use this only to fix a wrongly recorded deposit. It reduces the amount held; the original entry stays in the history.
            </div>
            <fieldset disabled={saving}>
              <CRow className="g-3">
                <CCol sm={4}>
                  <CFormLabel htmlFor="cor-amount">Amount to Reduce (PKR) <span className="text-danger">*</span></CFormLabel>
                  <CurrencyInput id="cor-amount" value={form.amount} allowDecimal={false} invalid={touched && !!errors.amount}
                    onValueChange={(v) => setForm((f) => ({ ...f, amount: v }))} />
                  <CFormFeedback invalid>{errors.amount}</CFormFeedback>
                  <CFormText>At most PKR {fmt(held)} (held now)</CFormText>
                </CCol>
                <CCol sm={3}>
                  <CFormLabel htmlFor="cor-date">Date <span className="text-danger">*</span></CFormLabel>
                  <CFormInput id="cor-date" type="date" value={form.entryDate} max={todayLocal()} invalid={touched && !!errors.entryDate}
                    onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))} />
                  <CFormFeedback invalid>{errors.entryDate}</CFormFeedback>
                </CCol>
                <CCol sm={5}>
                  <CFormLabel htmlFor="cor-reason">Reason <span className="text-danger">*</span></CFormLabel>
                  <CFormInput id="cor-reason" value={form.reason} maxLength={500} placeholder="e.g. Entered twice by mistake"
                    invalid={touched && !!errors.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
                  <CFormFeedback invalid>{errors.reason}</CFormFeedback>
                </CCol>
              </CRow>
              <div className="d-flex gap-2 justify-content-end mt-3">
                <CButton color="secondary" variant="outline" size="sm" onClick={() => { setCorrecting(false); setTouched(false) }}>Cancel</CButton>
                <CButton type="submit" color="warning" size="sm">{saving ? 'Saving...' : 'Save Correction'}</CButton>
              </div>
            </fieldset>
          </CForm>
        )}
      </CModalBody>
      <CModalFooter>
        {!correcting && (
          <span className="me-auto" title={held > 0 ? '' : 'Nothing is held, so there is nothing to correct.'}>
            <CButton color="warning" variant="outline" disabled={held <= 0} onClick={() => setCorrecting(true)}>Record Correction</CButton>
          </span>
        )}
        <CButton color="secondary" onClick={onClose}>Close</CButton>
      </CModalFooter>
    </CModal>
  )
}
HistoryModal.propTypes = { t: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired, onSaved: PropTypes.func.isRequired }

const SecurityDeposits = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [building, setBuilding] = useState('')
  const [status, setStatus] = useState('All')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [modal, setModal] = useState(null) // { type: 'record' | 'agreed' | 'history', key }

  const load = () => depositService.getAll().then((d) => { setRows(d); setLoading(false) })
  useEffect(() => { load() }, [])

  const keyOf = (t) => `${t.tenantId}-${t.unitId}`
  const withStatus = useMemo(() => rows.map((r) => ({ ...r, status: depositStatusOf(r) })), [rows])
  const current = modal ? withStatus.find((r) => keyOf(r) === modal.key) : null
  const buildings = useMemo(() => [...new Set(rows.map((r) => r.buildingName).filter(Boolean))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return withStatus.filter((r) =>
      (!building || r.buildingName === building) &&
      (status === 'All' || r.status === status) &&
      (!q || [r.tenantName, r.unitNumber, r.buildingName, String(r.leaseId)].some((v) => String(v || '').toLowerCase().includes(q))))
  }, [withStatus, search, building, status])

  const counts = useMemo(() => {
    const base = withStatus.filter((r) => !building || r.buildingName === building)
    return Object.fromEntries(STATUS_FILTERS.map((s) => [s, s === 'All' ? base.length : base.filter((r) => r.status === s).length]))
  }, [withStatus, building])
  const totals = useMemo(() => depositTotals(withStatus.filter((r) => !building || r.buildingName === building)), [withStatus, building])
  const endedHolding = counts['Lease ended'] || 0

  useEffect(() => { setPageIndex(0) }, [search, building, status, pageSize])
  const paged = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const afterSave = () => { setModal(null); load() }
  const afterCorrection = () => load() // keep the history open; it reloads its own rows

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="py-3 px-4">
        <div className="fw-semibold fs-5">Security Deposits</div>
        <div className="small text-body-secondary">
          Deposits held for each tenancy. A deposit is not rent or income: it creates no invoice and doesn&apos;t change rent balances.
        </div>
      </CCardHeader>
      <CCardBody>
        <CRow className="g-2 mb-3">
          {[
            ['Total Held', `PKR ${fmt(totals.held)}`, `${totals.tenanciesHolding} tenanc${totals.tenanciesHolding === 1 ? 'y' : 'ies'}`],
            ['Still to Receive', `PKR ${fmt(totals.outstanding)}`, 'agreed but not received (current leases)'],
            ['Not Received', counts['Not received'] || 0, 'agreed, nothing received yet'],
            ['Ended Leases Holding', endedHolding, 'deposit still held, lease over'],
          ].map(([k, v, s]) => (
            <CCol key={k} xs={6} lg={3}>
              <div className="h-100 rounded border p-2">
                <div className="small fw-semibold text-body-secondary">{k}</div>
                <div className="fw-bold">{loading ? '…' : v}</div>
                <div className="small text-body-secondary">{s}</div>
              </div>
            </CCol>
          ))}
        </CRow>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <CFormInput type="search" placeholder="Search tenant, unit or lease #..." style={{ maxWidth: 260 }}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <CFormSelect style={{ maxWidth: 200 }} value={building} onChange={(e) => setBuilding(e.target.value)}>
            <option value="">All Buildings</option>
            {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
          </CFormSelect>
          <CButtonGroup className="ms-auto flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <CButton key={s} size="sm" color="primary" variant={status === s ? undefined : 'outline'} onClick={() => setStatus(s)}>
                {s} ({counts[s] || 0})
              </CButton>
            ))}
          </CButtonGroup>
        </div>
        <div className="mb-2"><PageSizeSelect pageSize={pageSize} onChange={setPageSize} /></div>

        <CTable hover responsive small className="align-middle">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Tenant</CTableHeaderCell>
              <CTableHeaderCell>Unit</CTableHeaderCell>
              <CTableHeaderCell>Lease</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Agreed</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Held</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Still Due</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell>Last Received</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paged.map((r) => {
              const due = outstandingOf(r)
              const canRecord = r.hasCurrentLease && !r.tenantDeleted && due !== 0
              return (
                <CTableRow key={keyOf(r)}>
                  <CTableDataCell>
                    <div className="fw-semibold">{r.tenantName}</div>
                    {r.contact && <div className="small text-body-secondary">{r.contact}</div>}
                  </CTableDataCell>
                  <CTableDataCell className="small">{r.buildingName} – {r.unitNumber}</CTableDataCell>
                  <CTableDataCell className="small">
                    #{r.leaseId} {r.leaseUpcoming && <CBadge color="info">Upcoming</CBadge>}
                    {r.leaseStartDate && <div className="text-body-secondary">{formatDay(r.leaseStartDate)} – {formatDay(r.leaseEndDate)}</div>}
                  </CTableDataCell>
                  <CTableDataCell className="text-end">{r.agreedAmount == null ? <span className="text-body-secondary">—</span> : fmt(r.agreedAmount)}</CTableDataCell>
                  <CTableDataCell className="text-end fw-semibold">{fmt(r.held)}</CTableDataCell>
                  <CTableDataCell className={`text-end ${due > 0 ? 'text-danger' : ''}`}>{due == null ? '—' : fmt(due)}</CTableDataCell>
                  <CTableDataCell><CBadge color={DEPOSIT_STATUS_COLOR[r.status]}>{r.status}</CBadge></CTableDataCell>
                  <CTableDataCell className="small">{r.lastReceivedDate ? formatDay(r.lastReceivedDate) : '—'}</CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex gap-1 flex-wrap">
                      <span title={canRecord ? '' : !r.hasCurrentLease ? 'The lease has ended.' : r.tenantDeleted ? 'The tenant has been deleted.' : 'The agreed deposit has been received in full.'}>
                        <CButton size="sm" color="success" variant="outline" disabled={!canRecord}
                          onClick={() => setModal({ type: 'record', key: keyOf(r) })}>Record Deposit</CButton>
                      </span>
                      <CButton size="sm" color="info" variant="outline" onClick={() => setModal({ type: 'history', key: keyOf(r) })}>History</CButton>
                      {r.hasCurrentLease && (
                        <CButton size="sm" color="secondary" variant="outline" onClick={() => setModal({ type: 'agreed', key: keyOf(r) })}>
                          {r.agreedAmount == null ? 'Set Agreed' : 'Edit Agreed'}
                        </CButton>
                      )}
                    </div>
                  </CTableDataCell>
                </CTableRow>
              )
            })}
            {!paged.length && (
              <CTableRow>
                <CTableDataCell colSpan={9} className="text-center text-muted py-4">{loading ? 'Loading...' : 'No tenancies match'}</CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
        <TablePagination pageIndex={pageIndex} pageSize={pageSize} total={filtered.length} onPageChange={setPageIndex} />
        <div className="small text-body-secondary mt-2">
          The held amount belongs to the tenancy (tenant + unit) and carries over when a lease is renewed. Ended leases stay
          listed while a deposit is still held.
        </div>
      </CCardBody>

      {current && modal.type === 'record' && <RecordModal t={current} onClose={() => setModal(null)} onSaved={afterSave} />}
      {current && modal.type === 'agreed' && <AgreedModal t={current} onClose={() => setModal(null)} onSaved={afterSave} />}
      {current && modal.type === 'history' && <HistoryModal t={current} onClose={() => setModal(null)} onSaved={afterCorrection} />}
    </CCard>
  )
}

export default SecurityDeposits
