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
  CButton,
  CCol,
  CRow,
} from '@coreui/react'

const FloorModal = ({ visible, editData, handleSubmit, closeModal, buildingName }) => {
  const [formData, setFormData] = useState({ floorNumber: '', description: '' })
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (editData) {
      setFormData({
        floorNumber: editData.floorNumber || '',
        description: editData.description || '',
      })
    } else {
      setFormData({ floorNumber: '', description: '' })
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
        <CModalTitle>
          {editData ? 'Edit Floor' : 'Add Floor'}
          {buildingName && <small className="text-muted ms-2 fs-6">— {buildingName}</small>}
        </CModalTitle>
      </CModalHeader>
      <CForm noValidate validated={validated} onSubmit={onSubmit}>
        <CModalBody>
          <CRow className="g-3">
            <CCol md={12}>
              <CFormLabel className="fw-semibold">
                Floor Number <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                type="number"
                value={formData.floorNumber}
                onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                placeholder="e.g. 1"
                required
              />
            </CCol>
            <CCol md={12}>
              <CFormLabel className="fw-semibold">Description</CFormLabel>
              <CFormInput
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={closeModal}>
            Cancel
          </CButton>
          <CButton color="primary" type="submit">
            {editData ? 'Update Floor' : 'Add Floor'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default FloorModal