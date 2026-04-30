// import React, { useState, useEffect } from 'react'
// import {
//   CForm,
//   CFormInput,
//   CFormLabel,
//   CFormSelect,
//   CFormTextarea,
//   CButton,
//   CCol,
//   CRow,
// } from '@coreui/react'
// import { useProperties } from '../../../hooks/useProperties'

// const PropertyForm = ({ editData, handleSubmit, closeModal, buildings, floors, loadFloors }) => {
//   const [formData, setFormData] = useState({
//     buildingId: '',
//     floorId: '',
//     unitNumber: '',
//     propertyType: '',
//     baseRent: '',
//     city: '',
//     address: '',
//     status: '',
//     notes: '',
//   })

//   const [validated, setValidated] = useState(false)

//   // useEffect(() => {
//   //   if (editData) {
//   //     setFormData({
//   //       buildingId: editData.buildingId || '',
//   //       floorId: editData.floorId || '',
//   //       unitNumber: editData.unitNumber || '',
//   //       propertyType: editData.propertyType || '',
//   //       baseRent: editData.baseRent || '',
//   //       city: editData.cityName || '',
//   //       address: editData.address || '',
//   //       status: editData.status || '',
//   //       notes: editData.note || '',
//   //     })
//   //   } else {
//   //     setFormData({
//   //       buildingId: '',
//   //       floorId: '',
//   //       unitNumber: '',
//   //       propertyType: '',
//   //       baseRent: '',
//   //       city: '',
//   //       address: '',
//   //       status: '',
//   //       notes: '',
//   //     })
//   //   }
//   // }, [editData])

//   useEffect(() => {
//     if (editData) {
//       setFormData(editData)
//     } else {
//       setFormData({
//         buildingId: '',
//         floorId: '',
//         unitNumber: '',
//         propertyType: '',
//         baseRent: '',
//         city: '',
//         address: '',
//         status: '',
//         notes: '',
//       })
//     }
//   }, [editData])

//   const onSubmit = (e) => {
//     e.preventDefault()

//     const form = e.currentTarget

//     if (form.checkValidity() === false) {
//       e.stopPropagation()
//     } else {
//       handleSubmit(formData)
//     }

//     setValidated(true)
//   }

//   return (
//     <CForm
//       className="row g-3 needs-validation"
//       noValidate
//       validated={validated}
//       onSubmit={onSubmit}
//     >
//       <CRow>
//         <CCol md={6}>
//           <CFormLabel>Building Name</CFormLabel>
//           <CFormSelect
//             value={formData.buildingId}
//             // onChange={(e) => setFormData({ ...formData, buildingId: e.target.value, floorId: '' })}
//             onChange={(e) => {
//               setFormData({
//                 ...formData,
//                 buildingId: e.target.value,
//                 floorId: '',
//               })

//               loadFloors(e.target.value)
//             }}
//             required
//           >
//             <option value="">Select Building...</option>
//             {buildings.map((b) => (
//               <option key={b.id} value={b.id}>
//                 {b.name}
//               </option>
//             ))}
//           </CFormSelect>
//         </CCol>

//         <CCol md={6}>
//           <CFormLabel>Floor</CFormLabel>
//           {/* <CFormSelect
//             value={formData.floorId}
//             onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
//             required
//             disabled={!formData.buildingId}
//           >
//             <option value="">Select Floor...</option>
//           </CFormSelect> */}
//           <CFormSelect
//             value={formData.floorId}
//             onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
//             disabled={!formData.buildingId}
//             required
//           >
//             <option value="">Select Floor...</option>
//             {floors.map((f) => (
//               <option key={f.id} value={f.id}>
//                 Floor {f.floorNumber}
//               </option>
//             ))}
//           </CFormSelect>
//         </CCol>

//         <CCol md={4}>
//           <CFormLabel>Unit Number</CFormLabel>
//           <CFormInput
//             value={formData.unitNumber}
//             onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
//             required
//           />
//         </CCol>

//         <CCol md={4}>
//           <CFormLabel>Type</CFormLabel>
//           <CFormSelect
//             value={formData.propertyType}
//             onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
//             required
//           >
//             <option value="">Select Type...</option>
//             <option value="Apartment">Apartment</option>
//             <option value="House">House</option>
//             <option value="Office">Office</option>
//             <option value="Shop">Shop</option>
//           </CFormSelect>
//         </CCol>

//         <CCol md={4}>
//           <CFormLabel>Base Rent</CFormLabel>
//           <CFormInput
//             type="number"
//             value={formData.baseRent}
//             onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })}
//             required
//           />
//         </CCol>

//         <CCol md={6}>
//           <CFormLabel>City</CFormLabel>
//           <CFormInput
//             value={formData.city}
//             onChange={(e) => setFormData({ ...formData, city: e.target.value })}
//             required
//           />
//         </CCol>

//         <CCol md={6}>
//           <CFormLabel>Status</CFormLabel>
//           <CFormSelect
//             value={formData.status}
//             onChange={(e) => setFormData({ ...formData, status: e.target.value })}
//             required
//           >
//             <option value="">Select Status...</option>
//             <option value="Available">Available</option>
//             <option value="Rented">Rented</option>
//             <option value="Maintenance">Maintenance</option>
//           </CFormSelect>
//         </CCol>

//         <CCol md={12}>
//           <CFormLabel>Full Address</CFormLabel>
//           <CFormInput
//             value={formData.address}
//             onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//             required
//           />
//         </CCol>

//         <CCol md={12}>
//           <CFormLabel>Notes</CFormLabel>
//           <CFormTextarea
//             value={formData.notes}
//             onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
//             rows={3}
//           />
//         </CCol>
//       </CRow>

//       <CRow className="mt-4">
//         <CCol xs={12} className="text-end">
//           <CButton color="secondary" className="me-3" onClick={closeModal}>
//             Cancel
//           </CButton>
//           <CButton color="primary" type="submit">
//             {editData ? 'Update Property' : 'Add Property'}
//           </CButton>
//         </CCol>
//       </CRow>
//     </CForm>
//   )
// }

