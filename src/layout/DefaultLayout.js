import React, { useEffect } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import TopProgress from '../components/TopProgress'
import { preloadRoutes } from '../routes'
import { shouldPreloadPages } from '../utils/network'

const DefaultLayout = () => {
  // Fetch the other pages' code once the current page has loaded, so menu items open without a wait.
  // Skipped on slow / data-saving connections: there the page being opened gets all the bandwidth.
  useEffect(() => {
    if (!shouldPreloadPages()) return undefined
    const t = setTimeout(preloadRoutes, 3000)
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
