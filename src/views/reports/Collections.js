import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CBadge, CButton, CButtonGroup, CCard, CCardBody, CCardHeader, CCol, CFormInput, CFormLabel, CFormSelect, CRow,
  CTable, CTableBody, CTableDataCell, CTableFoot, CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { reportService } from '../../services/report.service'
import CompanyHeader from '../../components/common/CompanyHeader'
import TenantFilter from '../../components/rent/TenantFilter'
import { PageSizeSelect, TablePagination, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'
import { fmt } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay, invoiceLabel } from '../../utils/reminders'
import { GROUP_BY, PRESETS, groupPayments, isReversalRow, presetRange, totalsOf } from '../../utils/collections'

// Collections: money actually received (by payment date), totalled by day, month, method, building or tenant.
// Read only. The date range is loaded from the API; the other filters work on the loaded payments.
const isWaived = (p) => p.lateFeeWaived === true || p.lateFeeWaived === 1
// Reversal = a payment entered by mistake, taken back on this date (negative amounts); Reversed = taken back later
const rowType = (p) =>
  isReversalRow(p) ? `Reversal of #${p.reversalOfPaymentId}` : p.reversedByPaymentId != null ? 'Reversed' : ''
const money = (v) => (Number(v) ? fmt(v) : '—')

