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
  CFormCheck,
  CFormInput,
  CFormFeedback,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
} from '@coreui/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table'

// 🔹 Tenant form component
const TenantForm = ({ onSubmit }) => {
  const [validated, setValidated] = useState(false)
  const [tenant, setTenant] = useState({
    name: '',
    email: '',
    phone: '',
    unit: '',
    city: '',
    notes: '',
    agree: false,
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = event.currentTarget

    if (form.checkValidity() === false) {
      event.stopPropagation()
    } else {
      onSubmit(tenant) // send tenant data to parent
      setTenant({
        name: '',
        email: '',
        phone: '',
        unit: '',
        city: '',
        notes: '',
        agree: false,
      })
    }

    setValidated(true)
  }

  return (
    <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      <CCol md={6}>
        <CFormLabel htmlFor="tenantName">Tenant Name</CFormLabel>
        <CFormInput
          type="text"
          id="tenantName"
          value={tenant.name}
          onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter tenant name.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="tenantEmail">Email</CFormLabel>
        <CFormInput
          type="email"
          id="tenantEmail"
          value={tenant.email}
          onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter valid email.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="tenantPhone">Phone</CFormLabel>
        <CFormInput
          type="text"
          id="tenantPhone"
          value={tenant.phone}
          onChange={(e) => setTenant({ ...tenant, phone: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter phone number.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="tenantUnit">Property / Unit</CFormLabel>
        <CFormSelect
          id="tenantUnit"
          value={tenant.unit}
          onChange={(e) => setTenant({ ...tenant, unit: e.target.value })}
          required
        >
          <option value="">Select Unit...</option>
          <option>Unit 101</option>
          <option>Unit 102</option>
        </CFormSelect>
        <CFormFeedback invalid>Please select a unit.</CFormFeedback>
      </CCol>

      <CCol md={6}>
        <CFormLabel htmlFor="tenantCity">City</CFormLabel>
        <CFormInput
          type="text"
          id="tenantCity"
          value={tenant.city}
          onChange={(e) => setTenant({ ...tenant, city: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter city.</CFormFeedback>
      </CCol>

      <CCol xs={12}>
        <CFormLabel htmlFor="tenantNotes">Notes</CFormLabel>
        <CFormTextarea
          id="tenantNotes"
          value={tenant.notes}
          onChange={(e) => setTenant({ ...tenant, notes: e.target.value })}
          placeholder="Optional notes"
        />
      </CCol>

      <CCol xs={12}>
        <CFormCheck
          type="checkbox"
          id="tenantAgree"
          label="Agree to terms and conditions"
          checked={tenant.agree}
          onChange={(e) => setTenant({ ...tenant, agree: e.target.checked })}
          required
        />
        <CFormFeedback invalid>You must agree before submitting.</CFormFeedback>
      </CCol>

      <CCol xs={12}>
        <CButton color="primary" type="submit">
          Add Tenant
        </CButton>
      </CCol>
    </CForm>
  )
}

// 🔹 CSV export helper
const exportCSV = (columns, data, filename = 'tenants.csv') => {
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

const Tenants = () => {
  const [tenants, setTenants] = useState([
    { id: 1, name: 'Ali Khan', email: 'ali@example.com', phone: '03001234567', city: 'Karachi' },
    { id: 2, name: 'Sara Ahmed', email: 'sara@example.com', phone: '03007654321', city: 'Lahore' },
  ])

  const [visible, setVisible] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'phone', header: 'Phone' },
      { accessorKey: 'city', header: 'City' },
    ],
    []
  )

  const table = useReactTable({
    data: tenants,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // ✅ onSubmit passed to form
  const handleAddTenant = (newTenant) => {
    const tenantWithId = { ...newTenant, id: tenants.length + 1 }
    setTenants([...tenants, tenantWithId])
    setVisible(false)
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Tenants</strong>
            <div>
              <input
                type="text"
                placeholder="Search..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                style={{ width: '200px', display: 'inline-block', marginRight: '10px' }}
              />
              <CButton color="success" onClick={() => exportCSV(columns, tenants)} className="me-2">
                Export CSV
              </CButton>
              <CButton color="primary" onClick={() => setVisible(true)}>
                + Add Tenant
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
                Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{' '}
                {table.getPageCount()}
              </span>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      {/* ✅ Modal with TenantForm */}
      <CModal visible={visible} onClose={() => setVisible(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Add Tenant</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <TenantForm onSubmit={handleAddTenant} />
        </CModalBody>
      </CModal>
    </CRow>
  )
}

export default Tenants