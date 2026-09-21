// // // src/pages/rent/RentCollection.page.jsx
// // import React, { useMemo, useState } from 'react'
// // import { CButton, CCard, CCardBody, CCardHeader, CRow, CCol } from '@coreui/react'
// // import {
// //   useReactTable,
// //   getCoreRowModel,
// //   getSortedRowModel,
// //   getFilteredRowModel,
// //   getPaginationRowModel,
// // } from '@tanstack/react-table'

// // import api from '../../api/axios'
// // import { toast } from 'react-toastify'
// // import Loader from '../../components/Loader'
// // import RentListTable from '../../components/rent/RentListTable'
// // import PaymentModal from '../../components/rent/PaymentModal'
// // import BulkDueDateUpdateModal from '../../components/rent/BulkDueDateUpdateModal'
// // import GenerateInvoicesModal from '../../components/rent/GenerateInvoicesModal'

// // import { useRentCollection } from '../../hooks/useRentCollection'
// // import { fmt, formatDate } from '../../utils/rentUtils'
// // import { exportCSV } from '../../utils/exportUtils'
// // import { useIsDarkMode } from '../../hooks/useIsDarkMode'

// // const RentCollection = () => {
// //   const {
// //     loading,
// //     rentList,
// //     tenants,
// //     rentForm,
// //     setRentForm,
// //     isModalOpen,
// //     isEditMode,
// //     openFrom,
// //     totals,
// //     openNewPayment,
// //     openEditPayment,
// //     handleDeletePayment,
// //     closeModal,
// //     handleTenantChange,
// //     handleToggleSelectAll,
// //     handleToggleInvoiceSelect,
// //     handleUpdateInvoiceField,
// //     handleApplyGlobalDiscountAmount,
// //     handleApplyGlobalDiscountPercent,
// //     handleGlobalWaveChange,
// //     handleSubmitPayments,
// //     handleApplyGlobalPaymentMethod,
// //     handleApplyGlobalPaymentDate,
// //     handleApplyGlobalNotes,
// //     loadRentCollection,

// //     // Generate invoices
// //     generateModal,
// //     setGenerateModal,
// //     isGenerating,
// //     openGenerateInvoices,
// //     closeGenerateInvoices,
// //     handleGenerateInvoices,
// //   } = useRentCollection()

// //   const isDark = useIsDarkMode()
// //   const [selectedIds, setSelectedIds] = useState([])
// //   const [bulkDueDateState, setBulkDueDateState] = useState({
// //     visible: false,
// //     newDueDate: '',
// //   })
// //   const [isSubmittingDueDate, setIsSubmittingDueDate] = useState(false)

// //   const handleBulkDueDateSubmit = async () => {
// //     if (!bulkDueDateState.newDueDate || selectedIds.length === 0) return

// //     setIsSubmittingDueDate(true) // ← start loading

// //     try {
// //       const res = await api.put('/Rent/BulkUpdateDueDate', {
// //         InvoiceIds: selectedIds,
// //         NewDueDate: bulkDueDateState.newDueDate,
// //       })

// //       if (res.data.isSuccess) {
// //         toast.success(res.data.message)
// //         setBulkDueDateState({ visible: false, newDueDate: '' })
// //         setSelectedIds([])
// //         await loadRentCollection()
// //       } else {
// //         toast.error(res.data.errorMessage)
// //       }
// //     } catch (error) {
// //       toast.error(error.response?.data?.errorMessage || 'Something went wrong')
// //     } finally {
// //       setIsSubmittingDueDate(false) // ← always stop loading
// //     }
// //   }

// //   const [globalFilter, setGlobalFilter] = useState('')
// //   const [expandedRows, setExpandedRows] = useState({})

// //   const toggleExpand = (id) => {
// //     setExpandedRows((prev) => ({
// //       ...prev,
// //       [id]: !prev[id],
// //     }))
// //   }

