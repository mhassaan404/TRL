import React, { useEffect } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import TopProgress from '../components/TopProgress'
import { preloadRoutes } from '../routes'

const DefaultLayout = () => {
  // Fetch the other pages' code once the current page has loaded, so menu items open without a wait
  useEffect(() => {
    const t = setTimeout(preloadRoutes, 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div>
      <TopProgress />
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
