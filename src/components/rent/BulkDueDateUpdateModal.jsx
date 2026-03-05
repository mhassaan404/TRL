import React from 'react'
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
} from '@coreui/react'

const BulkDueDateUpdateModal = ({
  visible,
  onClose,
  selectedCount,
  newDueDate,
  onDateChange,
  onSubmit,
  isSubmitting,
  isDark,
}) => {
  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'}>
        <strong>
          Update Due Date for {selectedCount} Invoice{selectedCount !== 1 ? 's' : ''}
        </strong>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <CFormInput
            label="New Due Date"
            type="date"
            value={newDueDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="mb-3"
          />
          <small className="text-muted">Selected invoices: {selectedCount}</small>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton
          color="warning"
          disabled={!newDueDate || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? 'Updating...' : 'Update Due Dates'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default BulkDueDateUpdateModal
