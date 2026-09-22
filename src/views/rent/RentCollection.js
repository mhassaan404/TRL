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
import GenerateInvoicesModal from '../../components/rent/GenerateInvoicesModal'
import ExtraChargeModal from '../../components/rent/ExtraChargeModal'

import { useRentCollection } from '../../hooks/useRentCollection'
import { fmt, formatDate } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { useIsDarkMode } from '../../hooks/useIsDarkMode'

const RentCollection = () => {
  const {
    loading,
    rentList,
    tenants,
    activeTenants,
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
    handleChargeLateFee,
    handleReverseLateFee,
    loadRentCollection,

    // Generate invoices
    generateModal,
    setGenerateModal,
    isGenerating,
    openGenerateInvoices,
    closeGenerateInvoices,
    handleGenerateInvoices,

    // Extra charges
    extraChargeModal,
    setExtraChargeForm,
    isAddingCharge,
    openExtraCharge,
    closeExtraCharge,
    handleAddExtraCharge,
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

    setIsSubmittingDueDate(true)

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
      setIsSubmittingDueDate(false)
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
        header: 'Amount',
        cell: ({ row }) => (
          <div>
            {fmt(row.original.monthlyRent || 0)}
            {row.original.chargeType && (
              <div>
                <small className="text-muted">
                  {row.original.chargeType}
                  {row.original.description ? ` — ${row.original.description}` : ''}
                </small>
              </div>
            )}
          </div>
        ),
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
              Record Payment
            </CButton>
            {/* <CButton
              color="danger"
              size="sm"
              variant="outline"
              onClick={() => handleDeletePayment(row.original)}
            >
              Delete
            </CButton> */}
          </div>
        ),
      },
    ],
    [openEditPayment,
      // handleDeletePayment, 
      toggleExpand, expandedRows],
  )

  // const table = useReactTable({
  //   data: rentList || [],
  //   columns,
  //   initialState: {
  //     globalFilter,
  //   },
  //   onGlobalFilterChange: setGlobalFilter,
  //   globalFilterFn: 'includesString',
  //   getCoreRowModel: getCoreRowModel(),
  //   getSortedRowModel: getSortedRowModel(),
  //   getFilteredRowModel: getFilteredRowModel(),
  // })

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
    getFilteredRowModel: getFilteredRowModel(),
    autoResetPageIndex: false,
  })

  return (
    <>
      {loading && <Loader />}
      <CRow>
        <CCol xs={12}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader className={`border-0 py-3 px-4 ${isDark ? '' : 'bg-white'}`}
            >
              {/* Header Row */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="fw-semibold fs-5">Rent Collection</div>
                  <div className="text-body-secondary small">
                    Manage outstanding rent invoices
                  </div>
                </div>
                <CButton
                  color="success"
                  variant="outline"
                  onClick={() => exportCSV(columns, rentList)}
                >
                  Export CSV
                </CButton>
              </div>
              {/* Filters / Actions */}
              <div className="border-top pt-3">
                <div className="text-body-secondary small fw-semibold mb-2">
                  Filters & Actions
                </div>
                <div className="d-flex flex-column flex-xl-row gap-2">
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search tenant, unit or invoice..."
                    className="form-control"
                    style={{ maxWidth: '260px' }}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                  />
                  {/* Generate Invoices */}
                  <CButton
                    color="dark"
                    onClick={openGenerateInvoices}
                  >
                    + Generate Invoices
                  </CButton>
                  {/* New Payment */}
                  <CButton
                    color="primary"
                    onClick={openNewPayment}
                  >
                    + New Payment
                  </CButton>
                  {/* Update Due Date */}
                  <CButton
                    color="warning"
                    variant="outline"
                    disabled={selectedIds.length === 0}
                    onClick={() => {
                      let prefill = new Date().toISOString().split('T')[0]
                      if (selectedIds.length === 1) {
                        const invoice = rentList.find(
                          (r) => r.invoiceId === selectedIds[0]
                        )
                        if (invoice?.dueDate) {
                          const datePart = String(invoice.dueDate).split('T')[0]
                          if (
                            datePart &&
                            datePart.includes('-') &&
                            datePart.length >= 10
                          ) {
                            prefill = datePart
                          }
                        }
                      }
                      setBulkDueDateState({
                        visible: true,
                        newDueDate: prefill,
                      })
                    }}
                  >
                    Update Due Date
                  </CButton>
                </div>
                {/* Filtered Count */}
                <div className="text-body-secondary small mt-2">
                  {table.getFilteredRowModel().rows.length} records found
                </div>
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

          <GenerateInvoicesModal
            visible={generateModal.visible}
            onClose={closeGenerateInvoices}
            month={generateModal.month}
            year={generateModal.year}
            onMonthChange={(month) => setGenerateModal((prev) => ({ ...prev, month }))}
            onYearChange={(year) => setGenerateModal((prev) => ({ ...prev, year }))}
            tenants={activeTenants}
            selectedTenants={generateModal.tenantIds}
            onSelectedTenantsChange={(val) => setGenerateModal((prev) => ({ ...prev, tenantIds: val }))}
            onSubmit={handleGenerateInvoices}
            isSubmitting={isGenerating}
            isDark={isDark}
          />

          <ExtraChargeModal
            visible={extraChargeModal.visible}
            onClose={closeExtraCharge}
            form={extraChargeModal.form}
            setForm={setExtraChargeForm}
            tenants={activeTenants}
            onSubmit={handleAddExtraCharge}
            isSubmitting={isAddingCharge}
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
            handleChargeLateFee={handleChargeLateFee}
            handleReverseLateFee={handleReverseLateFee}
          />
        </CCol>
      </CRow>
    </>
  )
}

export default RentCollection