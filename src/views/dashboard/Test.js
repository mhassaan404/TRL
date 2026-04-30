// import React, { useMemo, useState } from 'react'
// import {
//   CRow,
//   CCol,
//   CButton,
//   CCard,
//   CCardBody,
//   CCardHeader,
//   CFormInput,
//   CFormSelect,
// } from '@coreui/react'
// import {
//   useReactTable,
//   getCoreRowModel,
//   getSortedRowModel,
//   getFilteredRowModel,
// } from '@tanstack/react-table'

// import Loader from '../../components/Loader'
// import PropertyListTable from '../../components/property/PropertyListTable'
// import PropertyModal from '../../components/property/PropertyModal'

// import { useProperties } from '../../hooks/useProperties'
// import { fmt } from '../../utils/rentUtils'
// import { useIsDarkMode } from '../../hooks/useIsDarkMode'

// const Properties = () => {
//   const isDark = useIsDarkMode()
//   const { properties, loading, modalOpen, editData, openAddModal, openEditModal, handleDelete } =
//     useProperties()

//   // 🔥 Filters State
//   const [globalFilter, setGlobalFilter] = useState('')
//   const [statusFilter, setStatusFilter] = useState('')
//   const [cityFilter, setCityFilter] = useState('')

//   // 🔥 Unique dropdown values
//   const cities = [...new Set(properties.map((x) => x.cityName).filter(Boolean))]
//   const statuses = [...new Set(properties.map((x) => x.status).filter(Boolean))]

//   const filteredData = useMemo(() => {
//     return properties.filter((p) => {
//       const matchesSearch =
//         p.buildingName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
//         p.unitNumber?.toLowerCase().includes(globalFilter.toLowerCase())

//       const matchesStatus = statusFilter ? p.status === statusFilter : true
//       const matchesCity = cityFilter ? p.cityName === cityFilter : true

//       return matchesSearch && matchesStatus && matchesCity
//     })
//   }, [properties, globalFilter, statusFilter, cityFilter])

//   const columns = useMemo(
//     () => [
//       { accessorKey: 'buildingName', header: 'Building' },
//       { accessorKey: 'floorNumber', header: 'Floor' },
//       { accessorKey: 'unitNumber', header: 'Unit #' },
//       { accessorKey: 'propertyType', header: 'Type' },
//       {
//         accessorKey: 'baseRent',
//         header: 'Base Rent',
//         cell: ({ row }) => fmt(row.original.baseRent),
//       },
//       { accessorKey: 'cityName', header: 'City' },
//       {
//         accessorKey: 'status',
//         header: 'Status',
//         cell: ({ row }) => {
//           const status = row.original.status || 'Unknown'
//           const variants = {
//             Available: 'success',
//             Rented: 'primary',
//             Reserved: 'info',
//             'Under Maintenance': 'warning',
//           }
//           return (
//             <span className={`badge bg-${variants[status] || 'secondary'} text-white`}>
//               {status}
//             </span>
//           )
//         },
//       },
//       {
//         accessorKey: 'actions',
//         header: 'Actions',
//         cell: ({ row }) => (
//           <div className="d-flex gap-2">
//             <CButton
//               color="primary"
//               size="sm"
//               variant="outline"
//               onClick={() => openEditModal(row.original)}
//             >
//               Update
//             </CButton>
//             <CButton
//               color="danger"
//               size="sm"
//               variant="outline"
//               onClick={() => handleDelete(row.original.id)}
//             >
//               Delete
//             </CButton>
//           </div>
//         ),
//       },
//     ],
//     [openEditModal, handleDelete],
//   )

//   const table = useReactTable({
//     data: filteredData,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
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
//               <strong className="fs-5 me-2">Properties Management</strong>

//               {/* Filters */}
//               <div className="d-flex flex-column flex-sm-row align-items-stretch gap-2 justify-content-md-end">
//                 <input
//                   type="text"
//                   placeholder="Search..."
//                   className="form-control me-2"
//                   style={{ width: '220px', border: '2px #7b7b7b solid' }}
//                   value={globalFilter ?? ''}
//                   onChange={(e) => setGlobalFilter(e.target.value)}
//                 />

//                 <CFormSelect
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                   style={{ width: '220px', border: '2px #7b7b7b solid' }}
//                 >
//                   <option value="">All Status</option>
//                   {statuses.map((s) => (
//                     <option key={s} value={s}>
//                       {s}
//                     </option>
//                   ))}
//                 </CFormSelect>

//                 <CFormSelect
//                   value={cityFilter}
//                   onChange={(e) => setCityFilter(e.target.value)}
//                   style={{ width: '220px', border: '2px #7b7b7b solid' }}
//                 >
//                   <option value="">All Cities</option>
//                   {cities.map((c) => (
//                     <option key={c} value={c}>
//                       {c}
//                     </option>
//                   ))}
//                 </CFormSelect>

//                 <CButton color="primary" className="flex-shrink-0" onClick={openAddModal}>
//                   + New Property
//                 </CButton>
//               </div>
//             </CCardHeader>

//             <CCardBody>
//               <PropertyListTable table={table} />
//             </CCardBody>
//           </CCard>

//           <PropertyModal visible={modalOpen} editData={editData} />
//         </CCol>
//       </CRow>
//     </>
//   )
// }

// export default Properties

// import React, { useMemo, useState } from 'react'
// import { CRow, CCol, CButton, CCard, CCardBody, CCardHeader, CFormSelect } from '@coreui/react'

