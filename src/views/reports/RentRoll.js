import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge, CButton, CButtonGroup, CCard, CCardBody, CCardHeader, CCol, CFormInput, CFormSelect, CRow, CTable, CTableBody,
  CTableDataCell, CTableFoot, CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { reportService } from '../../services/report.service'
import { PageSizeSelect, TablePagination, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'
import { fmt } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay } from '../../utils/reminders'
import { UNIT_STATUS, unitStatusColor } from '../../utils/unitStatus'
import { EXPIRY_FILTERS, byBuilding, daysToExpiry, leaseStateOf, statusOfRow, summarize } from '../../utils/rentRoll'

// Occupancy / rent roll (as of today): every unit in use, its status (same rule as the Properties pages), the lease
// in force today, any lease booked to start later, contracted rent vs base rent, and what is owed on the unit.
const STATUSES = [UNIT_STATUS.OCCUPIED, UNIT_STATUS.AVAILABLE, UNIT_STATUS.RESERVED, UNIT_STATUS.MAINTENANCE]
const LEASE_COLOR = { Active: 'success', Holdover: 'warning', Renewed: 'info', 'No lease': 'secondary', Booked: 'info' }
const money = (v) => (Number(v) ? fmt(v) : '—')
const pct = (v) => (v == null ? '—' : `${v}%`)

const ExpiryCell = ({ days }) => {
  if (days == null) return <span className="text-body-secondary">—</span>
  if (days < 0) return <span className="text-danger fw-semibold">{-days} days ago</span>
  return <span className={days <= 30 ? 'text-danger fw-semibold' : days <= 90 ? 'text-warning fw-semibold' : ''}>{days} days</span>
}

