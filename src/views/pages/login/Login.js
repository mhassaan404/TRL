// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { API_BASE_URL } from "../../../config";
// import {
//   CButton,
//   CCard,
//   CCardBody,
//   CCardGroup,
//   CCol,
//   CContainer,
//   CForm,
//   CFormInput,
//   CInputGroup,
//   CInputGroupText,
//   CRow,
//   CFormFeedback,
// } from '@coreui/react'
// import CIcon from '@coreui/icons-react'
// import { cilLockLocked, cilUser } from '@coreui/icons'

// const Login = () => {
//   const [username, setUsername] = useState('')
//   const [password, setPassword] = useState('')
//   const [serverError, setServerError] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [touched, setTouched] = useState({ username: false, password: false })
//   const navigate = useNavigate()

//   const handleLogin = async (e) => {
//     e.preventDefault()
//     setServerError('')

//     const hasError = !username || !password
//     if (hasError) {
//       setTouched({ username: true, password: true })
//       return
//     }

//     setLoading(true)
//     try {
//       const res = await fetch(`${API_BASE_URL}/Auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include', // for HttpOnly cookie
//         body: JSON.stringify({ username, password }),
//       })

//       if (res.ok) {
//         navigate('/dashboard')
//       } else {
//         const data = await res.json()
//         console.log(data)
//         setServerError(data.message || 'Invalid username or password')
//       }
//     } catch {
//       setServerError('Network error. Please try again.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
//       <CContainer>
//         <CRow className="justify-content-center">
//           <CCol md={8}>
//             <CCardGroup>
//               <CCard className="p-4">
//                 <CCardBody>
//                   <CForm onSubmit={handleLogin} noValidate>
//                     <h1>Login</h1>
//                     <p className="text-body-secondary">Sign In to your account</p>

//                     {serverError && (
//                       <div className="alert alert-danger py-2">{serverError}</div>
//                     )}

//                     <CInputGroup className="mb-3">
//                       <CInputGroupText>
//                         <CIcon icon={cilUser} />
//                       </CInputGroupText>
//                       <CFormInput
//                         placeholder="Username"
//                         autoComplete="username"
//                         value={username}
//                         invalid={touched.username && !username}
//                         onBlur={() => setTouched({ ...touched, username: true })}
//                         onChange={(e) => setUsername(e.target.value)}
//                         required
//                       />
//                       <CFormFeedback invalid>Username is required</CFormFeedback>
//                     </CInputGroup>

//                     <CInputGroup className="mb-4">
//                       <CInputGroupText>
//                         <CIcon icon={cilLockLocked} />
//                       </CInputGroupText>
//                       <CFormInput
//                         type="password"
//                         placeholder="Password"
//                         autoComplete="current-password"
//                         value={password}
//                         invalid={touched.password && !password}
//                         onBlur={() => setTouched({ ...touched, password: true })}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                       />
//                       <CFormFeedback invalid>Password is required</CFormFeedback>
//                     </CInputGroup>

//                     <CRow>
//                       <CCol xs={6}>
//                         <CButton
//                           color="primary"
//                           className="px-4"
//                           type="submit"
//                           disabled={loading}
//                         >
//                           {loading ? 'Logging in...' : 'Login'}
//                         </CButton>
//                       </CCol>
//                       <CCol xs={6} className="text-right">
//                         <CButton color="link" className="px-0">
//                           Forgot password?
//                         </CButton>
//                       </CCol>
//                     </CRow>
//                   </CForm>
//                 </CCardBody>
//               </CCard>

//               <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
//                 <CCardBody className="text-center">
//                   <div>
//                     <h2>Sign up</h2>
//                     <p>
//                       Join now and experience secure, seamless access to our services.
//                     </p>
//                     <Link to="/register">
//                       <CButton color="primary" className="mt-3" active tabIndex={-1}>
//                         Register Now!
//                       </CButton>
//                     </Link>
//                   </div>
//                 </CCardBody>
//               </CCard>
//             </CCardGroup>
//           </CCol>
//         </CRow>
//       </CContainer>
//     </div>
//   )
// }

// export default Login

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CFormFeedback,
  CAlert,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'

import authService from '../../../services/auth.service'

const Login = () => {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ username: false, password: false })

  const handleLogin = async (e) => {
    e.preventDefault()
    setServerError('')

    const hasError = !username.trim() || !password
    if (hasError) {
      setTouched({ username: true, password: true })
      return
    }

    setLoading(true)

    try {
      await authService.login(username.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(err.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol lg={8}>
            <CCardGroup>
              <CCard className="p-4 shadow-lg">
                <CCardBody>
                  <h1 className="text-center mb-4">Login</h1>
                  <p className="text-body-secondary text-center mb-4">Sign in to your account</p>

                  {serverError && (
                    <CAlert color="danger" dismissible onClose={() => setServerError('')}>
                      {serverError}
                    </CAlert>
                  )}

                  <CForm onSubmit={handleLogin} noValidate>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Username"
                        autoComplete="username"
                        value={username}
                        invalid={touched.username && !username.trim()}
                        onBlur={() => setTouched({ ...touched, username: true })}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        required
                      />
                      <CFormFeedback invalid>Username is required</CFormFeedback>
                    </CInputGroup>

                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        invalid={touched.password && !password}
                        onBlur={() => setTouched({ ...touched, password: true })}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                      <CFormFeedback invalid>Password is required</CFormFeedback>
                    </CInputGroup>

                    <CRow className="mb-4">
                      <CCol xs={6}>
                        <CButton
                          color="primary"
                          className="px-4 w-100"
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              Logging in...
                            </>
                          ) : (
                            'Login'
                          )}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-end">
                        <CButton color="link" className="px-0">
                          Forgot password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>

              <CCard
                className="text-white bg-primary py-5 d-none d-md-block"
                style={{ width: '44%' }}
              >
                <CCardBody className="text-center">
                  <h2>Welcome Back!</h2>
                  <p>Securely manage your rent collection, tenants, and payments.</p>
                  <Link to="/register">
                    <CButton color="light" className="mt-3" active>
                      Register Now!
                    </CButton>
                  </Link>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
