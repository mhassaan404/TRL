// src/pages/rent/RentCollection.page.jsx
import React, { useMemo, useState } from 'react'
import { CButton, CCard, CCardBody, CCardHeader, CRow, CCol } from '@coreui/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'

import api from '../../api/axios'
import { toast } from 'react-toastify'
import Loader from '../../components/Loader'
import RentListTable from '../../components/rent/RentListTable'
import PaymentModal from '../../components/rent/PaymentModal'
import BulkDueDateUpdateModal from '../../components/rent/BulkDueDateUpdateModal'

import { useRentCollection } from '../../hooks/useRentCollection'
import { fmt, formatDate } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { useIsDarkMode } from '../../hooks/useIsDarkMode'

const RentCollection = () => {
  const {
    loading,
    rentList,
    tenants,
    rentForm,
    setRentForm,
    isModalOpen,
    isEditMode,
    openFrom,
    totals,
    openNewPayment,
    openEditPayment,
    handleDeletePayment,
    closeModal,
    handleTenantChange,
    handleToggleSelectAll,
    handleToggleInvoiceSelect,
    handleUpdateInvoiceField,
    handleApplyGlobalDiscountAmount,
    handleApplyGlobalDiscountPercent,
    handleGlobalWaveChange,
    handleSubmitPayments,
    handleApplyGlobalPaymentMethod,
    handleApplyGlobalPaymentDate,
    handleApplyGlobalNotes,
    loadRentCollection,
  } = useRentCollection()

  const isDark = useIsDarkMode()
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDueDateState, setBulkDueDateState] = useState({
    visible: false,
    newDueDate: '',
  })
  const [isSubmittingDueDate, setIsSubmittingDueDate] = useState(false)

  const handleBulkDueDateSubmit = async () => {
    if (!bulkDueDateState.newDueDate || selectedIds.length === 0) return

    setIsSubmittingDueDate(true) // ← start loading

    try {
      const res = await api.put('/Rent/BulkUpdateDueDate', {
        InvoiceIds: selectedIds,
        NewDueDate: bulkDueDateState.newDueDate,
      })

      if (res.data.isSuccess) {
        toast.success(res.data.message)
        setBulkDueDateState({ visible: false, newDueDate: '' })
        setSelectedIds([])
        await loadRentCollection()
      } else {
        toast.error(res.data.errorMessage)
      }
    } catch (error) {
      toast.error(error.response?.data?.errorMessage || 'Something went wrong')
    } finally {
      setIsSubmittingDueDate(false) // ← always stop loading
    }
  }

  const [globalFilter, setGlobalFilter] = useState('')
  const [expandedRows, setExpandedRows] = useState({})

  const toggleExpand = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'tenantName', header: 'Tenant' },
      { accessorKey: 'buildingName', header: 'Building' },
      { accessorKey: 'floorNumber', header: 'Floor' },
      { accessorKey: 'unitNumber', header: 'Unit' },
      {
        accessorKey: 'monthlyRent',
        header: 'Monthly Rent',
        cell: ({ getValue }) => fmt(getValue() || 0),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => formatDate(row.original.dueDate),
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Invoice Date',
        cell: ({ row }) => formatDate(row.original.invoiceDate),
      },
      {
        accessorKey: 'statusName',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.statusName || 'Unknown'
          const variants = {
            Paid: 'success',
            Unpaid: 'danger',
            Pending: 'warning',
            Partial: 'info',
            Overpaid: 'purple',
          }
          const variant = variants[status] || 'secondary'

          return (
            <span className={`badge bg-${variant} text-white px-2 py-1 rounded-pill`}>
              {status}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            <CButton
              color="primary"
              size="sm"
              variant="outline"
              onClick={() => openEditPayment(row.original)}
            >
              Update
            </CButton>
            <CButton
              color="danger"
              size="sm"
              variant="outline"
              onClick={() => handleDeletePayment(row.original)}
            >
              Delete
            </CButton>
          </div>
        ),
      },
    ],
    [openEditPayment, handleDeletePayment, toggleExpand, expandedRows],
  )

  const table = useReactTable({
    data: rentList || [],
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // ← THIS IS REQUIRED FOR FILTERING
  })

  return (
    <>
      {loading && <Loader />}
      <CRow>
        <CCol xs={12}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader
              className={`d-flex justify-content-between align-items-center ${isDark ? '' : 'bg-white'}`}
            >
              <strong className="fs-5 me-2">Rent Collection</strong>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Search Textbox - LEFT SIDE */}
                <input
                  type="text"
                  placeholder="Search..."
                  className="form-control me-2"
                  style={{ width: '220px', border: '2px #7b7b7b solid' }}
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />

                {/* Export CSV */}
                <CButton
                  color="success"
                  onClick={() => exportCSV(columns, rentList)}
                  className="me-2"
                >
                  Export CSV
                </CButton>

                {/* + New Payment */}
                <CButton color="primary" onClick={openNewPayment} className="me-2">
                  + New Payment
                </CButton>

                {/* Update Due Date */}
                <CButton
                  color="warning"
                  onClick={() => {
                    let prefill = new Date().toISOString().split('T')[0] // default fallback = today

                    if (selectedIds.length === 1) {
                      const invoice = rentList.find((r) => r.invoiceId === selectedIds[0])
                      if (invoice && invoice.dueDate) {
                        // Take only YYYY-MM-DD part – works with both "2025-03-15" and "2025-03-15T00:00:00"
                        const datePart = String(invoice.dueDate).split('T')[0]
                        if (datePart && datePart.includes('-') && datePart.length >= 10) {
                          prefill = datePart
                        }
                      }
                    }
                    setBulkDueDateState({
                      visible: true,
                      newDueDate: prefill,
                    })
                  }}
                  disabled={selectedIds.length === 0}
                >
                  Update Due Date for Selected
                </CButton>
              </div>
            </CCardHeader>

            <CCardBody>
              <RentListTable
                table={table}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                expandedRows={expandedRows}
                toggleExpand={toggleExpand}
              />
            </CCardBody>
          </CCard>

          <BulkDueDateUpdateModal
            visible={bulkDueDateState.visible}
            onClose={() => setBulkDueDateState({ visible: false, newDueDate: '' })}
            selectedCount={selectedIds.length}
            newDueDate={bulkDueDateState.newDueDate}
            onDateChange={(value) =>
              setBulkDueDateState((prev) => ({ ...prev, newDueDate: value }))
            }
            onSubmit={handleBulkDueDateSubmit}
            isSubmitting={isSubmittingDueDate}
            isDark={isDark}
          />

          <PaymentModal
            visible={isModalOpen}
            onClose={closeModal}
            rentForm={rentForm}
            setRentForm={setRentForm}
            tenants={tenants}
            isEditMode={isEditMode}
            openFrom={openFrom}
            totals={totals}
            handleTenantChange={handleTenantChange}
            handleToggleSelectAll={handleToggleSelectAll}
            handleToggleInvoiceSelect={handleToggleInvoiceSelect}
            handleUpdateInvoiceField={handleUpdateInvoiceField}
            handleApplyGlobalDiscountAmount={handleApplyGlobalDiscountAmount}
            handleApplyGlobalDiscountPercent={handleApplyGlobalDiscountPercent}
            handleGlobalWaveChange={handleGlobalWaveChange}
            handleSubmitPayments={handleSubmitPayments}
            handleApplyGlobalPaymentMethod={handleApplyGlobalPaymentMethod}
            handleApplyGlobalPaymentDate={handleApplyGlobalPaymentDate}
            handleApplyGlobalNotes={handleApplyGlobalNotes}
          />
        </CCol>
      </CRow>
    </>
  )
}

export default RentCollection