// export default PropertyForm





// import React, { useState, useEffect } from 'react'
// import {
//   CForm,
//   CFormInput,
//   CFormLabel,
//   CFormSelect,
//   CFormTextarea,
//   CButton,
//   CCol,
//   CRow,
//   CInputGroup,
//   CInputGroupText,
//   CSpinner,
// } from '@coreui/react'
// import { toast } from 'react-toastify'
// import { propertyService } from '../../../services/property.service'

// const PropertyForm = ({ editData, handleSubmit, closeModal, buildings, floors, loadFloors, onBuildingCreated }) => {
//   const [formData, setFormData] = useState({
//     buildingId: '',
//     floorId: '',
//     unitNumber: '',
//     propertyType: '',
//     baseRent: '',
//     city: '',
//     address: '',
//     status: '',
//     notes: '',
//   })

//   const [validated, setValidated] = useState(false)

//   // Quick-add building inline
//   const [showNewBuilding, setShowNewBuilding] = useState(false)
//   const [newBuildingName, setNewBuildingName] = useState('')
//   const [newBuildingCity, setNewBuildingCity] = useState('')
//   const [savingBuilding, setSavingBuilding] = useState(false)

//   // Quick-add floor inline
//   const [showNewFloor, setShowNewFloor] = useState(false)
//   const [newFloorNumber, setNewFloorNumber] = useState('')
//   const [savingFloor, setSavingFloor] = useState(false)

//   useEffect(() => {
//     if (editData) {
//       setFormData({
//         buildingId: editData.buildingId || '',
//         floorId: editData.floorId || '',
//         unitNumber: editData.unitNumber || '',
//         propertyType: editData.propertyType || '',
//         baseRent: editData.baseRent || '',
//         city: editData.city || editData.cityName || '',
//         address: editData.address || '',
//         status: editData.status || '',
//         notes: editData.notes || editData.note || '',
//       })
//     } else {
//       setFormData({
//         buildingId: '',
//         floorId: '',
//         unitNumber: '',
//         propertyType: '',
//         baseRent: '',
//         city: '',
//         address: '',
//         status: '',
//         notes: '',
//       })
//     }
//   }, [editData])

//   const onSubmit = (e) => {
//     e.preventDefault()
//     const form = e.currentTarget
//     if (form.checkValidity() === false) {
//       e.stopPropagation()
//       setValidated(true)
//       return
//     }
//     setValidated(true)
//     handleSubmit(formData)
//   }

//   const handleBuildingChange = (e) => {
//     const val = e.target.value
//     setFormData({ ...formData, buildingId: val, floorId: '' })
//     setShowNewFloor(false)
//     setNewFloorNumber('')
//     if (val) loadFloors(val)
//   }

//   const saveNewBuilding = async () => {
//     if (!newBuildingName.trim()) {
//       toast.error('Building name is required')
//       return
//     }
//     setSavingBuilding(true)
//     try {
//       const created = await propertyService.createBuilding({
//         name: newBuildingName.trim(),
//         city: newBuildingCity.trim(),
//       })
//       toast.success('Building created')
//       setShowNewBuilding(false)
//       setNewBuildingName('')
//       setNewBuildingCity('')
//       if (onBuildingCreated) await onBuildingCreated()
//       // auto-select new building
//       if (created?.id) {
//         setFormData((prev) => ({ ...prev, buildingId: created.id, floorId: '' }))
//         loadFloors(created.id)
//       }
//     } catch {
//       toast.error('Failed to create building')
//     } finally {
//       setSavingBuilding(false)
//     }
//   }

//   const saveNewFloor = async () => {
//     if (!newFloorNumber.toString().trim()) {
//       toast.error('Floor number is required')
//       return
//     }
//     if (!formData.buildingId) {
//       toast.error('Select a building first')
//       return
//     }
//     setSavingFloor(true)
//     try {
//       const created = await propertyService.createFloor({
//         floorNumber: newFloorNumber,
//         buildingId: formData.buildingId,
//       })
//       toast.success('Floor created')
//       setShowNewFloor(false)
//       setNewFloorNumber('')
//       await loadFloors(formData.buildingId)
//       if (created?.id) {
//         setFormData((prev) => ({ ...prev, floorId: created.id }))
//       }
//     } catch {
//       toast.error('Failed to create floor')
//     } finally {
//       setSavingFloor(false)
//     }
//   }

//   return (
//     <CForm
//       className="row g-3 needs-validation"
//       noValidate
//       validated={validated}
//       onSubmit={onSubmit}
//     >
//       <CRow>
//         {/* Building */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">
//             Building Name <span className="text-danger">*</span>
//           </CFormLabel>
//           <CInputGroup>
//             <CFormSelect
//               value={formData.buildingId}
//               onChange={handleBuildingChange}
//               required
//             >
//               <option value="">Select Building...</option>
//               {buildings.map((b) => (
//                 <option key={b.id} value={b.id}>
//                   {b.name}
//                 </option>
//               ))}
//             </CFormSelect>
//             <CButton
//               type="button"
//               color="outline-primary"
//               title="Add new building"
//               onClick={() => setShowNewBuilding((v) => !v)}
//             >
//               +
//             </CButton>
//           </CInputGroup>

//           {/* Inline new building */}
//           {showNewBuilding && (
//             <div className="border rounded p-2 mt-2 bg-light">
//               <small className="fw-semibold text-muted d-block mb-2">New Building</small>
//               <CFormInput
//                 placeholder="Building name *"
//                 value={newBuildingName}
//                 onChange={(e) => setNewBuildingName(e.target.value)}
//                 className="mb-2"
//                 size="sm"
//               />
//               <CFormInput
//                 placeholder="City (optional)"
//                 value={newBuildingCity}
//                 onChange={(e) => setNewBuildingCity(e.target.value)}
//                 className="mb-2"
//                 size="sm"
//               />
//               <div className="d-flex gap-2">
//                 <CButton
//                   size="sm"
//                   color="primary"
//                   onClick={saveNewBuilding}
//                   disabled={savingBuilding}
//                 >
//                   {savingBuilding ? <CSpinner size="sm" /> : 'Save Building'}
//                 </CButton>
//                 <CButton
//                   size="sm"
//                   color="secondary"
//                   variant="outline"
//                   onClick={() => {
//                     setShowNewBuilding(false)
//                     setNewBuildingName('')
//                     setNewBuildingCity('')
//                   }}
//                 >
//                   Cancel
//                 </CButton>
//               </div>
//             </div>
//           )}
//         </CCol>

