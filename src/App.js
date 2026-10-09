import React, { Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './App.css';
import authService from './services/auth.service'

// Sends logged-out users to the login page. The session itself lives in HttpOnly cookies the page can't read,
// so this checks the user saved at login; an expired session is still caught by the API's 401 + refresh flow.
const RequireAuth = ({ children }) =>
  authService.isAuthenticated() ? children : <Navigate to="/login" replace />

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

// Printable documents: own tab, outside the app layout (no sidebar/header)
const ReceiptPrint = React.lazy(() => import('./views/print/ReceiptPrint'))
const InvoicePrint = React.lazy(() => import('./views/print/InvoicePrint'))
const DepositReceiptPrint = React.lazy(() => import('./views/print/DepositReceiptPrint'))
const SettlementPrint = React.lazy(() => import('./views/print/SettlementPrint'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
      <HashRouter>
        <Suspense
          fallback={
            <div className="pt-3 text-center">
              <CSpinner color="primary" variant="grow" />
            </div>
          }
        >

          {/* ✅ Toast Container here */}
          <ToastContainer position="top-right" autoClose={2000} />

          <Routes>
            <Route exact path="/login" name="Login Page" element={<Login />} />
            <Route exact path="/404" name="Page 404" element={<Page404 />} />
            <Route exact path="/500" name="Page 500" element={<Page500 />} />
            <Route path="/print/receipts/:ids" name="Receipt" element={<RequireAuth><ReceiptPrint /></RequireAuth>} />
            <Route path="/print/invoice/:id" name="Invoice" element={<RequireAuth><InvoicePrint /></RequireAuth>} />
            <Route path="/print/deposit/:id" name="Deposit Receipt" element={<RequireAuth><DepositReceiptPrint /></RequireAuth>} />
            <Route path="/print/settlement/:id" name="Settlement" element={<RequireAuth><SettlementPrint /></RequireAuth>} />
            <Route path="*" name="Home" element={<RequireAuth><DefaultLayout /></RequireAuth>} />
          </Routes>
        </Suspense>
      </HashRouter>
  )
}

export default App
