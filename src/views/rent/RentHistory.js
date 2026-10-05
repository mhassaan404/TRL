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
import { exportCSV } from '../../utils/exportUtils'
import { PageSizeSelect, TablePagination, tablePageProps, tablePageSizeProps, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'

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
  const {
    loading,
    historyRecords,
    loadRentHistory,
    handleCancel,
    handleReinstate,
  } = useRentHistory()

  const [globalSearch, setGlobalSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [historyId, setHistoryId] = useState(null) // invoice shown in the History window
  const [datePreset, setDatePreset] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Load data on mount
  useEffect(() => {
    loadRentHistory()
  }, [loadRentHistory])

  // Date preset logic
  const applyDatePreset = (preset) => {
    setDatePreset(preset)

    if (preset === 'all' || preset === 'custom') {
      setDateFrom('')
      setDateTo('')
      return
    }

    const today = new Date()
    const todayStr = toLocalDateString(today)

    let from = ''

    if (preset === 'thisMonth') {
      from = toLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1))
    } else if (preset === 'last3') {
      const d = new Date()
      d.setMonth(d.getMonth() - 3)
      from = toLocalDateString(d)
    } else if (preset === 'lastYear') {
      const d = new Date()
      d.setFullYear(d.getFullYear() - 1)
      from = toLocalDateString(d)
    }

    setDateFrom(from)
    setDateTo(todayStr)
  }

  const filteredData = useMemo(() => {
    return historyRecords.filter((record) => {
      const term = globalSearch.toLowerCase().trim()

      // Global search
      if (term) {
        const matches =
          record.tenant?.toLowerCase().includes(term) ||
          record.unit?.toLowerCase().includes(term) ||
          String(record.invoiceId || '').includes(term) ||
          String(record.monthlyRent || '').includes(term)

        if (!matches) return false
      }

      // Tenant / Company filter (exact name chosen from the list)
      if (tenantFilter && record.tenant !== tenantFilter) {
        return false
      }

      // Unit filter
      if (
        unitFilter &&
        !record.unit?.toLowerCase().includes(unitFilter.toLowerCase().trim())
      ) {
        return false
      }

      // Status filter
      if (statusFilter && record.status !== statusFilter) {
        return false
      }

      const recDate = normalizeDate(record.invoiceDate)

      if (!recDate) return true

      if (dateFrom && recDate < dateFrom) return false
      if (dateTo && recDate > dateTo) return false

      return true
    })
  }, [
    historyRecords,
    globalSearch,
    tenantFilter,
    unitFilter,
    statusFilter,
    dateFrom,
    dateTo,
  ])

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
        header: 'ID',
      },
      {
        accessorKey: 'tenant',
        header: 'Tenant Name',
      },
      {
        accessorKey: 'unit',
        header: 'Property / Unit',
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

          const colors = {
            Paid: 'success',
            Partial: 'warning',
            Unpaid: 'danger',
            Pending: 'info',
            'In Progress': 'primary',
            Completed: 'success',
            Overpaid: 'dark',
            Cancelled: 'secondary',
          }

          return (
            <CBadge color={colors[value] || 'secondary'}>
              {value || '—'}
            </CBadge>
          )
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
              {status === 'Cancelled' ? (
                <CButton
                  color="success"
                  variant="outline"
                  size="sm"
                  onClick={() => handleReinstate(id)}
                >
                  Reinstate
                </CButton>
              ) : row.original.hasPaymentRecords ? (
                // Same rule as the API: an invoice with payment records can't be cancelled, so payment history is
                // never rewritten. Corrections go through payment adjustments instead.
                <span
                  title="This invoice has payment records (payments, discounts, waivers or adjustments), so it can't be cancelled. Correct it with a payment adjustment instead."
                  style={{ cursor: 'not-allowed' }}
                >
                  <CButton color="warning" variant="outline" size="sm" disabled style={{ pointerEvents: 'none' }}>
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
              onClick={() =>
                exportCSV(columns, filteredData, 'rent_history.csv')
              }
            >
              Export CSV
            </CButton>
          </CCardHeader>

          <CCardBody>
            {/* Filters */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">
                  Search
                </label>

                <CFormInput
                  placeholder="Tenant, unit, invoice ID, amount..."
                  value={globalSearch}
                  onChange={(e) =>
                    setGlobalSearch(e.target.value)
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">
                  Tenant / Company
                </label>

                <TenantFilter
                  names={historyRecords.map((r) => r.tenant)}
                  value={tenantFilter}
                  onChange={setTenantFilter}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">
                  Status
                </label>

                <CFormSelect
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overpaid">Overpaid</option>
                  <option value="Cancelled">Cancelled</option>
                </CFormSelect>
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">
                  Date Range
                </label>

                <CFormSelect
                  value={datePreset}
                  onChange={(e) =>
                    applyDatePreset(e.target.value)
                  }
                >
                  <option value="all">All Time</option>
                  <option value="thisMonth">This Month</option>
                  <option value="last3">Last 3 Months</option>
                  <option value="lastYear">Last 12 Months</option>
                  <option value="custom">Custom Range</option>
                </CFormSelect>
              </div>

              {datePreset === 'custom' && (
                <>
                  <div className="col-md-3">
                    <label className="form-label small text-muted mb-1">
                      From
                    </label>

                    <CFormInput
                      type="date"
                      value={dateFrom}
                      onChange={(e) =>
                        setDateFrom(e.target.value)
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small text-muted mb-1">
                      To
                    </label>

                    <CFormInput
                      type="date"
                      value={dateTo}
                      onChange={(e) =>
                        setDateTo(e.target.value)
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mb-2">
              <PageSizeSelect {...tablePageSizeProps(table)} />
            </div>

            {loading ? (
              <div className="text-center py-5">
                Loading rent history...
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead>
                      {table.getHeaderGroups().map(
                        (headerGroup) => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map(
                              (header) => (
                                <th
                                  key={header.id}
                                  onClick={header.column.getToggleSortingHandler?.()}
                                  style={{
                                    cursor:
                                      header.column.getCanSort()
                                        ? 'pointer'
                                        : 'default',
                                  }}
                                >
                                  {flexRender(
                                    header.column.columnDef
                                      .header,
                                    header.getContext(),
                                  )}

                                  {{
                                    asc: ' ↑',
                                    desc: ' ↓',
                                  }[
                                    header.column.getIsSorted()
                                  ] ?? null}
                                </th>
                              ),
                            )}
                          </tr>
                        ),
                      )}
                    </thead>

                    <tbody>
                      {table.getRowModel().rows.map(
                        (row) => (
                          <tr key={row.id}>
                            {row
                              .getVisibleCells()
                              .map((cell) => (
                                <td key={cell.id}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </td>
                              ))}
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>

                  <TablePagination {...tablePageProps(table)} />
                </div>

                {filteredData.length === 0 && !loading && (
                  <div className="text-center text-muted py-5">
                    No records found.
                  </div>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
        <InvoiceDetailsModal invoiceId={historyId} onClose={() => setHistoryId(null)} onOpenInvoice={setHistoryId} />
      </CCol>
    </CRow>
  )
}

export default RentHistory