//         {/* Floor */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">
//             Floor <span className="text-danger">*</span>
//           </CFormLabel>
//           <CInputGroup>
//             <CFormSelect
//               value={formData.floorId}
//               onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
//               disabled={!formData.buildingId}
//               required
//             >
//               <option value="">Select Floor...</option>
//               {floors.map((f) => (
//                 <option key={f.id} value={f.id}>
//                   Floor {f.floorNumber}
//                 </option>
//               ))}
//             </CFormSelect>
//             <CButton
//               type="button"
//               color="outline-primary"
//               disabled={!formData.buildingId}
//               title="Add new floor"
//               onClick={() => setShowNewFloor((v) => !v)}
//             >
//               +
//             </CButton>
//           </CInputGroup>

//           {/* Inline new floor */}
//           {showNewFloor && (
//             <div className="border rounded p-2 mt-2 bg-light">
//               <small className="fw-semibold text-muted d-block mb-2">New Floor</small>
//               <CFormInput
//                 type="number"
//                 placeholder="Floor number *"
//                 value={newFloorNumber}
//                 onChange={(e) => setNewFloorNumber(e.target.value)}
//                 className="mb-2"
//                 size="sm"
//               />
//               <div className="d-flex gap-2">
//                 <CButton
//                   size="sm"
//                   color="primary"
//                   onClick={saveNewFloor}
//                   disabled={savingFloor}
//                 >
//                   {savingFloor ? <CSpinner size="sm" /> : 'Save Floor'}
//                 </CButton>
//                 <CButton
//                   size="sm"
//                   color="secondary"
//                   variant="outline"
//                   onClick={() => {
//                     setShowNewFloor(false)
//                     setNewFloorNumber('')
//                   }}
//                 >
//                   Cancel
//                 </CButton>
//               </div>
//             </div>
//           )}
//         </CCol>

//         {/* Unit Number */}
//         <CCol md={4}>
//           <CFormLabel className="fw-semibold">
//             Unit Number <span className="text-danger">*</span>
//           </CFormLabel>
//           <CFormInput
//             value={formData.unitNumber}
//             onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
//             placeholder="e.g. 101"
//             required
//           />
//         </CCol>

//         {/* Type */}
//         <CCol md={4}>
//           <CFormLabel className="fw-semibold">
//             Type <span className="text-danger">*</span>
//           </CFormLabel>
//           <CFormSelect
//             value={formData.propertyType}
//             onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
//             required
//           >
//             <option value="">Select Type...</option>
//             <option value="Apartment">Apartment</option>
//             <option value="House">House</option>
//             <option value="Office">Office</option>
//             <option value="Shop">Shop</option>
//           </CFormSelect>
//         </CCol>

//         {/* Base Rent */}
//         <CCol md={4}>
//           <CFormLabel className="fw-semibold">
//             Base Rent <span className="text-danger">*</span>
//           </CFormLabel>
//           <CInputGroup>
//             <CInputGroupText>PKR</CInputGroupText>
//             <CFormInput
//               type="number"
//               min="0"
//               value={formData.baseRent}
//               onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })}
//               placeholder="0"
//               required
//             />
//           </CInputGroup>
//         </CCol>

//         {/* City */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">
//             City <span className="text-danger">*</span>
//           </CFormLabel>
//           <CFormInput
//             value={formData.city}
//             onChange={(e) => setFormData({ ...formData, city: e.target.value })}
//             placeholder="e.g. Karachi"
//             required
//           />
//         </CCol>

//         {/* Status */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">
//             Status <span className="text-danger">*</span>
//           </CFormLabel>
//           <CFormSelect
//             value={formData.status}
//             onChange={(e) => setFormData({ ...formData, status: e.target.value })}
//             required
//           >
//             <option value="">Select Status...</option>
//             <option value="Available">Available</option>
//             <option value="Rented">Rented</option>
//             <option value="Maintenance">Maintenance</option>
//           </CFormSelect>
//         </CCol>

//         {/* Address */}
//         <CCol md={12}>
//           <CFormLabel className="fw-semibold">
//             Full Address <span className="text-danger">*</span>
//           </CFormLabel>
//           <CFormInput
//             value={formData.address}
//             onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//             placeholder="Full address"
//             required
//           />
//         </CCol>

//         {/* Notes */}
//         <CCol md={12}>
//           <CFormLabel className="fw-semibold">Notes</CFormLabel>
//           <CFormTextarea
//             value={formData.notes}
//             onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
//             rows={3}
//             placeholder="Any additional notes..."
//           />
//         </CCol>
//       </CRow>

//       <CRow className="mt-4">
//         <CCol xs={12} className="text-end">
//           <CButton color="secondary" className="me-3" onClick={closeModal}>
//             Cancel
//           </CButton>
//           <CButton color="primary" type="submit">
//             {editData ? 'Update Property' : 'Add Property'}
//           </CButton>
//         </CCol>
//       </CRow>
//     </CForm>
//   )
// }

// export default PropertyForm



// import React, { useState, useEffect } from 'react'
// import {
//   CForm,
//   CFormInput,
//   CFormLabel,
//   CFormSelect,
//   CFormTextarea,
//   CButton,
//   CCol,
//   CRow,
//   CInputGroup,
//   CInputGroupText,
//   CSpinner,
// } from '@coreui/react'
// import { toast } from 'react-toastify'
// import { propertyService } from '../../../services/property.service'

