import React from 'react'

// A lazily loaded page that can also be fetched ahead of time (preloadRoutes)
const lazyPage = (load) => Object.assign(React.lazy(load), { preload: load })

const Dashboard = lazyPage(() => import('./views/dashboard/Dashboard'))
const Tenants = lazyPage(() => import('./views/tenants/Tenants'))
const Properties = lazyPage(() => import('./views/properties/Properties'))
const PropertyDashboard = lazyPage(() => import('./views/properties/PropertyDashboard'))
const RentCollection = lazyPage(() => import('./views/rent/RentCollection'))
const RentHistory = lazyPage(() => import('./views/rent/RentHistory'))
const Payments = lazyPage(() => import('./views/rent/Payments'))
const Reminders = lazyPage(() => import('./views/rent/Reminders'))
const MaintenanceJobs = lazyPage(() => import('./views/maintenance/MaintenanceJobs'))
const LeaseManagement = lazyPage(() => import('./views/rent/LeaseManagement.page'))
const ArrearsAgeing = lazyPage(() => import('./views/reports/ArrearsAgeing'))
const Collections = lazyPage(() => import('./views/reports/Collections'))
const TenantStatement = lazyPage(() => import('./views/reports/TenantStatement'))
const BillingVsCollection = lazyPage(() => import('./views/reports/BillingVsCollection'))
const RentRoll = lazyPage(() => import('./views/reports/RentRoll'))
const MaintenanceCost = lazyPage(() => import('./views/reports/MaintenanceCost'))
const CompanyProfile = lazyPage(() => import('./views/settings/CompanyProfile'))
const SecurityDeposits = lazyPage(() => import('./views/rent/SecurityDeposits'))
const MoveOutSettlements = lazyPage(() => import('./views/rent/MoveOutSettlements'))
const SettlementForm = lazyPage(() => import('./views/rent/SettlementForm'))
const ChangePassword = lazyPage(() => import('./views/account/ChangePassword'))
const LateFeeSettings = lazyPage(() => import('./views/settings/LateFeeSettings'))

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
  {
    path: '/reports/billing-vs-collection',
    name: 'Billing vs Collection',
    element: BillingVsCollection,
  },
  { path: '/reports/rent-roll', name: 'Occupancy / Rent Roll', element: RentRoll },
  { path: '/reports/maintenance-cost', name: 'Maintenance Cost', element: MaintenanceCost },
  { path: '/rent/deposits', name: 'Security Deposits', element: SecurityDeposits },
  { path: '/rent/settlements', name: 'Move-out Settlements', element: MoveOutSettlements },
  {
    path: '/rent/settlements/new/:tenantId/:unitId',
    name: 'Settle Tenancy',
    element: SettlementForm,
  },
  { path: '/account/change-password', name: 'Change Password', element: ChangePassword },
  { path: '/settings/company-profile', name: 'Company Profile', element: CompanyProfile },
  { path: '/settings/late-fee', name: 'Late Fee Settings', element: LateFeeSettings },
]

// Download every page in the background (after login), so opening a menu item is instant
export const preloadRoutes = () => routes.forEach((r) => r.element?.preload?.().catch(() => {}))

export default routes