// import Loader from '../../components/Loader'
// import PropertyModal from '../../components/property/PropertyModal'

// import { useProperties } from '../../hooks/useProperties'
// import { fmt } from '../../utils/rentUtils'
// import { useIsDarkMode } from '../../hooks/useIsDarkMode'

// const Properties = () => {

//   const {
//     properties,
//     buildings,
//     floors,
//     openEditModal,
//     handleDelete,
//     openAddModal,
//     modalOpen,
//     editData,
//     handleSubmit,
//     closeModal,
//     loadFloors,
//   } = useProperties()

//   const [selectedBuilding, setSelectedBuilding] = useState(null)
//   const [statusFilter, setStatusFilter] = useState('')

//   const groupedBuildings = useMemo(() => {
//     const map = {}
//     properties.forEach((p) => {
//       if (!map[p.buildingName]) {
//         map[p.buildingName] = {
//           buildingName: p.buildingName,
//           cityName: p.cityName,
//           items: [],
//         }
//       }
//       map[p.buildingName].items.push(p)
//     })
//     return Object.values(map)
//   }, [properties])

//   const buildingUnits = useMemo(() => {
//     if (!selectedBuilding) return []
//     return selectedBuilding.items.filter((p) => (statusFilter ? p.status === statusFilter : true))
//   }, [selectedBuilding, statusFilter])

//   const stats = useMemo(() => {
//     const allUnits = selectedBuilding?.items || properties
//     return {
//       total: allUnits.length,
//       available: allUnits.filter((x) => x.status === 'Available').length,
//       rented: allUnits.filter((x) => x.status === 'Rented').length,
//     }
//   }, [selectedBuilding, properties])

//   const statusColor = {
//     Available: 'success',
//     Rented: 'primary',
//     Reserved: 'info',
//     'Under Maintenance': 'warning',
//   }

//   return (
//     <div className="container-fluid py-3">
//       {/* Responsive Header */}
//       <CCard className="border-0 shadow-sm mb-4">
//         <CCardHeader
//           className={`d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 ${useIsDarkMode() ? '' : 'bg-white'}`}
//         >
//           <strong className="fs-5">
//             {selectedBuilding ? selectedBuilding.buildingName : 'Properties Management'}
//           </strong>

//           <div className="d-flex flex-column flex-sm-row align-items-stretch gap-2 justify-content-md-end">
//             {selectedBuilding && (
//               <CButton
//                 color="secondary"
//                 variant="outline"
//                 onClick={() => setSelectedBuilding(null)}
//                 className="flex-shrink-0"
//               >
//                 ← Back to Buildings
//               </CButton>
//             )}

//             <CButton color="primary" onClick={openAddModal} className="flex-shrink-0">
//               + Add Property
//             </CButton>
//           </div>
//         </CCardHeader>
//       </CCard>

//       {/* KPI Cards */}
//       <CRow className="mb-4 g-3">
//         <CCol xs={12} sm={4}>
//           <CCard className="p-3 shadow-sm border-0 text-center text-sm-start">
//             <small className="text-muted fw-semibold">Total Units</small>
//             <h4 className="fw-bold mb-0">{stats.total}</h4>
//           </CCard>
//         </CCol>
//         <CCol xs={12} sm={4}>
//           <CCard className="p-3 shadow-sm border-0 text-center text-sm-start">
//             <small className="text-success fw-semibold">Available</small>
//             <h4 className="fw-bold mb-0">{stats.available}</h4>
//           </CCard>
//         </CCol>
//         <CCol xs={12} sm={4}>
//           <CCard className="p-3 shadow-sm border-0 text-center text-sm-start">
//             <small className="text-primary fw-semibold">Rented</small>
//             <h4 className="fw-bold mb-0">{stats.rented}</h4>
//           </CCard>
//         </CCol>
//       </CRow>

//       {/* Status Filter (Only when building selected) */}
//       {selectedBuilding && (
//         <div className="mb-4">
//           <CFormSelect
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             style={{ maxWidth: '220px' }}
//           >
//             <option value="">All Status</option>
//             <option value="Available">Available</option>
//             <option value="Rented">Rented</option>
//             <option value="Reserved">Reserved</option>
//             <option value="Under Maintenance">Under Maintenance</option>
//           </CFormSelect>
//         </div>
//       )}

//       {/* Buildings Grid */}
//       {!selectedBuilding && (
//         <CRow className="g-3">
//           {groupedBuildings.map((b, i) => (
//             <CCol key={i} xs={12} sm={6} lg={4} xl={3}>
//               <CCard
//                 className="shadow-sm border-0 h-100"
//                 style={{ cursor: 'pointer', borderRadius: '14px' }}
//                 onClick={() => setSelectedBuilding(b)}
//               >
//                 <div
//                   style={{
//                     height: '140px',
//                     background: 'linear-gradient(135deg,#e9ecef,#f8f9fa)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     color: '#777',
//                     borderRadius: '14px 14px 0 0',
//                   }}
//                 >
//                   Building
//                 </div>
//                 <CCardBody>
//                   <h6 className="mb-1">{b.buildingName}</h6>
//                   <small className="text-muted">{b.cityName}</small>
//                   <hr className="my-2" />
//                   <div className="d-flex justify-content-between">
//                     <strong>Units: {b.items.length}</strong>
//                   </div>
//                 </CCardBody>
//               </CCard>
//             </CCol>
//           ))}
//         </CRow>
//       )}