// const PropertyForm = ({ editData, handleSubmit, closeModal, buildings, floors, loadFloors, onBuildingCreated }) => {
//   const defaultForm = {
//     buildingId: '',
//     floorId: '',
//     unitNumber: '',
//     propertyType: '',
//     baseRent: '',
//     city: '',
//     address: '',
//     status: '',
//     notes: '',
//   }

//   const [formData, setFormData] = useState(defaultForm)
//   const [validated, setValidated] = useState(false)

//   // Quick-add building
//   const [showNewBuilding, setShowNewBuilding] = useState(false)
//   const [newBuildingName, setNewBuildingName] = useState('')
//   const [newBuildingCity, setNewBuildingCity] = useState('')
//   const [savingBuilding, setSavingBuilding] = useState(false)

//   // Quick-add floor
//   const [showNewFloor, setShowNewFloor] = useState(false)
//   const [newFloorNumber, setNewFloorNumber] = useState('')
//   const [savingFloor, setSavingFloor] = useState(false)

//   useEffect(() => {
//     if (editData) {
//       setFormData({
//         buildingId: editData.buildingId || '',
//         floorId: editData.floorId || '',
//         unitNumber: editData.unitNumber || '',
//         propertyType: editData.propertyType || '',
//         baseRent: editData.baseRent || '',
//         city: editData.city || editData.cityName || '',
//         address: editData.address || '',
//         status: editData.status || '',
//         notes: editData.notes || editData.note || '',
//       })
//     } else {
//       setFormData(defaultForm)
//     }
//   }, [editData])

//   const isFormValid = () => {
//     return (
//       formData.buildingId &&
//       formData.floorId &&
//       formData.unitNumber &&
//       formData.propertyType &&
//       formData.baseRent &&
//       formData.city &&
//       formData.address &&
//       formData.status
//     )
//   }

//   // Save & Close
//   const onSubmit = (e) => {
//     e.preventDefault()
//     const form = e.currentTarget
//     if (form.checkValidity() === false) {
//       e.stopPropagation()
//       setValidated(true)
//       return
//     }
//     setValidated(true)
//     handleSubmit(formData, false)
//   }

//   // Add Another — saves then resets unit fields, keeps building+floor
//   const onAddAnother = (e) => {
//     e.preventDefault()
//     if (!isFormValid()) {
//       setValidated(true)
//       return
//     }
//     const savedBuildingId = formData.buildingId
//     const savedFloorId = formData.floorId
//     const savedCity = formData.city
//     const savedAddress = formData.address

//     handleSubmit(formData, true) // true = keep modal open

//     setValidated(false)
//     setFormData({
//       buildingId: savedBuildingId,
//       floorId: savedFloorId,
//       unitNumber: '',
//       propertyType: '',
//       baseRent: '',
//       city: savedCity,
//       address: savedAddress,
//       status: '',
//       notes: '',
//     })
//   }

//   const handleBuildingChange = (e) => {
//     const val = e.target.value
//     setFormData({ ...formData, buildingId: val, floorId: '' })
//     setShowNewFloor(false)
//     setNewFloorNumber('')
//     if (val) loadFloors(val)
//   }

//   const saveNewBuilding = async () => {
//     if (!newBuildingName.trim()) { toast.error('Building name is required'); return }
//     setSavingBuilding(true)
//     try {
//       const created = await propertyService.createBuilding({ name: newBuildingName.trim(), city: newBuildingCity.trim() })
//       toast.success('Building created')
//       setShowNewBuilding(false)
//       setNewBuildingName('')
//       setNewBuildingCity('')
//       if (onBuildingCreated) await onBuildingCreated()
//       if (created?.id) {
//         setFormData((prev) => ({ ...prev, buildingId: created.id, floorId: '' }))
//         loadFloors(created.id)
//       }
//     } catch { toast.error('Failed to create building') }
//     finally { setSavingBuilding(false) }
//   }

//   const saveNewFloor = async () => {
//     if (!newFloorNumber.toString().trim()) { toast.error('Floor number is required'); return }
//     if (!formData.buildingId) { toast.error('Select a building first'); return }
//     setSavingFloor(true)
//     try {
//       const created = await propertyService.createFloor({ floorNumber: newFloorNumber, buildingId: formData.buildingId })
//       toast.success('Floor created')
//       setShowNewFloor(false)
//       setNewFloorNumber('')
//       await loadFloors(formData.buildingId)
//       if (created?.id) setFormData((prev) => ({ ...prev, floorId: created.id }))
//     } catch { toast.error('Failed to create floor') }
//     finally { setSavingFloor(false) }
//   }

//   return (
//     <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={onSubmit}>
//       <CRow>
//         {/* Building */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">Building Name <span className="text-danger">*</span></CFormLabel>
//           <CInputGroup>
//             <CFormSelect value={formData.buildingId} onChange={handleBuildingChange} required>
//               <option value="">Select Building...</option>
//               {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
//             </CFormSelect>
//             <CButton type="button" color="outline-primary" title="Add new building" onClick={() => setShowNewBuilding((v) => !v)}>+</CButton>
//           </CInputGroup>
//           {showNewBuilding && (
//             <div className="border rounded p-2 mt-2 bg-light">
//               <small className="fw-semibold text-muted d-block mb-2">New Building</small>
//               <CFormInput placeholder="Building name *" value={newBuildingName} onChange={(e) => setNewBuildingName(e.target.value)} className="mb-2" size="sm" />
//               <CFormInput placeholder="City (optional)" value={newBuildingCity} onChange={(e) => setNewBuildingCity(e.target.value)} className="mb-2" size="sm" />
//               <div className="d-flex gap-2">
//                 <CButton size="sm" color="primary" onClick={saveNewBuilding} disabled={savingBuilding}>
//                   {savingBuilding ? <CSpinner size="sm" /> : 'Save Building'}
//                 </CButton>
//                 <CButton size="sm" color="secondary" variant="outline" onClick={() => { setShowNewBuilding(false); setNewBuildingName(''); setNewBuildingCity('') }}>Cancel</CButton>
//               </div>
//             </div>
//           )}
//         </CCol>

