import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Test = React.lazy(() => import('./views/dashboard/Test'))
const Tenants = React.lazy(() => import('./views/tenants/Tenants'))
const Properties = React.lazy(() => import('./views/properties/Properties'))
const PropertyDashboard = React.lazy(() => import('./views/properties/PropertyDashboard'))
const RentCollection = React.lazy(() => import('./views/rent/RentCollection'))
const Invoices = React.lazy(() => import('./views/rent/Invoices'))
const RentHistory = React.lazy(() => import('./views/rent/RentHistory'))
const Maintenance = React.lazy(() => import('./views/maintenance/Maintenance'))
const Reminders = React.lazy(() => import('./views/reminders/Reminders'))
const Reports = React.lazy(() => import('./views/reports/Reports'))

const Charts = React.lazy(() => import('./views/charts/Charts'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/test', name: 'Test', element: Test },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/tenants', name: 'Tenants', element: Tenants },
  { path: '/properties', name: 'Properties', element: Properties },
  { path: '/properties/propertyDashboard', name: 'PropertyDashboard', element: PropertyDashboard },
  { path: '/rent/rentcollection', name: 'RentCollection', element: RentCollection },
  { path: '/rent/invoices', name: 'Invoices', element: Invoices },
  { path: '/rent/renthistory', name: 'RentHistory', element: RentHistory },
  { path: '/maintenance', name: 'Maintenance', element: Maintenance },
  { path: '/reminders', name: 'Reminders', element: Reminders },
  { path: '/reports', name: 'Reports', element: Reports },
]

export default routes