import { describe, expect, it } from 'vitest'
import {
  ACTIONS,
  PAGES,
  can,
  canEdit,
  canView,
  filterNav,
  firstAllowedPath,
  pageOfPath,
} from '../../permissions'
import routes from '../../routes'

const staff = (permissions) => ({ isSuperAdmin: false, permissions })
const admin = { isSuperAdmin: true, permissions: [] }

describe('can', () => {
  it('gives the Super Admin everything', () => {
    expect(can(admin, 'action:reversePayment')).toBe(true)
    expect(canEdit(admin, 'tenants')).toBe(true)
  })

  it('lets edit include view, but not the other way round', () => {
    const a = staff(['tenants:edit', 'collectionsReport:view'])
    expect(canView(a, 'tenants')).toBe(true)
    expect(canEdit(a, 'tenants')).toBe(true)
    expect(canView(a, 'collectionsReport')).toBe(true)
    expect(canEdit(a, 'collectionsReport')).toBe(false)
    expect(canView(a, 'leases')).toBe(false)
  })

  it('needs each risky action ticked on its own', () => {
    const a = staff(['rentCollection:edit'])
    expect(can(a, 'action:discount')).toBe(false)
    expect(can(staff(['action:discount']), 'action:discount')).toBe(true)
  })

  it('allows nothing without access', () => {
    expect(can(null, 'dashboard:view')).toBe(false)
    expect(canView(staff([]), 'dashboard')).toBe(false)
  })
})

describe('pages and routes', () => {
  it('matches the API list of keys and actions', () => {
    expect(PAGES.map((p) => p.key)).toEqual([
      'dashboard',
      'tenants',
      'properties',
      'occupancy',
      'rentCollection',
      'rentHistory',
      'leases',
      'deposits',
      'settlements',
      'reminders',
      'maintenance',
      'arrearsReport',
      'collectionsReport',
      'statementReport',
      'billingReport',
      'rentRollReport',
      'maintenanceCostReport',
      'companyProfile',
      'lateFeeSettings',
    ])
    expect(PAGES.filter((p) => p.edit).map((p) => p.key)).toEqual([
      'tenants',
      'properties',
      'rentCollection',
      'rentHistory',
      'leases',
      'deposits',
      'settlements',
      'maintenance',
      'companyProfile',
      'lateFeeSettings',
    ])
    expect(ACTIONS.map((a) => a.key)).toEqual([
      'action:reversePayment',
      'action:lateFee',
      'action:discount',
      'action:deleteCancel',
      'action:endLease',
    ])
  })

  it('gives every app page a permission, except Change Password (all users) and Users (Super Admin)', () => {
    const open = routes.filter((r) => r.element && !r.page && !r.superAdmin).map((r) => r.path)
    expect(open).toEqual(['/account/change-password'])
    expect(routes.find((r) => r.path === '/settings/users').superAdmin).toBe(true)
    for (const r of routes.filter((x) => x.page)) {
      expect(PAGES.some((p) => p.key === r.page)).toBe(true)
      // the route's address belongs to the same page (so the menu and the guard agree)
      expect(pageOfPath(r.path.replace(/\/:.*$/, ''))).toBe(r.page)
    }
  })

  it('has no Payment Records page any more (merged into Collections)', () => {
    expect(PAGES.some((p) => p.key === 'payments')).toBe(false)
    expect(routes.some((r) => r.path.toLowerCase() === '/rent/payments')).toBe(false)
    expect(pageOfPath('/rent/payments')).toBe(null)
  })

  it('finds the most specific page of an address', () => {
    expect(pageOfPath('/properties')).toBe('properties')
    expect(pageOfPath('/properties/PropertyDashboard')).toBe('occupancy')
    expect(pageOfPath('/rent/settlements/new/3/4')).toBe('settlements')
    expect(pageOfPath('/account/change-password')).toBe(null)
  })

  it('starts on the dashboard, or the first allowed page', () => {
    expect(firstAllowedPath(admin)).toBe('/dashboard')
    expect(firstAllowedPath(staff(['collectionsReport:view', 'tenants:view']))).toBe('/tenants')
    expect(firstAllowedPath(staff([]))).toBe(null)
  })
})

describe('filterNav', () => {
  const nav = [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Operations' },
    { name: 'Tenants', to: '/tenants' },
    {
      name: 'Rent',
      items: [
        { name: 'Rent Collection', to: '/rent/RentCollection' },
        { name: 'Rent History', to: '/rent/RentHistory' },
      ],
    },
    { name: 'Administration' },
    { name: 'Late Fee Settings', to: '/settings/late-fee' },
    { name: 'Users', to: '/settings/users', superAdmin: true },
  ]

  it('shows everything to the Super Admin, without the superAdmin flag', () => {
    const items = filterNav(nav, admin)
    expect(items.map((i) => i.name)).toEqual(nav.map((i) => i.name))
    expect(items.some((i) => 'superAdmin' in i)).toBe(false)
  })

  it('keeps only allowed links and drops empty groups and titles', () => {
    const items = filterNav(nav, staff(['tenants:view', 'rentHistory:view']))
    expect(items.map((i) => i.name)).toEqual(['Operations', 'Tenants', 'Rent'])
    expect(items[2].items.map((i) => i.name)).toEqual(['Rent History'])
  })

  it('shows nothing when nothing is allowed', () => {
    expect(filterNav(nav, staff([]))).toEqual([])
  })
})
