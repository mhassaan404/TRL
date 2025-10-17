import React, { useState, useMemo } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormSelect,
} from '@coreui/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table'

// 🔹 Sample tenant data
const tenantsList = [
  { id: 1, name: 'Ali Khan', building: 'Sunrise Apartments', floor: '1', unit: '101', dueDate: '2025-09-25', paymentDate: '2025-098-25', status: 'Pending' },
  { id: 2, name: 'Sara Ahmed', building: 'Sunrise Apartments', floor: '2', unit: '102', dueDate: '2025-09-27', paymentDate: '2025-08-22', status: 'Pending' },
  { id: 3, name: 'Bilal Iqbal', building: 'Green Villa', floor: 'G', unit: 'A1', dueDate: '2025-09-30', paymentDate: '2025-09-14', status: 'Pending' },
  { id: 4, name: 'Hina Raza', building: 'Green Villa', floor: '1', unit: 'A2', dueDate: '2025-09-20', paymentDate: '2025-09-25', status: 'Paid' },
]

// 🔹 CSV Export Helper
const exportCSV = (columns, data, filename = 'report.csv') => {
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

const Reports = () => {
  const [tenants] = useState(tenantsList)
  const [globalFilter, setGlobalFilter] = useState('')
  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterFloor, setFilterFloor] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => 
      (!filterBuilding || t.building === filterBuilding) &&
      (!filterFloor || t.floor === filterFloor) &&
      (!filterUnit || t.unit === filterUnit) &&
      (!filterStatus || t.status === filterStatus) &&
      (!globalFilter ||
        t.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        t.unit.toLowerCase().includes(globalFilter.toLowerCase()))
    )
  }, [tenants, globalFilter, filterBuilding, filterFloor, filterUnit, filterStatus])

  const getStatusColor = (tenant) => {
    if (tenant.status === 'Paid') return 'green'
    const today = new Date()
    const due = new Date(tenant.dueDate)
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    if (diffDays <= 3) return 'orange'
    return 'red'
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'building', header: 'Building' },
      { accessorKey: 'floor', header: 'Floor' },
      { accessorKey: 'unit', header: 'Unit' },
      { accessorKey: 'name', header: 'Tenant Name' },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => {
          const today = new Date()
          const due = new Date(row.original.dueDate)
          const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
          return `${row.original.dueDate} (${diffDays} day${diffDays !== 1 ? 's' : ''})`
        },
      },
      { accessorKey: 'paymentDate', header: 'Payment Date' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const bgColor = getStatusColor(row.original)
          return (
            <span
              style={{
                backgroundColor: bgColor,
                color: 'white',
                padding: '4px 10px',
                borderRadius: '12px',
                fontWeight: '500',
                display: 'inline-block',
                textAlign: 'center',
                minWidth: '70px',
              }}
            >
              {row.original.status}
            </span>
          )
        },
      },
    ],
    [tenants]
  )

  const table = useReactTable({
    data: filteredTenants,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Get unique floors and units based on selected building/floor
  const floors = [...new Set(tenantsList.filter(t => !filterBuilding || t.building === filterBuilding).map(t => t.floor))]
  const units = [...new Set(tenantsList.filter(t => (!filterBuilding || t.building === filterBuilding) && (!filterFloor || t.floor === filterFloor)).map(t => t.unit))]

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Tenant Payment Report</strong>
            <div>
              <input
                type="text"
                placeholder="Search tenant or unit..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                style={{ width: '200px', display: 'inline-block', marginRight: '10px' }}
              />
              <CFormSelect
                value={filterBuilding}
                onChange={(e) => { setFilterBuilding(e.target.value); setFilterFloor(''); setFilterUnit(''); }}
                style={{ display: 'inline-block', width: '150px', marginRight: '10px' }}
              >
                <option value="">All Buildings</option>
                {[...new Set(tenantsList.map((t) => t.building))].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </CFormSelect>
              <CFormSelect
                value={filterFloor}
                onChange={(e) => { setFilterFloor(e.target.value); setFilterUnit(''); }}
                style={{ display: 'inline-block', width: '100px', marginRight: '10px' }}
              >
                <option value="">All Floors</option>
                {floors.map(f => <option key={f} value={f}>{f}</option>)}
              </CFormSelect>
              <CFormSelect
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                style={{ display: 'inline-block', width: '100px', marginRight: '10px' }}
              >
                <option value="">All Units</option>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </CFormSelect>
              <CFormSelect
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ display: 'inline-block', width: '120px', marginRight: '10px' }}
              >
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </CFormSelect>
              <CButton color="success" onClick={() => exportCSV(columns, filteredTenants)}>Export CSV</CButton>
            </div>
          </CCardHeader>
          <CCardBody>
            <table className="table table-bordered table-striped">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ cursor: 'pointer' }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}{' '}
                        {{
                          asc: '🔼',
                          desc: '🔽',
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
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <CButton
                  color="secondary"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </CButton>{' '}
                <CButton
                  color="secondary"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </CButton>
              </div>
              <span>
                Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of {table.getPageCount()}
              </span>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Reports