// //   const columns = useMemo(
// //     () => [
// //       { accessorKey: 'tenantName', header: 'Tenant' },
// //       { accessorKey: 'buildingName', header: 'Building' },
// //       { accessorKey: 'floorNumber', header: 'Floor' },
// //       { accessorKey: 'unitNumber', header: 'Unit' },
// //       {
// //         accessorKey: 'monthlyRent',
// //         header: 'Monthly Rent',
// //         cell: ({ getValue }) => fmt(getValue() || 0),
// //       },
// //       {
// //         accessorKey: 'dueDate',
// //         header: 'Due Date',
// //         cell: ({ row }) => formatDate(row.original.dueDate),
// //       },
// //       {
// //         accessorKey: 'invoiceDate',
// //         header: 'Invoice Date',
// //         cell: ({ row }) => formatDate(row.original.invoiceDate),
// //       },
// //       {
// //         accessorKey: 'statusName',
// //         header: 'Status',
// //         cell: ({ row }) => {
// //           const status = row.original.statusName || 'Unknown'
// //           const variants = {
// //             Paid: 'success',
// //             Unpaid: 'danger',
// //             Pending: 'warning',
// //             Partial: 'info',
// //             Overpaid: 'purple',
// //           }
// //           const variant = variants[status] || 'secondary'

// //           return (
// //             <span className={`badge bg-${variant} text-white px-2 py-1 rounded-pill`}>
// //               {status}
// //             </span>
// //           )
// //         },
// //       },
// //       {
// //         id: 'actions',
// //         header: 'Actions',
// //         cell: ({ row }) => (
// //           <div className="d-flex gap-2">
// //             <CButton
// //               color="primary"
// //               size="sm"
// //               variant="outline"
// //               onClick={() => openEditPayment(row.original)}
// //             >
// //               Record Payment
// //             </CButton>
// //           </div>
// //         ),
// //       },
// //     ],
// //     [openEditPayment, toggleExpand, expandedRows],
// //   )

// //   const [pagination, setPagination] = useState({
// //     pageIndex: 0,
// //     pageSize: 10,
// //   })

// //   const table = useReactTable({
// //     data: rentList || [],
// //     columns,
// //     state: {
// //       globalFilter,
// //       pagination,
// //     },
// //     onGlobalFilterChange: setGlobalFilter,
// //     onPaginationChange: setPagination,
// //     globalFilterFn: 'includesString',
// //     getCoreRowModel: getCoreRowModel(),
// //     getSortedRowModel: getSortedRowModel(),
// //     getFilteredRowModel: getFilteredRowModel(),
// //     getPaginationRowModel: getPaginationRowModel(),
// //   })

// //   return (
// //     <>
// //       {loading && <Loader />}
// //       <CRow>
// //         <CCol xs={12}>
// //           <CCard className="border-0 shadow-sm mb-4">
// //             <CCardHeader
// //               className={`border-0 py-3 px-4 ${isDark ? '' : 'bg-white'}`}
// //             >
// //               {/* Header Row */}
// //               <div className="d-flex justify-content-between align-items-center mb-3">
// //                 <div>
// //                   <div className="fw-semibold fs-5">Rent Collection</div>
// //                   <div className="text-body-secondary small">
// //                     Manage outstanding rent invoices
// //                   </div>
// //                 </div>

// //                 <CButton
// //                   color="success"
// //                   variant="outline"
// //                   onClick={() => exportCSV(columns, rentList)}
// //                 >
// //                   Export CSV
// //                 </CButton>
// //               </div>

// //               {/* Filters / Actions */}
// //               <div className="border-top pt-3">
// //                 <div className="text-body-secondary small fw-semibold mb-2">
// //                   Filters & Actions
// //                 </div>

// //                 <div className="d-flex flex-column flex-xl-row gap-2">
// //                   {/* Search */}
// //                   <input
// //                     type="text"
// //                     placeholder="Search tenant, unit or invoice..."
// //                     className="form-control"
// //                     style={{ maxWidth: '260px' }}
// //                     value={globalFilter ?? ''}
// //                     onChange={(e) => setGlobalFilter(e.target.value)}
// //                   />

// //                   {/* Generate Invoices */}
// //                   <CButton
// //                     color="dark"
// //                     onClick={openGenerateInvoices}
// //                   >
// //                     + Generate Invoices
// //                   </CButton>

// //                   {/* New Payment */}
// //                   <CButton
// //                     color="primary"
// //                     onClick={openNewPayment}
// //                   >
// //                     + New Payment
// //                   </CButton>

// //                   {/* Update Due Date */}
// //                   <CButton
// //                     color="warning"
// //                     variant="outline"
// //                     disabled={selectedIds.length === 0}
// //                     onClick={() => {
// //                       let prefill = new Date().toISOString().split('T')[0]

// //                       if (selectedIds.length === 1) {
// //                         const invoice = rentList.find(
// //                           (r) => r.invoiceId === selectedIds[0]
// //                         )

// //                         if (invoice?.dueDate) {
// //                           const datePart = String(invoice.dueDate).split('T')[0]

