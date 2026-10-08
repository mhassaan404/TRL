import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Tenants = React.lazy(() => import('./views/tenants/Tenants'))
const Properties = React.lazy(() => import('./views/properties/Properties'))
const PropertyDashboard = React.lazy(() => import('./views/properties/PropertyDashboard'))
const RentCollection = React.lazy(() => import('./views/rent/RentCollection'))
const RentHistory = React.lazy(() => import('./views/rent/RentHistory'))
const Payments = React.lazy(() => import('./views/rent/Payments'))
const Reminders = React.lazy(() => import('./views/rent/Reminders'))
const MaintenanceJobs = React.lazy(() => import('./views/maintenance/MaintenanceJobs'))
const LeaseManagement = React.lazy(() => import('./views/rent/LeaseManagement.page'))
const LateFeeSettings = React.lazy(() => import('./views/settings/LateFeeSettings'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/tenants', name: 'Tenants', element: Tenants },
  { path: '/properties', name: 'Buildings & Units', element: Properties },
  { path: '/properties/propertyDashboard', name: 'Unit Occupancy', element: PropertyDashboard },
  { path: '/rent/rentcollection', name: 'RentCollection', element: RentCollection },
  { path: '/rent/renthistory', name: 'RentHistory', element: RentHistory },
  { path: '/rent/payments', name: 'Payments', element: Payments },
  { path: '/rent/reminders', name: 'Reminders', element: Reminders },
  { path: '/maintenance', name: 'Maintenance', element: MaintenanceJobs },
  { path: '/rent/leasemanagement', name: 'LeaseManagement', element: LeaseManagement },
  { path: '/settings/late-fee', name: 'Late Fee Settings', element: LateFeeSettings },
]

export default routes