const Collections = () => {
  const [preset, setPreset] = useState('This Month')
  const [range, setRange] = useState(() => presetRange('This Month', todayLocal()))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState('Day')
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [building, setBuilding] = useState('')
  const [method, setMethod] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [printing, setPrinting] = useState(false)
  const requestId = useRef(0)

  const validRange = range.from && range.to && range.from <= range.to

  // Only the latest request may set the rows (the range can change while a load is still running)
  useEffect(() => {
    if (!validRange) {
      requestId.current += 1 // ignore a load that is still running
      setRows([])
      setLoading(false)
      return
    }
    const id = ++requestId.current
    setLoading(true)
    reportService.getCollections(range.from, range.to).then((d) => {
      if (id !== requestId.current) return
      setRows(d)
      setLoading(false)
    })
  }, [range.from, range.to, validRange])

  // Print every filtered payment (not just the current page), then go back to paging
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
  const methods = useMemo(() => [...new Set(rows.map((r) => r.method).filter(Boolean))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((p) =>
      (!tenantFilter || p.tenantName === tenantFilter) &&
      (!building || p.buildingName === building) &&
      (!method || p.method === method) &&
      (!q || String(p.tenantName || '').toLowerCase().includes(q) ||
        String(p.unitNumber || '').toLowerCase().includes(q) ||
        String(p.invoiceId || '').includes(q) || String(p.paymentId).includes(q)))
  }, [rows, search, tenantFilter, building, method])

  const totals = useMemo(() => totalsOf(filtered), [filtered])
  const groups = useMemo(() => groupPayments(filtered, groupBy), [filtered, groupBy])

  useEffect(() => { setPageIndex(0) }, [search, tenantFilter, building, method, range.from, range.to])
  const paged = printing ? filtered : filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const rangeText = validRange ? `${formatDay(range.from)} to ${formatDay(range.to)}` : ''
  const fileSuffix = `${range.from}_to_${range.to}`

  const exportSummary = () => exportCSV(
    [
      { accessorKey: 'label', header: groupBy },
      { accessorKey: 'count', header: 'Payments' },
      { accessorKey: 'amount', header: 'Received' },
      { accessorKey: 'discount', header: 'Discount' },
      { accessorKey: 'waived', header: 'Late Fees Waived' },
      { accessorKey: 'share', header: '% of Received' },
    ],
    [...groups, { label: 'TOTAL', ...totals, share: totals.amount ? 100 : 0 }],
    `collections-by-${groupBy.toLowerCase()}-${fileSuffix}.csv`,
  )

  const exportPayments = () => exportCSV(
    [
      { accessorKey: 'paymentDate', header: 'Payment Date' },
      { accessorKey: 'paymentId', header: 'Payment #' },
      { accessorKey: 'tenantName', header: 'Tenant' },
      { accessorKey: 'buildingName', header: 'Building' },
      { accessorKey: 'unitNumber', header: 'Unit' },
      { accessorKey: 'invoiceId', header: 'Invoice #' },
      { accessorKey: 'for', header: 'For' },
      { accessorKey: 'method', header: 'Method' },
      { accessorKey: 'amount', header: 'Received' },
      { accessorKey: 'discount', header: 'Discount' },
      { accessorKey: 'waived', header: 'Late Fee Waived' },
      { accessorKey: 'reversal', header: 'Reversal' },
      { accessorKey: 'recordedBy', header: 'Recorded By' },
      { accessorKey: 'notes', header: 'Notes' },
    ],
    filtered.map((p) => ({
      ...p,
      for: p.invoiceId ? invoiceLabel(p) : '',
      waived: isWaived(p) ? 'Yes' : isReversalRow(p) && p.reversesWaiver ? 'Waiver reversed' : '',
      reversal: rowType(p),
    })),
    `collections-payments-${fileSuffix}.csv`,
  )

  const cards = [
    { label: 'Total Received', value: `PKR ${fmt(totals.amount)}`, strong: true },
    {
      label: 'Payments',
      value: `${totals.count} from ${totals.tenants} tenant${totals.tenants === 1 ? '' : 's'}${
        totals.reversals ? ` · ${totals.reversals} reversal${totals.reversals === 1 ? '' : 's'}` : ''}`,
    },
    { label: 'Discounts Given', value: `PKR ${fmt(totals.discount)}` },
    { label: 'Late Fees Waived', value: `${totals.waived} payment${totals.waived === 1 ? '' : 's'}` },
  ]

  return (
    <CCard className="border-0 shadow-sm mb-4 report-print">
      <div className="px-4 pt-3 d-none d-print-block">
        <CompanyHeader />
      </div>
      <CCardHeader className="py-3 px-4 d-flex flex-wrap align-items-center gap-2">
        <div className="me-auto">
          <div className="fw-semibold fs-5">Collections</div>
          <div className="small text-body-secondary">
            Money received by payment date{rangeText && `, ${rangeText}`}.
            {building && ` Building: ${building}.`}
            {method && ` Method: ${method}.`}
            {tenantFilter && ` Tenant: ${tenantFilter}.`}
          </div>
        </div>
        <div className="d-flex gap-2 no-print">
          <CButton size="sm" color="secondary" variant="outline" disabled={!filtered.length} onClick={exportSummary}>
            Export Summary
          </CButton>
          <CButton size="sm" color="secondary" variant="outline" disabled={!filtered.length} onClick={exportPayments}>
            Export Payments
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
            <CCol key={c.label} xs={6} lg={3}>
              <div className={`h-100 rounded border p-2 ${c.strong ? 'bg-body-tertiary' : 'bg-body'}`}>
                <div className="small fw-semibold text-body-secondary">{c.label}</div>
                <div className={c.strong ? 'fw-bold' : 'fw-semibold'}>{loading ? '…' : c.value}</div>
              </div>
            </CCol>
          ))}
        </CRow>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-3 no-print">
          <CFormInput
            type="search"
            placeholder="Search tenant, unit, invoice # or payment #..."
            style={{ maxWidth: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ minWidth: 220 }}>
            <TenantFilter names={rows.map((r) => r.tenantName)} value={tenantFilter} onChange={setTenantFilter} />
          </div>
          <CFormSelect style={{ maxWidth: 200 }} value={building} onChange={(e) => setBuilding(e.target.value)}>
            <option value="">All Buildings</option>
            {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
          </CFormSelect>
          <CFormSelect style={{ maxWidth: 180 }} value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">All Methods</option>
            {methods.map((m) => <option key={m} value={m}>{m}</option>)}
          </CFormSelect>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <div className="fw-semibold me-auto">Summary by {groupBy.toLowerCase()}</div>
          <CButtonGroup className="no-print">
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
              <CTableHeaderCell className="text-end">Payments</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Received</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Discount</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Late Fees Waived</CTableHeaderCell>
              <CTableHeaderCell className="text-end">% of Received</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {groups.map((g) => (
              <CTableRow key={g.key}>
                <CTableDataCell>{groupBy === 'Day' ? formatDay(g.key) : g.label}</CTableDataCell>
                <CTableDataCell className="text-end">{g.count}</CTableDataCell>
                <CTableDataCell className="text-end fw-semibold">{fmt(g.amount)}</CTableDataCell>
                <CTableDataCell className="text-end">{money(g.discount)}</CTableDataCell>
                <CTableDataCell className="text-end">{g.waived || '—'}</CTableDataCell>
                <CTableDataCell className="text-end">{g.share}%</CTableDataCell>
              </CTableRow>
            ))}
            {!groups.length && (
              <CTableRow>
                <CTableDataCell colSpan={6} className="text-center text-muted py-4">
                  {loading ? 'Loading...' : 'No payments in this period'}
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
          {groups.length > 0 && (
            <CTableFoot>
              <CTableRow className="fw-bold">
                <CTableDataCell>Total</CTableDataCell>
                <CTableDataCell className="text-end">{totals.count}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.amount)}</CTableDataCell>
                <CTableDataCell className="text-end">{money(totals.discount)}</CTableDataCell>
                <CTableDataCell className="text-end">{totals.waived || '—'}</CTableDataCell>
                <CTableDataCell className="text-end">{totals.amount ? '100%' : '—'}</CTableDataCell>
              </CTableRow>
            </CTableFoot>
          )}
        </CTable>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <div className="fw-semibold me-auto">Payments</div>
          <div className="no-print">
            <PageSizeSelect pageSize={pageSize} onChange={(size) => { setPageSize(size); setPageIndex(0) }} />
          </div>
        </div>
        <CTable hover responsive small className="align-middle">
          <CTableHead>
            <CTableRow>
              {['Date', 'Payment #', 'Tenant', 'Unit', 'Invoice #', 'For', 'Method'].map((h) => (
                <CTableHeaderCell key={h}>{h}</CTableHeaderCell>
              ))}
              <CTableHeaderCell className="text-end">Received</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Discount</CTableHeaderCell>
              <CTableHeaderCell>Recorded By</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paged.map((p) => (
              <CTableRow key={p.paymentId}>
                <CTableDataCell>{formatDay(p.paymentDate)}</CTableDataCell>
                <CTableDataCell>#{p.paymentId}</CTableDataCell>
                <CTableDataCell className="fw-semibold">{p.tenantName}</CTableDataCell>
                <CTableDataCell className="small">
                  {p.unitNumber ? `${p.buildingName ? `${p.buildingName} – ` : ''}${p.unitNumber}` : '—'}
                </CTableDataCell>
                <CTableDataCell>{p.invoiceId ? `#${p.invoiceId}` : '—'}</CTableDataCell>
                <CTableDataCell>
                  {p.invoiceId ? invoiceLabel(p) : '—'}
                  {isWaived(p) && <CBadge color="warning" className="ms-1">Late fee waived</CBadge>}
                  {rowType(p) && <CBadge color="danger" className="ms-1">{rowType(p)}</CBadge>}
                </CTableDataCell>
                <CTableDataCell>{p.method}</CTableDataCell>
                <CTableDataCell className="text-end fw-semibold">{fmt(p.amount)}</CTableDataCell>
                <CTableDataCell className="text-end">{money(p.discount)}</CTableDataCell>
                <CTableDataCell className="small">{p.recordedBy || '—'}</CTableDataCell>
              </CTableRow>
            ))}
            {!paged.length && (
              <CTableRow>
                <CTableDataCell colSpan={10} className="text-center text-muted py-4">
                  {loading ? 'Loading...' : 'No payments in this period'}
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
        <div className="no-print">
          <TablePagination pageIndex={pageIndex} pageSize={pageSize} total={filtered.length} onPageChange={setPageIndex} />
        </div>
      </CCardBody>
    </CCard>
  )
}

export default Collections
