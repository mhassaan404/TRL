import React from 'react'

// A lazily loaded page that can also be fetched ahead of time (preloadRoutes)
const lazyPage = (load) => Object.assign(React.lazy(load), { preload: load })

const Dashboard = lazyPage(() => import('./views/dashboard/Dashboard'))
const Tenants = lazyPage(() => import('./views/tenants/Tenants'))
const Properties = lazyPage(() => import('./views/properties/Properties'))
const PropertyDashboard = lazyPage(() => import('./views/properties/PropertyDashboard'))
const RentCollection = lazyPage(() => import('./views/rent/RentCollection'))
const RentHistory = lazyPage(() => import('./views/rent/RentHistory'))
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
const Users = lazyPage(() => import('./views/settings/Users'))

// page: the permission page (src/permissions.js) a user needs to open it (edit: needs its Edit level);
// superAdmin: Super Admin only; neither: any signed-in user
const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard, page: 'dashboard' },
  { path: '/tenants', name: 'Tenants', element: Tenants, page: 'tenants' },
  { path: '/properties', name: 'Buildings & Units', element: Properties, page: 'properties' },
  {
    path: '/properties/propertyDashboard',
    name: 'Unit Occupancy',
    element: PropertyDashboard,
    page: 'occupancy',
  },
  {
    path: '/rent/rentcollection',
    name: 'RentCollection',
    element: RentCollection,
    page: 'rentCollection',
  },
  { path: '/rent/renthistory', name: 'RentHistory', element: RentHistory, page: 'rentHistory' },
  { path: '/rent/reminders', name: 'Reminders', element: Reminders, page: 'reminders' },
  { path: '/maintenance', name: 'Maintenance', element: MaintenanceJobs, page: 'maintenance' },
  {
    path: '/rent/leasemanagement',
    name: 'LeaseManagement',
    element: LeaseManagement,
    page: 'leases',
  },
  {
    path: '/reports/arrears-ageing',
    name: 'Arrears Ageing',
    element: ArrearsAgeing,
    page: 'arrearsReport',
  },
  {
    path: '/reports/collections',
    name: 'Collections',
    element: Collections,
    page: 'collectionsReport',
  },
  {
    path: '/reports/tenant-statement',
    name: 'Tenant Statement',
    element: TenantStatement,
    page: 'statementReport',
  },
  {
    path: '/reports/billing-vs-collection',
    name: 'Billing vs Collection',
    element: BillingVsCollection,
    page: 'billingReport',
  },
  {
    path: '/reports/rent-roll',
    name: 'Occupancy / Rent Roll',
    element: RentRoll,
    page: 'rentRollReport',
  },
  {
    path: '/reports/maintenance-cost',
    name: 'Maintenance Cost',
    element: MaintenanceCost,
    page: 'maintenanceCostReport',
  },
  {
    path: '/rent/deposits',
    name: 'Security Deposits',
    element: SecurityDeposits,
    page: 'deposits',
  },
  {
    path: '/rent/settlements',
    name: 'Move-out Settlements',
    element: MoveOutSettlements,
    page: 'settlements',
  },
  {
    path: '/rent/settlements/new/:tenantId/:unitId',
    name: 'Settle Tenancy',
    element: SettlementForm,
    page: 'settlements',
    edit: true,
  },
  { path: '/account/change-password', name: 'Change Password', element: ChangePassword },
  {
    path: '/settings/company-profile',
    name: 'Company Profile',
    element: CompanyProfile,
    page: 'companyProfile',
  },
  {
    path: '/settings/late-fee',
    name: 'Late Fee Settings',
    element: LateFeeSettings,
    page: 'lateFeeSettings',
  },
  { path: '/settings/users', name: 'Users', element: Users, superAdmin: true },
]

// Download every page in the background (after login), so opening a menu item is instant
export const preloadRoutes = () => routes.forEach((r) => r.element?.preload?.().catch(() => {}))

// What the user sees right after logging in (the app frame, then the dashboard, then its chart), fetched while they
// type on the login page: on a slow connection the dashboard is then ready instead of a long wait after "Login".
export const preloadAfterLogin = () =>
  import('./layout/DefaultLayout')
    .then(() => Dashboard.preload())
    .then(() => import('./views/dashboard/MainChart'))
    .catch(() => {}) // a failed prefetch only means it loads normally later

export default routes
