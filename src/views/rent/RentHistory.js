// // RentHistory.jsx
// import React, { useState, useEffect, useMemo } from 'react'
// import { fmt, formatDate } from '../../utils/rentUtils'
// import {
//   CButton,
//   CCard,
//   CCardBody,
//   CCardHeader,
//   CCol,
//   CRow,
//   CFormInput,
//   CFormSelect,
//   CBadge,
// } from '@coreui/react'
// import {
//   useReactTable,
//   getCoreRowModel,
//   flexRender,
//   getSortedRowModel,
// } from '@tanstack/react-table'

// import { useRentHistory } from '../../hooks/useRentHistory'

// // CSV Export Helper
// const exportToCSV = (columns, data, filename = 'rent_history.csv') => {
//   const headers = columns.map((col) => `"${col.header}"`).join(',')
//   const rows = data.map((row) =>
//     columns.map((col) => `"${String(row[col.accessorKey] ?? '').replace(/"/g, '""')}"`).join(','),
//   )
//   const csv = [headers, ...rows].join('\n')
//   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
//   const url = URL.createObjectURL(blob)
//   const a = document.createElement('a')
//   a.href = url
//   a.download = filename
//   a.click()
//   URL.revokeObjectURL(url)
// }

// const RentHistory = () => {
//   const {
//     loading,
//     historyRecords,
//     loadRentHistory,
//     refresh,
//     setHistoryRecords,
//     handleDelete,
//     handleReinstate,
//   } = useRentHistory()

//   const [globalSearch, setGlobalSearch] = useState('')
//   const [tenantFilter, setTenantFilter] = useState('')
//   const [unitFilter, setUnitFilter] = useState('')
//   const [statusFilter, setStatusFilter] = useState('')
//   const [datePreset, setDatePreset] = useState('all')
//   const [dateFrom, setDateFrom] = useState('')
//   const [dateTo, setDateTo] = useState('')

//   // Load data on mount
//   useEffect(() => {
//     loadRentHistory()
//   }, [loadRentHistory])

//   // Date preset logic
//   const applyDatePreset = (preset) => {
//     setDatePreset(preset)
//     if (preset === 'all') {
//       setDateFrom('')
//       setDateTo('')
//       return
//     }

//     const today = new Date()
//     const todayStr = today.toISOString().split('T')[0]

//     let from = ''
//     if (preset === 'thisMonth') {
//       from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
//     } else if (preset === 'last3') {
//       const d = new Date()
//       d.setMonth(d.getMonth() - 3)
//       from = d.toISOString().split('T')[0]
//     } else if (preset === 'lastYear') {
//       const d = new Date()
//       d.setFullYear(d.getFullYear() - 1)
//       from = d.toISOString().split('T')[0]
//     }

//     setDateFrom(from)
//     setDateTo(todayStr)
//   }

//   const filteredData = useMemo(() => {
//     return historyRecords.filter((record) => {
//       const term = globalSearch.toLowerCase().trim()
//       if (term) {
//         const matches =
//           record.tenant?.toLowerCase().includes(term) ||
//           record.unit?.toLowerCase().includes(term) ||
//           (record.notes || '').toLowerCase().includes(term) ||
//           String(record.amount || '').includes(term)
//         if (!matches) return false
//       }

//       if (tenantFilter && !record.tenant?.toLowerCase().includes(tenantFilter.toLowerCase().trim()))
//         return false
//       if (unitFilter && !record.unit?.toLowerCase().includes(unitFilter.toLowerCase().trim()))
//         return false
//       if (statusFilter && record.status !== statusFilter) return false

//       const recDate = record.paymentDate || '9999-12-31'
//       if (dateFrom && recDate < dateFrom) return false
//       if (dateTo && recDate > dateTo) return false

//       return true
//     })
//   }, [historyRecords, globalSearch, tenantFilter, unitFilter, statusFilter, dateFrom, dateTo])