//         {/* Floor */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">Floor <span className="text-danger">*</span></CFormLabel>
//           <CInputGroup>
//             <CFormSelect value={formData.floorId} onChange={(e) => setFormData({ ...formData, floorId: e.target.value })} disabled={!formData.buildingId} required>
//               <option value="">Select Floor...</option>
//               {floors.map((f) => <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>)}
//             </CFormSelect>
//             <CButton type="button" color="outline-primary" disabled={!formData.buildingId} title="Add new floor" onClick={() => setShowNewFloor((v) => !v)}>+</CButton>
//           </CInputGroup>
//           {showNewFloor && (
//             <div className="border rounded p-2 mt-2 bg-light">
//               <small className="fw-semibold text-muted d-block mb-2">New Floor</small>
//               <CFormInput type="number" placeholder="Floor number *" value={newFloorNumber} onChange={(e) => setNewFloorNumber(e.target.value)} className="mb-2" size="sm" />
//               <div className="d-flex gap-2">
//                 <CButton size="sm" color="primary" onClick={saveNewFloor} disabled={savingFloor}>
//                   {savingFloor ? <CSpinner size="sm" /> : 'Save Floor'}
//                 </CButton>
//                 <CButton size="sm" color="secondary" variant="outline" onClick={() => { setShowNewFloor(false); setNewFloorNumber('') }}>Cancel</CButton>
//               </div>
//             </div>
//           )}
//         </CCol>

//         {/* Unit Number */}
//         <CCol md={4}>
//           <CFormLabel className="fw-semibold">Unit Number <span className="text-danger">*</span></CFormLabel>
//           <CFormInput value={formData.unitNumber} onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })} placeholder="e.g. 101" required />
//         </CCol>

//         {/* Type */}
//         <CCol md={4}>
//           <CFormLabel className="fw-semibold">Type <span className="text-danger">*</span></CFormLabel>
//           <CFormSelect value={formData.propertyType} onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })} required>
//             <option value="">Select Type...</option>
//             <option value="Apartment">Apartment</option>
//             <option value="House">House</option>
//             <option value="Office">Office</option>
//             <option value="Shop">Shop</option>
//           </CFormSelect>
//         </CCol>

//         {/* Base Rent */}
//         <CCol md={4}>
//           <CFormLabel className="fw-semibold">Base Rent <span className="text-danger">*</span></CFormLabel>
//           <CInputGroup>
//             <CInputGroupText>PKR</CInputGroupText>
//             <CFormInput type="number" min="0" value={formData.baseRent} onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })} placeholder="0" required />
//           </CInputGroup>
//         </CCol>

//         {/* City */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">City <span className="text-danger">*</span></CFormLabel>
//           <CFormInput value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="e.g. Karachi" required />
//         </CCol>

//         {/* Status */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">Status <span className="text-danger">*</span></CFormLabel>
//           <CFormSelect value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required>
//             <option value="">Select Status...</option>
//             <option value="Available">Available</option>
//             <option value="Rented">Rented</option>
//             <option value="Maintenance">Maintenance</option>
//           </CFormSelect>
//         </CCol>

//         {/* Address */}
//         <CCol md={12}>
//           <CFormLabel className="fw-semibold">Full Address <span className="text-danger">*</span></CFormLabel>
//           <CFormInput value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full address" required />
//         </CCol>

//         {/* Notes */}
//         <CCol md={12}>
//           <CFormLabel className="fw-semibold">Notes</CFormLabel>
//           <CFormTextarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Any additional notes..." />
//         </CCol>
//       </CRow>

//       <CRow className="mt-4">
//         <CCol xs={12} className="d-flex justify-content-end gap-2 flex-wrap">
//           <CButton color="secondary" variant="outline" onClick={closeModal}>Cancel</CButton>
//           {!editData && (
//             <CButton color="secondary" type="button" onClick={onAddAnother}>
//               + Add Another
//             </CButton>
//           )}
//           <CButton color="primary" type="submit">
//             {editData ? 'Update Property' : 'Save & Close'}
//           </CButton>
//         </CCol>
//       </CRow>
//     </CForm>
//   )
// }

// export default PropertyForm




// import React, { useState, useEffect } from 'react'
// import {
//   CForm,
//   CFormInput,
//   CFormLabel,
//   CFormSelect,
//   CFormTextarea,
//   CButton,
//   CCol,
//   CRow,
//   CInputGroup,
//   CInputGroupText,
//   CSpinner,
// } from '@coreui/react'
// import { toast } from 'react-toastify'
// import { propertyService } from '../../../services/property.service'

// const PropertyForm = ({
//   editData,
//   handleSubmit,
//   closeModal,
//   buildings,
//   floors,
//   loadFloors,
//   onBuildingCreated,
//   unitStatuses,
// }) => {
//   const defaultForm = {
//     buildingId: '',
//     floorId: '',
//     unitNumber: '',
//     propertyType: '',
//     baseRent: '',
//     statusId: '',
//     note: '',
//     isActive: true,
//   }

//   const [formData, setFormData] = useState(defaultForm)
//   const [validated, setValidated] = useState(false)

//   // Quick-add building
//   const [showNewBuilding, setShowNewBuilding] = useState(false)
//   const [newBuildingName, setNewBuildingName] = useState('')
//   const [savingBuilding, setSavingBuilding] = useState(false)

//   // Quick-add floor
//   const [showNewFloor, setShowNewFloor] = useState(false)
//   const [newFloorNumber, setNewFloorNumber] = useState('')
//   const [savingFloor, setSavingFloor] = useState(false)

//   useEffect(() => {
//     if (editData) {
//       setFormData({
//         buildingId: editData.buildingId || '',
//         floorId: editData.floorId || '',
//         unitNumber: editData.unitNumber || '',
//         propertyType: editData.propertyType || '',
//         baseRent: editData.baseRent || '',
//         statusId: editData.statusId || '',
//         note: editData.note || editData.notes || '',
//         isActive: editData.isActive ?? true,
//       })
//     } else {
//       setFormData(defaultForm)
//     }
//   }, [editData])

