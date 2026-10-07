import React, { useState, useEffect } from 'react'
import SearchableSelect from '../rent/SearchableSelect'
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
    buildingName: '',
    cityId: '',
    typeId: '',
    address: '',
    isActive: true,
  })
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (editData) {
      setFormData({
        buildingName: editData.name || editData.buildingName || '',
        cityId: editData.cityId || '',
        typeId: editData.typeId || '',
        address: editData.address || '',
        isActive: editData.isActive ?? true,
      })
    } else {
      setFormData({ buildingName: '', cityId: '', typeId: '', address: '', isActive: true })
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
    <CModal visible={visible} backdrop="static" alignment="center" onClose={closeModal}>
      <CModalHeader>
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
                value={formData.buildingName}
                onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
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
              <SearchableSelect
                options={cities.map((c) => ({ value: c.id, label: c.name }))}
                value={formData.cityId}
                onChange={(v) => setFormData({ ...formData, cityId: String(v) })}
                placeholder="Select City..."
                required
                invalid={validated && !formData.cityId}
              />
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