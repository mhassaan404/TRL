// // // src/pages/rent/RentCollection.page.jsx
// // import React, { useMemo } from 'react'
// // import { CButton, CCard, CCardBody, CCardHeader } from '@coreui/react'
// // import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'

// // import Loader from '../../components/Loader'
// // // import RentListTable from '../../components/rent/RentListTable';
// // import RentListTable from '../../components/rent/RentListTable'
// // import PaymentModal from '../../components/rent/PaymentModal'

// // import { useRentCollection } from '../../hooks/useRentCollection'
// // import { formatDate } from '../../utils/rentUtils'

// // const RentCollection = () => {
// //   const {
// //     loading,
// //     rentList,
// //     tenants, // ← pass tenants
// //     rentForm, // ← pass full form state
// //     setRentForm, // ← if modal needs to update
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

// //     handleApplyGlobalPaymentDate,
// //     handleApplyGlobalPaymentMethod,
// //     handleApplyGlobalNotes,
// //   } = useRentCollection()

// //   const columns = useMemo(
// //     () => [
// //       { accessorKey: 'tenantName', header: 'Tenant' },
// //       { accessorKey: 'buildingName', header: 'Building' },
// //       { accessorKey: 'floorNumber', header: 'Floor' },
// //       { accessorKey: 'unitNumber', header: 'Unit' },
// //       { accessorKey: 'monthlyRent', header: 'Monthly Rent' },
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
// //           const status = row.original.statusName

// //           // Map status to colors
// //           let bgColor = ''
// //           let textColor = ''

// //           switch (status) {
// //             case 'Paid':
// //               bgColor = '#10b981' // medium green
// //               textColor = '#ffffff' // white text
// //               break
// //             case 'Unpaid':
// //               bgColor = '#ef4444' // medium red
// //               textColor = '#ffffff'
// //               break
// //             case 'Pending':
// //               bgColor = '#f59e0b' // orange-yellow
// //               textColor = '#ffffff'
// //               break
// //             case 'Partial':
// //               bgColor = '#f97316' // stronger orange
// //               textColor = '#ffffff'
// //               break
// //             case 'Overpaid':
// //               bgColor = '#8b5cf6' // purple
// //               textColor = '#ffffff'
// //               break
// //             default:
// //               bgColor = '#d1d5db' // light gray
// //               textColor = '#000000'
// //           }

// //           return (
// //             <span
// //               style={{
// //                 backgroundColor: bgColor,
// //                 color: textColor,
// //                 padding: '2px 8px',
// //                 borderRadius: '4px',
// //                 fontWeight: 500,
// //                 display: 'inline-block',
// //               }}
// //             >
// //               {status}
// //             </span>
// //           )
// //         },
// //       },
// //     ],
// //     [],
// //   )

// //   const table = useReactTable({
// //     data: rentList,
// //     columns,
// //     getCoreRowModel: getCoreRowModel(),
// //     getSortedRowModel: getSortedRowModel(),
// //   })

// //   return (
// //     <>
// //       {loading && <Loader />}
// //       <CCard className="mb-4">
// //         <CCardHeader className="d-flex justify-content-between align-items-center">
// //           <strong>Rent Collection</strong>
// //           <CButton color="success" onClick={openNewPayment}>
// //             + New Payment
// //           </CButton>
// //         </CCardHeader>
// //         <CCardBody>
// //           <RentListTable
// //             table={table}
// //             handleEdit={openEditPayment}
// //             handleDelete={handleDeletePayment}
// //           />
// //         </CCardBody>
// //       </CCard>

// //       <PaymentModal
// //         visible={isModalOpen}
// //         onClose={closeModal}
// //         // Pass ALL needed values from the SINGLE hook instance
// //         rentForm={rentForm}
// //         setRentForm={setRentForm}
// //         tenants={tenants}
// //         isEditMode={isEditMode}
// //         openFrom={openFrom}
// //         totals={totals}
// //         handleTenantChange={handleTenantChange}
// //         handleToggleSelectAll={handleToggleSelectAll}
// //         handleToggleInvoiceSelect={handleToggleInvoiceSelect}
// //         handleUpdateInvoiceField={handleUpdateInvoiceField}
// //         handleApplyGlobalDiscountAmount={handleApplyGlobalDiscountAmount}
// //         handleApplyGlobalDiscountPercent={handleApplyGlobalDiscountPercent}
// //         handleGlobalWaveChange={handleGlobalWaveChange}
// //         handleSubmitPayments={handleSubmitPayments}
// //         // ── Add these 3 if not already present ──
// //         handleApplyGlobalPaymentMethod={handleApplyGlobalPaymentMethod}
// //         handleApplyGlobalPaymentDate={handleApplyGlobalPaymentDate}
// //         handleApplyGlobalNotes={handleApplyGlobalNotes}
// //       />
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

