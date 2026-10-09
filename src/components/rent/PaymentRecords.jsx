import React, { useEffect, useMemo, useState } from 'react'
import { CBadge, CButton, CCard, CCardBody, CCardHeader, CFormInput, CTable, CTableHead, CTableRow,
  CTableHeaderCell, CTableBody, CTableDataCell } from '@coreui/react'
import { rentService } from '../../services/rent.service'
import { fmt, formatDate } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { toLocalDateString } from '../../utils/dates'
import { PageSizeSelect, TablePagination, DEFAULT_PAGE_SIZE } from '../common/TablePagination'
import TenantFilter from './TenantFilter'
import { hasReceipt, openReceipts, receiptNo } from '../../utils/documents'

const iso = toLocalDateString

const typeOf = (r) =>
  r.paymentMethod === 'Security Deposit' ? 'From deposit'
  : r.paymentMethod === 'Credit to Deposit' ? 'Credit moved'
  : Number(r.paymentAmount) > 0 ? 'Payment'
  : r.isLateFeeWaived ? 'Late fee waived'
  : Number(r.discountAmount) > 0 ? 'Discount'
  : 'Adjustment'

// Badge colour per type, so an adjustment (often money taken back) stands out from normal payments
const TYPE_COLOR = { Payment: 'success', Adjustment: 'warning', Discount: 'info', 'Late fee waived': 'secondary', 'From deposit': 'primary', 'Credit moved': 'dark' }

// CSV columns: the same as the table
const CSV_COLUMNS = [
  { accessorKey: 'paymentDate', header: 'Date' },
  { accessorKey: 'tenantName', header: 'Tenant' },
  { accessorKey: 'buildingName', header: 'Building' },
  { accessorKey: 'floorNumber', header: 'Floor' },
  { accessorKey: 'unitNumber', header: 'Unit' },
  { accessorKey: 'invoiceId', header: 'Invoice #' },
  { accessorKey: 'chargeType', header: 'Charge Type' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'paymentAmount', header: 'Paid' },
  { accessorKey: 'discountAmount', header: 'Discount' },
  { accessorKey: 'paymentMethod', header: 'Method' },
  { accessorKey: 'notes', header: 'Notes' },
  { accessorKey: 'receiptNo', header: 'Receipt No.' },
]

const PaymentRecords = () => {
  const [from, setFrom] = useState(iso(new Date(Date.now() - 90 * 864e5)))
  const [to, setTo] = useState(iso(new Date()))
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('') // '' = all tenants
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    let alive = true
    setLoading(true)
    rentService.getAllPayments(from, to).then((d) => {
      if (alive) { setRows(d); setLoading(false) }
    })
    return () => { alive = false }
  }, [from, to])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const byTenant = tenantFilter ? rows.filter((r) => r.tenantName === tenantFilter) : rows
    if (!q) return byTenant
    return byTenant.filter((r) =>
      [r.tenantName, r.buildingName, r.floorNumber, r.unitNumber, r.invoiceId, r.paymentMethod, r.notes, r.chargeType, typeOf(r),
        hasReceipt(r) ? receiptNo(r.paymentId) : '']
        .join(' ').toLowerCase().includes(q))
  }, [rows, search, tenantFilter])

  // Back to page 1 whenever the dates, tenant, search or page size change the list
  useEffect(() => { setPageIndex(0) }, [from, to, tenantFilter, search, pageSize])
  const paged = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const totalPaid = filtered.reduce((s, r) => s + Number(r.paymentAmount || 0), 0)
  const totalDisc = filtered.reduce((s, r) => s + Number(r.discountAmount || 0), 0)

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="py-3 px-4">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
          <div className="fw-semibold fs-5">Payment Records</div>
          {/* Exports what the filters show (all pages) */}
          <CButton color="success" variant="outline" disabled={loading || !filtered.length}
            onClick={() => exportCSV(CSV_COLUMNS, filtered.map((r) => ({ ...r, type: typeOf(r), receiptNo: hasReceipt(r) ? receiptNo(r.paymentId) : '' })), `payments_${from}_to_${to}.csv`)}>
            Export CSV
          </CButton>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <CFormInput type="date" style={{ maxWidth: 170 }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <CFormInput type="date" style={{ maxWidth: 170 }} value={to} onChange={(e) => setTo(e.target.value)} />
          <div style={{ minWidth: 240, maxWidth: 260 }} title="Tenant / Company">
            <TenantFilter names={rows.map((r) => r.tenantName)} value={tenantFilter} onChange={setTenantFilter} />
          </div>
          <CFormInput placeholder="Search tenant, invoice, method..." style={{ maxWidth: 260 }}
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="text-body-secondary small mt-2">
          {loading ? 'Loading...' : `${filtered.length} records | Paid ${fmt(totalPaid)} | Discounts ${fmt(totalDisc)}`}
        </div>
      </CCardHeader>
      <CCardBody>
        <div className="mb-2">
          <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
        </div>
        <CTable hover responsive small className="mb-0">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell>Tenant</CTableHeaderCell>
              <CTableHeaderCell>Building</CTableHeaderCell>
              <CTableHeaderCell>Floor</CTableHeaderCell>
              <CTableHeaderCell>Unit</CTableHeaderCell>
              <CTableHeaderCell>Invoice #</CTableHeaderCell>
              <CTableHeaderCell>Type</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Paid</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Discount</CTableHeaderCell>
              <CTableHeaderCell>Method</CTableHeaderCell>
              <CTableHeaderCell>Notes</CTableHeaderCell>
              <CTableHeaderCell>Receipt</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paged.map((r) => (
              <CTableRow key={r.paymentId}>
                <CTableDataCell>{formatDate(r.paymentDate)}</CTableDataCell>
                <CTableDataCell>{r.tenantName}</CTableDataCell>
                <CTableDataCell>{r.buildingName}</CTableDataCell>
                <CTableDataCell>{r.floorNumber}</CTableDataCell>
                <CTableDataCell>{r.unitNumber}</CTableDataCell>
                <CTableDataCell>#{r.invoiceId}{r.chargeType ? ` (${r.chargeType})` : ''}</CTableDataCell>
                <CTableDataCell><CBadge color={TYPE_COLOR[typeOf(r)]}>{typeOf(r)}</CBadge></CTableDataCell>
                <CTableDataCell className={`text-end ${Number(r.paymentAmount) < 0 ? 'text-danger' : ''}`}>{fmt(r.paymentAmount)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(r.discountAmount)}</CTableDataCell>
                <CTableDataCell>{r.paymentMethod}</CTableDataCell>
                <CTableDataCell>{r.notes}</CTableDataCell>
                <CTableDataCell className="text-nowrap">
                  {hasReceipt(r) ? (
                    <CButton size="sm" color="primary" variant="outline" title={`Print receipt ${receiptNo(r.paymentId)}`}
                      onClick={() => openReceipts(r.paymentId)}>
                      {receiptNo(r.paymentId)}
                    </CButton>
                  ) : <span className="text-body-secondary small">—</span>}
                </CTableDataCell>
              </CTableRow>
            ))}
            {!loading && !filtered.length && (
              <CTableRow>
                <CTableDataCell colSpan={12} className="text-center text-muted py-4">No records</CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
        <TablePagination pageIndex={pageIndex} pageSize={pageSize} total={filtered.length} onPageChange={setPageIndex} />
      </CCardBody>
    </CCard>
  )
}

export default PaymentRecords