// //                           if (
// //                             datePart &&
// //                             datePart.includes('-') &&
// //                             datePart.length >= 10
// //                           ) {
// //                             prefill = datePart
// //                           }
// //                         }
// //                       }

// //                       setBulkDueDateState({
// //                         visible: true,
// //                         newDueDate: prefill,
// //                       })
// //                     }}
// //                   >
// //                     Update Due Date
// //                   </CButton>
// //                 </div>

// //                 {/* Filtered Count */}
// //                 <div className="text-body-secondary small mt-2">
// //                   {table.getFilteredRowModel().rows.length} records found
// //                 </div>
// //               </div>
// //             </CCardHeader>

// //             <CCardBody>
// //               <RentListTable
// //                 table={table}
// //                 selectedIds={selectedIds}
// //                 setSelectedIds={setSelectedIds}
// //                 expandedRows={expandedRows}
// //                 toggleExpand={toggleExpand}
// //               />
// //             </CCardBody>
// //           </CCard>

// //           <BulkDueDateUpdateModal
// //             visible={bulkDueDateState.visible}
// //             onClose={() => setBulkDueDateState({ visible: false, newDueDate: '' })}
// //             selectedCount={selectedIds.length}
// //             newDueDate={bulkDueDateState.newDueDate}
// //             onDateChange={(value) =>
// //               setBulkDueDateState((prev) => ({ ...prev, newDueDate: value }))
// //             }
// //             onSubmit={handleBulkDueDateSubmit}
// //             isSubmitting={isSubmittingDueDate}
// //             isDark={isDark}
// //           />

// //           <GenerateInvoicesModal
// //             visible={generateModal.visible}
// //             onClose={closeGenerateInvoices}
// //             month={generateModal.month}
// //             year={generateModal.year}
// //             onMonthChange={(month) => setGenerateModal((prev) => ({ ...prev, month }))}
// //             onYearChange={(year) => setGenerateModal((prev) => ({ ...prev, year }))}
// //             onSubmit={handleGenerateInvoices}
// //             isSubmitting={isGenerating}
// //             isDark={isDark}
// //           />

// //           <PaymentModal
// //             visible={isModalOpen}
// //             onClose={closeModal}
// //             rentForm={rentForm}
// //             setRentForm={setRentForm}
// //             tenants={tenants}
// //             isEditMode={isEditMode}
// //             openFrom={openFrom}
// //             totals={totals}
// //             handleTenantChange={handleTenantChange}
// //             handleToggleSelectAll={handleToggleSelectAll}
// //             handleToggleInvoiceSelect={handleToggleInvoiceSelect}
// //             handleUpdateInvoiceField={handleUpdateInvoiceField}
// //             handleApplyGlobalDiscountAmount={handleApplyGlobalDiscountAmount}
// //             handleApplyGlobalDiscountPercent={handleApplyGlobalDiscountPercent}
// //             handleGlobalWaveChange={handleGlobalWaveChange}
// //             handleSubmitPayments={handleSubmitPayments}
// //             handleApplyGlobalPaymentMethod={handleApplyGlobalPaymentMethod}
// //             handleApplyGlobalPaymentDate={handleApplyGlobalPaymentDate}
// //             handleApplyGlobalNotes={handleApplyGlobalNotes}
// //           />
// //         </CCol>
// //       </CRow>
// //     </>
// //   )
// // }

// // export default RentCollection






// // src/pages/rent/RentCollection.page.jsx
// import React, { useMemo, useState } from 'react'
// import { CButton, CCard, CCardBody, CCardHeader, CRow, CCol } from '@coreui/react'
// import {
//   useReactTable,
//   getCoreRowModel,
//   getSortedRowModel,
//   getFilteredRowModel,
// } from '@tanstack/react-table'

// import api from '../../api/axios'
// import { toast } from 'react-toastify'
// import Loader from '../../components/Loader'
// import RentListTable from '../../components/rent/RentListTable'
// import PaymentModal from '../../components/rent/PaymentModal'
// import BulkDueDateUpdateModal from '../../components/rent/BulkDueDateUpdateModal'
// import GenerateInvoicesModal from '../../components/rent/GenerateInvoicesModal'
// import ExtraChargeModal from '../../components/rent/ExtraChargeModal'
// import ManageTenantRentModal from '../../components/rent/ManageTenantRentModal'

// import { useRentCollection } from '../../hooks/useRentCollection'
// import { fmt, formatDate } from '../../utils/rentUtils'
// import { exportCSV } from '../../utils/exportUtils'
// import { useIsDarkMode } from '../../hooks/useIsDarkMode'