//       {/* Units Grid */}
//       {selectedBuilding && (
//         <CRow className="g-3">
//           {buildingUnits.map((p) => (
//             <CCol key={p.id} xs={12} md={6} lg={4} xl={3}>
//               <CCard className="shadow-sm border-0 h-100">
//                 <CCardBody>
//                   <h6 className="mb-1">Unit {p.unitNumber}</h6>
//                   <small className="text-muted">Floor {p.floorNumber}</small>
//                   <div className="mt-2 text-primary fw-bold fs-5">{fmt(p.baseRent)}</div>

//                   <span className={`badge bg-${statusColor[p.status] || 'secondary'} mt-2`}>
//                     {p.status}
//                   </span>

//                   <div className="d-flex gap-2 mt-3">
//                     <CButton
//                       size="sm"
//                       color="primary"
//                       variant="outline"
//                       onClick={() => openEditModal(p)}
//                     >
//                       Edit
//                     </CButton>
//                     <CButton
//                       size="sm"
//                       color="danger"
//                       variant="outline"
//                       onClick={() => handleDelete(p.id)}
//                     >
//                       Delete
//                     </CButton>
//                   </div>
//                 </CCardBody>
//               </CCard>
//             </CCol>
//           ))}
//         </CRow>
//       )}

//       <PropertyModal
//         visible={modalOpen}
//         editData={editData}
//         handleSubmit={handleSubmit}
//         closeModal={closeModal}
//         buildings={buildings}
//         floors={floors}
//         loadFloors={loadFloors}
//       />
//     </div>
//   )
// }

// export default Properties




// import React, { useMemo, useState } from 'react'
// import {
//   CRow,
//   CCol,
//   CButton,
//   CCard,
//   CCardBody,
//   CCardHeader,
//   CFormSelect,
//   CFormInput,
//   CInputGroup,
//   CInputGroupText,
//   CBadge,
//   CDropdown,
//   CDropdownToggle,
//   CDropdownMenu,
//   CDropdownItem,
// } from '@coreui/react'
// import CIcon from '@coreui/icons-react'
// import {
//   cilBuilding,
//   cilPlus,
//   cilPencil,
//   cilTrash,
//   cilSearch,
//   cilOptions,
//   cilLayers,
//   cilHome,
// } from '@coreui/icons'

// import Loader from '../../components/Loader'
// import PropertyModal from '../../components/property/PropertyModal'
// import BuildingModal from '../../components/property/BuildingModal'
// import FloorModal from '../../components/property/FloorModal'

// import { useProperties } from '../../hooks/useProperties'
// import { fmt } from '../../utils/rentUtils'
// import { useIsDarkMode } from '../../hooks/useIsDarkMode'

// const statusColor = {
//   Available: 'success',
//   Rented: 'primary',
//   Reserved: 'info',
//   Maintenance: 'warning',
// }

// const typeIcon = {
//   Apartment: '🏢',
//   House: '🏠',
//   Office: '💼',
//   Shop: '🏪',
// }

// const Properties = () => {
//   const isDark = useIsDarkMode()

//   const {
//     properties,
//     buildings,
//     floors,
//     loading,

//     modalOpen,
//     editData,
//     openAddModal,
//     openEditModal,
//     closeModal,
//     handleSubmit,
//     handleDelete,
//     loadFloors,
//     loadBuildings,

//     buildingModalOpen,
//     editBuilding,
//     openAddBuildingModal,
//     openEditBuildingModal,
//     closeBuildingModal,
//     handleBuildingSubmit,
//     handleBuildingDelete,

//     floorModalOpen,
//     editFloor,
//     openAddFloorModal,
//     openEditFloorModal,
//     closeFloorModal,
//     handleFloorSubmit,
//     handleFloorDelete,
//   } = useProperties()

//   const [selectedBuilding, setSelectedBuilding] = useState(null)
//   const [statusFilter, setStatusFilter] = useState('')
//   const [typeFilter, setTypeFilter] = useState('')
//   const [searchQuery, setSearchQuery] = useState('')
//   const [view, setView] = useState('buildings') // 'buildings' | 'units' | 'floors'

//   // ── Group properties by building ──
//   const groupedBuildings = useMemo(() => {
//     const map = {}
//     properties.forEach((p) => {
//       const key = p.buildingName || 'Unknown'
//       if (!map[key]) {
//         map[key] = {
//           buildingId: p.buildingId,
//           buildingName: p.buildingName,
//           cityName: p.cityName || p.city,
//           items: [],
//         }
//       }
//       map[key].items.push(p)
//     })

//     // Merge with buildings that have 0 properties
//     buildings.forEach((b) => {
//       if (!map[b.name]) {
//         map[b.name] = {
//           buildingId: b.id,
//           buildingName: b.name,
//           cityName: b.city || b.cityName || '',
//           items: [],
//         }
//       }
//     })

//     return Object.values(map)
//   }, [properties, buildings])

//   // ── Filter buildings by search ──
//   const filteredBuildings = useMemo(() => {
//     if (!searchQuery) return groupedBuildings
//     const q = searchQuery.toLowerCase()
//     return groupedBuildings.filter(
//       (b) => b.buildingName?.toLowerCase().includes(q) || b.cityName?.toLowerCase().includes(q),
//     )
//   }, [groupedBuildings, searchQuery])

