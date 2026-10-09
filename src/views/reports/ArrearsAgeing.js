import React, { useEffect, useMemo, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CFormInput, CFormSelect, CRow, CTable, CTableBody, CTableDataCell,
  CTableFoot, CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { reportService } from '../../services/report.service'
import CompanyHeader from '../../components/common/CompanyHeader'
import TenantFilter from '../../components/rent/TenantFilter'
import { PageSizeSelect, TablePagination, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'
import { fmt } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay, invoiceLabel } from '../../utils/reminders'
import { BUCKETS, groupArrears, totalsOf } from '../../utils/arrears'

// Arrears ageing: what each tenant owes, split by how long it is overdue. Read only.
// Owed = balance + open late fee (same as Rent Collection / Reminders). Overpaid invoices show as Credit.
const BUCKET_COLOR = { current: 'secondary', d30: 'info', d60: 'warning', d90: 'danger', d90plus: 'danger' }
const money = (v) => (Number(v) ? fmt(v) : '—')

const ArrearsAgeing = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [building, setBuilding] = useState('')
  const [bucket, setBucket] = useState('')
  const [expanded, setExpanded] = useState({})
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    reportService.getArrearsAgeing().then((d) => { setRows(d); setLoading(false) })
  }, [])

  // Print every filtered tenant (not just the current page), then go back to paging
  useEffect(() => {
    if (!printing) return undefined
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 50)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done) }
  }, [printing])

  const asOf = rows[0]?.asOfDate || todayLocal()
  const buildings = useMemo(() => [...new Set(rows.map((r) => r.buildingName).filter(Boolean))].sort(), [rows])

  // Building filter works on invoices, so a tenant in two buildings shows only that building's amounts
  const groups = useMemo(
    () => groupArrears(building ? rows.filter((r) => r.buildingName === building) : rows),
    [rows, building],
  )

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    return groups
      .filter((g) =>
        (!tenantFilter || g.tenantName === tenantFilter) &&
        (!q || g.tenantName.toLowerCase().includes(q) ||
          g.invoices.some((i) => String(i.unitNumber || '').toLowerCase().includes(q) || String(i.invoiceId).includes(q))))
      .sort((a, b) => b.net - a.net || a.tenantName.localeCompare(b.tenantName))
  }, [groups, tenantFilter, search])

  // Cards always show the totals for the search/tenant/building filters; a clicked card limits the table to that bucket
  const cardTotals = useMemo(() => totalsOf(searched), [searched])
  const filtered = bucket ? searched.filter((g) => g[bucket] > 0) : searched
  const totals = useMemo(() => totalsOf(filtered), [filtered])
  const showCredit = totals.credit > 0

  useEffect(() => { setPageIndex(0) }, [search, tenantFilter, building, bucket])
  const paged = printing ? filtered : filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const exportSummary = () => exportCSV(
    [
      { accessorKey: 'tenantName', header: 'Tenant' },
      { accessorKey: 'units', header: 'Units' },
      { accessorKey: 'phone', header: 'Phone' },
      ...BUCKETS.map((b) => ({ accessorKey: b.key, header: b.label })),
      { accessorKey: 'total', header: 'Total Owed' },
      { accessorKey: 'credit', header: 'Credit' },
      { accessorKey: 'net', header: 'Net' },
      { accessorKey: 'oldestDays', header: 'Oldest (days overdue)' },
    ],
    [
      ...filtered.map((g) => ({ ...g, units: [...g.units].join('; ') })),
      { tenantName: 'TOTAL', ...totals },
    ],
    `arrears-ageing-${asOf}.csv`,
  )

  const exportInvoices = () => exportCSV(
    [
      { accessorKey: 'tenantName', header: 'Tenant' },
      { accessorKey: 'invoiceId', header: 'Invoice #' },
      { accessorKey: 'leaseId', header: 'Lease #' },
      { accessorKey: 'buildingName', header: 'Building' },
      { accessorKey: 'unitNumber', header: 'Unit' },
      { accessorKey: 'for', header: 'For' },
      { accessorKey: 'dueDate', header: 'Due Date' },
      { accessorKey: 'daysOverdue', header: 'Days Overdue' },
      { accessorKey: 'bucketLabel', header: 'Bucket' },
      { accessorKey: 'balance', header: 'Balance' },
      { accessorKey: 'lateFee', header: 'Open Late Fee' },
      { accessorKey: 'owed', header: 'Owed' },
    ],
    filtered.flatMap((g) => g.invoices
      .filter((i) => !bucket || i.bucket === bucket)
      .map((i) => ({
        ...i, for: invoiceLabel(i),
        bucketLabel: Number(i.owed) < 0 ? 'Credit' : BUCKETS.find((b) => b.key === i.bucket).label,
      }))),
    `arrears-ageing-invoices-${asOf}.csv`,
  )

  const colCount = 9 + (showCredit ? 2 : 0) + 1

  return (
    <CCard className="border-0 shadow-sm mb-4 report-print">
      <div className="px-4 pt-3 d-none d-print-block">
        <CompanyHeader />
      </div>
      <CCardHeader className="py-3 px-4 d-flex flex-wrap align-items-center gap-2">
        <div className="me-auto">
          <div className="fw-semibold fs-5">Arrears Ageing</div>
          <div className="small text-body-secondary">
            Unpaid amounts by tenant, grouped by days past the due date. As of {formatDay(asOf)}.
            {building && ` Building: ${building}.`}
          </div>
        </div>
        <div className="d-flex gap-2 no-print">
          <CButton size="sm" color="secondary" variant="outline" disabled={!filtered.length} onClick={exportSummary}>
            Export Summary
          </CButton>
          <CButton size="sm" color="secondary" variant="outline" disabled={!filtered.length} onClick={exportInvoices}>
            Export Invoices
          </CButton>
          <CButton size="sm" color="primary" variant="outline" disabled={!filtered.length} onClick={() => setPrinting(true)}>
            Print
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <CRow className="g-2 mb-3">
          {BUCKETS.map((b) => (
            <CCol key={b.key} xs={6} md={4} xl={2}>
              <button
                type="button"
                className={`w-100 h-100 text-start rounded border p-2 bg-body ${bucket === b.key ? `border-2 border-${BUCKET_COLOR[b.key]}` : ''}`}
                title={bucket === b.key ? 'Show all' : `Show tenants with amounts ${b.label === 'Current' ? 'not overdue yet' : `${b.label} overdue`}`}
                onClick={() => setBucket(bucket === b.key ? '' : b.key)}
              >
                <div className={`small text-${BUCKET_COLOR[b.key]} fw-semibold`}>{b.label}</div>
                <div className="fw-semibold">PKR {fmt(cardTotals[b.key])}</div>
              </button>
            </CCol>
          ))}
          <CCol xs={6} md={4} xl={2}>
            <div className="h-100 rounded border p-2 bg-body-tertiary">
              <div className="small fw-semibold">Total Owed</div>
              <div className="fw-bold">PKR {fmt(cardTotals.total)}</div>
              {cardTotals.credit > 0 && (
                <div className="small text-body-secondary">Net PKR {fmt(cardTotals.net)} after credit</div>
              )}
            </div>
          </CCol>
        </CRow>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-3 no-print">
          <CFormInput
            type="search"
            placeholder="Search tenant, unit or invoice #..."
            style={{ maxWidth: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ minWidth: 220 }}>
            <TenantFilter names={rows.map((r) => r.tenantName)} value={tenantFilter} onChange={setTenantFilter} />
          </div>
          <CFormSelect style={{ maxWidth: 220 }} value={building} onChange={(e) => setBuilding(e.target.value)}>
            <option value="">All Buildings</option>
            {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
          </CFormSelect>
          {bucket && (
            <CButton size="sm" color="link" onClick={() => setBucket('')}>
              Clear bucket filter ({BUCKETS.find((b) => b.key === bucket).label})
            </CButton>
          )}
        </div>

        <div className="mb-2 no-print">
          <PageSizeSelect pageSize={pageSize} onChange={(size) => { setPageSize(size); setPageIndex(0) }} />
        </div>

        <CTable hover responsive small className="align-middle">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell className="no-print" style={{ width: 32 }} />
              <CTableHeaderCell>Tenant</CTableHeaderCell>
              <CTableHeaderCell>Unit(s)</CTableHeaderCell>
              {BUCKETS.map((b) => <CTableHeaderCell key={b.key} className="text-end">{b.label}</CTableHeaderCell>)}
              <CTableHeaderCell className="text-end">Total Owed</CTableHeaderCell>
              {showCredit && <CTableHeaderCell className="text-end">Credit</CTableHeaderCell>}
              {showCredit && <CTableHeaderCell className="text-end">Net</CTableHeaderCell>}
              <CTableHeaderCell className="text-end">Oldest</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paged.map((g) => {
              const open = !!expanded[g.tenantId]
              return (
                <React.Fragment key={g.tenantId}>
                  <CTableRow>
                    <CTableDataCell className="no-print">
                      <CButton size="sm" color="link" className="p-0" title={open ? 'Hide invoices' : 'Show invoices'}
                        onClick={() => setExpanded((p) => ({ ...p, [g.tenantId]: !p[g.tenantId] }))}>
                        {open ? '▾' : '▸'}
                      </CButton>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="fw-semibold">{g.tenantName}</div>
                      {g.phone && <div className="small text-body-secondary">{g.phone}</div>}
                    </CTableDataCell>
                    <CTableDataCell className="small">{[...g.units].join(', ') || '—'}</CTableDataCell>
                    {BUCKETS.map((b) => (
                      <CTableDataCell key={b.key} className={`text-end ${bucket === b.key ? 'fw-semibold' : ''}`}>
                        {money(g[b.key])}
                      </CTableDataCell>
                    ))}
                    <CTableDataCell className="text-end fw-semibold">{fmt(g.total)}</CTableDataCell>
                    {showCredit && <CTableDataCell className="text-end text-success">{money(g.credit)}</CTableDataCell>}
                    {showCredit && <CTableDataCell className="text-end fw-semibold">{fmt(g.net)}</CTableDataCell>}
                    <CTableDataCell className="text-end">{g.oldestDays > 0 ? `${g.oldestDays} days` : '—'}</CTableDataCell>
                  </CTableRow>
                  {open && (
                    <CTableRow>
                      <CTableDataCell colSpan={colCount} className="bg-body-tertiary">
                        <CTable small className="mb-0">
                          <CTableHead>
                            <CTableRow>
                              {['Invoice #', 'Lease #', 'Building', 'Unit', 'For', 'Due Date', 'Days Overdue', 'Balance', 'Open Late Fee', 'Owed'].map((h) => (
                                <CTableHeaderCell key={h}>{h}</CTableHeaderCell>
                              ))}
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {g.invoices.map((i) => (
                              <CTableRow key={i.invoiceId}>
                                <CTableDataCell>#{i.invoiceId}</CTableDataCell>
                                <CTableDataCell>{i.leaseId ? `#${i.leaseId}` : '—'}</CTableDataCell>
                                <CTableDataCell>{i.buildingName}</CTableDataCell>
                                <CTableDataCell>{i.unitNumber}</CTableDataCell>
                                <CTableDataCell>{invoiceLabel(i)}</CTableDataCell>
                                <CTableDataCell>{formatDay(i.dueDate)}</CTableDataCell>
                                <CTableDataCell>{Number(i.daysOverdue) > 0 ? i.daysOverdue : 'Not due'}</CTableDataCell>
                                <CTableDataCell>{fmt(i.balance)}</CTableDataCell>
                                <CTableDataCell>{money(i.lateFee)}</CTableDataCell>
                                <CTableDataCell className={Number(i.owed) < 0 ? 'text-success' : 'fw-semibold'}>
                                  {Number(i.owed) < 0 ? `${fmt(-i.owed)} credit` : fmt(i.owed)}
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </React.Fragment>
              )
            })}
            {!paged.length && (
              <CTableRow>
                <CTableDataCell colSpan={colCount} className="text-center text-muted py-4">
                  {loading ? 'Loading...' : 'No arrears'}
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
          {filtered.length > 0 && (
            <CTableFoot>
              <CTableRow className="fw-bold">
                <CTableDataCell className="no-print" />
                <CTableDataCell colSpan={2}>Total ({filtered.length} tenant{filtered.length === 1 ? '' : 's'})</CTableDataCell>
                {BUCKETS.map((b) => <CTableDataCell key={b.key} className="text-end">{money(totals[b.key])}</CTableDataCell>)}
                <CTableDataCell className="text-end">{fmt(totals.total)}</CTableDataCell>
                {showCredit && <CTableDataCell className="text-end text-success">{fmt(totals.credit)}</CTableDataCell>}
                {showCredit && <CTableDataCell className="text-end">{fmt(totals.net)}</CTableDataCell>}
                <CTableDataCell />
              </CTableRow>
            </CTableFoot>
          )}
        </CTable>
        <div className="no-print">
          <TablePagination pageIndex={pageIndex} pageSize={pageSize} total={filtered.length} onPageChange={setPageIndex} />
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ArrearsAgeing
