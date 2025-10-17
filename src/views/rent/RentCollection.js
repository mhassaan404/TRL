import React, { useState, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
    CModal,
    CModalBody,
    CModalHeader,
    CModalTitle,
    CForm,
    CFormInput,
    CFormLabel,
    CFormSelect,
    CFormTextarea,
    CFormFeedback,
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

/* 🔹 RentCollection Form Component */
const RentCollectionForm = ({ onSubmit }) => {
    const [validated, setValidated] = useState(false)
    const [rent, setRent] = useState({
        tenant: '',
        unit: '',
        amount: '',
        paymentDate: '',
        dueDate: '',
        method: '',
        status: '',
        notes: '',
    })

    const handleSubmit = (event) => {
        event.preventDefault()
        const form = event.currentTarget
        if (form.checkValidity() === false) {
            event.stopPropagation()
        } else {
            onSubmit(rent)
            setRent({
                tenant: '',
                unit: '',
                amount: '',
                paymentDate: '',
                dueDate: '',
                method: '',
                status: '',
                notes: '',
            })
        }
        setValidated(true)
    }

    const propertiesList = [
        { building: 'Sunrise Apartments', unit: 'Unit 101', floor: '1' },
        { building: 'Sunrise Apartments', unit: 'Unit 102', floor: '2' },
        { building: 'Green Villa', unit: 'A1', floor: 'G' },
        { building: 'Green Villa', unit: 'A2', floor: '1' },
    ]
    const filteredFloors = rent.building
        ? [...new Set(propertiesList.filter(p => p.building === rent.building).map(p => p.floor))]
        : []
    const filteredUnits = rent.building && rent.floor
        ? propertiesList.filter(p => p.building === rent.building && p.floor === rent.floor).map(p => p.unit)
        : []

    return (
        <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
            <CCol md={4}>
                <CFormLabel htmlFor="tenantName">Tenant Name</CFormLabel>
                <CFormInput
                    id="tenantName"
                    value={rent.tenant}
                    onChange={(e) => setRent({ ...rent, tenant: e.target.value })}
                    required
                />
                <CFormFeedback invalid>Please enter tenant name.</CFormFeedback>
            </CCol>

            <CCol md={4}>
                <CFormLabel htmlFor="building">Building</CFormLabel>
                <CFormSelect
                    id="building"
                    value={rent.building}
                    onChange={(e) => setRent({ ...rent, building: e.target.value, floor: '', unit: '' })}
                    required
                >
                    <option value="">Select Building...</option>
                    {[...new Set(propertiesList.map((p) => p.building))].map((b) => (
                        <option key={b} value={b}>
                            {b}
                        </option>
                    ))}
                </CFormSelect>
                <CFormFeedback invalid>Please select building.</CFormFeedback>
            </CCol>

            <CCol md={4}>
                <CFormLabel htmlFor="floor">Floor</CFormLabel>
                <CFormSelect
                    id="floor"
                    value={rent.floor}
                    onChange={(e) => setRent({ ...rent, floor: e.target.value, unit: '' })}
                    required
                    disabled={!rent.building}
                >
                    <option value="">Select Floor...</option>
                    {filteredFloors.map((f) => (
                        <option key={f} value={f}>
                            {f}
                        </option>
                    ))}
                </CFormSelect>
                <CFormFeedback invalid>Please select floor.</CFormFeedback>
            </CCol>

            <CCol md={4}>
                <CFormLabel htmlFor="unit">Unit</CFormLabel>
                <CFormSelect
                    id="unit"
                    value={rent.unit}
                    onChange={(e) => setRent({ ...rent, unit: e.target.value })}
                    required
                    disabled={!rent.floor}
                >
                    <option value="">Select Unit...</option>
                    {filteredUnits.map((u) => (
                        <option key={u} value={u}>
                            {u}
                        </option>
                    ))}
                </CFormSelect>
                <CFormFeedback invalid>Please select unit.</CFormFeedback>
            </CCol>

            {/* <CCol md={6}>
                <CFormLabel htmlFor="unit">Property / Unit</CFormLabel>
                <CFormInput
                    id="unit"
                    value={rent.unit}
                    onChange={(e) => setRent({ ...rent, unit: e.target.value })}
                    required
                />
                <CFormFeedback invalid>Please enter property/unit.</CFormFeedback>
            </CCol> */}

            <CCol md={4}>
                <CFormLabel htmlFor="amount">Rent Amount</CFormLabel>
                <CFormInput
                    type="number"
                    id="amount"
                    value={rent.amount}
                    onChange={(e) => setRent({ ...rent, amount: e.target.value })}
                    required
                    min="0"
                />
                <CFormFeedback invalid>Please enter a valid rent amount.</CFormFeedback>
            </CCol>

            <CCol md={4}>
                <CFormLabel htmlFor="paymentDate">Payment Date</CFormLabel>
                <CFormInput
                    type="date"
                    id="paymentDate"
                    value={rent.paymentDate}
                    onChange={(e) => setRent({ ...rent, paymentDate: e.target.value })}
                    required
                />
                <CFormFeedback invalid>Please select payment date.</CFormFeedback>
            </CCol>

            <CCol md={4}>
                <CFormLabel htmlFor="dueDate">Due Date</CFormLabel>
                <CFormInput
                    type="date"
                    id="dueDate"
                    value={rent.dueDate}
                    onChange={(e) => setRent({ ...rent, dueDate: e.target.value })}
                    required
                />
                <CFormFeedback invalid>Please select due date.</CFormFeedback>
            </CCol>

            <CCol md={4}>
                <CFormLabel htmlFor="method">Payment Method</CFormLabel>
                <CFormSelect
                    id="method"
                    value={rent.method}
                    onChange={(e) => setRent({ ...rent, method: e.target.value })}
                    required
                >
                    <option value="">Select Method...</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Online Payment</option>
                </CFormSelect>
                <CFormFeedback invalid>Please select payment method.</CFormFeedback>
            </CCol>

            <CCol md={4}>
                <CFormLabel htmlFor="status">Status</CFormLabel>
                <CFormSelect
                    id="status"
                    value={rent.status}
                    onChange={(e) => setRent({ ...rent, status: e.target.value })}
                    required
                >
                    <option value="">Select Status...</option>
                    <option>Paid</option>
                    <option>Pending</option>
                    <option>Overdue</option>
                    <option>Leaved</option>
                </CFormSelect>
                <CFormFeedback invalid>Please select status.</CFormFeedback>
            </CCol>

            <CCol xs={12}>
                <CFormLabel htmlFor="notes">Notes</CFormLabel>
                <CFormTextarea
                    id="notes"
                    value={rent.notes}
                    onChange={(e) => setRent({ ...rent, notes: e.target.value })}
                    placeholder="Optional notes"
                />
            </CCol>

            <CCol xs={12}>
                <CButton color="primary" type="submit">
                    Add Rent Collection
                </CButton>
            </CCol>
        </CForm>
    )
}

/* 🔹 CSV Export Helper */
const exportCSV = (columns, data, filename = 'rent_collection.csv') => {
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

/* 🔹 Main RentCollection Page */
const RentCollection = () => {
    const [rentRecords, setRentRecords] = useState([
        {
            id: uuidv4(),
            tenant: 'Ali Khan',
            building: 'Sunrise Apartments',
            floor: '1',
            unit: 'Unit 101',
            amount: 25000,
            paymentDate: '2025-09-01',
            dueDate: '2025-09-05',
            method: 'Cash',
            status: 'Paid',
            notes: '',
            createdBy: 'admin',
            createdAt: '2025-09-01',
        },
        {
            id: uuidv4(),
            tenant: 'Sara Ahmed',
            building: 'Sunrise Apartments',
            floor: '2',
            unit: 'Unit 202',
            amount: 40000,
            paymentDate: '2025-09-05',
            dueDate: '2025-09-10',
            method: 'Bank Transfer',
            status: 'Pending',
            notes: '',
            createdBy: 'admin',
            createdAt: '2025-09-05',
        },
    ])

    const [visible, setVisible] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])

    /* 🔹 Inline update */
    const handleInlineUpdate = (id, field, value) => {
        setRentRecords((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, [field]: value, updatedAt: new Date().toISOString() } : r
            )
        )
    }

    /* 🔹 Bulk Due Date Update */
    const handleBulkDueDateUpdate = () => {
        const newDue = prompt('Enter new due date (YYYY-MM-DD) for selected tenants:')
        if (!newDue) return
        setRentRecords((prev) =>
            prev.map((r) =>
                selectedIds.includes(r.id) ? { ...r, dueDate: newDue, updatedAt: new Date().toISOString() } : r
            )
        )
        setSelectedIds([])
    }

    const [expandedRows, setExpandedRows] = useState({})
    const toggleExpand = (id) => {
        setExpandedRows((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))
    }

    const columns = useMemo(
        () => [
            {
                accessorKey: 'expand',
                header: '',
                cell: ({ row }) => (
                    <CButton
                        color="secondary"
                        size="sm"
                        onClick={() => toggleExpand(row.original.id)}
                    >
                        {expandedRows[row.original.id] ? '-' : '+'}
                    </CButton>
                ),
            },
            {
                accessorKey: 'select',
                header: ({ table }) => (
                    <CFormCheck
                        checked={selectedIds.length === table.getFilteredRowModel().rows.length}
                        onChange={(e) => {
                            const allIds = table.getFilteredRowModel().rows.map((row) => row.original.id)
                            setSelectedIds(e.target.checked ? allIds : [])
                        }}
                    />
                ),
                cell: ({ row }) => (
                    <CFormCheck
                        checked={selectedIds.includes(row.original.id)}
                        onChange={(e) => {
                            if (e.target.checked) {
                                setSelectedIds((prev) => [...prev, row.original.id])
                            } else {
                                setSelectedIds((prev) => prev.filter((id) => id !== row.original.id))
                            }
                        }}
                    />
                ),
            },
            { accessorKey: 'tenant', header: 'Tenant Name' },
            { accessorKey: 'building', header: 'Building' },
            { accessorKey: 'unit', header: 'Unit' },
            {
                accessorKey: 'amount',
                header: 'Rent Amount',
                cell: ({ row }) =>
                    editingId === row.original.id ? (
                        <CFormInput
                            type="number"
                            size="sm"
                            value={row.original.amount}
                            onChange={(e) => handleInlineUpdate(row.original.id, 'amount', e.target.value)}
                        />
                    ) : (
                        row.original.amount
                    ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) =>
                    editingId === row.original.id ? (
                        <CFormSelect
                            size="sm"
                            value={row.original.status}
                            onChange={(e) => handleInlineUpdate(row.original.id, 'status', e.target.value)}
                        >
                            <option>Paid</option>
                            <option>Pending</option>
                            <option>Overdue</option>
                            <option>Leaved</option>
                        </CFormSelect>
                    ) : (
                        row.original.status
                    ),
            },
            {
                accessorKey: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <>
                        {editingId === row.original.id ? (
                            <CButton color="success" size="sm" onClick={() => setEditingId(null)}>
                                Save
                            </CButton>
                        ) : (
                            <>
                                <CButton
                                    color="info"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => setEditingId(row.original.id)}
                                >
                                    Edit
                                </CButton>
                                <CButton
                                    color="danger"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleDelete(row.original.id)}
                                >
                                    Delete
                                </CButton>
                                <CButton
                                    color="warning"
                                    size="sm"
                                    onClick={() => handleMarkLeaved(row.original.id)}
                                >
                                    Mark Leaved
                                </CButton>
                            </>
                        )}
                    </>
                ),
            },
        ],
        [editingId, expandedRows, selectedIds]
    )


    /* 🔹 Delete handler */
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            setRentRecords((prev) => prev.filter((r) => r.id !== id))
        }
    }

    /* 🔹 Mark Leaved handler */
    const handleMarkLeaved = (id) => {
        if (window.confirm('Are you sure you want to change status to Leaved?')) {
            setRentRecords((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status: 'Leaved', updatedAt: new Date().toISOString() } : r))
            )
        }
    }

    const table = useReactTable({
        data: rentRecords,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    const handleAddRentCollection = (newRent) => {
        const rentWithId = { ...newRent, id: uuidv4(), createdBy: 'admin', createdAt: new Date().toISOString() }
        setRentRecords([...rentRecords, rentWithId])
        setVisible(false)
    }

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader className="d-flex justify-content-between align-items-center">
                        <strong>Rent Collection</strong>
                        <div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                style={{ width: '200px', display: 'inline-block', marginRight: '10px' }}
                            />
                            <CButton color="success" onClick={() => exportCSV(columns, rentRecords)} className="me-2">
                                Export CSV
                            </CButton>
                            <CButton color="primary" onClick={() => setVisible(true)} className="me-2">
                                + Add Rent
                            </CButton>
                            <CButton color="warning" onClick={handleBulkDueDateUpdate} disabled={selectedIds.length === 0}>
                                Update Due Date for Selected
                            </CButton>
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
                                    <React.Fragment key={row.id}>
                                        <tr>
                                            {row.getVisibleCells().map((cell) => (
                                                <td key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                        {expandedRows[row.original.id] && (
                                            <tr>
                                                <td colSpan={columns.length}>
                                                    <div><strong>Floor:</strong> {row.original.floor}</div>
                                                    <div><strong>Payment Date:</strong> {row.original.paymentDate}</div>
                                                    <div><strong>Due Date:</strong> {row.original.dueDate}</div>
                                                    <div><strong>Method:</strong> {row.original.method}</div>
                                                    <div><strong>Notes:</strong> {row.original.notes}</div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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
                                Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{' '}
                                {table.getPageCount()}
                            </span>
                        </div>
                    </CCardBody>
                </CCard>
            </CCol>

            {/* ✅ Modal with RentCollectionForm */}
            <CModal visible={visible} onClose={() => setVisible(false)} size="xl">
                <CModalHeader>
                    <CModalTitle>Add Rent Collection</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <RentCollectionForm onSubmit={handleAddRentCollection} />
                </CModalBody>
            </CModal>
        </CRow>
    )
}

export default RentCollection
