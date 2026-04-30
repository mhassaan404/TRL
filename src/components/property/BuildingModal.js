// import React, { useState, useEffect } from 'react'
// import {
//   CModal,
//   CModalHeader,
//   CModalTitle,
//   CModalBody,
//   CModalFooter,
//   CForm,
//   CFormInput,
//   CFormLabel,
//   CButton,
//   CCol,
//   CRow,
// } from '@coreui/react'

// const BuildingModal = ({ visible, editData, handleSubmit, closeModal }) => {
//   const [formData, setFormData] = useState({ name: '', city: '', address: '' })
//   const [validated, setValidated] = useState(false)

//   useEffect(() => {
//     if (editData) {
//       setFormData({
//         name: editData.name || '',
//         city: editData.city || editData.cityName || '',
//         address: editData.address || '',
//       })
//     } else {
//       setFormData({ name: '', city: '', address: '' })
//     }
//     setValidated(false)
//   }, [editData, visible])

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

//   return (
//     <CModal visible={visible} backdrop="static" alignment="center">
//       <CModalHeader onClick={closeModal}>
//         <CModalTitle>{editData ? 'Edit Building' : 'Add Building'}</CModalTitle>
//       </CModalHeader>
//       <CForm noValidate validated={validated} onSubmit={onSubmit}>
//         <CModalBody>
//           <CRow className="g-3">
//             <CCol md={12}>
//               <CFormLabel className="fw-semibold">
//                 Building Name <span className="text-danger">*</span>
//               </CFormLabel>
//               <CFormInput
//                 value={formData.name}
//                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                 placeholder="e.g. Al-Noor Tower"
//                 required
//               />
//             </CCol>
//             <CCol md={12}>
//               <CFormLabel className="fw-semibold">City</CFormLabel>
//               <CFormInput
//                 value={formData.city}
//                 onChange={(e) => setFormData({ ...formData, city: e.target.value })}
//                 placeholder="e.g. Karachi"
//               />
//             </CCol>
//             <CCol md={12}>
//               <CFormLabel className="fw-semibold">Address</CFormLabel>
//               <CFormInput
//                 value={formData.address}
//                 onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//                 placeholder="Full address"
//               />
//             </CCol>
//           </CRow>
//         </CModalBody>
//         <CModalFooter>
//           <CButton color="secondary" onClick={closeModal}>
//             Cancel
//           </CButton>
//           <CButton color="primary" type="submit">
//             {editData ? 'Update Building' : 'Add Building'}
//           </CButton>
//         </CModalFooter>
//       </CForm>
//     </CModal>
//   )
// }

// export default BuildingModal




import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CCol,
  CRow,
} from '@coreui/react'

const BuildingModal = ({ visible, editData, handleSubmit, closeModal, cities, buildingTypes }) => {
  const [formData, setFormData] = useState({
    name: '',
    cityId: '',
    typeId: '',
    address: '',
    isActive: true,
  })
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || editData.buildingName || '',
        cityId: editData.cityId || '',
        typeId: editData.typeId || '',
        address: editData.address || '',
        isActive: editData.isActive ?? true,
      })
    } else {
      setFormData({ name: '', cityId: '', typeId: '', address: '', isActive: true })
    }
    setValidated(false)
  }, [editData, visible])

  const onSubmit = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    if (form.checkValidity() === false) {
      e.stopPropagation()
      setValidated(true)
      return
    }
    setValidated(true)
    handleSubmit(formData)
  }

  return (
    <CModal visible={visible} backdrop="static" alignment="center">
      <CModalHeader onClick={closeModal}>
        <CModalTitle>{editData ? 'Edit Building' : 'Add Building'}</CModalTitle>
      </CModalHeader>
      <CForm noValidate validated={validated} onSubmit={onSubmit}>
        <CModalBody>
          <CRow className="g-3">
            {/* Building Name */}
            <CCol md={12}>
              <CFormLabel className="fw-semibold">
                Building Name <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Al-Noor Tower"
                required
              />
            </CCol>

            {/* Building Type */}
            <CCol md={6}>
              <CFormLabel className="fw-semibold">
                Building Type <span className="text-danger">*</span>
              </CFormLabel>
              <CFormSelect
                value={formData.typeId}
                onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                required
              >
                <option value="">Select Type...</option>
                {buildingTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </CFormSelect>
            </CCol>

            {/* City */}
            <CCol md={6}>
              <CFormLabel className="fw-semibold">
                City <span className="text-danger">*</span>
              </CFormLabel>
              <CFormSelect
                value={formData.cityId}
                onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                required
              >
                <option value="">Select City...</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </CFormSelect>
            </CCol>

            {/* Address */}
            <CCol md={12}>
              <CFormLabel className="fw-semibold">Address</CFormLabel>
              <CFormInput
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
              />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={closeModal}>Cancel</CButton>
          <CButton color="primary" type="submit">
            {editData ? 'Update Building' : 'Add Building'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default BuildingModal