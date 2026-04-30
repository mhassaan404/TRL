// import React from 'react'
// import { CModal, CModalBody, CModalHeader, CModalTitle } from '@coreui/react'
// import PropertyForm from './PropertyForm'

// const PropertyModal = ({
//   visible,
//   editData,
//   handleSubmit,
//   closeModal,
//   buildings,
//   floors,
//   loadFloors,
// }) => {
//   return (
//     <CModal visible={visible} size="xl" backdrop="static">
//       <CModalHeader closeButton onClick={closeModal}>
//         <CModalTitle>{editData ? 'Edit Property' : 'Add Property'}</CModalTitle>
//       </CModalHeader>

//       <CModalBody>
//         {/* <PropertyForm editData={editData} handleSubmit={handleSubmit} closeModal={closeModal} /> */}

//         <PropertyForm
//           editData={editData}
//           handleSubmit={handleSubmit}
//           closeModal={closeModal}
//           buildings={buildings}
//           floors={floors}
//           loadFloors={loadFloors}
//         />
//       </CModalBody>
//     </CModal>
//   )
// }

// export default PropertyModal




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
}) => {
  return (
    <CModal visible={visible} size="xl" backdrop="static" alignment="center">
      <CModalHeader onClick={closeModal}>
        <CModalTitle>{editData ? 'Edit Property' : 'Add Property'}</CModalTitle>
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
        />
      </CModalBody>
    </CModal>
  )
}

export default PropertyModal