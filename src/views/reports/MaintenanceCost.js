import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CBadge, CButton, CButtonGroup, CCard, CCardBody, CCardHeader, CCol, CFormInput, CFormLabel, CFormSelect, CRow,
  CTable, CTableBody, CTableDataCell, CTableFoot, CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { reportService } from '../../services/report.service'
import { PageSizeSelect, TablePagination, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'
import { fmt } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay } from '../../utils/reminders'
import { PRESETS, presetRange } from '../../utils/collections'
import { GROUP_BY, groupJobs, totalsOf } from '../../utils/maintenanceCost'

// Maintenance Cost: jobs in a period (completed date, else reported date) with their cost, what was billed to the
// tenant and recovered, and the net cost to the owner. Read only.
const STATUSES = ['Completed', 'Open', 'In Progress', 'Cancelled']
const STATUS_COLOR = { Open: 'secondary', 'In Progress': 'info', Completed: 'success', Cancelled: 'dark' }
const money = (v) => (Number(v) ? fmt(v) : '—')

const MaintenanceCost = () => {
  const [preset, setPreset] = useState('This Year')
  const [range, setRange] = useState(() => presetRange('This Year', todayLocal()))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState('Category')
  const [building, setBuilding] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [printing, setPrinting] = useState(false)
  const requestId = useRef(0)

  const validRange = range.from && range.to && range.from <= range.to

  // Only the latest request may set the rows (the range can change while a load is still running)
  useEffect(() => {
    const id = ++requestId.current
    if (!validRange) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    reportService.getMaintenanceCost(range.from, range.to).then((d) => {
      if (id !== requestId.current) return
      setRows(d)
      setLoading(false)
    })
  }, [range.from, range.to, validRange])

  // Print every filtered job (not just the current page), then go back to paging
  useEffect(() => {
    if (!printing) return undefined
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 50)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done) }
  }, [printing])

  const choosePreset = (p) => {
    setPreset(p)
    setRange(presetRange(p, todayLocal()))
  }
  const setDate = (field, value) => {
    setPreset('Custom')
    setRange((r) => ({ ...r, [field]: value }))
  }

  const buildings = useMemo(() => [...new Set(rows.map((r) => r.buildingName).filter(Boolean))].sort(), [rows])
  const categories = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((j) =>
      (!building || j.buildingName === building) &&
      (!category || j.category === category) &&
      (!status || j.status === status) &&
      (!q || [j.title, j.unitNumber, j.tenantName, j.assignedTo, String(j.jobId)]
        .some((v) => String(v || '').toLowerCase().includes(q))))
  }, [rows, building, category, status, search])

  const totals = useMemo(() => totalsOf(filtered), [filtered])
  const groups = useMemo(() => groupJobs(filtered, groupBy), [filtered, groupBy])

  useEffect(() => { setPageIndex(0) }, [building, category, status, search, range.from, range.to])
  const paged = printing ? filtered : filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const fileSuffix = `${range.from}_to_${range.to}`
  const exportSummary = () => exportCSV(
    [
      { accessorKey: 'label', header: groupBy },
      { accessorKey: 'jobs', header: 'Jobs' },
      { accessorKey: 'completed', header: 'Completed' },
      { accessorKey: 'open', header: 'Open' },
      { accessorKey: 'cancelled', header: 'Cancelled' },
      { accessorKey: 'spent', header: 'Cost (Completed)' },
      { accessorKey: 'openCost', header: 'Cost (Open)' },
      { accessorKey: 'cost', header: 'Total Cost' },
      { accessorKey: 'billed', header: 'Billed To Tenants' },
      { accessorKey: 'recovered', header: 'Recovered' },
      { accessorKey: 'net', header: 'Net Cost' },
      { accessorKey: 'avgDays', header: 'Avg Days To Complete' },
    ],
    [...groups, { label: 'TOTAL', ...totals }],
    `maintenance-cost-by-${groupBy.toLowerCase().replace(/\s+/g, '-')}-${fileSuffix}.csv`,
  )
  const exportJobs = () => exportCSV(
    [
      { accessorKey: 'jobId', header: 'Job #' },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'category', header: 'Category' },
      { accessorKey: 'priority', header: 'Priority' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'buildingName', header: 'Building' },
      { accessorKey: 'floorNumber', header: 'Floor' },
      { accessorKey: 'unitNumber', header: 'Unit' },
      { accessorKey: 'tenantName', header: 'Tenant' },
      { accessorKey: 'assignedTo', header: 'Assigned To' },
      { accessorKey: 'reportedDate', header: 'Reported Date' },
      { accessorKey: 'completedDate', header: 'Completed Date' },
      { accessorKey: 'daysToComplete', header: 'Days To Complete' },
      { accessorKey: 'cost', header: 'Cost' },
      { accessorKey: 'chargeInvoiceId', header: 'Charge Invoice #' },
      { accessorKey: 'billed', header: 'Billed' },
      { accessorKey: 'recovered', header: 'Recovered' },
    ],
    filtered,
    `maintenance-jobs-${fileSuffix}.csv`,
  )

  const cards = [
    { label: 'Total Cost', value: `PKR ${fmt(totals.cost)}`, sub: `${fmt(totals.spent)} completed · ${fmt(totals.openCost)} open` },
    { label: 'Billed to Tenants', value: `PKR ${fmt(totals.billed)}`, sub: `PKR ${fmt(totals.recovered)} recovered` },
    { label: 'Net Cost (Owner)', value: `PKR ${fmt(totals.net)}`, sub: 'total cost − billed' },
    { label: 'Jobs', value: totals.jobs, sub: `${totals.completed} done · ${totals.open} open · ${totals.cancelled} cancelled` },
    { label: 'Avg Days to Complete', value: totals.avgDays == null ? '—' : totals.avgDays, sub: 'completed jobs' },
  ]

  return (
    <CCard className="border-0 shadow-sm mb-4 report-print">
      <CCardHeader className="py-3 px-4 d-flex flex-wrap align-items-center gap-2">
        <div className="me-auto">
          <div className="fw-semibold fs-5">Maintenance Cost</div>
          <div className="small text-body-secondary">
            Maintenance jobs and what they cost
            {validRange && `, ${formatDay(range.from)} to ${formatDay(range.to)}`}
            {building && ` · ${building}`}
            {category && ` · ${category}`}
            {status && ` · ${status}`}.
          </div>
        </div>
        <div className="d-flex gap-2 no-print">
          <CButton size="sm" color="secondary" variant="outline" disabled={!filtered.length} onClick={exportSummary}>
            Export Summary
          </CButton>
          <CButton size="sm" color="secondary" variant="outline" disabled={!filtered.length} onClick={exportJobs}>
            Export Jobs
          </CButton>
          <CButton size="sm" color="primary" variant="outline" disabled={!filtered.length} onClick={() => setPrinting(true)}>
            Print
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <div className="d-flex flex-wrap align-items-end gap-2 mb-3 no-print">
          <CButtonGroup className="flex-wrap">
            {PRESETS.map((p) => (
              <CButton key={p} size="sm" color="primary" variant={preset === p ? undefined : 'outline'} onClick={() => choosePreset(p)}>
                {p}
              </CButton>
            ))}
          </CButtonGroup>
          <div>
            <CFormLabel className="small mb-0">From</CFormLabel>
            <CFormInput type="date" size="sm" value={range.from} max={range.to || undefined}
              invalid={!validRange} onChange={(e) => setDate('from', e.target.value)} />
          </div>
          <div>
            <CFormLabel className="small mb-0">To</CFormLabel>
            <CFormInput type="date" size="sm" value={range.to} min={range.from || undefined}
              invalid={!validRange} onChange={(e) => setDate('to', e.target.value)} />
          </div>
          {!validRange && <div className="small text-danger pb-1">Choose a From date on or before the To date.</div>}
        </div>

        <CRow className="g-2 mb-3">
          {cards.map((c) => (
            <CCol key={c.label} xs={6} md={4} xl>
              <div className="h-100 rounded border p-2">
                <div className="small fw-semibold text-body-secondary">{c.label}</div>
                <div className="fw-bold">{loading ? '…' : c.value}</div>
                {!loading && <div className="small text-body-secondary">{c.sub}</div>}
              </div>
            </CCol>
          ))}
        </CRow>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-3 no-print">
          <CFormInput
            type="search"
            placeholder="Search job, unit, tenant or assignee..."
            style={{ maxWidth: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CFormSelect style={{ maxWidth: 190 }} value={building} onChange={(e) => setBuilding(e.target.value)}>
            <option value="">All Buildings</option>
            {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
          </CFormSelect>
          <CFormSelect style={{ maxWidth: 170 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </CFormSelect>
          <CFormSelect style={{ maxWidth: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </CFormSelect>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <div className="fw-semibold me-auto">Summary by {groupBy.toLowerCase()}</div>
          <CButtonGroup className="no-print flex-wrap">
            {Object.keys(GROUP_BY).map((g) => (
              <CButton key={g} size="sm" color="secondary" variant={groupBy === g ? undefined : 'outline'} onClick={() => setGroupBy(g)}>
                {g}
              </CButton>
            ))}
          </CButtonGroup>
        </div>
        <CTable hover responsive small className="align-middle mb-4">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>{groupBy}</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Jobs</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Cost (Completed)</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Cost (Open)</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Total Cost</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Billed</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Recovered</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Net Cost</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Avg Days</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {groups.map((g) => (
              <CTableRow key={g.key}>
                <CTableDataCell className="fw-semibold">{g.label}</CTableDataCell>
                <CTableDataCell className="text-end">
                  {g.jobs}
                  {g.cancelled > 0 && <span className="small text-body-secondary"> ({g.cancelled} cancelled)</span>}
                </CTableDataCell>
                <CTableDataCell className="text-end">{money(g.spent)}</CTableDataCell>
                <CTableDataCell className="text-end">{money(g.openCost)}</CTableDataCell>
                <CTableDataCell className="text-end fw-semibold">{money(g.cost)}</CTableDataCell>
                <CTableDataCell className="text-end">{money(g.billed)}</CTableDataCell>
                <CTableDataCell className="text-end text-success">{money(g.recovered)}</CTableDataCell>
                <CTableDataCell className="text-end fw-semibold">{fmt(g.net)}</CTableDataCell>
                <CTableDataCell className="text-end">{g.avgDays ?? '—'}</CTableDataCell>
              </CTableRow>
            ))}
            {!groups.length && (
              <CTableRow>
                <CTableDataCell colSpan={9} className="text-center text-muted py-4">
                  {loading ? 'Loading...' : 'No maintenance jobs in this period'}
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
          {groups.length > 0 && (
            <CTableFoot>
              <CTableRow className="fw-bold">
                <CTableDataCell>Total</CTableDataCell>
                <CTableDataCell className="text-end">{totals.jobs}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.spent)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.openCost)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.cost)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.billed)}</CTableDataCell>
                <CTableDataCell className="text-end text-success">{fmt(totals.recovered)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.net)}</CTableDataCell>
                <CTableDataCell className="text-end">{totals.avgDays ?? '—'}</CTableDataCell>
              </CTableRow>
            </CTableFoot>
          )}
        </CTable>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <div className="fw-semibold me-auto">Jobs</div>
          <div className="no-print">
            <PageSizeSelect pageSize={pageSize} onChange={(size) => { setPageSize(size); setPageIndex(0) }} />
          </div>
        </div>
        <CTable hover responsive small className="align-middle">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Job</CTableHeaderCell>
              <CTableHeaderCell>Location</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell>Reported</CTableHeaderCell>
              <CTableHeaderCell>Completed</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Cost</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Billed</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Recovered</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paged.map((j) => (
              <CTableRow key={j.jobId}>
                <CTableDataCell>
                  <div className="fw-semibold">#{j.jobId} {j.title}</div>
                  <div className="small text-body-secondary">
                    {j.category} · {j.priority}{j.assignedTo ? ` · ${j.assignedTo}` : ''}
                  </div>
                </CTableDataCell>
                <CTableDataCell className="small">
                  <div>{j.buildingName}{j.unitNumber ? ` – ${j.unitNumber}` : ''}</div>
                  {j.tenantName && <div className="text-body-secondary">{j.tenantName}</div>}
                </CTableDataCell>
                <CTableDataCell><CBadge color={STATUS_COLOR[j.status] || 'secondary'}>{j.status}</CBadge></CTableDataCell>
                <CTableDataCell className="small text-nowrap">{formatDay(j.reportedDate)}</CTableDataCell>
                <CTableDataCell className="small text-nowrap">
                  {j.completedDate ? formatDay(j.completedDate) : '—'}
                  {j.daysToComplete != null && <div className="text-body-secondary">{j.daysToComplete} days</div>}
                </CTableDataCell>
                <CTableDataCell className={`text-end ${j.status === 'Cancelled' ? 'text-decoration-line-through text-body-secondary' : 'fw-semibold'}`}>
                  {j.cost == null ? <span className="text-body-secondary" title="No cost entered">—</span> : fmt(j.cost)}
                </CTableDataCell>
                <CTableDataCell className="text-end">
                  {money(j.billed)}
                  {j.chargeInvoiceId && <div className="small text-body-secondary">Inv #{j.chargeInvoiceId}</div>}
                </CTableDataCell>
                <CTableDataCell className="text-end text-success">{money(j.recovered)}</CTableDataCell>
              </CTableRow>
            ))}
            {!paged.length && (
              <CTableRow>
                <CTableDataCell colSpan={8} className="text-center text-muted py-4">
                  {loading ? 'Loading...' : 'No maintenance jobs in this period'}
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
        <div className="no-print">
          <TablePagination pageIndex={pageIndex} pageSize={pageSize} total={filtered.length} onPageChange={setPageIndex} />
        </div>
        <ul className="small text-body-secondary mt-2 mb-0 ps-3">
          <li>A job counts in the period of its completed date, or its reported date while it is not completed.</li>
          <li>Cost of cancelled jobs is not counted. Cost of open jobs is the cost entered so far.</li>
          <li>Billed = the job&apos;s charge invoice to the tenant (unless cancelled); Recovered = what the tenant has paid on it.</li>
          {totals.noCost > 0 && (
            <li className="text-warning">{totals.noCost} completed job(s) have no cost entered.</li>
          )}
        </ul>
      </CCardBody>
    </CCard>
  )
}

export default MaintenanceCost