// import Loader from '../../components/Loader'
// import RentListTable from '../../components/rent/RentListTable'
// import PaymentModal from '../../components/rent/PaymentModal'
// import BulkDueDateUpdateModal from '../../components/rent/BulkDueDateUpdateModal'

// import { useRentCollection } from '../../hooks/useRentCollection'
// import { fmt, formatDate } from '../../utils/rentUtils'
// import { exportCSV } from '../../utils/exportUtils'
// import { useIsDarkMode } from '../../hooks/useIsDarkMode'

// const RentCollection = () => {
//   const {
//     loading,
//     rentList,
//     tenants,
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
//   } = useRentCollection()

//   const isDark = useIsDarkMode()
//   const [selectedIds, setSelectedIds] = useState([])
//   const [bulkDueDateState, setBulkDueDateState] = useState({
//     visible: false,
//     newDueDate: '',
//   })

//   // const handleBulkDueDateUpdate = async () => {
//   //   if (selectedIds.length === 0) return

//   //   const newDueDate = prompt('Enter new due date (YYYY-MM-DD):')
//   //   if (!newDueDate) return

//   //   try {
//   //     await api.patch('/Rent/BulkUpdateDueDate', { ids: selectedIds, dueDate: newDueDate })
//   //     alert('Due dates updated!')
//   //     setSelectedIds([]) // clear
//   //     // Optional: refresh rentList
//   //   } catch {
//   //     alert('Failed to update')
//   //   }
//   // }

//   const handleBulkDueDateSubmit = async () => {
//     if (!bulkDueDateState.newDueDate || selectedIds.length === 0) return

//     try {
//       await api.patch('/Rent/BulkUpdateDueDate', {
//         ids: selectedIds,
//         dueDate: bulkDueDateState.newDueDate,
//       })
//       // success
//       setBulkDueDateState({ visible: false, newDueDate: '' }) // ← closes modal
//       setSelectedIds([])
//       // refresh list if you have such function
//     } catch {
//       alert('Failed')
//       // modal stays open so user can correct date or retry
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
//         header: 'Monthly Rent',
//         cell: ({ getValue }) => fmt(getValue() || 0),
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
//               Update
//             </CButton>
//             <CButton
//               color="danger"
//               size="sm"
//               variant="outline"
//               onClick={() => handleDeletePayment(row.original)}
//             >
//               Delete
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
//     getFilteredRowModel: getFilteredRowModel(), // ← THIS IS REQUIRED FOR FILTERING
//   })

//   return (
//     <>
//       {loading && <Loader />}
//       <CRow>
//         <CCol xs={12}>
//           <CCard className="border-0 shadow-sm mb-4">
//             <CCardHeader
//               className={`d-flex justify-content-between align-items-center ${isDark ? '' : 'bg-white'}`}
//             >
//               <strong className="fs-5 me-2">Rent Collection</strong>
//               <div className="d-flex align-items-center gap-2 flex-wrap">
//                 {/* Search Textbox - LEFT SIDE */}
//                 <input
//                   type="text"
//                   placeholder="Search..."
//                   className="form-control me-2"
//                   style={{ width: '220px', border: '2px #7b7b7b solid' }}
//                   value={globalFilter ?? ''}
//                   onChange={(e) => setGlobalFilter(e.target.value)}
//                 />

//                 {/* Export CSV */}
//                 <CButton
//                   color="success"
//                   onClick={() => exportCSV(columns, rentList)}
//                   className="me-2"
//                 >
//                   Export CSV
//                 </CButton>

//                 {/* + New Payment */}
//                 <CButton color="primary" onClick={openNewPayment} className="me-2">
//                   + New Payment
//                 </CButton>

//                 {/* Update Due Date */}
//                 {/* <CButton
//                   color="warning"
//                   onClick={handleBulkDueDateUpdate}
//                   disabled={selectedIds.length === 0}
//                 >
//                   Update Due Date for Selected
//                 </CButton> */}

//                 <CButton
//                   color="warning"
//                   onClick={() => setBulkDueDateState({ visible: true, newDueDate: '' })}
//                   disabled={selectedIds.length === 0}
//                 >
//                   Update Due Date for Selected
//                 </CButton>
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
//           />
//         </CCol>
//       </CRow>
//     </>
//   )
// }

// export default RentCollection