//   const columns = useMemo(
//     () => [
//       { accessorKey: 'id', header: 'ID' },
//       { accessorKey: 'tenant', header: 'Tenant Name' },
//       { accessorKey: 'unit', header: 'Property / Unit' },
//       {
//         accessorKey: 'monthlyRent',
//         header: 'Monthly Rent',
//         cell: ({ getValue }) => fmt(getValue() || 0),
//       },
//       {
//         accessorKey: 'lastPaymentDate',
//         header: 'Last Payment Date',
//         cell: ({ row }) => formatDate(row.original.dueDate),
//       },
//       { accessorKey: 'paymentMethod', header: 'Payment Method' },
//       {
//         accessorKey: 'status',
//         header: 'Status',
//         cell: ({ getValue }) => {
//           const v = getValue()
//           const colors = {
//             Paid: 'success',
//             Late: 'warning',
//             Pending: 'info',
//             Overdue: 'danger',
//             Leaved: 'secondary',
//           }
//           return <CBadge color={colors[v] || 'secondary'}>{v || '—'}</CBadge>
//         },
//       },
//       { accessorKey: 'allNotes', header: 'Notes' },
//       {
//         id: 'actions',
//         header: 'Actions',
//         cell: ({ row }) => (
//           <>
//             {row.original.status === 'Leaved' && (
//               <CButton
//                 color="warning"
//                 size="sm"
//                 className="me-2"
//                 onClick={() => handleReinstate(row.original.Id || row.original.id)}
//               >
//                 Reinstate
//               </CButton>
//             )}
//             <CButton
//               color="danger"
//               size="sm"
//               onClick={() => handleDelete(row.original.Id || row.original.id)}
//             >
//               Delete
//             </CButton>
//           </>
//         ),
//       },
//     ],
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     [refresh],
//   )

//   const table = useReactTable({
//     data: filteredData,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//   })

//   return (
//     <CRow>
//       <CCol xs={12}>
//         <CCard className="mb-4">
//           <CCardHeader className="d-flex justify-content-between align-items-center">
//             <strong>Rent History</strong>
//             <CButton color="success" onClick={() => exportToCSV(columns, filteredData)}>
//               Export CSV
//             </CButton>
//           </CCardHeader>

//           <CCardBody>
//             {/* Filters */}
//             <div className="row g-3 mb-4">
//               <div className="col-md-3">
//                 <label className="form-label small text-muted mb-1">Search</label>
//                 <CFormInput
//                   placeholder="Tenant, unit, notes, amount..."
//                   value={globalSearch}
//                   onChange={(e) => setGlobalSearch(e.target.value)}
//                 />
//               </div>

//               <div className="col-md-3">
//                 <label className="form-label small text-muted mb-1">Status</label>
//                 <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
//                   <option value="">All Status</option>
//                   <option value="Paid">Paid</option>
//                   <option value="Unpaid">Unpaid</option>
//                   <option value="Pending">Pending</option>
//                   <option value="Overdue">Overdue</option>
//                   <option value="Late">Late</option>
//                   <option value="Leaved">Leaved</option>
//                 </CFormSelect>
//               </div>

//               <div className="col-md-3">
//                 <label className="form-label small text-muted mb-1">Date Range</label>
//                 <CFormSelect value={datePreset} onChange={(e) => applyDatePreset(e.target.value)}>
//                   <option value="all">All Time</option>
//                   <option value="thisMonth">This Month</option>
//                   <option value="last3">Last 3 Months</option>
//                   <option value="lastYear">Last 12 Months</option>
//                   <option value="custom">Custom Range</option>
//                 </CFormSelect>
//               </div>

//               {datePreset === 'custom' && (
//                 <>
//                   <div className="col-md-3">
//                     <label className="form-label small text-muted mb-1">From</label>
//                     <CFormInput
//                       type="date"
//                       value={dateFrom}
//                       onChange={(e) => setDateFrom(e.target.value)}
//                     />
//                   </div>
//                   <div className="col-md-3">
//                     <label className="form-label small text-muted mb-1">To</label>
//                     <CFormInput
//                       type="date"
//                       value={dateTo}
//                       onChange={(e) => setDateTo(e.target.value)}
//                     />
//                   </div>
//                 </>
//               )}
//             </div>

//             {loading ? (
//               <div className="text-center py-5">Loading rent history...</div>
//             ) : (
//               <>
//                 <div className="table-responsive">
//                   <table className="table table-bordered table-striped">
//                     <thead>
//                       {table.getHeaderGroups().map((headerGroup) => (
//                         <tr key={headerGroup.id}>
//                           {headerGroup.headers.map((header) => (
//                             <th
//                               key={header.id}
//                               onClick={header.column.getToggleSortingHandler?.()}
//                               style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
//                             >
//                               {flexRender(header.column.columnDef.header, header.getContext())}
//                               {{
//                                 asc: ' ↑',
//                                 desc: ' ↓',
//                               }[header.column.getIsSorted()] ?? null}
//                             </th>
//                           ))}
//                         </tr>
//                       ))}
//                     </thead>
//                     <tbody>
//                       {table.getRowModel().rows.map((row) => (
//                         <tr key={row.id}>
//                           {row.getVisibleCells().map((cell) => (
//                             <td key={cell.id}>
//                               {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                             </td>
//                           ))}
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>

//                 {filteredData.length === 0 && !loading && (
//                   <div className="text-center text-muted py-5">No records found.</div>
//                 )}
//               </>
//             )}
//           </CCardBody>
//         </CCard>
//       </CCol>
//     </CRow>
//   )
// }

