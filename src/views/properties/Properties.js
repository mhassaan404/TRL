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

// 🔹 Floor options
const floorOptions = ['B2', 'B1', 'G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

// 🔹 Property Form Component
const PropertyForm = ({ onSubmit, initialData }) => {
  const [validated, setValidated] = useState(false)
  const [property, setProperty] = useState(
    initialData || {
      name: '',
      unit: '',
      floor: '',
      type: '',
      address: '',
      city: '',
      rent: '',
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
      onSubmit(property)
      setProperty({
        name: '',
        floor: '',
        unit: '',
        type: '',
        address: '',
        city: '',
        rent: '',
        status: '',
        notes: '',
      })
    }
    setValidated(true)
  }

  return (
    <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      <CCol md={4}>
        <CFormLabel htmlFor="propertyName">Property Name</CFormLabel>
        <CFormInput
          id="propertyName"
          value={property.name}
          onChange={(e) => setProperty({ ...property, name: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter property name.</CFormFeedback>
      </CCol>

      <CCol md={4}>
        <CFormLabel htmlFor="propertyFloor">Floor</CFormLabel>
        <CFormSelect
          id="propertyFloor"
          value={property.floor}
          onChange={(e) => setProperty({ ...property, floor: e.target.value })}
          required
        >
          <option value="">Select Floor...</option>
          {floorOptions.map((floor) => (
            <option key={floor} value={floor}>
              {floor}
            </option>
          ))}
        </CFormSelect>
        <CFormFeedback invalid>Please select floor.</CFormFeedback>
      </CCol>

      <CCol md={4}>
        <CFormLabel htmlFor="propertyUnit">Unit No.</CFormLabel>
        <CFormInput
          id="propertyUnit"
          value={property.unit}
          onChange={(e) => setProperty({ ...property, unit: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter unit number.</CFormFeedback>
      </CCol>

      <CCol md={4}>
        <CFormLabel htmlFor="propertyType">Type</CFormLabel>
        <CFormSelect
          id="propertyType"
          value={property.type}
          onChange={(e) => setProperty({ ...property, type: e.target.value })}
          required
        >
          <option value="">Select Type...</option>
          <option>Apartment</option>
          <option>House</option>
          <option>Office</option>
          <option>Shop</option>
        </CFormSelect>
        <CFormFeedback invalid>Please select property type.</CFormFeedback>
      </CCol>

      <CCol md={4}>
        <CFormLabel htmlFor="propertyRent">Rent Amount</CFormLabel>
        <CFormInput
          type="number"
          id="propertyRent"
          value={property.rent}
          onChange={(e) => setProperty({ ...property, rent: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter rent amount.</CFormFeedback>
      </CCol>

      <CCol md={4}>
        <CFormLabel htmlFor="propertyCity">City</CFormLabel>
        <CFormInput
          id="propertyCity"
          value={property.city}
          onChange={(e) => setProperty({ ...property, city: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter city.</CFormFeedback>
      </CCol>

      <CCol md={4}>
        <CFormLabel htmlFor="propertyStatus">Status</CFormLabel>
        <CFormSelect
          id="propertyStatus"
          value={property.status}
          onChange={(e) => setProperty({ ...property, status: e.target.value })}
          required
        >
          <option value="">Select Status...</option>
          <option>Available</option>
          <option>Rented</option>
          <option>Maintenance</option>
        </CFormSelect>
        <CFormFeedback invalid>Please select status.</CFormFeedback>
      </CCol>

      <CCol md={12}>
        <CFormLabel htmlFor="propertyAddress">Address</CFormLabel>
        <CFormInput
          id="propertyAddress"
          value={property.address}
          onChange={(e) => setProperty({ ...property, address: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter address.</CFormFeedback>
      </CCol>

      <CCol xs={12}>
        <CFormLabel htmlFor="propertyNotes">Notes</CFormLabel>
        <CFormTextarea
          id="propertyNotes"
          value={property.notes}
          onChange={(e) => setProperty({ ...property, notes: e.target.value })}
          placeholder="Optional notes"
        />
      </CCol>

      <CCol xs={12}>
        <CButton color="primary" type="submit">
          {initialData ? 'Update Property' : 'Add Property'}
        </CButton>
      </CCol>
    </CForm>
  )
}

// 🔹 CSV Export Helper
const exportCSV = (columns, data, filename = 'properties.csv') => {
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

const Properties = () => {
  const [properties, setProperties] = useState([
    { id: 1, name: 'Sunrise Apartments', unit: '101', floor: '1', type: 'Apartment', rent: '25000', address: 'Street 1', city: 'Karachi', status: 'Available', notes: '' },
    { id: 2, name: 'Green Villa', unit: 'A2', floor: 'G', type: 'House', rent: '40000', address: 'Street 2', city: 'Lahore', status: 'Rented', notes: '' },
  ])

  const [visible, setVisible] = useState(false)
  const [editData, setEditData] = useState(null)
  const [globalFilter, setGlobalFilter] = useState('')

  const handleAddProperty = (property) => {
    if (editData) {
      // Update existing property
      setProperties((prev) =>
        prev.map((p) => (p.id === editData.id ? { ...property, id: editData.id } : p))
      )
      setEditData(null)
    } else {
      // Add new property
      const newProperty = { ...property, id: properties.length + 1 }
      setProperties([...properties, newProperty])
    }
    setVisible(false)
  }

  const handleEdit = (property) => {
    setEditData(property)
    setVisible(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      setProperties((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Property Name' },
      { accessorKey: 'floor', header: 'Floor' },
      { accessorKey: 'unit', header: 'Unit' },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'rent', header: 'Rent' },
      { accessorKey: 'city', header: 'City' },
      { accessorKey: 'status', header: 'Status' },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <>
            <CButton size="sm" color="info" className="me-2" onClick={() => handleEdit(row.original)}>
              Edit
            </CButton>
            <CButton size="sm" color="danger" onClick={() => handleDelete(row.original.id)}>
              Delete
            </CButton>
          </>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: properties,
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
            <strong>Properties</strong>
            <div>
              <input
                type="text"
                placeholder="Search..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                style={{ width: '200px', display: 'inline-block', marginRight: '10px' }}
              />
              <CButton color="success" onClick={() => exportCSV(columns, properties)} className="me-2">
                Export CSV
              </CButton>
              <CButton color="primary" onClick={() => setVisible(true)}>
                + Add Property
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

      {/* ✅ Modal with PropertyForm */}
      <CModal visible={visible} onClose={() => setVisible(false)} size="xl">
        <CModalHeader>
          <CModalTitle>{editData ? 'Edit Property' : 'Add Property'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <PropertyForm onSubmit={handleAddProperty} initialData={editData} />
        </CModalBody>
      </CModal>
    </CRow>
  )
}

export default Properties
