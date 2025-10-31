import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUser,
  cilBuilding,
  cilCash,
  cilSettings,
  cilBell,
  cilPeople,
  cilClipboard,
  cilBarChart,
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
    component: CNavItem,
    name: 'Test',
    to: '/test',
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
        name: 'RentHistory',
        to: '/rent/RentHistory',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Maintenance',
    to: '/maintenance',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Reminders',
    to: '/reminders',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Reports',
  },
  {
    component: CNavItem,
    name: 'Reports',
    to: '/reports',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
  },
  // {
  //   component: CNavItem,
  //   name: 'Tenant',
  //   to: '/forms/operations',
  //   icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  // },
  // {
  //   component: CNavItem,
  //   name: 'Maintenance',
  //   to: '/forms/operations',
  //   icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
  // },
  // {
  //   component: CNavItem,
  //   name: 'Rent Collection',
  //   to: '/forms/operations',
  //   icon: <CIcon icon={cilBarChart} customClassName="nav-icon" />,
  // },

  // ******* Others *******
  // {
  //   component: CNavGroup,
  //   name: 'Pages',
  //   icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
  //   items: [
  //     {
  //       component: CNavItem,
  //       name: 'Login',
  //       to: '/login',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'Register',
  //       to: '/register',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'Error 404',
  //       to: '/404',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'Error 500',
  //       to: '/500',
  //     },
  //   ],
  // },
]

export default _nav