//   // ── Units for selected building ──
//   const buildingUnits = useMemo(() => {
//     if (!selectedBuilding) return []
//     return selectedBuilding.items.filter((p) => {
//       const matchStatus = statusFilter ? p.status === statusFilter : true
//       const matchType = typeFilter ? p.propertyType === typeFilter : true
//       const matchSearch = searchQuery
//         ? p.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           p.propertyType?.toLowerCase().includes(searchQuery.toLowerCase())
//         : true
//       return matchStatus && matchType && matchSearch
//     })
//   }, [selectedBuilding, statusFilter, typeFilter, searchQuery])

//   // ── Stats ──
//   const stats = useMemo(() => {
//     const allUnits = selectedBuilding?.items || properties
//     return {
//       total: allUnits.length,
//       available: allUnits.filter((x) => x.status === 'Available').length,
//       rented: allUnits.filter((x) => x.status === 'Rented').length,
//       maintenance: allUnits.filter((x) => x.status === 'Maintenance').length,
//     }
//   }, [selectedBuilding, properties])

//   // ── Find building object for selected building's edit ──
//   const selectedBuildingObj = useMemo(() => {
//     if (!selectedBuilding) return null
//     return buildings.find((b) => b.id === selectedBuilding.buildingId) || null
//   }, [selectedBuilding, buildings])

//   const handleSelectBuilding = (b) => {
//     setSelectedBuilding(b)
//     setView('units')
//     setStatusFilter('')
//     setTypeFilter('')
//     setSearchQuery('')
//   }

//   const handleBackToBuildings = () => {
//     setSelectedBuilding(null)
//     setView('buildings')
//     setStatusFilter('')
//     setTypeFilter('')
//     setSearchQuery('')
//   }

//   if (loading && !properties.length && !buildings.length) return <Loader />

//   return (
//     <div className="container-fluid py-3">
//       {/* ── Header ── */}
//       <CCard className="border-0 shadow-sm mb-4">
//         <CCardHeader
//           className={`d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 py-3 ${isDark ? '' : 'bg-white'}`}
//         >
//           <div className="d-flex align-items-center gap-2">
//             {selectedBuilding && (
//               <CButton
//                 color="secondary"
//                 variant="outline"
//                 size="sm"
//                 onClick={handleBackToBuildings}
//               >
//                 ← Back
//               </CButton>
//             )}
//             <strong className="fs-5">
//               {selectedBuilding
//                 ? `${selectedBuilding.buildingName} — Units`
//                 : 'Properties Management'}
//             </strong>
//             {selectedBuilding && (
//               <small className="text-muted">({selectedBuilding.cityName})</small>
//             )}
//           </div>

//           <div className="d-flex flex-wrap gap-2 justify-content-md-end">
//             {!selectedBuilding ? (
//               <>
//                 <CButton color="outline-secondary" size="sm" onClick={openAddBuildingModal}>
//                   + Add Building
//                 </CButton>
//                 <CButton color="primary" size="sm" onClick={openAddModal}>
//                   + Add Property
//                 </CButton>
//               </>
//             ) : (
//               <>
//                 {selectedBuildingObj && (
//                   <CDropdown>
//                     <CDropdownToggle color="outline-secondary" size="sm">
//                       Building Actions
//                     </CDropdownToggle>
//                     <CDropdownMenu>
//                       <CDropdownItem onClick={() => openEditBuildingModal(selectedBuildingObj)}>
//                         ✏️ Edit Building
//                       </CDropdownItem>
//                       <CDropdownItem onClick={() => openAddFloorModal(selectedBuilding.buildingId)}>
//                         + Add Floor
//                       </CDropdownItem>
//                       <CDropdownItem
//                         className="text-danger"
//                         onClick={() => {
//                           handleBuildingDelete(selectedBuilding.buildingId)
//                           handleBackToBuildings()
//                         }}
//                       >
//                         🗑 Delete Building
//                       </CDropdownItem>
//                     </CDropdownMenu>
//                   </CDropdown>
//                 )}
//                 <CButton color="primary" size="sm" onClick={openAddModal}>
//                   + Add Unit
//                 </CButton>
//               </>
//             )}
//           </div>
//         </CCardHeader>
//       </CCard>

//       {/* ── KPI Cards ── */}
//       <CRow className="mb-4 g-3">
//         <CCol xs={6} sm={3}>
//           <CCard className="p-3 shadow-sm border-0 text-center">
//             <small className="text-muted fw-semibold">Total Units</small>
//             <h4 className="fw-bold mb-0">{stats.total}</h4>
//           </CCard>
//         </CCol>
//         <CCol xs={6} sm={3}>
//           <CCard className="p-3 shadow-sm border-0 text-center">
//             <small className="text-success fw-semibold">Available</small>
//             <h4 className="fw-bold mb-0 text-success">{stats.available}</h4>
//           </CCard>
//         </CCol>
//         <CCol xs={6} sm={3}>
//           <CCard className="p-3 shadow-sm border-0 text-center">
//             <small className="text-primary fw-semibold">Rented</small>
//             <h4 className="fw-bold mb-0 text-primary">{stats.rented}</h4>
//           </CCard>
//         </CCol>
//         <CCol xs={6} sm={3}>
//           <CCard className="p-3 shadow-sm border-0 text-center">
//             <small className="text-warning fw-semibold">Maintenance</small>
//             <h4 className="fw-bold mb-0 text-warning">{stats.maintenance}</h4>
//           </CCard>
//         </CCol>
//       </CRow>

