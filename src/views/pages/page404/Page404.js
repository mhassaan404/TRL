import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CButton, CCol, CContainer, CRow } from '@coreui/react'

const Page404 = () => {
  const navigate = useNavigate()
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <div className="clearfix mb-3">
              <h1 className="float-start display-3 me-4">404</h1>
              <h4 className="pt-3">Page not found</h4>
              <p className="text-body-secondary float-start">The page you are looking for doesn't exist or was moved.</p>
            </div>
            <CButton color="primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </CButton>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Page404
