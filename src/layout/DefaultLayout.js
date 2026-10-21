import React, { useEffect } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import TopProgress from '../components/TopProgress'
import { preloadRoutes } from '../routes'
import { shouldPreloadPages } from '../utils/network'
import { refreshAccess } from '../access'

const DefaultLayout = () => {
  // The user's current access (pages and actions): asked when the app opens and when the window is used again, so
  // changes on the Users page show without logging out
  useEffect(() => {
    refreshAccess(true)
    const onFocus = () => refreshAccess()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

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
