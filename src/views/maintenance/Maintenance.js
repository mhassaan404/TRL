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

// 🔹 Maintenance Form Component
const MaintenanceForm = ({ onSubmit, initialData }) => {
  const [validated, setValidated] = useState(false)
  const [request, setRequest] = useState(
    initialData || {
      title: '',
      building: '',
      floor: '',
      unit: '',
      priority: 'Low',
      description: '',
      assignedTo: '',
    }
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.stopPropagation()
    } else {
      onSubmit(request)
      setRequest({
        title: '',
        building: '',
        floor: '',
        unit: '',
        priority: 'Low',
        description: '',
        assignedTo: '',
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
  const filteredFloors = request.building
    ? [...new Set(propertiesList.filter(p => p.building === request.building).map(p => p.floor))]
    : []
  const filteredUnits = request.building && request.floor
    ? propertiesList.filter(p => p.building === request.building && p.floor === request.floor).map(p => p.unit)
    : []

  return (
    <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      <CCol md={4}>
        <CFormLabel htmlFor="reqTitle">Title</CFormLabel>
        <CFormInput
          id="reqTitle"
          value={request.title}
          onChange={(e) => setRequest({ ...request, title: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter request title.</CFormFeedback>
      </CCol>

      <CCol md={4}>
        <CFormLabel htmlFor="building">Building</CFormLabel>
        <CFormSelect
          id="building"
          value={request.building}
          onChange={(e) => setRequest({ ...request, building: e.target.value, floor: '', unit: '' })}
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
          value={request.floor}
          onChange={(e) => setRequest({ ...request, floor: e.target.value, unit: '' })}
          required
          disabled={!request.building}
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
          value={request.unit}
          onChange={(e) => setRequest({ ...request, unit: e.target.value })}
          required
          disabled={!request.floor}
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

      <CCol md={4}>
        <CFormLabel htmlFor="reqPriority">Priority</CFormLabel>
        <CFormSelect
          id="reqPriority"
          value={request.priority}
          onChange={(e) => setRequest({ ...request, priority: e.target.value })}
          required
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </CFormSelect>
        <CFormFeedback invalid>Please select priority.</CFormFeedback>
      </CCol>

      <CCol md={4}>
        <CFormLabel htmlFor="reqAssigned">Assigned To</CFormLabel>
        <CFormInput
          id="reqAssigned"
          value={request.assignedTo}
          onChange={(e) => setRequest({ ...request, assignedTo: e.target.value })}
          placeholder="Optional"
        />
      </CCol>

      <CCol xs={12}>
        <CFormLabel htmlFor="reqDescription">Description</CFormLabel>
        <CFormTextarea
          id="reqDescription"
          rows={3}
          value={request.description}
          onChange={(e) => setRequest({ ...request, description: e.target.value })}
          required
        />
        <CFormFeedback invalid>Please enter description.</CFormFeedback>
      </CCol>

      <CCol xs={12}>
        <CButton color="primary" type="submit">
          {initialData ? 'Update Request' : 'Create Request'}
        </CButton>
      </CCol>
    </CForm>
  )
}

// 🔹 CSV Export Helper
const exportCSV = (columns, data, filename = 'maintenance_requests.csv') => {
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

const Maintenance = () => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      title: 'Leaky faucet',
      building: 'Sunrise Apartments',
      floor: '1',
      unit: 'Unit 101',
      description: 'Kitchen sink faucet leaking',
      priority: 'Low',
      status: 'Open',
      createdAt: '2025-09-01',
      assignedTo: '',
    },
    {
      id: 2,
      title: 'AC not cooling',
      building: 'Sunrise Apartments',
      floor: '2',
      unit: 'Unit 202',
      description: 'AC runs but air is warm',
      priority: 'High',
      status: 'In Progress',
      createdAt: '2025-09-05',
      assignedTo: 'Technician Ali',
    },
  ])

  const [visible, setVisible] = useState(false)
  const [editData, setEditData] = useState(null)
  const [globalFilter, setGlobalFilter] = useState('')

  const handleAddRequest = (request) => {
    if (editData) {
      setRequests((prev) =>
        prev.map((r) => (r.id === editData.id ? { ...request, id: editData.id, status: r.status, createdAt: r.createdAt } : r))
      )
      setEditData(null)
    } else {
      const newRequest = {
        ...request,
        id: Date.now(),
        status: 'Open',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setRequests([newRequest, ...requests])
    }
    setVisible(false)
  }

  const handleEdit = (request) => {
    setEditData(request)
    setVisible(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      setRequests((prev) => prev.filter((r) => r.id !== id))
    }
  }

  const handleChangeStatus = (id, status) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    )
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'unit', header: 'Unit' },
      { accessorKey: 'description', header: 'Description' },
      { accessorKey: 'priority', header: 'Priority' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'assignedTo', header: 'Assigned To' },
      { accessorKey: 'createdAt', header: 'Created At' },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <>
            <CButton size="sm" color="info" className="me-2" onClick={() => handleEdit(row.original)}>
              Edit
            </CButton>
            {row.original.status !== 'Closed' && (
              <CButton size="sm" color="success" className="me-2" onClick={() => handleChangeStatus(row.original.id, 'Closed')}>
                Mark Closed
              </CButton>
            )}
            <CButton size="sm" color="danger" onClick={() => handleDelete(row.original.id)}>
              Delete
            </CButton>
          </>
        ),
      },
    ],
    [requests]
  )

  const table = useReactTable({
    data: requests,
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
            <strong>Maintenance Requests</strong>
            <div>
              <input
                type="text"
                placeholder="Search..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                style={{ width: '200px', display: 'inline-block', marginRight: '10px' }}
              />
              <CButton color="success" onClick={() => exportCSV(columns, requests)} className="me-2">
                Export CSV
              </CButton>
              <CButton color="primary" onClick={() => setVisible(true)}>
                + Create Request
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

      {/* ✅ Modal with MaintenanceForm */}
      <CModal visible={visible} onClose={() => setVisible(false)} size="xl">
        <CModalHeader>
          <CModalTitle>{editData ? 'Edit Request' : 'Create Request'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <MaintenanceForm onSubmit={handleAddRequest} initialData={editData} />
        </CModalBody>
      </CModal>
    </CRow>
  )
}

export default Maintenance
