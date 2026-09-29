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
  const [formData, setFormData] = useState({ floorNumber: '' })
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (editData) {
      // ?? keeps a ground floor "0"; floor numbers are text ("G", "1", "Mezzanine")
      setFormData({ floorNumber: String(editData.floorNumber ?? '') })
    } else {
      setFormData({ floorNumber: '' })
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
                value={formData.floorNumber}
                maxLength={50}
                onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                placeholder="e.g. G, 1, 2, Mezzanine"
                required
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