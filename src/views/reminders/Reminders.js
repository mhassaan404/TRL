import React, { useState, useMemo } from 'react'
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
    CFormSelect,
    CFormCheck,
} from '@coreui/react'
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table'

// 🔹 Sample tenants with building/floor/unit and due date
const tenantsList = [
    { id: 1, name: 'Ali Khan', building: 'Sunrise Apartments', floor: '1', unit: '101', dueDate: '2025-09-25', paymentDate: '2025-09-20', status: 'Pending' },
    { id: 2, name: 'Sara Ahmed', building: 'Sunrise Apartments', floor: '2', unit: '102', dueDate: '2025-09-27', paymentDate: '2025-09-20', status: 'Pending' },
    { id: 3, name: 'Bilal Iqbal', building: 'Green Villa', floor: 'G', unit: 'A1', dueDate: '2025-09-30', paymentDate: '2025-09-20', status: 'Pending' },
    { id: 4, name: 'Hina Raza', building: 'Green Villa', floor: '1', unit: 'A2', dueDate: '2025-09-20', paymentDate: '2025-09-20', status: 'Paid' },
]

const exportCSV = (columns, data, filename = 'reminder_list.csv') => {
    const headers = columns.map((col) => col.header).join(',')
    const rows = data.map((row) => columns.map((col) => row[col.accessorKey] ?? '').join(','))
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

const Reminder = () => {
    const [tenants, setTenants] = useState(tenantsList)
    const [globalFilter, setGlobalFilter] = useState('')
    const [filterBuilding, setFilterBuilding] = useState('')
    const [selectedIds, setSelectedIds] = useState([])

    const filteredTenants = useMemo(() => {
        return tenants.filter(
            (t) =>
                (!filterBuilding || t.building === filterBuilding) &&
                (!globalFilter ||
                    t.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
                    t.unit.toLowerCase().includes(globalFilter.toLowerCase()))
        )
    }, [tenants, globalFilter, filterBuilding])

    const handleSendReminder = () => {
        const selectedTenants = tenants.filter(t => selectedIds.includes(t.id) && t.status !== 'Paid')
        if (selectedTenants.length === 0) return
        const names = selectedTenants.map(t => `${t.name} (${t.unit})`).join(', ')
        alert(`Reminder sent to: ${names}`)
        setSelectedIds([])
    }

    const getStatusColor = (tenant) => {
        if (tenant.status === 'Paid') return 'green'
        const today = new Date()
        const due = new Date(tenant.dueDate)
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
        if (diffDays <= 3) return 'orange'
        return 'red'
    }

    const columns = useMemo(() => [
        {
            accessorKey: 'select',
            header: ({ table }) => (
                <CFormCheck
                    checked={selectedIds.length === filteredTenants.length && filteredTenants.length > 0}
                    onChange={(e) => {
                        const allIds = filteredTenants.map(t => t.id)
                        setSelectedIds(e.target.checked ? allIds : [])
                    }}
                />
            ),
            cell: ({ row }) => (
                <CFormCheck
                    checked={selectedIds.includes(row.original.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedIds(prev => [...prev, row.original.id])
                        } else {
                            setSelectedIds(prev => prev.filter(id => id !== row.original.id))
                        }
                    }}
                />
            ),
        },
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
        {
            accessorKey: 'paymentDate',
            header: 'Payment Date',
            cell: ({ row }) => row.original.paymentDate || '-'  // show '-' if not paid
        },
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
    ], [selectedIds, filteredTenants])

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

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader className="d-flex justify-content-between align-items-center">
                        <strong>Payment Reminders</strong>
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
                                onChange={(e) => setFilterBuilding(e.target.value)}
                                style={{ display: 'inline-block', width: '150px', marginRight: '10px' }}
                            >
                                <option value="">All Buildings</option>
                                {[...new Set(tenantsList.map((t) => t.building))].map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </CFormSelect>
                            <CButton
                                color="primary"
                                onClick={handleSendReminder}
                                disabled={selectedIds.length === 0}
                                className="me-2"
                            >
                                Send Reminder
                            </CButton>
                            <CButton
                                color="success"
                                onClick={() => exportCSV(columns, filteredTenants)}
                            >
                                Export CSV
                            </CButton>
                        </div>
                    </CCardHeader>
                    <CCardBody>
                        <table className="table table-bordered table-striped">
                            <thead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
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
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
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

export default Reminder