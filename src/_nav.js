import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUser,
  cilBuilding,
  cilCash,
  cilSettings,
  cilBell,
  cilClipboard,
  cilChartLine,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Operations',
  },
  {
    component: CNavItem,
    name: 'Tenants',
    to: '/tenants',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />
  },
  {
    component: CNavGroup,
    name: 'Properties',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Buildings & Units',
        to: '/properties',
      },
      {
        component: CNavItem,
        name: 'Unit Occupancy',
        to: '/properties/PropertyDashboard',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Rent',
    icon: <CIcon icon={cilCash} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Rent Collection',
        to: '/rent/RentCollection',
      },
      {
        component: CNavItem,
        name: 'Rent History',
        to: '/rent/RentHistory',
      },
      {
        component: CNavItem,
        name: 'Payment Records',
        to: '/rent/Payments',
      },
      {
        component: CNavItem,
        name: 'Lease Management',
        to: '/rent/LeaseManagement',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Reminders',
    to: '/rent/Reminders',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Maintenance',
    to: '/maintenance',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Reports',
    to: '/reports',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Arrears Ageing',
        to: '/reports/arrears-ageing',
      },
      {
        component: CNavItem,
        name: 'Collections',
        to: '/reports/collections',
      },
      {
        component: CNavItem,
        name: 'Tenant Statement',
        to: '/reports/tenant-statement',
      },
      {
        component: CNavItem,
        name: 'Billing vs Collection',
        to: '/reports/billing-vs-collection',
      },
      {
        component: CNavItem,
        name: 'Occupancy / Rent Roll',
        to: '/reports/rent-roll',
      },
      {
        component: CNavItem,
        name: 'Maintenance Cost',
        to: '/reports/maintenance-cost',
      },
    ],
  },
  {
    component: CNavTitle,
    name: 'Administration',
  },
  {
    component: CNavItem,
    name: 'Late Fee Settings',
    to: '/settings/late-fee',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]

export default _nav
