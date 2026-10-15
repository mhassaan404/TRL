// RentHistory.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { fmt, formatDate } from '../../utils/rentUtils'
import TenantFilter from '../../components/rent/TenantFilter'
import InvoiceDetailsModal from '../../components/rent/InvoiceDetailsModal'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormInput,
  CFormSelect,
  CBadge,
} from '@coreui/react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'

import { useRentHistory } from '../../hooks/useRentHistory'
import { toLocalDateString } from '../../utils/dates'
import {
  DEFAULT_HISTORY_RANGE,
  HISTORY_RANGES,
  customRangeError,
  inRange,
  rangeOf,
} from '../../utils/historyRange'
import { exportCSV } from '../../utils/exportUtils'
import { matchesLeaseFilter } from '../../utils/leaseFilter'
import LeaseFilterButtons from '../../components/common/LeaseFilterButtons'
import { invoiceNo, openInvoice } from '../../utils/documents'
import {
  PageSizeSelect,
  TablePagination,
  tablePageProps,
  tablePageSizeProps,
  DEFAULT_PAGE_SIZE,
} from '../../components/common/TablePagination'
import { invoiceStatusColor } from '../../utils/invoiceStatus'

// CSV Export Helper

// Normalize dates to YYYY-MM-DD
const normalizeDate = (value) => {
  if (!value) return null

  if (typeof value === 'string') {
    return value.split('T')[0] || null
  }

  if (value instanceof Date && !isNaN(value)) {
    return toLocalDateString(value)
  }

  return null
}