// const RentCollection = () => {
//   const {
//     loading,
//     rentList,
//     tenants,
//     activeTenants,
//     rentForm,
//     setRentForm,
//     isModalOpen,
//     isEditMode,
//     openFrom,
//     totals,
//     openNewPayment,
//     openEditPayment,
//     handleDeletePayment,
//     closeModal,
//     handleTenantChange,
//     handleToggleSelectAll,
//     handleToggleInvoiceSelect,
//     handleUpdateInvoiceField,
//     handleApplyGlobalDiscountAmount,
//     handleApplyGlobalDiscountPercent,
//     handleGlobalWaveChange,
//     handleSubmitPayments,
//     handleApplyGlobalPaymentMethod,
//     handleApplyGlobalPaymentDate,
//     handleApplyGlobalNotes,
//     loadRentCollection,

//     // Generate invoices
//     generateModal,
//     setGenerateModal,
//     isGenerating,
//     openGenerateInvoices,
//     closeGenerateInvoices,
//     handleGenerateInvoices,

//     // Extra charges
//     extraChargeModal,
//     setExtraChargeForm,
//     isAddingCharge,
//     openExtraCharge,
//     closeExtraCharge,
//     handleAddExtraCharge,
//   } = useRentCollection()

//   const isDark = useIsDarkMode()
//   const [selectedIds, setSelectedIds] = useState([])
//   const [bulkDueDateState, setBulkDueDateState] = useState({
//     visible: false,
//     newDueDate: '',
//   })
//   const [isSubmittingDueDate, setIsSubmittingDueDate] = useState(false)

//   const [manageRentVisible, setManageRentVisible] = useState(false)

//   const handleBulkDueDateSubmit = async () => {
//     if (!bulkDueDateState.newDueDate || selectedIds.length === 0) return

//     setIsSubmittingDueDate(true)

//     try {
//       const res = await api.put('/Rent/BulkUpdateDueDate', {
//         InvoiceIds: selectedIds,
//         NewDueDate: bulkDueDateState.newDueDate,
//       })

//       if (res.data.isSuccess) {
//         toast.success(res.data.message)
//         setBulkDueDateState({ visible: false, newDueDate: '' })
//         setSelectedIds([])
//         await loadRentCollection()
//       } else {
//         toast.error(res.data.errorMessage)
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.errorMessage || 'Something went wrong')
//     } finally {
//       setIsSubmittingDueDate(false)
//     }
//   }

//   const [globalFilter, setGlobalFilter] = useState('')
//   const [expandedRows, setExpandedRows] = useState({})

//   const toggleExpand = (id) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [id]: !prev[id],
//     }))
//   }

//   const columns = useMemo(
//     () => [
//       { accessorKey: 'tenantName', header: 'Tenant' },
//       { accessorKey: 'buildingName', header: 'Building' },
//       { accessorKey: 'floorNumber', header: 'Floor' },
//       { accessorKey: 'unitNumber', header: 'Unit' },
//       {
//         accessorKey: 'monthlyRent',
//         header: 'Amount',
//         cell: ({ row }) => (
//           <div>
//             {fmt(row.original.monthlyRent || 0)}
//             {row.original.chargeType && (
//               <div>
//                 <small className="text-muted">
//                   {row.original.chargeType}
//                   {row.original.description ? ` — ${row.original.description}` : ''}
//                 </small>
//               </div>
//             )}
//           </div>
//         ),
//       },
//       {
//         accessorKey: 'dueDate',
//         header: 'Due Date',
//         cell: ({ row }) => formatDate(row.original.dueDate),
//       },
//       {
//         accessorKey: 'invoiceDate',
//         header: 'Invoice Date',
//         cell: ({ row }) => formatDate(row.original.invoiceDate),
//       },
//       {
//         accessorKey: 'statusName',
//         header: 'Status',
//         cell: ({ row }) => {
//           const status = row.original.statusName || 'Unknown'
//           const variants = {
//             Paid: 'success',
//             Unpaid: 'danger',
//             Pending: 'warning',
//             Partial: 'info',
//             Overpaid: 'purple',
//           }
//           const variant = variants[status] || 'secondary'