//   const isFormValid = () =>
//     formData.buildingId &&
//     formData.floorId &&
//     formData.unitNumber &&
//     formData.propertyType &&
//     formData.baseRent &&
//     formData.statusId

//   // Save & Close
//   const onSubmit = (e) => {
//     e.preventDefault()
//     const form = e.currentTarget
//     if (form.checkValidity() === false) {
//       e.stopPropagation()
//       setValidated(true)
//       return
//     }
//     setValidated(true)
//     handleSubmit(formData, false)
//   }

//   // Add Another — saves, keeps modal open, resets unit-specific fields
//   const onAddAnother = (e) => {
//     e.preventDefault()
//     if (!isFormValid()) { setValidated(true); return }

//     const { buildingId, floorId } = formData
//     handleSubmit(formData, true)
//     setValidated(false)
//     setFormData({
//       ...defaultForm,
//       buildingId,
//       floorId,
//       isActive: true,
//     })
//   }

//   const handleBuildingChange = (e) => {
//     const val = e.target.value
//     setFormData({ ...formData, buildingId: val, floorId: '' })
//     setShowNewFloor(false)
//     setNewFloorNumber('')
//     if (val) loadFloors(val)
//   }

//   const saveNewBuilding = async () => {
//     if (!newBuildingName.trim()) { toast.error('Building name is required'); return }
//     setSavingBuilding(true)
//     try {
//       const created = await propertyService.createBuilding({
//         name: newBuildingName.trim(),
//         isActive: true,
//       })
//       toast.success('Building created')
//       setShowNewBuilding(false)
//       setNewBuildingName('')
//       if (onBuildingCreated) await onBuildingCreated()
//       if (created?.id) {
//         setFormData((prev) => ({ ...prev, buildingId: created.id, floorId: '' }))
//         loadFloors(created.id)
//       }
//     } catch { toast.error('Failed to create building') }
//     finally { setSavingBuilding(false) }
//   }

//   const saveNewFloor = async () => {
//     if (!newFloorNumber.toString().trim()) { toast.error('Floor number is required'); return }
//     if (!formData.buildingId) { toast.error('Select a building first'); return }
//     setSavingFloor(true)
//     try {
//       const created = await propertyService.createFloor({
//         floorNumber: newFloorNumber,
//         buildingId: formData.buildingId,
//         isActive: true,
//       })
//       toast.success('Floor created')
//       setShowNewFloor(false)
//       setNewFloorNumber('')
//       await loadFloors(formData.buildingId)
//       if (created?.id) setFormData((prev) => ({ ...prev, floorId: created.id }))
//     } catch { toast.error('Failed to create floor') }
//     finally { setSavingFloor(false) }
//   }

//   return (
//     <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={onSubmit}>
//       <CRow>

//         {/* Building */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">
//             Building <span className="text-danger">*</span>
//           </CFormLabel>
//           <CInputGroup>
//             <CFormSelect value={formData.buildingId} onChange={handleBuildingChange} required>
//               <option value="">Select Building...</option>
//               {buildings.map((b) => (
//                 <option key={b.id} value={b.id}>{b.name || b.buildingName}</option>
//               ))}
//             </CFormSelect>
//             <CButton type="button" color="outline-primary" title="Quick add building" onClick={() => setShowNewBuilding((v) => !v)}>+</CButton>
//           </CInputGroup>

//           {showNewBuilding && (
//             <div className="border rounded p-2 mt-2 bg-light">
//               <small className="fw-semibold text-muted d-block mb-2">New Building</small>
//               <CFormInput
//                 placeholder="Building name *"
//                 value={newBuildingName}
//                 onChange={(e) => setNewBuildingName(e.target.value)}
//                 className="mb-2"
//                 size="sm"
//               />
//               <small className="text-muted d-block mb-2">
//                 💡 City & Type can be set by editing the building after creation.
//               </small>
//               <div className="d-flex gap-2">
//                 <CButton size="sm" color="primary" onClick={saveNewBuilding} disabled={savingBuilding}>
//                   {savingBuilding ? <CSpinner size="sm" /> : 'Save Building'}
//                 </CButton>
//                 <CButton size="sm" color="secondary" variant="outline" onClick={() => { setShowNewBuilding(false); setNewBuildingName('') }}>Cancel</CButton>
//               </div>
//             </div>
//           )}
//         </CCol>

//         {/* Floor */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">
//             Floor <span className="text-danger">*</span>
//           </CFormLabel>
//           <CInputGroup>
//             <CFormSelect
//               value={formData.floorId}
//               onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
//               disabled={!formData.buildingId}
//               required
//             >
//               <option value="">Select Floor...</option>
//               {floors.map((f) => (
//                 <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>
//               ))}
//             </CFormSelect>
//             <CButton type="button" color="outline-primary" disabled={!formData.buildingId} title="Quick add floor" onClick={() => setShowNewFloor((v) => !v)}>+</CButton>
//           </CInputGroup>

//           {showNewFloor && (
//             <div className="border rounded p-2 mt-2 bg-light">
//               <small className="fw-semibold text-muted d-block mb-2">New Floor</small>
//               <CFormInput
//                 type="number"
//                 placeholder="Floor number *"
//                 value={newFloorNumber}
//                 onChange={(e) => setNewFloorNumber(e.target.value)}
//                 className="mb-2"
//                 size="sm"
//               />
//               <div className="d-flex gap-2">
//                 <CButton size="sm" color="primary" onClick={saveNewFloor} disabled={savingFloor}>
//                   {savingFloor ? <CSpinner size="sm" /> : 'Save Floor'}
//                 </CButton>
//                 <CButton size="sm" color="secondary" variant="outline" onClick={() => { setShowNewFloor(false); setNewFloorNumber('') }}>Cancel</CButton>
//               </div>
//             </div>
//           )}
//         </CCol>

//         {/* Unit Number */}
//         <CCol md={4}>
//           <CFormLabel className="fw-semibold">
//             Unit Number <span className="text-danger">*</span>
//           </CFormLabel>
//           <CFormInput
//             value={formData.unitNumber}
//             onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
//             placeholder="e.g. 101"
//             required
//           />
//         </CCol>