const RentRoll = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState('')
  const [status, setStatus] = useState('')
  const [expiry, setExpiry] = useState('')
  const [search, setSearch] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    reportService.getRentRoll().then((d) => { setRows(d); setLoading(false) })
  }, [])

  // Print every filtered unit (not just the current page), then go back to paging
  useEffect(() => {
    if (!printing) return undefined
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 50)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done) }
  }, [printing])

  // "Today" comes from the server, so expiry days match the lease pages
  const today = String(rows[0]?.asOfDate || todayLocal()).slice(0, 10)
  const buildings = useMemo(() => [...new Set(rows.map((r) => r.buildingName).filter(Boolean))].sort(), [rows])

  const enriched = useMemo(
    () => rows.map((r) => ({ ...r, unitStatus: statusOfRow(r), leaseState: leaseStateOf(r, today), expiryDays: daysToExpiry(r, today) })),
    [rows, today],
  )
  const inBuilding = useMemo(() => (building ? enriched.filter((r) => r.buildingName === building) : enriched), [enriched, building])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const exp = EXPIRY_FILTERS.find((f) => f.key === expiry)
    return inBuilding.filter((r) =>
      (!status || r.unitStatus === status) &&
      (!exp || exp.test(r.expiryDays)) &&
      (!q || [r.unitNumber, r.tenantName, r.nextTenantName, r.floorNumber, r.propertyType]
        .some((v) => String(v || '').toLowerCase().includes(q))))
  }, [inBuilding, status, expiry, search])

  // Cards and building table: building filter only, so they show the whole picture; the table follows every filter
  const summary = useMemo(() => summarize(inBuilding, today), [inBuilding, today])
  const buildingRows = useMemo(() => byBuilding(inBuilding, today), [inBuilding, today])
  const tableTotals = useMemo(() => summarize(filtered, today), [filtered, today])

  useEffect(() => { setPageIndex(0) }, [building, status, expiry, search])
  const paged = printing ? filtered : filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const exportRows = () => exportCSV(
    [
      { accessorKey: 'buildingName', header: 'Building' },
      { accessorKey: 'floorNumber', header: 'Floor' },
      { accessorKey: 'unitNumber', header: 'Unit' },
      { accessorKey: 'propertyType', header: 'Type' },
      { accessorKey: 'unitStatus', header: 'Status' },
      { accessorKey: 'tenantName', header: 'Tenant' },
      { accessorKey: 'contact', header: 'Phone' },
      { accessorKey: 'leaseId', header: 'Lease #' },
      { accessorKey: 'leaseState', header: 'Lease' },
      { accessorKey: 'startDate', header: 'Start Date' },
      { accessorKey: 'endDate', header: 'End Date' },
      { accessorKey: 'expiryDays', header: 'Days To End' },
      { accessorKey: 'currentRent', header: 'Monthly Rent' },
      { accessorKey: 'baseRent', header: 'Base Rent' },
      { accessorKey: 'nextTenantName', header: 'Next Tenant' },
      { accessorKey: 'nextStartDate', header: 'Next Start Date' },
      { accessorKey: 'nextRent', header: 'Next Rent' },
      { accessorKey: 'arrears', header: 'Owed Now' },
    ],
    filtered,
    `rent-roll-${today}${building ? `-${building.replace(/[^\w-]+/g, '_')}` : ''}.csv`,
  )

  const cards = [
    { label: 'Units', value: summary.units, sub: `${summary.available} available · ${summary.reserved} reserved · ${summary.maintenance} maintenance` },
    { label: 'Occupied', value: `${summary.occupied} (${pct(summary.occupancy)})`, sub: 'of all units' },
    { label: 'Monthly Rent (leases)', value: `PKR ${fmt(summary.contractedRent)}`, sub: `${pct(summary.economicOccupancy)} of base rent PKR ${fmt(summary.potentialRent)}` },
    { label: 'Base Rent of Empty Units', value: `PKR ${fmt(summary.vacancyLoss)}`, sub: 'per month, not earning' },
    { label: 'Leases Ending', value: `${summary.ends30} / ${summary.ends60} / ${summary.ends90}`, sub: `in 30 / 60 / 90 days · ${summary.holdover} past end date` },
    { label: 'Owed Now', value: `PKR ${fmt(summary.arrears)}`, sub: 'on these units' },
  ]

  return (
    <CCard className="border-0 shadow-sm mb-4 report-print">
      <CCardHeader className="py-3 px-4 d-flex flex-wrap align-items-center gap-2">
        <div className="me-auto">
          <div className="fw-semibold fs-5">Occupancy / Rent Roll</div>
          <div className="small text-body-secondary">
            Every unit with its status, current lease and rent, as of {formatDay(today)}.
            {building && ` Building: ${building}.`}
          </div>
        </div>
        <div className="d-flex gap-2 no-print">
          <CButton size="sm" color="secondary" variant="outline" disabled={!filtered.length} onClick={exportRows}>
            Export CSV
          </CButton>
          <CButton size="sm" color="primary" variant="outline" disabled={!filtered.length} onClick={() => setPrinting(true)}>
            Print
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <CRow className="g-2 mb-3">
          {cards.map((c) => (
            <CCol key={c.label} xs={6} md={4} xl={2}>
              <div className="h-100 rounded border p-2">
                <div className="small fw-semibold text-body-secondary">{c.label}</div>
                <div className="fw-bold">{loading ? '…' : c.value}</div>
                {!loading && <div className="small text-body-secondary">{c.sub}</div>}
              </div>
            </CCol>
          ))}
        </CRow>

        {!building && buildingRows.length > 1 && (
          <CTable small responsive bordered className="align-middle mb-4">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Building</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Units</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Occupied</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Available</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Reserved</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Maintenance</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Occupancy</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Monthly Rent</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Base Rent</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Owed Now</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {buildingRows.map((b) => (
                <CTableRow key={b.buildingName}>
                  <CTableDataCell className="fw-semibold">
                    <CButton color="link" size="sm" className="p-0 no-print" onClick={() => setBuilding(b.buildingName)}>
                      {b.buildingName}
                    </CButton>
                    <span className="d-none d-print-inline">{b.buildingName}</span>
                  </CTableDataCell>
                  <CTableDataCell className="text-end">{b.units}</CTableDataCell>
                  <CTableDataCell className="text-end">{b.occupied}</CTableDataCell>
                  <CTableDataCell className="text-end">{b.available}</CTableDataCell>
                  <CTableDataCell className="text-end">{b.reserved}</CTableDataCell>
                  <CTableDataCell className="text-end">{b.maintenance}</CTableDataCell>
                  <CTableDataCell className="text-end fw-semibold">{pct(b.occupancy)}</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(b.contractedRent)}</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(b.potentialRent)}</CTableDataCell>
                  <CTableDataCell className="text-end">{money(b.arrears)}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
            <CTableFoot>
              <CTableRow className="fw-bold">
                <CTableDataCell>Total</CTableDataCell>
                <CTableDataCell className="text-end">{summary.units}</CTableDataCell>
                <CTableDataCell className="text-end">{summary.occupied}</CTableDataCell>
                <CTableDataCell className="text-end">{summary.available}</CTableDataCell>
                <CTableDataCell className="text-end">{summary.reserved}</CTableDataCell>
                <CTableDataCell className="text-end">{summary.maintenance}</CTableDataCell>
                <CTableDataCell className="text-end">{pct(summary.occupancy)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(summary.contractedRent)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(summary.potentialRent)}</CTableDataCell>
                <CTableDataCell className="text-end">{money(summary.arrears)}</CTableDataCell>
              </CTableRow>
            </CTableFoot>
          </CTable>
        )}

        <div className="d-flex flex-wrap align-items-center gap-2 mb-2 no-print">
          <CFormInput
            type="search"
            placeholder="Search unit, tenant, floor or type..."
            style={{ maxWidth: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CFormSelect style={{ maxWidth: 200 }} value={building} onChange={(e) => setBuilding(e.target.value)}>
            <option value="">All Buildings</option>
            {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
          </CFormSelect>
          <CFormSelect style={{ maxWidth: 190 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </CFormSelect>
          <CButtonGroup className="ms-auto flex-wrap">
            <CButton size="sm" color="secondary" variant={expiry ? 'outline' : undefined} onClick={() => setExpiry('')}>All Leases</CButton>
            {EXPIRY_FILTERS.map((f) => (
              <CButton key={f.key} size="sm" color="secondary" variant={expiry === f.key ? undefined : 'outline'} onClick={() => setExpiry(f.key)}>
                {f.label}
              </CButton>
            ))}
          </CButtonGroup>
        </div>
        <div className="mb-2 no-print">
          <PageSizeSelect pageSize={pageSize} onChange={(size) => { setPageSize(size); setPageIndex(0) }} />
        </div>

        <CTable hover responsive small className="align-middle">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Unit</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell>Tenant</CTableHeaderCell>
              <CTableHeaderCell>Lease</CTableHeaderCell>
              <CTableHeaderCell>Term</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Ends In</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Monthly Rent</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Base Rent</CTableHeaderCell>
              <CTableHeaderCell>Next Lease</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Owed Now</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paged.map((r) => {
              const diff = r.currentRent != null && r.baseRent ? Number(r.currentRent) - Number(r.baseRent) : 0
              return (
                <CTableRow key={r.unitId}>
                  <CTableDataCell>
                    <div className="fw-semibold">{r.buildingName} – {r.unitNumber}</div>
                    <div className="small text-body-secondary">Floor {r.floorNumber}{r.propertyType ? ` · ${r.propertyType}` : ''}</div>
                  </CTableDataCell>
                  <CTableDataCell><CBadge color={unitStatusColor[r.unitStatus]}>{r.unitStatus}</CBadge></CTableDataCell>
                  <CTableDataCell>
                    {r.tenantName ? <div className="fw-semibold">{r.tenantName}</div> : <span className="text-body-secondary">—</span>}
                    {r.contact && <div className="small text-body-secondary">{r.contact}</div>}
                  </CTableDataCell>
                  <CTableDataCell>
                    {r.leaseState ? <CBadge color={LEASE_COLOR[r.leaseState]}>{r.leaseState}</CBadge> : '—'}
                    {r.leaseId && <div className="small text-body-secondary">#{r.leaseId}</div>}
                  </CTableDataCell>
                  <CTableDataCell className="small text-nowrap">
                    {r.leaseId ? `${formatDay(r.startDate)} – ${formatDay(r.endDate)}` : '—'}
                  </CTableDataCell>
                  <CTableDataCell className="text-end small"><ExpiryCell days={r.expiryDays} /></CTableDataCell>
                  <CTableDataCell className="text-end fw-semibold">
                    {money(r.currentRent)}
                    {diff !== 0 && (
                      <div className={`small ${diff < 0 ? 'text-danger' : 'text-success'}`} title="Compared with the unit's base rent">
                        {diff > 0 ? '+' : '−'}{fmt(Math.abs(diff))}
                      </div>
                    )}
                  </CTableDataCell>
                  <CTableDataCell className="text-end">{money(r.baseRent)}</CTableDataCell>
                  <CTableDataCell className="small">
                    {r.nextLeaseId ? (
                      <>
                        <div>{r.nextTenantName === r.tenantName ? 'Renewal' : r.nextTenantName}</div>
                        <div className="text-body-secondary">from {formatDay(r.nextStartDate)} · {fmt(r.nextRent)}</div>
                      </>
                    ) : '—'}
                  </CTableDataCell>
                  <CTableDataCell className={`text-end ${Number(r.arrears) > 0 ? 'text-danger fw-semibold' : ''}`}>{money(r.arrears)}</CTableDataCell>
                </CTableRow>
              )
            })}
            {!paged.length && (
              <CTableRow>
                <CTableDataCell colSpan={10} className="text-center text-muted py-4">
                  {loading ? 'Loading...' : 'No units match'}
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
          {filtered.length > 0 && (
            <CTableFoot>
              <CTableRow className="fw-bold">
                <CTableDataCell colSpan={6}>
                  Total ({tableTotals.units} unit{tableTotals.units === 1 ? '' : 's'}, {tableTotals.occupied} occupied)
                </CTableDataCell>
                <CTableDataCell className="text-end">{fmt(tableTotals.contractedRent)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(tableTotals.potentialRent)}</CTableDataCell>
                <CTableDataCell />
                <CTableDataCell className="text-end">{money(tableTotals.arrears)}</CTableDataCell>
              </CTableRow>
            </CTableFoot>
          )}
        </CTable>
        <div className="no-print">
          <TablePagination pageIndex={pageIndex} pageSize={pageSize} total={filtered.length} onPageChange={setPageIndex} />
        </div>
        <div className="small text-body-secondary mt-2">
          Status follows the leases, like the Properties pages: a unit with an active lease is Occupied, even when that lease
          starts later (shown as Booked). Monthly Rent = the rent of the lease in force today. Ends In is shown for leases with
          no next term booked; past their end date they are still billed month to month until ended.
        </div>
      </CCardBody>
    </CCard>
  )
}

export default RentRoll
