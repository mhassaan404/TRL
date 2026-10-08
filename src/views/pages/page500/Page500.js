import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CButton, CCol, CContainer, CRow } from '@coreui/react'

const Page500 = () => {
  const navigate = useNavigate()
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <div className="clearfix mb-3">
              <h1 className="float-start display-3 me-4">500</h1>
              <h4 className="pt-3">Something went wrong</h4>
              <p className="text-body-secondary float-start">The server couldn't complete your request. Please try again in a moment.</p>
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

export default Page500