//         {/* Property Type */}
//         <CCol md={4}>
//           <CFormLabel className="fw-semibold">
//             Unit Type <span className="text-danger">*</span>
//           </CFormLabel>
//           <CFormSelect
//             value={formData.propertyType}
//             onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
//             required
//           >
//             <option value="">Select Type...</option>
//             <option value="Apartment">Apartment</option>
//             <option value="House">House</option>
//             <option value="Office">Office</option>
//             <option value="Shop">Shop</option>
//           </CFormSelect>
//         </CCol>

//         {/* Base Rent */}
//         <CCol md={4}>
//           <CFormLabel className="fw-semibold">
//             Base Rent <span className="text-danger">*</span>
//           </CFormLabel>
//           <CInputGroup>
//             <CInputGroupText>PKR</CInputGroupText>
//             <CFormInput
//               type="number"
//               min="0"
//               value={formData.baseRent}
//               onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })}
//               placeholder="0"
//               required
//             />
//           </CInputGroup>
//         </CCol>

//         {/* Status — from UnitStatus lookup table */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">
//             Status <span className="text-danger">*</span>
//           </CFormLabel>
//           <CFormSelect
//             value={formData.statusId}
//             onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
//             required
//           >
//             <option value="">Select Status...</option>
//             {unitStatuses.map((s) => (
//               <option key={s.id} value={s.id}>{s.name}</option>
//             ))}
//           </CFormSelect>
//         </CCol>

//         {/* Notes */}
//         <CCol md={6}>
//           <CFormLabel className="fw-semibold">Note</CFormLabel>
//           <CFormInput
//             value={formData.note}
//             onChange={(e) => setFormData({ ...formData, note: e.target.value })}
//             placeholder="Any additional note..."
//           />
//         </CCol>

//       </CRow>

//       <CRow className="mt-4">
//         <CCol xs={12} className="d-flex justify-content-end gap-2 flex-wrap">
//           <CButton color="secondary" variant="outline" onClick={closeModal}>Cancel</CButton>
//           {!editData && (
//             <CButton color="secondary" type="button" onClick={onAddAnother}>
//               + Add Another
//             </CButton>
//           )}
//           <CButton color="primary" type="submit">
//             {editData ? 'Update Property' : 'Save & Close'}
//           </CButton>
//         </CCol>
//       </CRow>
//     </CForm>
//   )
// }

// export default PropertyForm