//       {/* ── Search + Filters ── */}
//       <CRow className="mb-3 g-2 align-items-center">
//         <CCol xs={12} sm={5} md={4}>
//           <CInputGroup size="sm">
//             <CInputGroupText>
//               <CIcon icon={cilSearch} />
//             </CInputGroupText>
//             <CFormInput
//               placeholder={selectedBuilding ? 'Search units...' : 'Search buildings...'}
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </CInputGroup>
//         </CCol>

//         {selectedBuilding && (
//           <>
//             <CCol xs={6} sm={3} md={2}>
//               <CFormSelect
//                 size="sm"
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//               >
//                 <option value="">All Status</option>
//                 <option value="Available">Available</option>
//                 <option value="Rented">Rented</option>
//                 <option value="Maintenance">Maintenance</option>
//               </CFormSelect>
//             </CCol>
//             <CCol xs={6} sm={3} md={2}>
//               <CFormSelect
//                 size="sm"
//                 value={typeFilter}
//                 onChange={(e) => setTypeFilter(e.target.value)}
//               >
//                 <option value="">All Types</option>
//                 <option value="Apartment">Apartment</option>
//                 <option value="House">House</option>
//                 <option value="Office">Office</option>
//                 <option value="Shop">Shop</option>
//               </CFormSelect>
//             </CCol>
//           </>
//         )}
//       </CRow>

//       {/* ── Buildings Grid ── */}
//       {!selectedBuilding && (
//         <>
//           {filteredBuildings.length === 0 ? (
//             <CCard className="border-0 shadow-sm">
//               <CCardBody className="text-center py-5 text-muted">
//                 <div style={{ fontSize: '3rem' }}>🏢</div>
//                 <p className="mt-2 mb-3">No buildings found.</p>
//                 <CButton color="primary" size="sm" onClick={openAddBuildingModal}>
//                   + Add Your First Building
//                 </CButton>
//               </CCardBody>
//             </CCard>
//           ) : (
//             <CRow className="g-3">
//               {filteredBuildings.map((b, i) => {
//                 const available = b.items.filter((x) => x.status === 'Available').length
//                 const rented = b.items.filter((x) => x.status === 'Rented').length
//                 return (
//                   <CCol key={i} xs={12} sm={6} lg={4} xl={3}>
//                     <CCard
//                       className="shadow-sm border-0 h-100"
//                       style={{ borderRadius: '14px', cursor: 'pointer' }}
//                       onClick={() => handleSelectBuilding(b)}
//                     >
//                       {/* Building image placeholder */}
//                       <div
//                         style={{
//                           height: '120px',
//                           background: 'linear-gradient(135deg, #667eea22, #764ba222)',
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center',
//                           fontSize: '3rem',
//                           borderRadius: '14px 14px 0 0',
//                         }}
//                       >
//                         🏢
//                       </div>
//                       <CCardBody>
//                         <div className="d-flex justify-content-between align-items-start">
//                           <div>
//                             <h6 className="mb-0 fw-bold">{b.buildingName}</h6>
//                             <small className="text-muted">{b.cityName || '—'}</small>
//                           </div>
//                           {/* Stop propagation so dropdown doesn't open building */}
//                           <div onClick={(e) => e.stopPropagation()}>
//                             <CDropdown>
//                               <CDropdownToggle
//                                 color="light"
//                                 size="sm"
//                                 caret={false}
//                                 style={{ padding: '2px 6px', fontSize: '1rem' }}
//                               >
//                                 ⋮
//                               </CDropdownToggle>
//                               <CDropdownMenu>
//                                 <CDropdownItem
//                                   onClick={() => {
//                                     const bObj = buildings.find((x) => x.id === b.buildingId)
//                                     if (bObj) openEditBuildingModal(bObj)
//                                   }}
//                                 >
//                                   ✏️ Edit
//                                 </CDropdownItem>
//                                 <CDropdownItem onClick={() => openAddFloorModal(b.buildingId)}>
//                                   + Add Floor
//                                 </CDropdownItem>
//                                 <CDropdownItem
//                                   className="text-danger"
//                                   onClick={() => handleBuildingDelete(b.buildingId)}
//                                 >
//                                   🗑 Delete
//                                 </CDropdownItem>
//                               </CDropdownMenu>
//                             </CDropdown>
//                           </div>
//                         </div>

//                         <hr className="my-2" />
//                         <div className="d-flex justify-content-between align-items-center">
//                           <span className="text-muted small">
//                             Units: <strong>{b.items.length}</strong>
//                           </span>
//                           <div className="d-flex gap-1">
//                             <CBadge color="success">{available} free</CBadge>
//                             <CBadge color="primary">{rented} rented</CBadge>
//                           </div>
//                         </div>
//                       </CCardBody>
//                     </CCard>
//                   </CCol>
//                 )
//               })}
//             </CRow>
//           )}
//         </>
//       )}

