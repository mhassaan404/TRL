import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CBadge, CButton, CCard, CCardBody, CCardHeader, CCol, CFormCheck, CFormInput, CFormLabel, CFormSelect, CFormTextarea,
  CInputGroup, CInputGroupText, CModal, CModalBody, CModalFooter, CModalHeader, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { toast } from 'react-toastify'
import { maintenanceService } from '../../services/maintenance.service'
import CurrencyInput from '../../components/common/CurrencyInput'
import SearchableSelect from '../../components/rent/SearchableSelect'
import { PageSizeSelect, TablePagination, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'
import { fmt, formatDate } from '../../utils/rentUtils'
import { todayLocal } from '../../utils/dates'
import {
  CATEGORIES, PRIORITIES, STATUSES, billBlockedReason, filterJobs, isClosed, locationLockReason, nextStatuses, summarize,
} from '../../utils/maintenance'

// Maintenance jobs per building / floor / unit. Billing to the tenant creates a normal Maintenance extra-charge
// invoice (Rent Collection, Reminders, late fees and payments then work as usual). All rules are enforced by the API.
const STATUS_BADGE = { Open: 'primary', 'In Progress': 'warning', Completed: 'success', Cancelled: 'secondary' }
const PRIORITY_BADGE = { Low: 'secondary', Medium: 'info', High: 'warning', Urgent: 'danger' }
const UNDER_MAINTENANCE = 4 // UnitStatus id

const emptyJob = () => ({
  id: 0, buildingId: '', floorId: '', unitId: '', tenantId: null, tenantName: '', title: '', description: '',
  category: 'Other', priority: 'Medium', assignedTo: '', reportedDate: todayLocal(), cost: '', mark: false,
})

const day = (d) => String(d || '').slice(0, 10)
const toId = (v) => (v === '' || v == null ? null : Number(v))

const MaintenanceJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState({ buildings: [], units: [] })
  const [filters, setFilters] = useState({ status: 'Active', buildingId: '', unitId: '', priority: '', search: '' })
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [form, setForm] = useState(null) // job being created / edited
  const [statusState, setStatusState] = useState(null)
  const [billState, setBillState] = useState(null)
  const [historyState, setHistoryState] = useState(null)
  const savingRef = useRef(false) // blocks a double click before the saving flag re-renders

  const load = () => maintenanceService.getAll().then((d) => { setJobs(d); setLoading(false) })
  useEffect(() => {
    load()
    maintenanceService.getLocations().then(setLocations)
  }, [])

  const today = todayLocal()
  const stats = useMemo(() => summarize(jobs, today), [jobs, today])
  const filtered = useMemo(() => filterJobs(jobs, filters), [jobs, filters])
  useEffect(() => { setPageIndex(0) }, [filters])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  useEffect(() => { if (pageIndex > pageCount - 1) setPageIndex(pageCount - 1) }, [pageIndex, pageCount])
  const paged = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const setFilter = (key, value) =>
    setFilters((p) => ({ ...p, [key]: value, ...(key === 'buildingId' ? { unitId: '' } : {}) }))

  // Units for the building filter; floors and units for the form
  const unitsOf = (buildingId) => locations.units.filter((u) => String(u.buildingId) === String(buildingId))
  const floorsOf = (buildingId) =>
    [...new Map(unitsOf(buildingId).map((u) => [u.floorId, u.floorNumber]))].map(([value, label]) => ({ value, label }))

  // ── Run one change: the window stays open with the API's message on failure ──
  const run = async (setState, call, after) => {
    if (savingRef.current) return
    savingRef.current = true
    setState((p) => p && { ...p, saving: true })
    try {
      const res = await call()
      toast.success(res?.message || 'Saved')
      setState(null)
      after?.()
      load()
    } catch (err) {
      toast.error(err.message)
      setState((p) => p && { ...p, saving: false })
    } finally {
      savingRef.current = false
    }
  }

  // ── New / Edit ──
  const openNew = () => setForm({ ...emptyJob(), submitted: false, saving: false })
  const openEdit = (j) =>
    setForm({
      id: j.id, buildingId: String(j.buildingId), floorId: j.floorId ? String(j.floorId) : '', unitId: j.unitId ? String(j.unitId) : '',
      tenantId: j.tenantId || null, tenantName: j.tenantName || '', title: j.title, description: j.description || '',
      category: j.category, priority: j.priority, assignedTo: j.assignedTo || '', reportedDate: day(j.reportedDate),
      cost: j.cost == null ? '' : String(Number(j.cost)), mark: false, job: j, submitted: false, saving: false,
    })

  // Choosing a unit fills in the tenant of its current lease (none for a vacant unit or common area)
  const pickUnit = (unitId) => {
    const u = locations.units.find((x) => String(x.unitId) === String(unitId))
    setForm((p) => ({ ...p, unitId, tenantId: u?.tenantId || null, tenantName: u?.tenantName || '', mark: unitId ? p.mark : false }))
  }

  const formErrors = form?.submitted
    ? {
        buildingId: form.buildingId ? '' : 'Please select a building.',
        title: form.title.trim() ? '' : 'Please enter a title.',
        reportedDate: !form.reportedDate ? 'Please select the reported date.' : form.reportedDate > today ? "Can't be in the future." : '',
      }
    : {}
  const formUnit = form && locations.units.find((u) => String(u.unitId) === String(form.unitId))
  const lockReason = form ? locationLockReason(form.job) : null

  const saveJob = () => {
    setForm((p) => ({ ...p, submitted: true }))
    if (!form.buildingId || !form.title.trim() || !form.reportedDate || form.reportedDate > today) return
    run(setForm, () =>
      maintenanceService.save({
        Id: form.id,
        BuildingId: Number(form.buildingId),
        FloorId: toId(form.floorId),
        UnitId: toId(form.unitId),
        TenantId: form.tenantId || null,
        Title: form.title.trim(),
        Description: form.description.trim() || null,
        Category: form.category,
        Priority: form.priority,
        AssignedTo: form.assignedTo.trim() || null,
        ReportedDate: form.reportedDate,
        Cost: form.cost === '' ? null : Number(form.cost),
        MarkUnitUnderMaintenance: !form.id && form.mark,
      }),
      () => maintenanceService.getLocations().then(setLocations), // unit status may have changed
    )
  }

  // ── Status ──
  const openStatus = (j) =>
    setStatusState({ job: j, status: nextStatuses(j)[0], note: '', completedDate: today, submitted: false, saving: false })
  const statusError = statusState?.submitted && statusState.status === 'Cancelled' && !statusState.note.trim()
    ? 'Please enter a reason for cancelling.'
    : ''
  const saveStatus = () => {
    setStatusState((p) => ({ ...p, submitted: true }))
    if (statusState.status === 'Cancelled' && !statusState.note.trim()) return
    run(setStatusState, () =>
      maintenanceService.changeStatus({
        Id: statusState.job.id,
        Status: statusState.status,
        Note: statusState.note.trim() || null,
        CompletedDate: statusState.status === 'Completed' ? statusState.completedDate : null,
      }),
      () => maintenanceService.getLocations().then(setLocations),
    )
  }

  // ── Bill tenant ──
  const openBill = (j) =>
    setBillState({
      job: j, amount: j.cost ? String(Number(j.cost)) : '', description: `Maintenance job #${j.id} – ${j.title}`.slice(0, 255),
      dueInDays: '', applyLateFee: true, submitted: false, saving: false,
    })
  const billError = billState?.submitted && !(Number(billState.amount) > 0) ? 'Please enter the amount.' : ''
  const saveBill = () => {
    setBillState((p) => ({ ...p, submitted: true }))
    if (!(Number(billState.amount) > 0)) return
    run(setBillState, () =>
      maintenanceService.bill({
        Id: billState.job.id,
        Amount: Number(billState.amount),
        Description: billState.description.trim() || null,
        DueInDays: billState.dueInDays === '' ? null : Number(billState.dueInDays),
        ApplyLateFee: billState.applyLateFee,
      }),
    )
  }

  // ── History ──
  const openHistory = (j) => {
    setHistoryState({ job: j, rows: [], loading: true })
    maintenanceService.getLog(j.id).then((rows) => setHistoryState((p) => p && p.job.id === j.id && { ...p, rows, loading: false }))
  }

  const cards = [
    { label: 'Open', value: stats.open, color: 'primary', onClick: () => setFilters((p) => ({ ...p, status: 'Open', priority: '' })) },
    { label: 'In Progress', value: stats.inProgress, color: 'warning', onClick: () => setFilters((p) => ({ ...p, status: 'In Progress', priority: '' })) },
    { label: 'Urgent', value: stats.urgent, color: 'danger', onClick: () => setFilters((p) => ({ ...p, status: 'Active', priority: 'Urgent' })) },
    { label: 'Completed this month', value: stats.completedThisMonth, color: 'success', onClick: () => setFilters((p) => ({ ...p, status: 'Completed', priority: '' })) },
  ]

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-3 px-4">
        <div>
          <div className="fw-semibold fs-5">Maintenance</div>
          <div className="small text-body-secondary">{jobs.length} jobs in total</div>
        </div>
        <CButton color="primary" onClick={openNew}>+ New Request</CButton>
      </CCardHeader>
      <CCardBody>
        {/* Summary cards (click to filter) */}
        <CRow className="g-3 mb-3">
          {cards.map((c) => (
            <CCol xs={6} md={3} key={c.label}>
              <div role="button" tabIndex={0} onClick={c.onClick} onKeyDown={(e) => e.key === 'Enter' && c.onClick()}
                className="border rounded p-3 h-100" style={{ borderLeft: `4px solid var(--cui-${c.color})`, cursor: 'pointer' }}>
                <div className="small text-body-secondary">{c.label}</div>
                <div className={`fs-4 fw-semibold text-${c.color}`}>{c.value}</div>
              </div>
            </CCol>
          ))}
        </CRow>

        {/* Filters */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <CFormInput type="search" placeholder="Search job #, title, tenant, unit, assigned to..." style={{ maxWidth: 300 }}
            value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
          <CFormSelect style={{ maxWidth: 200 }} value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
            <option value="Active">Open + In Progress</option>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </CFormSelect>
          <div style={{ width: 200 }}>
            <SearchableSelect
              options={[{ value: '', label: 'All buildings' }, ...locations.buildings.map((b) => ({ value: b.buildingId, label: b.buildingName }))]}
              value={filters.buildingId}
              onChange={(v) => setFilter('buildingId', String(v))}
            />
          </div>
          <div style={{ width: 160 }}>
            <SearchableSelect
              options={[{ value: '', label: 'All units' }, ...(filters.buildingId ? unitsOf(filters.buildingId) : locations.units).map((u) => ({ value: u.unitId, label: `Unit ${u.unitNumber}` }))]}
              value={filters.unitId}
              onChange={(v) => setFilter('unitId', String(v))}
            />
          </div>
          <CFormSelect style={{ maxWidth: 150 }} value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Priority">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </CFormSelect>
        </div>

        <div className="mb-2">
          <PageSizeSelect pageSize={pageSize} onChange={(size) => { setPageSize(size); setPageIndex(0) }} />
        </div>

        <CTable hover responsive small className="align-middle">
          <CTableHead>
            <CTableRow>
              {['Job #', 'Building', 'Floor', 'Unit', 'Tenant', 'Title', 'Priority', 'Assigned To', 'Reported', 'Cost', 'Billed', 'Status', 'Actions'].map((h) => (
                <CTableHeaderCell key={h} className="text-nowrap">{h}</CTableHeaderCell>
              ))}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paged.map((j) => {
              const billReason = billBlockedReason(j)
              return (
                <CTableRow key={j.id}>
                  <CTableDataCell className="text-nowrap">#{j.id}</CTableDataCell>
                  <CTableDataCell>{j.buildingName}</CTableDataCell>
                  <CTableDataCell>{j.floorNumber ?? '—'}</CTableDataCell>
                  <CTableDataCell>{j.unitNumber ?? <span className="text-body-secondary">Common area</span>}</CTableDataCell>
                  <CTableDataCell>{j.tenantName || '—'}</CTableDataCell>
                  <CTableDataCell>
                    <div>{j.title}</div>
                    <small className="text-body-secondary">{j.category}</small>
                  </CTableDataCell>
                  <CTableDataCell><CBadge color={PRIORITY_BADGE[j.priority]}>{j.priority}</CBadge></CTableDataCell>
                  <CTableDataCell>{j.assignedTo || '—'}</CTableDataCell>
                  <CTableDataCell className="text-nowrap">
                    {formatDate(j.reportedDate)}
                    {j.completedDate && <div className="small text-body-secondary">Done {formatDate(j.completedDate)}</div>}
                  </CTableDataCell>
                  <CTableDataCell className="text-nowrap">{j.cost == null ? '—' : fmt(j.cost)}</CTableDataCell>
                  <CTableDataCell className="text-nowrap">
                    {j.isBilled ? (
                      <>
                        #{j.chargeInvoiceId}
                        <div className="small text-body-secondary">{fmt(j.chargeAmount)} · {j.chargeStatus}</div>
                      </>
                    ) : '—'}
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={STATUS_BADGE[j.status]}>{j.status}</CBadge>
                    {j.markedUnit && <div className="small text-body-secondary">Unit under maintenance</div>}
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex gap-1 text-nowrap">
                      <CButton size="sm" color="secondary" variant="outline" disabled={j.status === 'Cancelled'}
                        title={j.status === 'Cancelled' ? "Cancelled jobs can't be edited." : ''} onClick={() => openEdit(j)}>
                        Edit
                      </CButton>
                      <CButton size="sm" color="primary" variant="outline" disabled={isClosed(j)}
                        title={isClosed(j) ? 'This job is closed.' : ''} onClick={() => openStatus(j)}>
                        Status
                      </CButton>
                      <span title={billReason || ''}>
                        <CButton size="sm" color="success" variant="outline" disabled={!!billReason} onClick={() => openBill(j)}>
                          Bill Tenant
                        </CButton>
                      </span>
                      <CButton size="sm" color="info" variant="outline" onClick={() => openHistory(j)}>History</CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              )
            })}
            {!paged.length && (
              <CTableRow>
                <CTableDataCell colSpan={13} className="text-center text-muted py-4">
                  {loading ? 'Loading...' : 'No maintenance jobs'}
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
        <TablePagination pageIndex={pageIndex} pageSize={pageSize} total={filtered.length} onPageChange={setPageIndex} />
      </CCardBody>

      {/* New / Edit */}
      <CModal visible={!!form} onClose={() => setForm(null)} size="lg" backdrop="static">
        <CModalHeader><strong>{form?.id ? `Edit Job #${form.id}` : 'New Maintenance Request'}</strong></CModalHeader>
        {form && (
          <CModalBody>
            {lockReason && <div className="alert alert-info small py-2">{lockReason}</div>}
            <CRow className="g-2 mb-3">
              <CCol md={4}>
                <CFormLabel>Building <span className="text-danger">*</span></CFormLabel>
                <SearchableSelect
                  options={locations.buildings.map((b) => ({ value: b.buildingId, label: b.buildingName }))}
                  value={form.buildingId} disabled={!!lockReason} invalid={!!formErrors.buildingId} placeholder="Select building..."
                  onChange={(v) => setForm((p) => ({ ...p, buildingId: String(v), floorId: '', unitId: '', tenantId: null, tenantName: '', mark: false }))}
                />
                {formErrors.buildingId && <div className="invalid-feedback d-block">{formErrors.buildingId}</div>}
              </CCol>
              <CCol md={4}>
                <CFormLabel>Floor</CFormLabel>
                <SearchableSelect
                  options={[{ value: '', label: '— Whole building —' }, ...floorsOf(form.buildingId).map((f) => ({ value: f.value, label: String(f.label) }))]}
                  value={form.floorId} disabled={!!lockReason || !form.buildingId}
                  onChange={(v) => setForm((p) => ({ ...p, floorId: String(v), unitId: '', tenantId: null, tenantName: '', mark: false }))}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Unit</CFormLabel>
                <SearchableSelect
                  options={[{ value: '', label: '— Common area —' }, ...unitsOf(form.buildingId).filter((u) => String(u.floorId) === String(form.floorId)).map((u) => ({ value: u.unitId, label: String(u.unitNumber) }))]}
                  value={form.unitId} disabled={!!lockReason || !form.floorId}
                  onChange={(v) => pickUnit(String(v))}
                />
              </CCol>
            </CRow>
            <div className="mb-3 small">
              <span className="text-body-secondary">Tenant: </span>
              {form.tenantName ? <strong>{form.tenantName}</strong> : <span className="text-body-secondary">none (vacant unit or common area)</span>}
            </div>
            <div className="mb-3">
              <CFormLabel>Title <span className="text-danger">*</span></CFormLabel>
              <CFormInput maxLength={150} placeholder="e.g. Leaking kitchen tap" value={form.title} invalid={!!formErrors.title}
                feedbackInvalid={formErrors.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <CRow className="g-2 mb-3">
              <CCol md={4}>
                <CFormLabel>Category</CFormLabel>
                <CFormSelect value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Priority</CFormLabel>
                <CFormSelect value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                  {PRIORITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Reported Date <span className="text-danger">*</span></CFormLabel>
                <CFormInput type="date" max={today} value={form.reportedDate} invalid={!!formErrors.reportedDate}
                  feedbackInvalid={formErrors.reportedDate} onChange={(e) => setForm((p) => ({ ...p, reportedDate: e.target.value }))} />
              </CCol>
            </CRow>
            <CRow className="g-2 mb-3">
              <CCol md={6}>
                <CFormLabel>Assigned To</CFormLabel>
                <CFormInput maxLength={100} placeholder="Staff or vendor name" value={form.assignedTo}
                  onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))} />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Cost (owner&apos;s expense)</CFormLabel>
                <CInputGroup>
                  <CInputGroupText>PKR</CInputGroupText>
                  <CurrencyInput value={form.cost} placeholder="0" onValueChange={(v) => setForm((p) => ({ ...p, cost: v }))} />
                </CInputGroup>
              </CCol>
            </CRow>
            <div className="mb-3">
              <CFormLabel>Description</CFormLabel>
              <CFormTextarea rows={3} maxLength={1000} value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            {!form.id && (
              <CFormCheck id="mark-unit" label="Mark unit Under Maintenance (until this job is completed or cancelled)"
                checked={form.mark} disabled={!form.unitId || formUnit?.unitStatusId === UNDER_MAINTENANCE}
                onChange={(e) => setForm((p) => ({ ...p, mark: e.target.checked }))} />
            )}
            {!form.id && formUnit?.unitStatusId === UNDER_MAINTENANCE && (
              <div className="small text-body-secondary ms-4">This unit is already Under Maintenance.</div>
            )}
          </CModalBody>
        )}
        <CModalFooter>
          <CButton color="secondary" onClick={() => setForm(null)}>Cancel</CButton>
          <CButton color="primary" disabled={!!form?.saving} onClick={saveJob}>{form?.saving ? 'Saving...' : 'Save'}</CButton>
        </CModalFooter>
      </CModal>

      {/* Change status */}
      <CModal visible={!!statusState} onClose={() => setStatusState(null)} backdrop="static">
        <CModalHeader><strong>Change Status</strong></CModalHeader>
        {statusState && (
          <CModalBody>
            <p className="small text-body-secondary mb-3">
              Job #{statusState.job.id} · {statusState.job.title} · now <strong>{statusState.job.status}</strong>
            </p>
            <div className="mb-3">
              <CFormLabel>New Status</CFormLabel>
              <CFormSelect value={statusState.status} onChange={(e) => setStatusState((p) => ({ ...p, status: e.target.value }))}>
                {nextStatuses(statusState.job).map((s) => <option key={s} value={s}>{s}</option>)}
              </CFormSelect>
            </div>
            {statusState.status === 'Completed' && (
              <div className="mb-3">
                <CFormLabel>Completed Date</CFormLabel>
                <CFormInput type="date" min={day(statusState.job.reportedDate)} max={today} value={statusState.completedDate}
                  onChange={(e) => setStatusState((p) => ({ ...p, completedDate: e.target.value }))} />
              </div>
            )}
            <div>
              <CFormLabel>Note {statusState.status === 'Cancelled' && <span className="text-danger">*</span>}</CFormLabel>
              <CFormTextarea rows={2} maxLength={500} invalid={!!statusError} feedbackInvalid={statusError}
                placeholder={statusState.status === 'Cancelled' ? 'Reason for cancelling' : 'Optional'}
                value={statusState.note} onChange={(e) => setStatusState((p) => ({ ...p, note: e.target.value }))} />
            </div>
            {['Completed', 'Cancelled'].includes(statusState.status) && (
              <div className="small text-body-secondary mt-2">
                This closes the job; it can&apos;t be reopened.
                {statusState.job.markedUnit && ' The unit will no longer be Under Maintenance.'}
              </div>
            )}
          </CModalBody>
        )}
        <CModalFooter>
          <CButton color="secondary" onClick={() => setStatusState(null)}>Cancel</CButton>
          <CButton color="primary" disabled={!!statusState?.saving} onClick={saveStatus}>{statusState?.saving ? 'Saving...' : 'Save'}</CButton>
        </CModalFooter>
      </CModal>

      {/* Bill tenant */}
      <CModal visible={!!billState} onClose={() => setBillState(null)} backdrop="static">
        <CModalHeader><strong>Bill Tenant</strong></CModalHeader>
        {billState && (
          <CModalBody>
            <p className="small text-body-secondary mb-3">
              Job #{billState.job.id} · {billState.job.tenantName} · {billState.job.buildingName}
              {billState.job.unitNumber ? `, Unit ${billState.job.unitNumber}` : ''}
            </p>
            <div className="mb-3">
              <CFormLabel>Amount <span className="text-danger">*</span></CFormLabel>
              <CInputGroup>
                <CInputGroupText>PKR</CInputGroupText>
                <CurrencyInput value={billState.amount} placeholder="0" invalid={!!billError}
                  onValueChange={(v) => setBillState((p) => ({ ...p, amount: v }))} />
              </CInputGroup>
              {billError && <div className="invalid-feedback d-block">{billError}</div>}
            </div>
            <div className="mb-3">
              <CFormLabel>Description</CFormLabel>
              <CFormInput maxLength={255} value={billState.description}
                onChange={(e) => setBillState((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="mb-3">
              <CFormLabel>Due in (days)</CFormLabel>
              <CFormInput type="number" min={0} max={90} placeholder="Payment Due Days setting" value={billState.dueInDays}
                onChange={(e) => setBillState((p) => ({ ...p, dueInDays: e.target.value.replace(/\D/g, '').slice(0, 2) }))} />
            </div>
            <CFormCheck id="bill-late-fee" label="Apply late fee if paid late" checked={billState.applyLateFee}
              onChange={(e) => setBillState((p) => ({ ...p, applyLateFee: e.target.checked }))} />
            <div className="small text-body-secondary mt-2">
              Creates a Maintenance invoice for this tenant. It then shows in Rent Collection and Reminders.
            </div>
          </CModalBody>
        )}
        <CModalFooter>
          <CButton color="secondary" onClick={() => setBillState(null)}>Cancel</CButton>
          <CButton color="success" disabled={!!billState?.saving} onClick={saveBill}>{billState?.saving ? 'Billing...' : 'Create Invoice'}</CButton>
        </CModalFooter>
      </CModal>

      {/* History */}
      <CModal visible={!!historyState} onClose={() => setHistoryState(null)} size="lg">
        <CModalHeader><strong>Job #{historyState?.job.id} History</strong></CModalHeader>
        {historyState && (
          <CModalBody>
            <p className="small text-body-secondary">{historyState.job.title} · {historyState.job.buildingName}
              {historyState.job.unitNumber ? `, Unit ${historyState.job.unitNumber}` : ''}</p>
            {historyState.job.description && <p className="small">{historyState.job.description}</p>}
            <CTable small responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>When</CTableHeaderCell>
                  <CTableHeaderCell>Action</CTableHeaderCell>
                  <CTableHeaderCell>Note</CTableHeaderCell>
                  <CTableHeaderCell>By</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {historyState.rows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell className="text-nowrap">{new Date(r.createdAt).toLocaleString('en-GB')}</CTableDataCell>
                    <CTableDataCell>{r.action}</CTableDataCell>
                    <CTableDataCell>{r.note || '—'}</CTableDataCell>
                    <CTableDataCell>{r.userName || '—'}</CTableDataCell>
                  </CTableRow>
                ))}
                {!historyState.rows.length && (
                  <CTableRow>
                    <CTableDataCell colSpan={4} className="text-center text-muted py-3">
                      {historyState.loading ? 'Loading...' : 'No history'}
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </CModalBody>
        )}
        <CModalFooter>
          <CButton color="secondary" onClick={() => setHistoryState(null)}>Close</CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  )
}

export default MaintenanceJobs
