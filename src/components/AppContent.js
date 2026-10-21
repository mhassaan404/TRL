import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CCard, CCardBody, CContainer, CSpinner } from '@coreui/react'

// routes config
import routes from '../routes'
import { useAccess } from '../access'
import { firstAllowedPath } from '../permissions'

const Waiting = () => (
  <div className="d-flex align-items-center justify-content-center gap-2 py-5 text-body-secondary">
    <CSpinner color="primary" size="sm" />
    Loading…
  </div>
)

const NoAccess = ({ none }) => (
  <CCard className="mb-4">
    <CCardBody className="text-center py-5">
      <h5 className="mb-2">
        {none ? 'No pages assigned yet' : "You don't have access to this page"}
      </h5>
      <div className="text-body-secondary">
        {none
          ? 'Ask your administrator to give you access to the pages you need.'
          : 'Ask your administrator if you need it.'}
      </div>
    </CCardBody>
  </CCard>
)

// A page opens only when the user's access allows it (the server checks every action anyway)
const Guarded = ({ route }) => {
  const { access, isSuperAdmin, canView, canEdit } = useAccess()
  if (!access) return <Waiting /> // first visit after an update: the access is being fetched
  if (route.superAdmin && !isSuperAdmin) return <NoAccess />
  if (route.page && !(route.edit ? canEdit(route.page) : canView(route.page))) return <NoAccess />
  return <route.element />
}

// "/": the dashboard, or the user's first permitted page
const Home = () => {
  const { access } = useAccess()
  if (!access) return <Waiting />
  const to = firstAllowedPath(access)
  return to ? <Navigate to={to} replace /> : <NoAccess none />
}

const AppContent = () => {
  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<Waiting />}>
        <Routes>
          {routes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<Guarded route={route} />}
                />
              )
            )
          })}
          <Route path="/" element={<Home />} />
          {/* Any other address inside the app: the Not Found page instead of an empty screen */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
