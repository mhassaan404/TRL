import React from 'react'
import { CModal, CModalBody, CModalHeader, CModalTitle } from '@coreui/react'
import PropertyForm from './PropertyForm'

const PropertyModal = ({
  visible,
  editData,
  handleSubmit,
  closeModal,
  buildings,
  floors,
  loadFloors,
  onBuildingCreated,
  unitStatuses,
}) => {
  return (
    <CModal visible={visible} size="xl" backdrop="static" alignment="center" onClose={closeModal}>
      <CModalHeader>
        <CModalTitle>{editData?.id ? 'Edit Property' : 'Add Property'}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <PropertyForm
          editData={editData}
          handleSubmit={handleSubmit}
          closeModal={closeModal}
          buildings={buildings}
          floors={floors}
          loadFloors={loadFloors}
          onBuildingCreated={onBuildingCreated}
          unitStatuses={unitStatuses}
        />
      </CModalBody>
    </CModal>
  )
}

export default PropertyModal