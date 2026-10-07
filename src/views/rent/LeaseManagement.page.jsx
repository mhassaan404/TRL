import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CButton, CButtonGroup, CModal, CModalHeader, CModalBody, CModalFooter,
  CFormInput, CFormLabel, CFormTextarea, CFormFeedback, CInputGroup, CInputGroupText, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell
} from '@coreui/react'
import { toast } from 'react-toastify'
import { leaseService, rentService } from '../../services/rent.service'
import UnitPicker from '../../components/rent/UnitPicker'
import TenantFilter from '../../components/rent/TenantFilter'
import SearchableSelect from '../../components/rent/SearchableSelect'
import CurrencyInput from '../../components/common/CurrencyInput'
import { PAGE_SIZES, TablePagination, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'
import { fmt, formatDate } from '../../utils/rentUtils'
import { todayLocal } from '../../utils/dates'

const emptyForm = { tenantId: '', unitId: '', rentAmount: '', unitRent: 0, startDate: todayLocal(), tenureMonths: 12 }
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
  const [editState, setEditState] = useState(null)
  const editSavingRef = useRef(false)
  const [endState, setEndState] = useState(null)
  const [cancelState, setCancelState] = useState(null)
  const [cancelLeaseState, setCancelLeaseState] = useState(null)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('Active')
  const [tenantFilter, setTenantFilter] = useState('') // '' = all tenants
  const [search, setSearch] = useState('') // tenant, unit, building or floor
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const load = () => leaseService.getAll().then(setLeases)
  useEffect(() => { load(); rentService.getActiveTenants().then(setTenants) }, [])

  // The chosen tenant's leases matching the search; the status buttons (and their counts) then work within them
  const tenantLeases = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leases.filter(
      (l) =>
        (!tenantFilter || l.tenantName === tenantFilter) &&
        (!q || [l.tenantName, l.unitNumber, l.buildingName, l.floorNumber].join(' ').toLowerCase().includes(q)),
    )
  }, [leases, tenantFilter, search])

  const filtered = useMemo(
    () => (filter === 'All' ? tenantLeases : tenantLeases.filter((l) => statusOf(l) === filter)),
    [tenantLeases, filter],
  )

  useEffect(() => { setPageIndex(0) }, [filter, tenantFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  // Stay on a real page when the list shrinks (e.g. the last lease on the last page was ended)
  useEffect(() => { if (pageIndex > pageCount - 1) setPageIndex(pageCount - 1) }, [pageIndex, pageCount])
  const paged = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const counts = useMemo(() => {
    const c = { All: tenantLeases.length, Active: 0, Upcoming: 0, Expired: 0, Ended: 0 }
    tenantLeases.forEach((l) => { c[statusOf(l)]++ })
    return c
  }, [tenantLeases])

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

  // Edit: same rules as the API (LeaseRepository.UpdateAsync). Tenure can always change; start date and rent
  // only before the lease is billed; a renewal's start date never (it follows on from the previous term).
  const openEdit = (lease) =>
    setEditState({
      lease,
      startDate: day(lease.startDate),
      rentAmount: String(Number(lease.rentAmount)),
      tenureMonths: String(lease.tenureMonths),
      isRenewal: !!lease.isPendingRenewal || !!previousOf(lease),
      saving: false,
    })

  const editErrors = editState
    ? {
        startDate: editState.startDate ? '' : 'Please choose the start date.',
        rentAmount: Number(editState.rentAmount) > 0 ? '' : 'Rent must be greater than zero.',
      }
    : {}
  const editChanged = !!editState && (
    editState.startDate !== day(editState.lease.startDate)
    || Number(editState.rentAmount) !== Number(editState.lease.rentAmount)
    || Number(editState.tenureMonths) !== Number(editState.lease.tenureMonths))

  const handleEdit = async () => {
    // The ref blocks a second click in the same instant (state updates only apply on the next render)
    if (editSavingRef.current || editState.saving || editErrors.startDate || editErrors.rentAmount || !editChanged) return
    editSavingRef.current = true
    setEditState((p) => ({ ...p, saving: true }))
    try {
      const res = await leaseService.update({
        LeaseId: editState.lease.leaseId,
        StartDate: editState.startDate,
        RentAmount: Number(editState.rentAmount),
        TenureMonths: Number(editState.tenureMonths),
      })
      toast.success(res?.message || 'Lease updated')
      setEditState(null)
      load()
    } catch (err) {
      toast.error(err.message)
      setEditState((p) => p && { ...p, saving: false })
    } finally {
      editSavingRef.current = false
    }
  }

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

  // A lease made by mistake and then ended on its start day (one day billed) can still be cancelled (no rent).
  // Same rule as the API (LeaseRepository.CancelLeaseAsync); a renewal is refused there.
  const endedOnStartDay = (l) =>
    !l.isActive && !!l.billedThrough && day(l.billedThrough) === day(l.startDate)
    && !['Renewed', 'Lease cancelled', 'Renewal cancelled'].includes(l.terminationReason) && !previousOf(l)

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
        <div>
          <div className="fw-semibold fs-5">Lease Management</div>
          <div className="small text-body-secondary">{leases.length} leases in total</div>
        </div>
        <CButton color="primary" onClick={() => setModal({ visible: true })}>+ New Lease</CButton>
      </CCardHeader>
      <CCardBody>
        {/* Filters: search + tenant on the left, status on the right */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <CFormInput
            type="search"
            placeholder="Search tenant, unit, building or floor..."
            style={{ maxWidth: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ minWidth: 220, maxWidth: 260 }} title="Tenant / Company">
            <TenantFilter names={leases.map((l) => l.tenantName)} value={tenantFilter} onChange={setTenantFilter} />
          </div>
          <CButtonGroup size="sm" role="group" aria-label="Lease status" className="ms-lg-auto flex-wrap">
            {FILTERS.map((f) => (
              <CButton
                key={f}
                color={filter === f ? 'primary' : 'secondary'}
                variant={filter === f ? undefined : 'outline'}
                onClick={() => setFilter(f)}
              >
                {f} <span className="opacity-75">({counts[f]})</span>
              </CButton>
            ))}
          </CButtonGroup>
        </div>

        {/* Page size and the record count on one line */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          {/* Same choices as PageSizeSelect, kept on one line */}
          <label className="d-flex align-items-center gap-2 text-nowrap mb-0">
            Show
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0) }}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            entries
          </label>
          <div className="small text-body-secondary">
            {filtered.length === leases.length ? `${filtered.length} leases` : `${filtered.length} of ${leases.length} leases`}
          </div>
        </div>

        <CTable hover responsive small>
          <CTableHead><CTableRow>
            {['Lease #', 'Tenant', 'Building', 'Floor', 'Unit', 'Rent', 'Start', 'End', 'Tenure', 'Status', 'Actions'].map((h) => (
              <CTableHeaderCell key={h}>{h}</CTableHeaderCell>
            ))}
          </CTableRow></CTableHead>
          <CTableBody>
            {paged.map((l) => (
              <CTableRow key={l.leaseId}>
                <CTableDataCell className="text-nowrap">#{l.leaseId}</CTableDataCell>
                <CTableDataCell>{l.tenantName}</CTableDataCell>
                <CTableDataCell>{l.buildingName}</CTableDataCell>
                <CTableDataCell>{l.floorNumber}</CTableDataCell>
                <CTableDataCell>{l.unitNumber}</CTableDataCell>
                <CTableDataCell className="text-nowrap">{fmt(l.rentAmount)}</CTableDataCell>
                <CTableDataCell className="text-nowrap">{formatDate(l.startDate)}</CTableDataCell>
                <CTableDataCell className="text-nowrap">{formatDate(l.endDate)}</CTableDataCell>
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
                    <div className="d-flex gap-1 text-nowrap">
                      <CButton size="sm" color="secondary" variant="outline" onClick={() => openEdit(l)}>
                        Edit
                      </CButton>
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
                  {endedOnStartDay(l) && (
                    <CButton size="sm" color="warning" variant="outline" className="text-nowrap"
                      title="Ended on its start day, so one day is billed. Cancel it if it was created by mistake (no rent)."
                      onClick={() => setCancelLeaseState({ lease: l, saving: false })}>
                      Cancel Lease
                    </CButton>
                  )}
                </CTableDataCell>
              </CTableRow>
            ))}
            {!paged.length && (
              <CTableRow><CTableDataCell colSpan={11} className="text-center text-muted py-4">No leases</CTableDataCell></CTableRow>
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
            <SearchableSelect
              options={tenants.map((t) => ({ value: t.id, label: t.name }))}
              value={form.tenantId}
              onChange={(v) => setForm((p) => ({ ...p, tenantId: String(v) }))}
              placeholder="Select tenant..."
            />
          </div>
          <div className="mb-3">
            <UnitPicker value={form.unitId} onChange={({ unitId, rent }) => setForm((p) => ({ ...p, unitId, unitRent: rent, rentAmount: rent || p.rentAmount }))} />
          </div>
          <div className="mb-3">
            <CFormLabel>Monthly Rent</CFormLabel>
            <CInputGroup>
              <CInputGroupText>PKR</CInputGroupText>
              <CurrencyInput value={form.rentAmount} placeholder="0" onValueChange={(v) => setForm((p) => ({ ...p, rentAmount: v }))} />
            </CInputGroup>
            {form.unitRent > 0 && Number(form.rentAmount) > 0 && Number(form.rentAmount) !== Number(form.unitRent) && (
              <div className="small text-warning mt-1">
                Unit rent is PKR {fmt(form.unitRent)}; this lease is PKR {fmt(form.rentAmount)}.
              </div>
            )}
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

      <CModal visible={!!editState} onClose={() => setEditState(null)} backdrop="static">
        <CModalHeader><strong>Edit Lease</strong></CModalHeader>
        <CModalBody>
          {editState && (() => {
            const l = editState.lease
            const billed = !!l.hasRentInvoices
            const startLocked = billed || editState.isRenewal
            const tenureOptions = [...new Set([1, 3, 6, 12, 24, Number(l.tenureMonths)])].sort((a, b) => a - b)
            const end = new Date(`${editState.startDate || day(l.startDate)}T00:00:00`)
            end.setMonth(end.getMonth() + Number(editState.tenureMonths))
            return (
              <>
                <p className="text-body-secondary small mb-3">
                  {l.tenantName} · {l.buildingName}, Floor {l.floorNumber}, Unit {l.unitNumber}
                </p>
                {billed && (
                  <div className="alert alert-info small">
                    This lease already has rent invoices, so its start date and rent can&apos;t be changed here. To
                    correct them, cancel its open rent invoices in Rent History first, then edit the lease and
                    generate the rent again. The tenure can still be changed.
                  </div>
                )}
                <div className="mb-3">
                  <CFormLabel htmlFor="edit-start">Start Date <span className="text-danger">*</span></CFormLabel>
                  <CFormInput
                    id="edit-start"
                    type="date"
                    value={editState.startDate}
                    disabled={startLocked}
                    invalid={!!editErrors.startDate}
                    onChange={(e) => setEditState((p) => ({ ...p, startDate: e.target.value }))}
                  />
                  <CFormFeedback invalid>{editErrors.startDate}</CFormFeedback>
                  {editState.isRenewal && !billed && (
                    <small className="text-body-secondary">
                      This is a renewal: its start date follows on from the previous term and can&apos;t be changed.
                    </small>
                  )}
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="edit-rent">Monthly Rent <span className="text-danger">*</span></CFormLabel>
                  <CInputGroup className="has-validation">
                    <CInputGroupText>PKR</CInputGroupText>
                    <CurrencyInput
                      id="edit-rent"
                      value={editState.rentAmount}
                      disabled={billed}
                      invalid={!!editErrors.rentAmount}
                      onValueChange={(v) => setEditState((p) => ({ ...p, rentAmount: v }))}
                    />
                    <CFormFeedback invalid>{editErrors.rentAmount}</CFormFeedback>
                  </CInputGroup>
                </div>
                <div>
                  <CFormLabel htmlFor="edit-tenure">Tenure</CFormLabel>
                  <select
                    id="edit-tenure"
                    className="form-select"
                    value={editState.tenureMonths}
                    onChange={(e) => setEditState((p) => ({ ...p, tenureMonths: e.target.value }))}
                  >
                    {tenureOptions.map((m) => (
                      <option key={m} value={m}>{m === 12 ? '1 year' : m === 24 ? '2 years' : `${m} month${m === 1 ? '' : 's'}`}</option>
                    ))}
                  </select>
                  <small className="text-body-secondary">Ends {formatDate(end)}</small>
                </div>
              </>
            )
          })()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditState(null)}>Cancel</CButton>
          <CButton
            color="primary"
            disabled={!!editState?.saving || !editChanged || !!editErrors.startDate || !!editErrors.rentAmount}
            onClick={handleEdit}
          >
            {editState?.saving ? 'Saving...' : 'Save Changes'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={!!renewState} onClose={() => setRenewState(null)} backdrop="static">
        <CModalHeader><strong>Renew Lease</strong></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>New Monthly Rent (leave blank to keep current)</CFormLabel>
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
            {/* Moving out on the start day of a started, non-renewal lease bills one day: usually a lease made by mistake */}
            {endState && hasStarted(endState.lease) && !endState.lease.isPendingRenewal && !previousOf(endState.lease)
              && endState.moveOut === day(endState.lease.startDate) && (
              <div className="alert alert-warning small mt-3 mb-0">
                Ending on the start day bills <strong>1 day of rent</strong>. If this lease was created by mistake, cancel
                it instead, so no rent is billed.
                <div className="mt-2">
                  <CButton size="sm" color="warning"
                    onClick={() => { const lease = endState.lease; setEndState(null); setCancelLeaseState({ lease, saving: false }) }}>
                    Cancel Lease instead
                  </CButton>
                </div>
              </div>
            )}
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