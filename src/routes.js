import React from 'react'

// Mock pages (views/rent/Invoices, maintenance, reminders, reports, charts) are kept on disk but not routed:
// they only show sample data and have no API behind them yet.
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Tenants = React.lazy(() => import('./views/tenants/Tenants'))
const Properties = React.lazy(() => import('./views/properties/Properties'))
const PropertyDashboard = React.lazy(() => import('./views/properties/PropertyDashboard'))
const RentCollection = React.lazy(() => import('./views/rent/RentCollection'))
const RentHistory = React.lazy(() => import('./views/rent/RentHistory'))
const Payments = React.lazy(() => import('./views/rent/Payments'))
const LeaseManagement = React.lazy(() => import('./views/rent/LeaseManagement.page'))
const LateFeeSettings = React.lazy(() => import('./views/settings/LateFeeSettings'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/tenants', name: 'Tenants', element: Tenants },
  { path: '/properties', name: 'Properties', element: Properties },
  { path: '/properties/propertyDashboard', name: 'PropertyDashboard', element: PropertyDashboard },
  { path: '/rent/rentcollection', name: 'RentCollection', element: RentCollection },
  { path: '/rent/renthistory', name: 'RentHistory', element: RentHistory },
  { path: '/rent/payments', name: 'Payments', element: Payments },
  { path: '/rent/leasemanagement', name: 'LeaseManagement', element: LeaseManagement },
  { path: '/settings/late-fee', name: 'Late Fee Settings', element: LateFeeSettings },
]

export default routes