//           return (
//             <span className={`badge bg-${variant} text-white px-2 py-1 rounded-pill`}>
//               {status}
//             </span>
//           )
//         },
//       },
//       {
//         id: 'actions',
//         header: 'Actions',
//         cell: ({ row }) => (
//           <div className="d-flex gap-2">
//             <CButton
//               color="primary"
//               size="sm"
//               variant="outline"
//               onClick={() => openEditPayment(row.original)}
//             >
//               Record Payment
//             </CButton>
//             <CButton
//               color="danger"
//               size="sm"
//               variant="outline"
//               onClick={() => handleDeletePayment(row.original)}
//             >
//               Cancel Invoice
//             </CButton>
//           </div>
//         ),
//       },
//     ],
//     [openEditPayment, handleDeletePayment, toggleExpand, expandedRows],
//   )

//   const table = useReactTable({
//     data: rentList || [],
//     columns,
//     state: {
//       globalFilter,
//     },
//     onGlobalFilterChange: setGlobalFilter,
//     globalFilterFn: 'includesString',
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//   })

//   return (
//     <>
//       {loading && <Loader />}
//       <CRow>
//         <CCol xs={12}>
//           <CCard className="border-0 shadow-sm mb-4">

//             <CCardHeader
//               className={`border-0 py-3 px-4 ${isDark ? '' : 'bg-white'}`}
//             >
//               {/* Header Row */}
//               <div className="d-flex justify-content-between align-items-center mb-3">
//                 <div>
//                   <div className="fw-semibold fs-5">Rent Collection</div>
//                   <div className="text-body-secondary small">
//                     Manage outstanding rent invoices
//                   </div>
//                 </div>

//                 <CButton
//                   color="success"
//                   variant="outline"
//                   onClick={() => exportCSV(columns, rentList)}
//                 >
//                   Export CSV
//                 </CButton>
//               </div>

//               {/* Filters / Actions */}
//               <div className="border-top pt-3">
//                 <div className="text-body-secondary small fw-semibold mb-2">
//                   Filters & Actions
//                 </div>

//                 <div className="d-flex flex-column flex-xl-row gap-2">

//                   {/* Search */}
//                   <input
//                     type="text"
//                     placeholder="Search tenant, unit or invoice..."
//                     className="form-control"
//                     style={{ maxWidth: '260px' }}
//                     value={globalFilter ?? ''}
//                     onChange={(e) => setGlobalFilter(e.target.value)}
//                   />

//                   {/* Generate Invoices */}
//                   <CButton
//                     color="dark"
//                     onClick={openGenerateInvoices}
//                   >
//                     + Generate Invoices
//                   </CButton>

//                   {/* Add Extra Charge */}
//                   <CButton
//                     color="info"
//                     onClick={openExtraCharge}
//                     className="text-white"
//                   >
//                     + Add Extra Charge
//                   </CButton>

//                   <CButton color="secondary" onClick={() => setManageRentVisible(true)} className="me-2">
//                     Manage Rent Amounts
//                   </CButton>

//                   {/* New Payment */}
//                   <CButton
//                     color="primary"
//                     onClick={openNewPayment}
//                   >
//                     + New Payment
//                   </CButton>

//                   {/* Update Due Date */}
//                   <CButton
//                     color="warning"
//                     variant="outline"
//                     disabled={selectedIds.length === 0}
//                     onClick={() => {
//                       let prefill = new Date().toISOString().split('T')[0]

//                       if (selectedIds.length === 1) {
//                         const invoice = rentList.find(
//                           (r) => r.invoiceId === selectedIds[0]
//                         )

//                         if (invoice?.dueDate) {
//                           const datePart = String(invoice.dueDate).split('T')[0]

//                           if (
//                             datePart &&
//                             datePart.includes('-') &&
//                             datePart.length >= 10
//                           ) {
//                             prefill = datePart
//                           }
//                         }
//                       }

//                       setBulkDueDateState({
//                         visible: true,
//                         newDueDate: prefill,
//                       })
//                     }}
//                   >
//                     Update Due Date
//                   </CButton>
//                 </div>

//                 {/* Filtered Count */}
//                 <div className="text-body-secondary small mt-2">
//                   {table.getFilteredRowModel().rows.length} records found
//                 </div>
//               </div>
//             </CCardHeader>

//             <CCardBody>
//               <RentListTable
//                 table={table}
//                 selectedIds={selectedIds}
//                 setSelectedIds={setSelectedIds}
//                 expandedRows={expandedRows}
//                 toggleExpand={toggleExpand}
//               />
//             </CCardBody>
//           </CCard>