//       {/* ── Units Grid ── */}
//       {selectedBuilding && (
//         <>
//           {buildingUnits.length === 0 ? (
//             <CCard className="border-0 shadow-sm">
//               <CCardBody className="text-center py-5 text-muted">
//                 <div style={{ fontSize: '3rem' }}>🏠</div>
//                 <p className="mt-2 mb-3">No units found for this filter.</p>
//                 <CButton color="primary" size="sm" onClick={openAddModal}>
//                   + Add First Unit
//                 </CButton>
//               </CCardBody>
//             </CCard>
//           ) : (
//             <CRow className="g-3">
//               {buildingUnits.map((p) => (
//                 <CCol key={p.id} xs={12} sm={6} md={4} xl={3}>
//                   <CCard className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
//                     <CCardBody>
//                       <div className="d-flex justify-content-between align-items-start">
//                         <div>
//                           <div className="fw-bold fs-6">
//                             {typeIcon[p.propertyType] || '🏠'} Unit {p.unitNumber}
//                           </div>
//                           <small className="text-muted">
//                             Floor {p.floorNumber} · {p.propertyType}
//                           </small>
//                         </div>
//                         <CBadge color={statusColor[p.status] || 'secondary'}>{p.status}</CBadge>
//                       </div>

//                       <div className="mt-3 text-primary fw-bold fs-5">
//                         {fmt(p.baseRent)}
//                         <small className="text-muted fw-normal fs-6"> /mo</small>
//                       </div>

//                       {p.address && (
//                         <small className="text-muted d-block mt-1 text-truncate" title={p.address}>
//                           📍 {p.address}
//                         </small>
//                       )}

//                       <div className="d-flex gap-2 mt-3">
//                         <CButton
//                           size="sm"
//                           color="primary"
//                           variant="outline"
//                           className="flex-grow-1"
//                           onClick={() => openEditModal(p)}
//                         >
//                           ✏️ Edit
//                         </CButton>
//                         <CButton
//                           size="sm"
//                           color="danger"
//                           variant="outline"
//                           className="flex-grow-1"
//                           onClick={() => handleDelete(p.id)}
//                         >
//                           🗑 Delete
//                         </CButton>
//                       </div>
//                     </CCardBody>
//                   </CCard>
//                 </CCol>
//               ))}
//             </CRow>
//           )}
//         </>
//       )}

//       {/* ── Modals ── */}
//       <PropertyModal
//         visible={modalOpen}
//         editData={editData}
//         handleSubmit={handleSubmit}
//         closeModal={closeModal}
//         buildings={buildings}
//         floors={floors}
//         loadFloors={loadFloors}
//         onBuildingCreated={loadBuildings}
//       />

//       <BuildingModal
//         visible={buildingModalOpen}
//         editData={editBuilding}
//         handleSubmit={handleBuildingSubmit}
//         closeModal={closeBuildingModal}
//       />

//       <FloorModal
//         visible={floorModalOpen}
//         editData={editFloor}
//         handleSubmit={handleFloorSubmit}
//         closeModal={closeFloorModal}
//         buildingName={
//           selectedBuilding?.buildingName ||
//           buildings.find((b) => b.id === editFloor?.buildingId)?.name ||
//           ''
//         }
//       />
//     </div>
//   )
// }

// export default Properties






