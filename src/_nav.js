import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUser,
  cilBuilding,
  cilCash,
  cilSettings,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
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
    component: CNavItem,
    name: 'Properties',
    to: '/properties',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Properties',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Property Dashboard',
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
