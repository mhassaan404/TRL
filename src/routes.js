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
const ArrearsAgeing = React.lazy(() => import('./views/reports/ArrearsAgeing'))
const Collections = React.lazy(() => import('./views/reports/Collections'))
const TenantStatement = React.lazy(() => import('./views/reports/TenantStatement'))
const BillingVsCollection = React.lazy(() => import('./views/reports/BillingVsCollection'))
const RentRoll = React.lazy(() => import('./views/reports/RentRoll'))
const MaintenanceCost = React.lazy(() => import('./views/reports/MaintenanceCost'))
const CompanyProfile = React.lazy(() => import('./views/settings/CompanyProfile'))
const SecurityDeposits = React.lazy(() => import('./views/rent/SecurityDeposits'))
const MoveOutSettlements = React.lazy(() => import('./views/rent/MoveOutSettlements'))
const SettlementForm = React.lazy(() => import('./views/rent/SettlementForm'))
const ChangePassword = React.lazy(() => import('./views/account/ChangePassword'))
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
  { path: '/reports/arrears-ageing', name: 'Arrears Ageing', element: ArrearsAgeing },
  { path: '/reports/collections', name: 'Collections', element: Collections },
  { path: '/reports/tenant-statement', name: 'Tenant Statement', element: TenantStatement },
  { path: '/reports/billing-vs-collection', name: 'Billing vs Collection', element: BillingVsCollection },
  { path: '/reports/rent-roll', name: 'Occupancy / Rent Roll', element: RentRoll },
  { path: '/reports/maintenance-cost', name: 'Maintenance Cost', element: MaintenanceCost },
  { path: '/rent/deposits', name: 'Security Deposits', element: SecurityDeposits },
  { path: '/rent/settlements', name: 'Move-out Settlements', element: MoveOutSettlements },
  { path: '/rent/settlements/new/:tenantId/:unitId', name: 'Settle Tenancy', element: SettlementForm },
  { path: '/account/change-password', name: 'Change Password', element: ChangePassword },
  { path: '/settings/company-profile', name: 'Company Profile', element: CompanyProfile },
  { path: '/settings/late-fee', name: 'Late Fee Settings', element: LateFeeSettings },
]

export default routes
