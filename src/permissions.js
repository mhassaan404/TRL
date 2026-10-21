// What a staff user may open and do. Same list as the API (TRL_API/Helpers/Permissions.cs), which checks every action;
// here it only decides what is shown. The Super Admin always has everything.
//   "<page>:view" / "<page>:edit" (edit includes view), "action:<name>" for risky actions inside pages.

// Pages in menu order. edit: the page has an Edit level. paths: the app addresses that belong to the page.
export const PAGES = [
  { key: 'dashboard', label: 'Dashboard', group: 'General', paths: ['/dashboard'] },
  { key: 'tenants', label: 'Tenants', group: 'Operations', edit: true, paths: ['/tenants'] },
  {
    key: 'properties',
    label: 'Buildings & Units',
    group: 'Operations',
    edit: true,
    paths: ['/properties'],
  },
  {
    key: 'occupancy',
    label: 'Unit Occupancy',
    group: 'Operations',
    paths: ['/properties/propertydashboard'],
  },
  {
    key: 'rentCollection',
    label: 'Rent Collection',
    group: 'Rent',
    edit: true,
    paths: ['/rent/rentcollection'],
  },
  {
    key: 'rentHistory',
    label: 'Rent History',
    group: 'Rent',
    edit: true,
    paths: ['/rent/renthistory'],
  },
  { key: 'payments', label: 'Payment Records', group: 'Rent', paths: ['/rent/payments'] },
  {
    key: 'leases',
    label: 'Lease Management',
    group: 'Rent',
    edit: true,
    paths: ['/rent/leasemanagement'],
  },
  {
    key: 'deposits',
    label: 'Security Deposits',
    group: 'Rent',
    edit: true,
    paths: ['/rent/deposits'],
  },
  {
    key: 'settlements',
    label: 'Move-out Settlements',
    group: 'Rent',
    edit: true,
    paths: ['/rent/settlements'],
  },
  { key: 'reminders', label: 'Reminders', group: 'Operations', paths: ['/rent/reminders'] },
  {
    key: 'maintenance',
    label: 'Maintenance',
    group: 'Operations',
    edit: true,
    paths: ['/maintenance'],
  },
  {
    key: 'arrearsReport',
    label: 'Arrears Ageing',
    group: 'Reports',
    paths: ['/reports/arrears-ageing'],
  },
  {
    key: 'collectionsReport',
    label: 'Collections',
    group: 'Reports',
    paths: ['/reports/collections'],
  },
  {
    key: 'statementReport',
    label: 'Tenant Statement',
    group: 'Reports',
    paths: ['/reports/tenant-statement'],
  },
  {
    key: 'billingReport',
    label: 'Billing vs Collection',
    group: 'Reports',
    paths: ['/reports/billing-vs-collection'],
  },
  {
    key: 'rentRollReport',
    label: 'Occupancy / Rent Roll',
    group: 'Reports',
    paths: ['/reports/rent-roll'],
  },
  {
    key: 'maintenanceCostReport',
    label: 'Maintenance Cost',
    group: 'Reports',
    paths: ['/reports/maintenance-cost'],
  },
  {
    key: 'companyProfile',
    label: 'Company Profile',
    group: 'Administration',
    edit: true,
    paths: ['/settings/company-profile'],
  },
  {
    key: 'lateFeeSettings',
    label: 'Late Fee Settings',
    group: 'Administration',
    edit: true,
    paths: ['/settings/late-fee'],
  },
]

// Risky actions, ticked separately (the page's Edit is needed too)
export const ACTIONS = [
  { key: 'action:reversePayment', label: 'Reverse a payment', hint: 'Rent History' },
  { key: 'action:lateFee', label: 'Charge or waive a late fee', hint: 'Rent Collection' },
  { key: 'action:discount', label: 'Give a discount on a payment', hint: 'Rent Collection' },
  {
    key: 'action:deleteCancel',
    label: 'Delete or cancel',
    hint: 'Tenants, buildings/floors/units, invoices, leases, renewals',
  },
  { key: 'action:endLease', label: 'End a lease early (move-out)', hint: 'Lease Management' },
]

export const viewOf = (page) => `${page}:view`
export const editOf = (page) => `${page}:edit`

// Does the access (from login / Auth/me) allow this permission? "<page>:view" is allowed by "<page>:edit" too.
export const can = (access, permission) => {
  if (!access) return false
  if (access.isSuperAdmin) return true
  const list = access.permissions || []
  if (list.includes(permission)) return true
  return permission.endsWith(':view') && list.includes(permission.replace(/:view$/, ':edit'))
}

export const canView = (access, page) => can(access, viewOf(page))
export const canEdit = (access, page) => can(access, editOf(page))

// The page an app address belongs to (null: open to every signed-in user, e.g. Change Password)
export const pageOfPath = (path) => {
  const p = String(path || '').toLowerCase()
  const match = PAGES.filter((pg) => pg.paths.some((x) => p === x || p.startsWith(`${x}/`)))
  // the most specific address wins (/properties/propertydashboard is Unit Occupancy, not Buildings & Units)
  return match.sort((a, b) => longest(b) - longest(a))[0]?.key ?? null
  function longest(pg) {
    return Math.max(
      ...pg.paths.filter((x) => p === x || p.startsWith(`${x}/`)).map((x) => x.length),
    )
  }
}

// Where to go after login / from "/": the dashboard, or the user's first allowed page (null: nothing allowed yet)
export const firstAllowedPath = (access) => {
  const page = PAGES.find((pg) => canView(access, pg.key))
  return page ? page.paths[0] : null
}

// The menu (src/_nav.js) for this access: links the user can't open removed, then empty groups and section titles
// (a title is an item without `to` or `items`). `superAdmin: true` marks Super-Admin-only links.
export const filterNav = (items, access) => {
  const allowed = (item) => {
    if (item.superAdmin) return !!access?.isSuperAdmin
    const page = pageOfPath(item.to)
    return page ? canView(access, page) : true
  }
  const strip = ({ superAdmin, ...rest }) => rest
  const kept = []
  for (const item of items) {
    if (item.items) {
      const children = item.items.filter((c) => c.to && allowed(c)).map(strip)
      if (children.length) kept.push({ ...strip(item), items: children })
    } else if (item.to) {
      if (allowed(item)) kept.push(strip(item))
    } else {
      kept.push(item) // a section title: kept only if something follows it (below)
    }
  }
  return kept.filter(
    (item, i) => item.to || item.items || (kept[i + 1] && (kept[i + 1].to || kept[i + 1].items)),
  )
}