import React, { useState, useEffect } from 'react'
import {
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CCol,
  CRow,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
import { toast } from 'react-toastify'
import { propertyService } from '../../../services/property.service'

const PropertyForm = ({
  editData,
  handleSubmit,
  closeModal,
  buildings = [],       // default [] — prevents .map() crash if undefined
  floors = [],          // default []
  loadFloors,
  onBuildingCreated,
  unitStatuses = [],    // default []
}) => {
  const isEditMode = !!(editData?.id)

  const defaultForm = {
    buildingId: '',
    floorId: '',
    unitNumber: '',
    propertyType: '',
    baseRent: '',
    statusId: '',
    note: '',
    isActive: true,
  }

  const [formData, setFormData] = useState(defaultForm)
  const [validated, setValidated] = useState(false)

  const [showNewBuilding, setShowNewBuilding] = useState(false)
  const [newBuildingName, setNewBuildingName] = useState('')
  const [savingBuilding, setSavingBuilding] = useState(false)

  const [showNewFloor, setShowNewFloor] = useState(false)
  const [newFloorNumber, setNewFloorNumber] = useState('')
  const [savingFloor, setSavingFloor] = useState(false)

  useEffect(() => {
    if (editData?.id) {
      setFormData({
        buildingId: editData.buildingId || '',
        floorId: editData.floorId || '',
        unitNumber: editData.unitNumber || '',
        propertyType: editData.propertyType || '',
        baseRent: editData.baseRent || '',
        statusId: editData.statusId || '',
        note: editData.note || editData.notes || '',
        isActive: editData.isActive ?? true,
      })
    } else if (editData?.buildingId) {
      // Pre-selected building (add from building view)
      setFormData({ ...defaultForm, buildingId: editData.buildingId })
    } else {
      setFormData(defaultForm)
    }
    setValidated(false)
    setShowNewBuilding(false)
    setShowNewFloor(false)
  }, [editData])

  const isFormValid = () =>
    formData.buildingId &&
    formData.floorId &&
    formData.unitNumber &&
    formData.propertyType &&
    formData.baseRent &&
    formData.statusId

  const onSubmit = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    if (form.checkValidity() === false) {
      e.stopPropagation()
      setValidated(true)
      return
    }
    setValidated(true)
    handleSubmit(isEditMode ? { ...formData, id: editData.id } : formData, false)
  }

  const onAddAnother = (e) => {
    e.preventDefault()
    if (!isFormValid()) { setValidated(true); return }
    const { buildingId, floorId } = formData
    handleSubmit(formData, true)
    setValidated(false)
    setFormData({ ...defaultForm, buildingId, floorId, isActive: true })
  }

  const handleBuildingChange = (e) => {
    const val = e.target.value
    setFormData({ ...formData, buildingId: val, floorId: '' })
    setShowNewFloor(false)
    setNewFloorNumber('')
    if (val && loadFloors) loadFloors(val)
  }

  const saveNewBuilding = async () => {
    if (!newBuildingName.trim()) { toast.error('Building name is required'); return }
    setSavingBuilding(true)
    try {
      const created = await propertyService.createBuilding({ name: newBuildingName.trim(), isActive: true })
      toast.success('Building created')
      setShowNewBuilding(false)
      setNewBuildingName('')
      if (onBuildingCreated) await onBuildingCreated()
      if (created?.id) {
        setFormData((prev) => ({ ...prev, buildingId: created.id, floorId: '' }))
        if (loadFloors) loadFloors(created.id)
      }
    } catch { toast.error('Failed to create building') }
    finally { setSavingBuilding(false) }
  }

  const saveNewFloor = async () => {
    if (!newFloorNumber.toString().trim()) { toast.error('Floor number is required'); return }
    if (!formData.buildingId) { toast.error('Select a building first'); return }
    setSavingFloor(true)
    try {
      const created = await propertyService.createFloor({
        floorNumber: newFloorNumber,
        buildingId: formData.buildingId,
        isActive: true,
      })
      toast.success('Floor created')
      setShowNewFloor(false)
      setNewFloorNumber('')
      if (loadFloors) await loadFloors(formData.buildingId)
      if (created?.id) setFormData((prev) => ({ ...prev, floorId: created.id }))
    } catch { toast.error('Failed to create floor') }
    finally { setSavingFloor(false) }
  }

  return (
    <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={onSubmit}>
      <CRow>

        {/* ── Building Dropdown ── */}
        <CCol md={6}>
          <CFormLabel className="fw-semibold">
            Building <span className="text-danger">*</span>
          </CFormLabel>
          <CInputGroup>
            <CFormSelect value={formData.buildingId} onChange={handleBuildingChange} required>
              <option value="">Select Building...</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name || b.buildingName}</option>
              ))}
            </CFormSelect>
            <CButton type="button" color="outline-primary" onClick={() => setShowNewBuilding((v) => !v)}>+</CButton>
          </CInputGroup>

          {showNewBuilding && (
            <div className="border rounded p-2 mt-2 bg-light">
              <small className="fw-semibold text-muted d-block mb-2">New Building</small>
              <CFormInput
                placeholder="Building name *"
                value={newBuildingName}
                onChange={(e) => setNewBuildingName(e.target.value)}
                className="mb-2" size="sm"
              />
              <small className="text-muted d-block mb-2">
                💡 City & Type can be set by editing the building later.
              </small>
              <div className="d-flex gap-2">
                <CButton size="sm" color="primary" onClick={saveNewBuilding} disabled={savingBuilding}>
                  {savingBuilding ? <CSpinner size="sm" /> : 'Save Building'}
                </CButton>
                <CButton size="sm" color="secondary" variant="outline"
                  onClick={() => { setShowNewBuilding(false); setNewBuildingName('') }}>
                  Cancel
                </CButton>
              </div>
            </div>
          )}
        </CCol>

        {/* ── Floor Dropdown ── */}
        <CCol md={6}>
          <CFormLabel className="fw-semibold">
            Floor <span className="text-danger">*</span>
          </CFormLabel>
          <CInputGroup>
            <CFormSelect
              value={formData.floorId}
              onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
              disabled={!formData.buildingId}
              required
            >
              <option value="">
                {formData.buildingId ? 'Select Floor...' : 'Select building first'}
              </option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>
              ))}
            </CFormSelect>
            <CButton type="button" color="outline-primary" disabled={!formData.buildingId}
              onClick={() => setShowNewFloor((v) => !v)}>+</CButton>
          </CInputGroup>

          {showNewFloor && (
            <div className="border rounded p-2 mt-2 bg-light">
              <small className="fw-semibold text-muted d-block mb-2">New Floor</small>
              <CFormInput
                type="number" placeholder="Floor number *"
                value={newFloorNumber}
                onChange={(e) => setNewFloorNumber(e.target.value)}
                className="mb-2" size="sm"
              />
              <div className="d-flex gap-2">
                <CButton size="sm" color="primary" onClick={saveNewFloor} disabled={savingFloor}>
                  {savingFloor ? <CSpinner size="sm" /> : 'Save Floor'}
                </CButton>
                <CButton size="sm" color="secondary" variant="outline"
                  onClick={() => { setShowNewFloor(false); setNewFloorNumber('') }}>
                  Cancel
                </CButton>
              </div>
            </div>
          )}
        </CCol>

        {/* ── Unit Number ── */}
        <CCol md={4}>
          <CFormLabel className="fw-semibold">
            Unit Number <span className="text-danger">*</span>
          </CFormLabel>
          <CFormInput
            value={formData.unitNumber}
            onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
            placeholder="e.g. 101" required
          />
        </CCol>

        {/* ── Unit Type ── */}
        <CCol md={4}>
          <CFormLabel className="fw-semibold">
            Unit Type <span className="text-danger">*</span>
          </CFormLabel>
          <CFormSelect
            value={formData.propertyType}
            onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
            required
          >
            <option value="">Select Type...</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Office">Office</option>
            <option value="Shop">Shop</option>
          </CFormSelect>
        </CCol>

        {/* ── Base Rent ── */}
        <CCol md={4}>
          <CFormLabel className="fw-semibold">
            Base Rent <span className="text-danger">*</span>
          </CFormLabel>
          <CInputGroup>
            <CInputGroupText>PKR</CInputGroupText>
            <CFormInput
              type="number" min="0"
              value={formData.baseRent}
              onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })}
              placeholder="0" required
            />
          </CInputGroup>
        </CCol>

        {/* ── Status from UnitStatus table ── */}
        <CCol md={6}>
          <CFormLabel className="fw-semibold">
            Status <span className="text-danger">*</span>
          </CFormLabel>
          <CFormSelect
            value={formData.statusId}
            onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
            required
          >
            <option value="">Select Status...</option>
            {unitStatuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </CFormSelect>
        </CCol>

        {/* ── Note ── */}
        <CCol md={6}>
          <CFormLabel className="fw-semibold">Note</CFormLabel>
          <CFormInput
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Any additional note..."
          />
        </CCol>

      </CRow>

      <CRow className="mt-4">
        <CCol xs={12} className="d-flex justify-content-end gap-2 flex-wrap">
          <CButton color="secondary" variant="outline" onClick={closeModal}>Cancel</CButton>
          {!isEditMode && (
            <CButton color="secondary" type="button" onClick={onAddAnother}>
              + Add Another
            </CButton>
          )}
          <CButton color="primary" type="submit">
            {isEditMode ? 'Update Property' : 'Save & Close'}
          </CButton>
        </CCol>
      </CRow>
    </CForm>
  )
}

export default PropertyForm