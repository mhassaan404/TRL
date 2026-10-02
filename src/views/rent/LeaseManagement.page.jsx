import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CButton, CModal, CModalHeader, CModalBody, CModalFooter,
  CFormInput, CFormLabel, CFormTextarea, CFormFeedback, CInputGroup, CInputGroupText, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell
} from '@coreui/react'
import { toast } from 'react-toastify'
import { leaseService, rentService } from '../../services/rent.service'
import UnitPicker from '../../components/rent/UnitPicker'
import CurrencyInput from '../../components/common/CurrencyInput'
import { PageSizeSelect, TablePagination, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'
import { fmt, formatDate } from '../../utils/rentUtils'
import { todayLocal } from '../../utils/dates'

const emptyForm = { tenantId: '', unitId: '', rentAmount: '', startDate: todayLocal(), tenureMonths: 12 }
const FILTERS = ['All', 'Active', 'Upcoming', 'Expired', 'Ended']

const day = (d) => String(d || '').slice(0, 10)
// Renewed and still handed over to its next term (the API checks that term hasn't been ended)
const isRenewed = (l) => !l.isActive && !!l.renewedIntoNext

// Status shown in the list, from the lease dates (display only; billing already works from the dates):
//  - Upcoming: the term hasn't started yet (a renewal that starts later, or a lease created with a future start)
//  - Active:   running today. A renewed lease stays Active until its next term starts, because it is still
//              the term in force and being billed (it is marked inactive at renewal so only one lease per
//              unit is "active" in the database)
//  - Expired:  past its end date and not renewed or ended (holdover, still billed month to month)
//  - Ended:    ended by the user, a renewed term whose time is over, or a renewed term whose tenancy was ended
const statusOf = (l) => {
  const today = todayLocal()
  if (l.isActive) {
    if (day(l.startDate) > today) return 'Upcoming'
    return l.isExpired ? 'Expired' : 'Active'
  }
  if (isRenewed(l) && day(l.billedThrough) >= today) return day(l.startDate) > today ? 'Upcoming' : 'Active'
  return 'Ended'
}

const STATUS_BADGE = { Active: 'bg-success', Upcoming: 'bg-info', Expired: 'bg-warning', Ended: 'bg-secondary' }
// The term has begun (start date is today or earlier); only then can it be renewed
const hasStarted = (l) => String(l.startDate || '').slice(0, 10) <= todayLocal()

const LeaseManagement = () => {
  const [leases, setLeases] = useState([])
  const [tenants, setTenants] = useState([])
  const [modal, setModal] = useState({ visible: false })
  const [form, setForm] = useState(emptyForm)
  const [renewState, setRenewState] = useState(null)
  const [endState, setEndState] = useState(null)
  const [cancelState, setCancelState] = useState(null)
  const [cancelLeaseState, setCancelLeaseState] = useState(null)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('Active')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const load = () => leaseService.getAll().then(setLeases)
  useEffect(() => { load(); rentService.getActiveTenants().then(setTenants) }, [])

  const filtered = useMemo(
    () => (filter === 'All' ? leases : leases.filter((l) => statusOf(l) === filter)),
    [leases, filter],
  )

  useEffect(() => { setPageIndex(0) }, [filter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  // Stay on a real page when the list shrinks (e.g. the last lease on the last page was ended)
  useEffect(() => { if (pageIndex > pageCount - 1) setPageIndex(pageCount - 1) }, [pageIndex, pageCount])
  const paged = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const counts = useMemo(() => {
    const c = { All: leases.length, Active: 0, Upcoming: 0, Expired: 0, Ended: 0 }
    leases.forEach((l) => { c[statusOf(l)]++ })
    return c
  }, [leases])

  const handleCreate = async () => {
    if (creating) return
    setCreating(true)
    try {
      await leaseService.create({
        TenantId: Number(form.tenantId),
        UnitId: Number(form.unitId),
        RentAmount: Number(form.rentAmount),
        StartDate: form.startDate,
        TenureMonths: Number(form.tenureMonths),
      })
      toast.success('Lease created')
      setModal({ visible: false })
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleRenew = async () => {
    if (renewState.saving) return
    setRenewState((p) => ({ ...p, saving: true }))
    try {
      const res = await leaseService.renew({
        LeaseId: renewState.leaseId,
        NewRentAmount: renewState.rentAmount ? Number(renewState.rentAmount) : null,
        TenureMonths: Number(renewState.tenureMonths),
      })
      toast.success(res?.message || 'Lease renewed')
      setRenewState(null)
      load()
    } catch (err) {
      toast.error(err.message)
      setRenewState((p) => p && { ...p, saving: false })
    }
  }

  // The current lease that an upcoming renewal replaces (shown in the Cancel Renewal / End windows)
  const previousOf = (renewal) =>
    leases.find((p) => p.tenantId === renewal.tenantId && p.unitId === renewal.unitId && p.renewedIntoNext
      && day(p.nextStartDate) === day(renewal.startDate))

  const handleCancelRenewal = async () => {
    setCancelState((p) => ({ ...p, saving: true }))
    try {
      const res = await leaseService.cancelRenewal(cancelState.lease.leaseId)
      toast.success(res?.message || 'Renewal cancelled')
      setCancelState(null)
      load()
    } catch (err) {
      toast.error(err.message)
      setCancelState((p) => p && { ...p, saving: false })
    }
  }

  const handleCancelLease = async () => {
    if (cancelLeaseState.saving) return
    setCancelLeaseState((p) => ({ ...p, saving: true }))
    try {
      const res = await leaseService.cancelLease(cancelLeaseState.lease.leaseId)
      toast.success(res?.message || 'Lease cancelled')
      setCancelLeaseState(null)
      load()
    } catch (err) {
      toast.error(err.message)
      setCancelLeaseState((p) => p && { ...p, saving: false })
    }
  }

  // End Lease form: the window stays open until the lease is actually ended (missing reason, bad date or an
  // API error keep it open with the message shown)
  const openTerminate = (lease) =>
    setEndState({ lease, reason: '', moveOut: todayLocal(), submitted: false, saving: false })

  // A lease that has started can't be ended before its start date (same rule as the API)
  const moveOutBeforeStart = (s) => hasStarted(s.lease) && s.moveOut < day(s.lease.startDate)

  const endErrors = endState?.submitted
    ? {
        reason: endState.reason.trim() ? '' : 'Please enter a reason.',
        moveOut: !endState.moveOut
          ? 'Please choose the move-out date.'
          : endState.moveOut > todayLocal()
            ? "The move-out date can't be in the future."
            : moveOutBeforeStart(endState)
              ? `The move-out date can't be before the lease start date (${formatDate(endState.lease.startDate)}).`
              : '',
      }
    : {}

  const handleTerminate = async () => {
    const reason = endState.reason.trim()
    const moveOut = endState.moveOut
    setEndState((p) => ({ ...p, submitted: true }))
    if (!reason || !moveOut || moveOut > todayLocal() || moveOutBeforeStart(endState)) return

    setEndState((p) => ({ ...p, saving: true }))
    try {
      // Rent is billed through the move-out date (prorated) and stops after it
      const res = await leaseService.terminate({ LeaseId: endState.lease.leaseId, Reason: reason, MoveOutDate: moveOut })
      toast.success(res?.message || 'Lease ended')
      setEndState(null)
      load()
    } catch (err) {
      toast.error(err.message)
      setEndState((p) => p && { ...p, saving: false })
    }
  }

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-3 px-4">
        <div className="fw-semibold fs-5">Lease Management</div>
        <CButton color="primary" onClick={() => setModal({ visible: true })}>+ New Lease</CButton>
      </CCardHeader>
      <CCardBody>
        <div className="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
          <PageSizeSelect pageSize={pageSize} onChange={(size) => { setPageSize(size); setPageIndex(0) }} />
          <div className="d-flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <CButton
              key={f}
              size="sm"
              color={filter === f ? 'primary' : 'secondary'}
              variant={filter === f ? undefined : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f} ({counts[f]})
            </CButton>
          ))}
          </div>
        </div>

        <CTable hover responsive small>
          <CTableHead><CTableRow>
            {['Tenant', 'Building', 'Floor', 'Unit', 'Rent', 'Start', 'End', 'Tenure', 'Status', 'Actions'].map((h) => (
              <CTableHeaderCell key={h}>{h}</CTableHeaderCell>
            ))}
          </CTableRow></CTableHead>
          <CTableBody>
            {paged.map((l) => (
              <CTableRow key={l.leaseId}>
                <CTableDataCell>{l.tenantName}</CTableDataCell>
                <CTableDataCell>{l.buildingName}</CTableDataCell>
                <CTableDataCell>{l.floorNumber}</CTableDataCell>
                <CTableDataCell>{l.unitNumber}</CTableDataCell>
                <CTableDataCell>{fmt(l.rentAmount)}</CTableDataCell>
                <CTableDataCell>{formatDate(l.startDate)}</CTableDataCell>
                <CTableDataCell>{formatDate(l.endDate)}</CTableDataCell>
                <CTableDataCell>{l.tenureMonths} mo</CTableDataCell>
                <CTableDataCell>
                  <span className={'badge ' + STATUS_BADGE[statusOf(l)]}>{statusOf(l)}</span>
                  {isRenewed(l) && statusOf(l) !== 'Ended' && l.nextStartDate && (
                    <div className="small text-body-secondary mt-1">Renewed – next term from {formatDate(l.nextStartDate)}</div>
                  )}
                  {l.isActive && statusOf(l) === 'Upcoming' && (
                    <div className="small text-body-secondary mt-1">Starts {formatDate(l.startDate)}</div>
                  )}
                </CTableDataCell>
                <CTableDataCell>
                  {l.isActive && (
                    <div className="d-flex gap-1">
                      {/* Same rule as the API: only a term that has started can be renewed, so an early renewal
                          can't be renewed again before its new term begins (no Renew on upcoming leases) */}
                      {hasStarted(l) && (
                        <CButton size="sm" color="info" variant="outline"
                          onClick={() => setRenewState({ leaseId: l.leaseId, rentAmount: '', tenureMonths: l.tenureMonths, saving: false })}>
                          Renew
                        </CButton>
                      )}
                      {/* Only for a lease made by mistake; a renewal is refused by the API (use End) */}
                      {statusOf(l) === 'Active' && !previousOf(l) && (
                        <CButton size="sm" color="warning" variant="outline" onClick={() => setCancelLeaseState({ lease: l, saving: false })}>
                          Cancel Lease
                        </CButton>
                      )}
                      {l.isPendingRenewal && (
                        <CButton size="sm" color="warning" variant="outline" onClick={() => setCancelState({ lease: l, saving: false })}>
                          Cancel Renewal
                        </CButton>
                      )}
                      <CButton size="sm" color="danger" variant="outline" onClick={() => openTerminate(l)}>
                        End
                      </CButton>
                    </div>
                  )}
                </CTableDataCell>
              </CTableRow>
            ))}
            {!paged.length && (
              <CTableRow><CTableDataCell colSpan={10} className="text-center text-muted py-4">No leases</CTableDataCell></CTableRow>
            )}
          </CTableBody>
        </CTable>

        <TablePagination pageIndex={pageIndex} pageSize={pageSize} total={filtered.length} onPageChange={setPageIndex} />
      </CCardBody>

      <CModal visible={modal.visible} onClose={() => setModal({ visible: false })} size="lg" backdrop="static">
        <CModalHeader><strong>New Lease</strong></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>Tenant</CFormLabel>
            <select className="form-select" value={form.tenantId} onChange={(e) => setForm((p) => ({ ...p, tenantId: e.target.value }))}>
              <option value="">Select tenant...</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <UnitPicker value={form.unitId} onChange={({ unitId, rent }) => setForm((p) => ({ ...p, unitId, rentAmount: rent || p.rentAmount }))} />
          </div>
          <div className="mb-3">
            <CFormLabel>Rent Amount</CFormLabel>
            <CInputGroup>
              <CInputGroupText>PKR</CInputGroupText>
              <CurrencyInput value={form.rentAmount} placeholder="0" onValueChange={(v) => setForm((p) => ({ ...p, rentAmount: v }))} />
            </CInputGroup>
          </div>
          <div className="d-flex gap-2">
            <div className="flex-grow-1">
              <CFormLabel>Start Date</CFormLabel>
              <CFormInput type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div style={{ width: 160 }}>
              <CFormLabel>Tenure</CFormLabel>
              <select className="form-select" value={form.tenureMonths} onChange={(e) => setForm((p) => ({ ...p, tenureMonths: e.target.value }))}>
                <option value={1}>1 month</option>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>1 year</option>
                <option value={24}>2 years</option>
              </select>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal({ visible: false })}>Cancel</CButton>
          <CButton color="primary" disabled={!form.tenantId || !form.unitId || !form.rentAmount || creating} onClick={handleCreate}>
            {creating ? 'Creating...' : 'Create Lease'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={!!renewState} onClose={() => setRenewState(null)} backdrop="static">
        <CModalHeader><strong>Renew Lease</strong></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>New Rent (leave blank to keep current)</CFormLabel>
            <CInputGroup>
              <CInputGroupText>PKR</CInputGroupText>
              <CurrencyInput value={renewState?.rentAmount || ''} placeholder="Current rent"
                onValueChange={(v) => setRenewState((p) => ({ ...p, rentAmount: v }))} />
            </CInputGroup>
          </div>
          <div>
            <CFormLabel>New Tenure</CFormLabel>
            <select className="form-select" value={renewState?.tenureMonths || 12}
              onChange={(e) => setRenewState((p) => ({ ...p, tenureMonths: e.target.value }))}>
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>1 year</option>
              <option value={24}>2 years</option>
            </select>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setRenewState(null)}>Cancel</CButton>
          <CButton color="primary" disabled={!!renewState?.saving} onClick={handleRenew}>
            {renewState?.saving ? 'Renewing...' : 'Renew'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={!!cancelState} onClose={() => setCancelState(null)} backdrop="static">
        <CModalHeader><strong>Cancel Renewal</strong></CModalHeader>
        <CModalBody>
          {cancelState && (() => {
            const r = cancelState.lease
            const prev = previousOf(r)
            return (
              <>
                <p className="text-body-secondary small mb-3">
                  {r.tenantName} · {r.buildingName}, Floor {r.floorNumber}, Unit {r.unitNumber}
                </p>
                <p className="mb-2">
                  The renewed term from <strong>{formatDate(r.startDate)}</strong> ({fmt(r.rentAmount)}/month) will be cancelled
                  and never billed.
                </p>
                {prev && (
                  <p className="mb-2">
                    The current lease ({formatDate(prev.startDate)} – {formatDate(prev.endDate)}, {fmt(prev.rentAmount)}/month)
                    continues as before, and month to month after its end date until it is renewed or ended.
                  </p>
                )}
                <p className="small text-body-secondary mb-0">The tenant does not move out. To end the tenancy, use End instead.</p>
              </>
            )
          })()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setCancelState(null)}>Keep Renewal</CButton>
          <CButton color="warning" disabled={!!cancelState?.saving} onClick={handleCancelRenewal}>
            {cancelState?.saving ? 'Cancelling...' : 'Cancel Renewal'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={!!cancelLeaseState} onClose={() => setCancelLeaseState(null)} backdrop="static">
        <CModalHeader><strong>Cancel Lease</strong></CModalHeader>
        <CModalBody>
          {cancelLeaseState && (() => {
            const l = cancelLeaseState.lease
            return (
              <>
                <p className="text-body-secondary small mb-3">
                  {l.tenantName} · {l.buildingName}, Floor {l.floorNumber}, Unit {l.unitNumber}
                </p>
                <p className="mb-2">
                  Use this only for a lease created by mistake. The lease from <strong>{formatDate(l.startDate)}</strong>{' '}
                  ({fmt(l.rentAmount)}/month) will be cancelled and never billed, its rent invoices are cancelled and the
                  unit becomes available.
                </p>
                <p className="small text-body-secondary mb-0">If the tenant actually lived there, use End instead.</p>
              </>
            )
          })()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setCancelLeaseState(null)}>Keep Lease</CButton>
          <CButton color="warning" disabled={!!cancelLeaseState?.saving} onClick={handleCancelLease}>
            {cancelLeaseState?.saving ? 'Cancelling...' : 'Cancel Lease'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={!!endState} onClose={() => setEndState(null)} backdrop="static">
        <CModalHeader><strong>End Lease</strong></CModalHeader>
        <CModalBody>
          {endState && (
            <p className="text-body-secondary small mb-3">
              {endState.lease.tenantName} · {endState.lease.buildingName}, Floor {endState.lease.floorNumber}, Unit {endState.lease.unitNumber}
            </p>
          )}
          <div className="mb-3">
            <CFormLabel htmlFor="end-reason">Reason <span className="text-danger">*</span></CFormLabel>
            <CFormTextarea
              id="end-reason"
              rows={2}
              maxLength={200}
              placeholder="e.g. Tenant moved out"
              value={endState?.reason || ''}
              invalid={!!endErrors.reason}
              onChange={(e) => setEndState((p) => ({ ...p, reason: e.target.value }))}
            />
            <CFormFeedback invalid>{endErrors.reason}</CFormFeedback>
          </div>
          <div>
            <CFormLabel htmlFor="end-moveout">Move-out date <span className="text-danger">*</span></CFormLabel>
            <CFormInput
              id="end-moveout"
              type="date"
              min={endState && hasStarted(endState.lease) ? day(endState.lease.startDate) : undefined}
              max={todayLocal()}
              value={endState?.moveOut || ''}
              invalid={!!endErrors.moveOut}
              onChange={(e) => setEndState((p) => ({ ...p, moveOut: e.target.value }))}
            />
            <CFormFeedback invalid>{endErrors.moveOut}</CFormFeedback>
            {/* An upcoming lease (not a renewal) ends before it starts, so nothing is billed */}
            <small className="text-body-secondary">
              {endState && !hasStarted(endState.lease) && !endState.lease.isPendingRenewal
                ? "This lease hasn't started yet, so no rent is billed."
                : 'Rent is billed through this day.'}
            </small>
            {endState?.lease.isPendingRenewal && (
              <div className="alert alert-warning small mt-3 mb-0">
                This is an upcoming renewal. Ending it ends the tenancy: the current term also stops on the move-out
                date. To keep the tenant until the current term ends, use <strong>Cancel Renewal</strong> instead.
              </div>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEndState(null)}>Cancel</CButton>
          <CButton color="danger" disabled={!!endState?.saving} onClick={handleTerminate}>
            {endState?.saving ? 'Ending...' : 'End Lease'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  )
}

export default LeaseManagement