//           <BulkDueDateUpdateModal
//             visible={bulkDueDateState.visible}
//             onClose={() => setBulkDueDateState({ visible: false, newDueDate: '' })}
//             selectedCount={selectedIds.length}
//             newDueDate={bulkDueDateState.newDueDate}
//             onDateChange={(value) =>
//               setBulkDueDateState((prev) => ({ ...prev, newDueDate: value }))
//             }
//             onSubmit={handleBulkDueDateSubmit}
//             isSubmitting={isSubmittingDueDate}
//             isDark={isDark}
//           />

//           <GenerateInvoicesModal
//             visible={generateModal.visible}
//             onClose={closeGenerateInvoices}
//             month={generateModal.month}
//             year={generateModal.year}
//             onMonthChange={(month) => setGenerateModal((prev) => ({ ...prev, month }))}
//             onYearChange={(year) => setGenerateModal((prev) => ({ ...prev, year }))}
//             tenants={activeTenants}
//             selectedTenants={generateModal.tenantIds}
//             onSelectedTenantsChange={(val) => setGenerateModal((prev) => ({ ...prev, tenantIds: val }))}
//             onSubmit={handleGenerateInvoices}
//             isSubmitting={isGenerating}
//             isDark={isDark}
//           />

//           <ExtraChargeModal
//             visible={extraChargeModal.visible}
//             onClose={closeExtraCharge}
//             form={extraChargeModal.form}
//             setForm={setExtraChargeForm}
//             tenants={activeTenants}
//             onSubmit={handleAddExtraCharge}
//             isSubmitting={isAddingCharge}
//             isDark={isDark}
//           />

//           <ManageTenantRentModal
//             visible={manageRentVisible}
//             onClose={() => setManageRentVisible(false)}
//             isDark={isDark}
//           />

//           <PaymentModal
//             visible={isModalOpen}
//             onClose={closeModal}
//             rentForm={rentForm}
//             setRentForm={setRentForm}
//             tenants={tenants}
//             isEditMode={isEditMode}
//             openFrom={openFrom}
//             totals={totals}
//             handleTenantChange={handleTenantChange}
//             handleToggleSelectAll={handleToggleSelectAll}
//             handleToggleInvoiceSelect={handleToggleInvoiceSelect}
//             handleUpdateInvoiceField={handleUpdateInvoiceField}
//             handleApplyGlobalDiscountAmount={handleApplyGlobalDiscountAmount}
//             handleApplyGlobalDiscountPercent={handleApplyGlobalDiscountPercent}
//             handleGlobalWaveChange={handleGlobalWaveChange}
//             handleSubmitPayments={handleSubmitPayments}
//             handleApplyGlobalPaymentMethod={handleApplyGlobalPaymentMethod}
//             handleApplyGlobalPaymentDate={handleApplyGlobalPaymentDate}
//             handleApplyGlobalNotes={handleApplyGlobalNotes}
//             handleChargeLateFee={handleChargeLateFee}
//           />
//         </CCol>
//       </CRow>
//     </>
//   )
// }

// export default RentCollection






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
    handleChargeLateFee, // FIX: was missing — this is what threw "not defined"
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
  //   state: {
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
    initialState: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <>
      {loading && <Loader />}
      <CRow>
        <CCol xs={12}>
          <CCard className="border-0 shadow-sm mb-4">
            {/* <CCardHeader
              className={`d-flex justify-content-between align-items-center ${isDark ? '' : 'bg-white'}`}
            >
              <strong className="fs-5 me-2">Rent Collection</strong>

              <div className="d-flex flex-column flex-sm-row align-items-stretch gap-2 justify-content-md-end flex-wrap">
                <input
                  type="text"
                  placeholder="Search..."
                  className="form-control me-2"
                  style={{ width: '220px', border: '2px #7b7b7b solid' }}
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />

                <CButton
                  color="success"
                  onClick={() => exportCSV(columns, rentList)}
                  className="me-2"
                >
                  Export CSV
                </CButton>

                <CButton color="dark" onClick={openGenerateInvoices} className="me-2">
                  + Generate Invoices
                </CButton>

                <CButton color="info" onClick={openExtraCharge} className="me-2 text-white">
                  + Add Extra Charge
                </CButton>

                <CButton color="primary" onClick={openNewPayment} className="me-2">
                  + New Payment
                </CButton>

                <CButton
                  color="warning"
                  onClick={() => {
                    let prefill = new Date().toISOString().split('T')[0]

                    if (selectedIds.length === 1) {
                      const invoice = rentList.find((r) => r.invoiceId === selectedIds[0])
                      if (invoice && invoice.dueDate) {
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
            </CCardHeader> */}

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
          />
        </CCol>
      </CRow>
    </>
  )
}

export default RentCollection