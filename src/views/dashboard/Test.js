// src/pages/rent/RentCollection.page.jsx
import React, { useMemo } from 'react'
import { CButton, CCard, CCardBody, CCardHeader } from '@coreui/react'
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'

import Loader from '../../components/Loader'
// import RentListTable from '../../components/rent/RentListTable';
import RentListTable from '../../components/rent/RentListTable'
import PaymentModal from '../../components/rent/PaymentModal'

import { useRentCollection } from '../../hooks/useRentCollection'
import { formatDate } from '../../utils/rentUtils'

const RentCollection = () => {
  const {
    loading,
    rentList,
    tenants, // ← pass tenants
    rentForm, // ← pass full form state
    setRentForm, // ← if modal needs to update
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
  } = useRentCollection()

  const columns = useMemo(
    () => [
      { accessorKey: 'tenantName', header: 'Tenant' },
      { accessorKey: 'buildingName', header: 'Building' },
      { accessorKey: 'floorNumber', header: 'Floor' },
      { accessorKey: 'unitNumber', header: 'Unit' },
      { accessorKey: 'monthlyRent', header: 'Monthly Rent' },
      { accessorKey: 'statusName', header: 'Status' },
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
    ],
    [],
  )

  const table = useReactTable({
    data: rentList,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <>
      {loading && <Loader />}
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Rent Collection</strong>
          <CButton color="success" onClick={openNewPayment}>
            + New Payment
          </CButton>
        </CCardHeader>
        <CCardBody>
          <RentListTable
            table={table}
            handleEdit={openEditPayment}
            handleDelete={handleDeletePayment}
          />
        </CCardBody>
      </CCard>
      <PaymentModal
        visible={isModalOpen}
        onClose={closeModal}
        // Pass ALL needed values from the SINGLE hook instance
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
      />
    </>
  )
}

export default RentCollection
