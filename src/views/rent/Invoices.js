import React, { useState, useMemo } from 'react'
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
} from '@coreui/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table'

/* 🔹 Invoice Form Component */
const InvoiceForm = ({ onSubmit, initialData }) => {
  const [validated, setValidated] = useState(false)
  const [invoice, setInvoice] = useState(
    initialData || {
      tenant: '',
      unit: '',
      invoiceNumber: '',
      amount: '',
      issueDate: '',
      dueDate: '',
      status: '',
      notes: '',
    }
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.stopPropagation()
    } else {
      onSubmit(invoice)
    }
    setValidated(true)
  }

  return (
    <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      <CCol md={6}>
        <CFormLabel>Tenant Name</CFormLabel>
        <CFormInput
          value={invoice.tenant}
          onChange={(e) => setInvoice({ ...invoice, tenant: e.target.value })}
          required
          readOnly={!!initialData} // Read-only if editing
        />
        <CFormFeedback invalid>Please enter tenant name.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel>Property / Unit</CFormLabel>
        <CFormInput
          value={invoice.unit}
          onChange={(e) => setInvoice({ ...invoice, unit: e.target.value })}
          required
          readOnly={!!initialData}
        />
        <CFormFeedback invalid>Please enter property/unit.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel>Invoice Number</CFormLabel>
        <CFormInput
          value={invoice.invoiceNumber}
          onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
          required
          readOnly={!!initialData}
        />
        <CFormFeedback invalid>Please enter invoice number.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel>Amount</CFormLabel>
        <CFormInput
          type="number"
          value={invoice.amount}
          onChange={(e) => setInvoice({ ...invoice, amount: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter amount.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel>Issue Date</CFormLabel>
        <CFormInput
          type="date"
          value={invoice.issueDate}
          onChange={(e) => setInvoice({ ...invoice, issueDate: e.target.value })}
          required
          readOnly={!!initialData}
        />
        <CFormFeedback invalid>Please select issue date.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel>Due Date</CFormLabel>
        <CFormInput
          type="date"
          value={invoice.dueDate}
          onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
          required
          readOnly={!!initialData}
        />
        <CFormFeedback invalid>Please select due date.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel>Status</CFormLabel>
        <CFormSelect
          value={invoice.status}
          onChange={(e) => setInvoice({ ...invoice, status: e.target.value })}
          required
        >
          <option value="">Select Status...</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
        </CFormSelect>
        <CFormFeedback invalid>Please select status.</CFormFeedback>
      </CCol>

      <CCol xs={12}>
        <CFormLabel>Notes</CFormLabel>
        <CFormTextarea
          value={invoice.notes}
          onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
          placeholder="Optional notes"
        />
      </CCol>

      <CCol xs={12}>
        <CButton color="primary" type="submit">
          {initialData ? 'Update Invoice' : 'Add Invoice'}
        </CButton>
      </CCol>
    </CForm>
  )
}

/* 🔹 CSV Export */
const exportCSV = (columns, data, filename = 'invoices.csv') => {
  const headers = columns.map((col) => col.header).join(',')
  const rows = data.map((row) => columns.map((col) => row[col.accessorKey]).join(','))
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* 🔹 Main Invoices Page */
const Invoices = () => {
  const [invoiceRecords, setInvoiceRecords] = useState([
    {
      id: 1,
      tenant: 'Ali Khan',
      unit: 'Unit 101',
      invoiceNumber: 'INV001',
      amount: '25000',
      issueDate: '2025-09-01',
      dueDate: '2025-09-05',
      status: 'Pending',
    },
    {
      id: 2,
      tenant: 'Sara Ahmed',
      unit: 'Unit 202',
      invoiceNumber: 'INV002',
      amount: '40000',
      issueDate: '2025-09-03',
      dueDate: '2025-09-10',
      status: 'Paid',
    },
  ])

  const [visible, setVisible] = useState(false)
  const [modalData, setModalData] = useState(null) // full edit modal
  const [globalFilter, setGlobalFilter] = useState('')
  const [editingId, setEditingId] = useState(null)

  const handleAddInvoice = (newInvoice) => {
    if (modalData) {
      // update existing
      setInvoiceRecords((prev) =>
        prev.map((inv) => (inv.id === modalData.id ? { ...modalData, ...newInvoice } : inv))
      )
      setModalData(null)
    } else {
      const invoiceWithId = { ...newInvoice, id: invoiceRecords.length + 1 }
      setInvoiceRecords([...invoiceRecords, invoiceWithId])
    }
    setVisible(false)
  }

  const handleInlineUpdate = (id, field, value) => {
    setInvoiceRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleDelete = (id) => {
    setInvoiceRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'tenant', header: 'Tenant Name' },
      { accessorKey: 'unit', header: 'Property / Unit' },
      { accessorKey: 'invoiceNumber', header: 'Invoice #' },
      {
        accessorKey: 'amount',
        header: 'Amount',
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
      { accessorKey: 'issueDate', header: 'Issue Date' },
      { accessorKey: 'dueDate', header: 'Due Date' },
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
              <CButton
                color="success"
                size="sm"
                className="me-2"
                onClick={() => setEditingId(null)}
              >
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
                  Edit Inline
                </CButton>
                <CButton
                  color="warning"
                  size="sm"
                  className="me-2"
                  onClick={() => {
                    setModalData(row.original)
                    setVisible(true)
                  }}
                >
                  Edit Full
                </CButton>
                <CButton
                  color="danger"
                  size="sm"
                  onClick={() => handleDelete(row.original.id)}
                >
                  Delete
                </CButton>
              </>
            )}
          </>
        ),
      },
    ],
    [editingId, modalData]
  )

  const table = useReactTable({
    data: invoiceRecords,
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
            <strong>Invoices</strong>
            <div>
              <input
                type="text"
                placeholder="Search..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                style={{ width: '200px', display: 'inline-block', marginRight: '10px' }}
              />
              <CButton color="success" onClick={() => exportCSV(columns, invoiceRecords)} className="me-2">
                Export CSV
              </CButton>
              <CButton color="primary" onClick={() => setVisible(true)}>
                + Add Invoice
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

      {/* ✅ Modal with InvoiceForm */}
      <CModal visible={visible} onClose={() => { setVisible(false); setModalData(null) }} size="lg">
        <CModalHeader>
          <CModalTitle>{modalData ? 'Edit Invoice' : 'Add Invoice'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <InvoiceForm onSubmit={handleAddInvoice} initialData={modalData} />
        </CModalBody>
      </CModal>
    </CRow>
  )
}

export default Invoices