// export default RentHistory



// RentHistory.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { fmt, formatDate } from '../../utils/rentUtils'
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
} from '@tanstack/react-table'

import { useRentHistory } from '../../hooks/useRentHistory'

// CSV Export Helper
const exportToCSV = (columns, data, filename = 'rent_history.csv') => {
  const headers = columns.map((col) => `"${col.header}"`).join(',')
  const rows = data.map((row) =>
    columns.map((col) => `"${String(row[col.accessorKey] ?? '').replace(/"/g, '""')}"`).join(','),
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

// Helper to normalize dates to YYYY-MM-DD (fixes most date filter problems)
const normalizeDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    // Remove time part if exists (handles ISO format like 2025-03-15T00:00:00)
    return value.split('T')[0] || null;
  }
  if (value instanceof Date && !isNaN(value)) {
    return value.toISOString().split('T')[0];
  }
  return null;
};

const RentHistory = () => {
  const {
    loading,
    historyRecords,
    loadRentHistory,
    refresh,
    setHistoryRecords,
    handleDelete,
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
    if (preset === 'all') {
      setDateFrom('')
      setDateTo('')
      return
    }

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    let from = ''
    if (preset === 'thisMonth') {
      from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
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
      // Global search
      const term = globalSearch.toLowerCase().trim()
      if (term) {
        const matches =
          record.tenant?.toLowerCase().includes(term) ||
          record.unit?.toLowerCase().includes(term) ||
          (record.notes || '').toLowerCase().includes(term) ||
          String(record.amount || '').includes(term)
        if (!matches) return false
      }

      // Tenant & Unit filter
      if (tenantFilter && !record.tenant?.toLowerCase().includes(tenantFilter.toLowerCase().trim()))
        return false
      if (unitFilter && !record.unit?.toLowerCase().includes(unitFilter.toLowerCase().trim()))
        return false

      // Status filter
      if (statusFilter && record.status !== statusFilter) return false

      // ────────────────────────────────
      // FIXED DATE FILTER
      const recDate = normalizeDate(record.paymentDate || record.dueDate || record.lastPaymentDate)

      // If no valid date → show record (you can change to return false if you want to hide)
      if (!recDate) return true

      if (dateFrom && recDate < dateFrom) return false
      if (dateTo && recDate > dateTo) return false
      // ────────────────────────────────

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
    datePreset   // Added this - important for preset changes
  ])

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'tenant', header: 'Tenant Name' },
      { accessorKey: 'unit', header: 'Property / Unit' },
      {
        accessorKey: 'monthlyRent',
        header: 'Monthly Rent',
        cell: ({ getValue }) => fmt(getValue() || 0),
      },
      {
        accessorKey: 'lastPaymentDate',
        header: 'Last Payment Date',
        cell: ({ row }) => formatDate(row.original.dueDate || row.original.lastPaymentDate),
      },
      { accessorKey: 'paymentMethod', header: 'Payment Method' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const v = getValue()
          const colors = {
            Paid: 'success',
            Late: 'warning',
            Pending: 'info',
            Overdue: 'danger',
            Leaved: 'secondary',
            Unpaid: 'danger',
          }
          return <CBadge color={colors[v] || 'secondary'}>{v || '—'}</CBadge>
        },
      },
      { accessorKey: 'allNotes', header: 'Notes' },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <>
            {row.original.status === 'Leaved' && (
              <CButton
                color="warning"
                size="sm"
                className="me-2"
                onClick={() => handleReinstate(row.original.id || row.original.Id)}
              >
                Reinstate
              </CButton>
            )}
            <CButton
              color="danger"
              size="sm"
              onClick={() => handleDelete(row.original.id || row.original.Id)}
            >
              Delete
            </CButton>
          </>
        ),
      },
    ],
    [refresh]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Rent History</strong>
            <CButton color="success" onClick={() => exportToCSV(columns, filteredData)}>
              Export CSV
            </CButton>
          </CCardHeader>

          <CCardBody>
            {/* Filters */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Search</label>
                <CFormInput
                  placeholder="Tenant, unit, notes, amount..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Status</label>
                <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Late">Late</option>
                  <option value="Leaved">Leaved</option>
                </CFormSelect>
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Date Range</label>
                <CFormSelect value={datePreset} onChange={(e) => applyDatePreset(e.target.value)}>
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
                    <label className="form-label small text-muted mb-1">From</label>
                    <CFormInput
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted mb-1">To</label>
                    <CFormInput
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </>
              )}
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
                              style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
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
                </div>

                {filteredData.length === 0 && !loading && (
                  <div className="text-center text-muted py-5">No records found.</div>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default RentHistory