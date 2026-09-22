// RentHistory.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { fmt, formatDate } from '../../utils/rentUtils'
import PaymentRecords from '../../components/rent/PaymentRecords'
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

// CSV Export Helper
const exportToCSV = (columns, data, filename = 'rent_history.csv') => {
  const exportableColumns = columns.filter((col) => col.accessorKey)

  const headers = exportableColumns.map((col) => `"${col.header}"`).join(',')

  const rows = data.map((row) =>
    exportableColumns
      .map((col) => `"${String(row[col.accessorKey] ?? '').replace(/"/g, '""')}"`)
      .join(','),
  )

  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

// Normalize dates to YYYY-MM-DD
const normalizeDate = (value) => {
  if (!value) return null

  if (typeof value === 'string') {
    return value.split('T')[0] || null
  }

  if (value instanceof Date && !isNaN(value)) {
    return value.toISOString().split('T')[0]
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
    const todayStr = today.toISOString().split('T')[0]

    let from = ''

    if (preset === 'thisMonth') {
      from = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0]
    } else if (preset === 'last3') {
      const d = new Date()
      d.setMonth(d.getMonth() - 3)
      from = d.toISOString().split('T')[0]
    } else if (preset === 'lastYear') {
      const d = new Date()
      d.setFullYear(d.getFullYear() - 1)
      from = d.toISOString().split('T')[0]
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

      // Tenant filter
      if (
        tenantFilter &&
        !record.tenant?.toLowerCase().includes(tenantFilter.toLowerCase().trim())
      ) {
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
            <>
              {status === 'Cancelled' ? (
                <CButton
                  color="success"
                  variant="outline"
                  size="sm"
                  onClick={() => handleReinstate(id)}
                >
                  Reinstate
                </CButton>
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
            </>
          )
        },
      },
    ],
    [handleCancel, handleReinstate],
  )

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
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
                exportToCSV(columns, filteredData)
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

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted small">
                      Showing {table.getRowModel().rows.length} of {filteredData.length} records
                    </div>

                    <div className="d-flex gap-2">
                      <CButton
                        color="secondary"
                        variant="outline"
                        size="sm"
                        disabled={!table.getCanPreviousPage()}
                        onClick={() => table.previousPage()}
                      >
                        Previous
                      </CButton>

                      <span className="align-self-center small">
                        Page {table.getState().pagination.pageIndex + 1} of{' '}
                        {table.getPageCount()}
                      </span>

                      <CButton
                        color="secondary"
                        variant="outline"
                        size="sm"
                        disabled={!table.getCanNextPage()}
                        onClick={() => table.nextPage()}
                      >
                        Next
                      </CButton>
                    </div>
                  </div>
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
        <PaymentRecords />
      </CCol>
    </CRow>
  )
}

export default RentHistory