import React, { useMemo, useState } from 'react'
import {
  CRow,
  CCol,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormSelect,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import Loader from '../../components/Loader'
import PropertyModal from '../../components/property/PropertyModal'
import BuildingModal from '../../components/property/BuildingModal'
import FloorModal from '../../components/property/FloorModal'

import { useProperties } from '../../hooks/useProperties'
import { fmt } from '../../utils/rentUtils'
import { useIsDarkMode } from '../../hooks/useIsDarkMode'

const statusColor = {
  Available: 'success',
  Rented: 'primary',
  Reserved: 'info',
  Maintenance: 'warning',
}

const typeIcon = {
  Apartment: '🏢',
  House: '🏠',
  Office: '💼',
  Shop: '🏪',
}

const Properties = () => {
  const isDark = useIsDarkMode()

  const {
    properties,
    buildings,
    floors,
    loading,

    // Lookups
    cities,
    buildingTypes,
    unitStatuses,

    // Property modal
    modalOpen,
    editData,
    openAddModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    loadFloors,
    loadBuildings,

    // Building modal
    buildingModalOpen,
    editBuilding,
    openAddBuildingModal,
    openEditBuildingModal,
    closeBuildingModal,
    handleBuildingSubmit,
    handleBuildingDelete,

    // Floor modal
    floorModalOpen,
    editFloor,
    openAddFloorModal,
    closeFloorModal,
    handleFloorSubmit,
    handleFloorDelete,
  } = useProperties()

  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Group properties by building, merge with empty buildings ──
  const groupedBuildings = useMemo(() => {
    const map = {}
    properties.forEach((p) => {
      const key = p.buildingId || p.buildingName
      if (!map[key]) {
        map[key] = {
          buildingId: p.buildingId,
          buildingName: p.buildingName,
          cityName: p.cityName || p.city || '',
          items: [],
        }
      }
      map[key].items.push(p)
    })

    // Include buildings with 0 units
    buildings.forEach((b) => {
      if (!map[b.id]) {
        map[b.id] = {
          buildingId: b.id,
          buildingName: b.name || b.buildingName,
          cityName: b.cityName || b.city || '',
          items: [],
        }
      }
    })

    return Object.values(map)
  }, [properties, buildings])

  // ── Filter buildings by search ──
  const filteredBuildings = useMemo(() => {
    if (!searchQuery) return groupedBuildings
    const q = searchQuery.toLowerCase()
    return groupedBuildings.filter(
      (b) =>
        b.buildingName?.toLowerCase().includes(q) ||
        b.cityName?.toLowerCase().includes(q),
    )
  }, [groupedBuildings, searchQuery])

  // ── Units for selected building with filters ──
  const buildingUnits = useMemo(() => {
    if (!selectedBuilding) return []
    return selectedBuilding.items.filter((p) => {
      const unitStatusName = unitStatuses.find((s) => s.id === p.statusId)?.name || p.status || ''
      const matchStatus = statusFilter ? unitStatusName === statusFilter : true
      const matchType = typeFilter ? p.propertyType === typeFilter : true
      const matchSearch = searchQuery
        ? p.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.propertyType?.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      return matchStatus && matchType && matchSearch
    })
  }, [selectedBuilding, statusFilter, typeFilter, searchQuery, unitStatuses])

  // ── Stats ──
  const stats = useMemo(() => {
    const allUnits = selectedBuilding?.items || properties
    const getStatusName = (p) =>
      unitStatuses.find((s) => s.id === p.statusId)?.name || p.status || ''
    return {
      total: allUnits.length,
      available: allUnits.filter((x) => getStatusName(x) === 'Available').length,
      rented: allUnits.filter((x) => getStatusName(x) === 'Rented').length,
      maintenance: allUnits.filter((x) => getStatusName(x) === 'Maintenance').length,
    }
  }, [selectedBuilding, properties, unitStatuses])

  const selectedBuildingObj = useMemo(
    () => buildings.find((b) => b.id === selectedBuilding?.buildingId) || null,
    [selectedBuilding, buildings],
  )

  const handleSelectBuilding = (b) => {
    setSelectedBuilding(b)
    setStatusFilter('')
    setTypeFilter('')
    setSearchQuery('')
  }

  const handleBackToBuildings = () => {
    setSelectedBuilding(null)
    setStatusFilter('')
    setTypeFilter('')
    setSearchQuery('')
  }

  if (loading && !properties.length && !buildings.length) return <Loader />

  return (
    <div className="container-fluid py-3">

      {/* ── Header ── */}
      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader
          className={`d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 py-3 ${isDark ? '' : 'bg-white'}`}
        >
          <div className="d-flex align-items-center gap-2">
            {selectedBuilding && (
              <CButton color="secondary" variant="outline" size="sm" onClick={handleBackToBuildings}>
                ← Back
              </CButton>
            )}
            <strong className="fs-5">
              {selectedBuilding ? `${selectedBuilding.buildingName} — Units` : 'Properties Management'}
            </strong>
            {selectedBuilding && selectedBuilding.cityName && (
              <small className="text-muted">({selectedBuilding.cityName})</small>
            )}
          </div>

          <div className="d-flex flex-wrap gap-2 justify-content-md-end">
            {!selectedBuilding ? (
              <>
                <CButton color="outline-secondary" size="sm" onClick={openAddBuildingModal}>
                  + Add Building
                </CButton>
                <CButton color="primary" size="sm" onClick={openAddModal}>
                  + Add Property
                </CButton>
              </>
            ) : (
              <>
                {selectedBuildingObj && (
                  <CDropdown>
                    <CDropdownToggle color="outline-secondary" size="sm">
                      Building Actions
                    </CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem onClick={() => openEditBuildingModal(selectedBuildingObj)}>
                        ✏️ Edit Building
                      </CDropdownItem>
                      <CDropdownItem onClick={() => openAddFloorModal(selectedBuilding.buildingId)}>
                        + Add Floor
                      </CDropdownItem>
                      <CDropdownItem
                        className="text-danger"
                        onClick={() => { handleBuildingDelete(selectedBuilding.buildingId); handleBackToBuildings() }}
                      >
                        🗑 Delete Building
                      </CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                )}
                <CButton color="primary" size="sm" onClick={openAddModal}>
                  + Add Unit
                </CButton>
              </>
            )}
          </div>
        </CCardHeader>
      </CCard>

      {/* ── KPI Cards ── */}
      <CRow className="mb-4 g-3">
        {[
          { label: 'Total Units', value: stats.total, color: 'muted' },
          { label: 'Available', value: stats.available, color: 'success' },
          { label: 'Rented', value: stats.rented, color: 'primary' },
          { label: 'Maintenance', value: stats.maintenance, color: 'warning' },
        ].map((s) => (
          <CCol key={s.label} xs={6} sm={3}>
            <CCard className="p-3 shadow-sm border-0 text-center">
              <small className={`text-${s.color} fw-semibold`}>{s.label}</small>
              <h4 className={`fw-bold mb-0 text-${s.color}`}>{s.value}</h4>
            </CCard>
          </CCol>
        ))}
      </CRow>

      {/* ── Search + Filters ── */}
      <CRow className="mb-3 g-2 align-items-center">
        <CCol xs={12} sm={5} md={4}>
          <CInputGroup size="sm">
            <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
            <CFormInput
              placeholder={selectedBuilding ? 'Search units...' : 'Search buildings...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CInputGroup>
        </CCol>

        {selectedBuilding && (
          <>
            <CCol xs={6} sm={3} md={2}>
              <CFormSelect size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                {unitStatuses.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol xs={6} sm={3} md={2}>
              <CFormSelect size="sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Office">Office</option>
                <option value="Shop">Shop</option>
              </CFormSelect>
            </CCol>
          </>
        )}
      </CRow>

      {/* ── Buildings Grid ── */}
      {!selectedBuilding && (
        <>
          {filteredBuildings.length === 0 ? (
            <CCard className="border-0 shadow-sm">
              <CCardBody className="text-center py-5 text-muted">
                <div style={{ fontSize: '3rem' }}>🏢</div>
                <p className="mt-2 mb-3">No buildings found.</p>
                <CButton color="primary" size="sm" onClick={openAddBuildingModal}>
                  + Add Your First Building
                </CButton>
              </CCardBody>
            </CCard>
          ) : (
            <CRow className="g-3">
              {filteredBuildings.map((b, i) => {
                const getStatusName = (p) =>
                  unitStatuses.find((s) => s.id === p.statusId)?.name || p.status || ''
                const available = b.items.filter((x) => getStatusName(x) === 'Available').length
                const rented = b.items.filter((x) => getStatusName(x) === 'Rented').length
                const buildingTypeName =
                  buildingTypes.find((t) => t.id === buildings.find((bx) => bx.id === b.buildingId)?.typeId)?.name || ''

                return (
                  <CCol key={i} xs={12} sm={6} lg={4} xl={3}>
                    <CCard
                      className="shadow-sm border-0 h-100"
                      style={{ borderRadius: '14px', cursor: 'pointer' }}
                      onClick={() => handleSelectBuilding(b)}
                    >
                      <div
                        style={{
                          height: '110px',
                          background: 'linear-gradient(135deg, #667eea22, #764ba222)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem',
                          borderRadius: '14px 14px 0 0',
                        }}
                      >
                        🏢
                      </div>
                      <CCardBody>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-0 fw-bold">{b.buildingName}</h6>
                            <small className="text-muted">{b.cityName || '—'}</small>
                            {buildingTypeName && (
                              <div><small className="text-muted">{buildingTypeName}</small></div>
                            )}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <CDropdown>
                              <CDropdownToggle color="light" size="sm" caret={false} style={{ padding: '2px 8px' }}>
                                ⋮
                              </CDropdownToggle>
                              <CDropdownMenu>
                                <CDropdownItem onClick={() => {
                                  const bObj = buildings.find((x) => x.id === b.buildingId)
                                  if (bObj) openEditBuildingModal(bObj)
                                }}>✏️ Edit</CDropdownItem>
                                <CDropdownItem onClick={() => openAddFloorModal(b.buildingId)}>
                                  + Add Floor
                                </CDropdownItem>
                                <CDropdownItem className="text-danger" onClick={() => handleBuildingDelete(b.buildingId)}>
                                  🗑 Delete
                                </CDropdownItem>
                              </CDropdownMenu>
                            </CDropdown>
                          </div>
                        </div>
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">Units: <strong>{b.items.length}</strong></span>
                          <div className="d-flex gap-1">
                            <CBadge color="success">{available} free</CBadge>
                            <CBadge color="primary">{rented} rented</CBadge>
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                )
              })}
            </CRow>
          )}
        </>
      )}

      {/* ── Units Grid ── */}
      {selectedBuilding && (
        <>
          {buildingUnits.length === 0 ? (
            <CCard className="border-0 shadow-sm">
              <CCardBody className="text-center py-5 text-muted">
                <div style={{ fontSize: '3rem' }}>🏠</div>
                <p className="mt-2 mb-3">No units found.</p>
                <CButton color="primary" size="sm" onClick={openAddModal}>+ Add First Unit</CButton>
              </CCardBody>
            </CCard>
          ) : (
            <CRow className="g-3">
              {buildingUnits.map((p) => {
                const statusName = unitStatuses.find((s) => s.id === p.statusId)?.name || p.status || ''
                return (
                  <CCol key={p.id} xs={12} sm={6} md={4} xl={3}>
                    <CCard className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                      <CCardBody>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold">
                              {typeIcon[p.propertyType] || '🏠'} Unit {p.unitNumber}
                            </div>
                            <small className="text-muted">
                              Floor {p.floorNumber} · {p.propertyType}
                            </small>
                          </div>
                          <CBadge color={statusColor[statusName] || 'secondary'}>{statusName}</CBadge>
                        </div>

                        <div className="mt-3 text-primary fw-bold fs-5">
                          {fmt(p.baseRent)}
                          <small className="text-muted fw-normal fs-6"> /mo</small>
                        </div>

                        {p.note && (
                          <small className="text-muted d-block mt-1 text-truncate" title={p.note}>
                            📝 {p.note}
                          </small>
                        )}

                        <div className="d-flex gap-2 mt-3">
                          <CButton size="sm" color="primary" variant="outline" className="flex-grow-1" onClick={() => openEditModal(p)}>
                            ✏️ Edit
                          </CButton>
                          <CButton size="sm" color="danger" variant="outline" className="flex-grow-1" onClick={() => handleDelete(p.id)}>
                            🗑 Delete
                          </CButton>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                )
              })}
            </CRow>
          )}
        </>
      )}

      {/* ── Modals ── */}
      <PropertyModal
        visible={modalOpen}
        editData={editData}
        handleSubmit={handleSubmit}
        closeModal={closeModal}
        buildings={buildings}
        floors={floors}
        loadFloors={loadFloors}
        onBuildingCreated={loadBuildings}
        unitStatuses={unitStatuses}
      />

      <BuildingModal
        visible={buildingModalOpen}
        editData={editBuilding}
        handleSubmit={handleBuildingSubmit}
        closeModal={closeBuildingModal}
        cities={cities}
        buildingTypes={buildingTypes}
      />

      <FloorModal
        visible={floorModalOpen}
        editData={editFloor}
        handleSubmit={handleFloorSubmit}
        closeModal={closeFloorModal}
        buildingName={selectedBuilding?.buildingName || ''}
      />
    </div>
  )
}

export default Properties
