import React, { useState, useMemo } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormInput,
  CFormSelect,
} from '@coreui/react'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'

// 🔹 CSV Export Helper
const exportCSV = (columns, data, filename = 'rent_history.csv') => {
  const headers = columns.map((col) => col.header).join(',')
  const rows = data.map((row) =>
    columns.map((col) => row[col.accessorKey] ?? '').join(',')
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

const RentHistory = () => {
  // Sample historical data
  const [historyRecords, setHistoryRecords] = useState([
    {
      id: 1,
      tenant: 'Ali Khan',
      unit: 'Unit 101',
      amount: '25000',
      paymentDate: '2025-08-01',
      method: 'Cash',
      status: 'Leaved',
      notes: 'Tenant moved out after 1 year',
    },
    {
      id: 2,
      tenant: 'Sara Ahmed',
      unit: 'Unit 202',
      amount: '40000',
      paymentDate: '2025-07-05',
      method: 'Bank Transfer',
      status: 'Leaved',
      notes: 'Left due to relocation',
    },
  ])

  // 🔹 Filters
  const [tenantFilter, setTenantFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // 🔹 Filtered Data
  const filteredData = useMemo(() => {
    return historyRecords.filter((record) => {
      const matchTenant = tenantFilter
        ? record.tenant.toLowerCase().includes(tenantFilter.toLowerCase())
        : true
      const matchUnit = unitFilter
        ? record.unit.toLowerCase().includes(unitFilter.toLowerCase())
        : true
      const matchStatus = statusFilter ? record.status === statusFilter : true
      const matchDateFrom = dateFrom ? record.paymentDate >= dateFrom : true
      const matchDateTo = dateTo ? record.paymentDate <= dateTo : true

      return matchTenant && matchUnit && matchStatus && matchDateFrom && matchDateTo
    })
  }, [historyRecords, tenantFilter, unitFilter, statusFilter, dateFrom, dateTo])

  // ✅ Delete record
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setHistoryRecords((prev) => prev.filter((rec) => rec.id !== id))
    }
  }

  // ✅ Reinstate tenant
  const handleReinstate = (id) => {
    if (window.confirm('Are you sure you want to change status to Active?')) {
      setHistoryRecords((prev) =>
        prev.map((rec) =>
          rec.id === id ? { ...rec, status: 'Active', notes: 'Reinstated tenant' } : rec
        )
      )
    }
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'tenant', header: 'Tenant Name' },
      { accessorKey: 'unit', header: 'Property / Unit' },
      { accessorKey: 'amount', header: 'Rent Amount' },
      { accessorKey: 'paymentDate', header: 'Payment Date' },
      { accessorKey: 'method', header: 'Payment Method' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'notes', header: 'Notes' },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <>
            {row.original.status === 'Leaved' && (
              <CButton
                color="warning"
                size="sm"
                className="me-2"
                onClick={() => handleReinstate(row.original.id)}
              >
                Reinstate
              </CButton>
            )}
            <CButton
              color="danger"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
            >
              Delete
            </CButton>
          </>
        ),
      },
    ],
    [historyRecords]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Rent History</strong>
            <CButton color="success" onClick={() => exportCSV(columns, filteredData)}>
              Export CSV
            </CButton>
          </CCardHeader>
          <CCardBody>
            {/* 🔹 Filters Section */}
            <div className="row g-2 mb-3">
              <div className="col-md">
                <CFormInput
                  type="text"
                  placeholder="Filter by Tenant"
                  value={tenantFilter}
                  onChange={(e) => setTenantFilter(e.target.value)}
                />
              </div>
              <div className="col-md">
                <CFormInput
                  type="text"
                  placeholder="Filter by Unit"
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                />
              </div>
              <div className="col-md">
                <CFormSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Leaved">Leaved</option>
                </CFormSelect>
              </div>
              <div className="col-md">
                <CFormInput
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="col-md">
                <CFormInput
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* 🔹 Table */}
            <table className="table table-bordered table-striped">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler?.()}
                        style={{ cursor: 'pointer' }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default RentHistory