const RentHistory = () => {
  const { loading, historyRecords, loadRentHistory, handleCancel, handleReinstate } =
    useRentHistory()

  const [globalSearch, setGlobalSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [leaseFilter, setLeaseFilter] = useState('') // '' all, 'current', 'moved' (utils/leaseFilter)
  const [historyId, setHistoryId] = useState(null) // invoice shown in the History window
  // Invoice-date range: a preset (default last 3 months, so the page stays quick) or a custom From / To
  const [datePreset, setDatePreset] = useState(DEFAULT_HISTORY_RANGE)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Load data on mount
  useEffect(() => {
    loadRentHistory()
  }, [loadRentHistory])

  const today = toLocalDateString(new Date())
  const customError = datePreset === 'custom' ? customRangeError(customFrom, customTo) : ''
  // The range in force; an invalid custom range filters nothing until it is fixed
  const range = useMemo(() => {
    if (datePreset !== 'custom') return rangeOf(datePreset, today)
    return customError ? { from: '', to: '' } : { from: customFrom, to: customTo }
  }, [datePreset, customFrom, customTo, customError, today])

  // Switching to Custom starts from the range shown now, so nothing jumps
  const applyDatePreset = (preset) => {
    if (preset === 'custom') {
      setCustomFrom(range.from || '')
      setCustomTo(range.to || '')
    }
    setDatePreset(preset)
  }

  // Every filter except the date range
  const matchingOthers = useMemo(() => {
    return historyRecords.filter((record) => {
      const term = globalSearch.toLowerCase().trim()

      // Global search
      if (term) {
        const matches =
          record.tenant?.toLowerCase().includes(term) ||
          record.unit?.toLowerCase().includes(term) ||
          record.buildingName?.toLowerCase().includes(term) ||
          String(record.invoiceId || '').includes(term) ||
          (record.invoiceId && invoiceNo(record.invoiceId).toLowerCase().includes(term)) ||
          String(record.monthlyRent || '').includes(term)

        if (!matches) return false
      }

      // Tenant / Company filter (exact name chosen from the list)
      if (tenantFilter && record.tenant !== tenantFilter) {
        return false
      }

      // Unit filter
      if (unitFilter && !record.unit?.toLowerCase().includes(unitFilter.toLowerCase().trim())) {
        return false
      }

      // Status filter
      if (statusFilter && record.status !== statusFilter) {
        return false
      }

      // Current tenants / moved out (of that unit)
      if (!matchesLeaseFilter(record, leaseFilter)) {
        return false
      }

      return true
    })
  }, [historyRecords, globalSearch, tenantFilter, unitFilter, statusFilter, leaseFilter])

  const filteredData = useMemo(
    () => matchingOthers.filter((record) => inRange(normalizeDate(record.invoiceDate), range)),
    [matchingOthers, range],
  )
  // Invoices that match everything else but fall outside the date range (shown as a hint)
  const outsideRange = matchingOthers.length - filteredData.length

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }))
  }, [filteredData.length])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'invoiceId',
        header: 'Invoice #',
        cell: ({ row }) => `#${row.original.invoiceId}`,
      },
      {
        // Extra charges have no lease
        accessorKey: 'leaseId',
        header: 'Lease #',
        cell: ({ row }) => (row.original.leaseId ? `#${row.original.leaseId}` : '—'),
      },
      {
        accessorKey: 'tenant',
        header: 'Tenant Name',
      },
      {
        accessorKey: 'buildingName',
        header: 'Building',
      },
      {
        accessorKey: 'floorNumber',
        header: 'Floor',
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
      },
      {
        accessorKey: 'monthlyRent',
        header: 'Monthly Rent',
        cell: ({ getValue }) => fmt(getValue() || 0),
      },
      {
        accessorKey: 'paidAmount',
        header: 'Paid',
        cell: ({ row }) => fmt(row.original.paidAmount),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        cell: ({ row }) => fmt(row.original.balance),
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Invoice Date',
        cell: ({ row }) => formatDate(row.original.invoiceDate),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => formatDate(row.original.dueDate),
      },
      {
        accessorKey: 'lastPaymentDate',
        header: 'Last Payment Date',
        cell: ({ row }) => formatDate(row.original.lastPaymentDate),
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment Method',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const value = getValue()

          return <CBadge color={invoiceStatusColor(value)}>{value || '—'}</CBadge>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const id = row.original.invoiceId
          const status = row.original.status

          return (
            <div className="d-flex gap-1 flex-wrap">
              <CButton color="info" variant="outline" size="sm" onClick={() => setHistoryId(id)}>
                History
              </CButton>
              <CButton
                color="primary"
                variant="outline"
                size="sm"
                title={`Print invoice ${invoiceNo(id)}`}
                onClick={() => openInvoice(id)}
              >
                Print
              </CButton>
              {status === 'Cancelled' ? (
                // Same rule as the API (CanReinstate): disabled when its lease no longer covers that month or a newer
                // invoice already bills it
                <span
                  title={
                    row.original.canReinstate
                      ? ''
                      : "Can't be reinstated: its lease no longer covers that month, or another invoice already bills it."
                  }
                >
                  <CButton
                    color="success"
                    variant="outline"
                    size="sm"
                    disabled={!row.original.canReinstate}
                    onClick={() => handleReinstate(id)}
                  >
                    Reinstate
                  </CButton>
                </span>
              ) : row.original.hasPaymentRecords ? (
                // Same rule as the API: an invoice with payment records that still count can't be cancelled, so
                // payment history is never rewritten. Once every record is reversed (History), it can be cancelled.
                <span
                  title="This invoice has payment records (payments, discounts, waivers or adjustments), so it can't be cancelled. To cancel it, first reverse its records in History."
                  style={{ cursor: 'not-allowed' }}
                >
                  <CButton
                    color="warning"
                    variant="outline"
                    size="sm"
                    disabled
                    style={{ pointerEvents: 'none' }}
                  >
                    Cancel Invoice
                  </CButton>
                </span>
              ) : (
                <CButton
                  color="warning"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(id)}
                >
                  Cancel Invoice
                </CButton>
              )}
            </div>
          )
        },
      },
    ],
    [handleCancel, handleReinstate],
  )

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Rent History</strong>

            <CButton
              color="success"
              onClick={() => exportCSV(columns, filteredData, 'rent_history.csv')}
            >
              Export CSV
            </CButton>
          </CCardHeader>

          <CCardBody>
            {/* Filters */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Search</label>

                <CFormInput
                  placeholder="Tenant, unit, invoice ID, amount..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Tenant / Company</label>

                <TenantFilter
                  names={historyRecords.map((r) => r.tenant)}
                  value={tenantFilter}
                  onChange={setTenantFilter}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Status</label>

                <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overpaid">Overpaid</option>
                  <option value="Cancelled">Cancelled</option>
                </CFormSelect>
              </div>

              <div className="col-auto">
                <div className="form-label small text-muted mb-1">Tenants</div>
                <LeaseFilterButtons value={leaseFilter} onChange={setLeaseFilter} />
              </div>

              <div className="col-md-3">
                <label htmlFor="rh-range" className="form-label small text-muted mb-1">
                  Invoice date
                </label>

                <CFormSelect
                  id="rh-range"
                  value={datePreset}
                  onChange={(e) => applyDatePreset(e.target.value)}
                >
                  {HISTORY_RANGES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </CFormSelect>
              </div>

              {datePreset === 'custom' && (
                <>
                  <div className="col-md-3">
                    <label htmlFor="rh-from" className="form-label small text-muted mb-1">
                      From
                    </label>
                    <CFormInput
                      id="rh-from"
                      type="date"
                      value={customFrom}
                      max={customTo || undefined}
                      invalid={!!customError}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>

                  <div className="col-md-3">
                    <label htmlFor="rh-to" className="form-label small text-muted mb-1">
                      To
                    </label>
                    <CFormInput
                      id="rh-to"
                      type="date"
                      value={customTo}
                      min={customFrom || undefined}
                      invalid={!!customError}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                  {customError && <div className="col-12 small text-danger">{customError}</div>}
                </>
              )}
            </div>

            {!loading && outsideRange > 0 && (
              <div className="small text-body-secondary mb-2">
                {outsideRange} invoice{outsideRange === 1 ? ' is' : 's are'} outside this date
                range.{' '}
                <CButton
                  color="link"
                  size="sm"
                  className="p-0 align-baseline"
                  onClick={() => applyDatePreset('all')}
                >
                  Show all time
                </CButton>
              </div>
            )}

            <div className="mb-2">
              <PageSizeSelect {...tablePageSizeProps(table)} />
            </div>

            {loading ? (
              <div className="text-center py-5">Loading rent history...</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              onClick={header.column.getToggleSortingHandler?.()}
                              style={{
                                cursor: header.column.getCanSort() ? 'pointer' : 'default',
                              }}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}

                              {{
                                asc: ' ↑',
                                desc: ' ↓',
                              }[header.column.getIsSorted()] ?? null}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>

                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <TablePagination {...tablePageProps(table)} />
                </div>

                {filteredData.length === 0 && !loading && (
                  <div className="text-center text-muted py-5">No records found.</div>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
        <InvoiceDetailsModal
          invoiceId={historyId}
          onClose={() => setHistoryId(null)}
          onOpenInvoice={setHistoryId}
          onChanged={loadRentHistory}
        />
      </CCol>
    </CRow>
  )
}

export default RentHistory
