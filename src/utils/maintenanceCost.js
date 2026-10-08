// Maintenance Cost report: totals and grouping of maintenance jobs.
// Self-contained (no React or API imports) so the rules are easy to test.
//  - Cost counts jobs that are not cancelled: Completed = money spent, Open / In Progress = cost entered so far
//  - Billed / Recovered = the job's charge invoice (not cancelled) and what the tenant has paid on it
//  - Net Cost = Cost - Billed (what the owner carries)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const num = (v) => Number(v) || 0
const round2 = (v) => Math.round(v * 100) / 100
const day = (d) => String(d || '').slice(0, 10)

export const isOpenJob = (j) => j.status === 'Open' || j.status === 'In Progress'

export const totalsOf = (jobs) => {
  const t = {
    jobs: jobs.length, completed: 0, open: 0, cancelled: 0,
    spent: 0, openCost: 0, cost: 0, billed: 0, recovered: 0, net: 0,
    noCost: 0, daysTotal: 0, daysCount: 0, avgDays: null,
  }
  jobs.forEach((j) => {
    if (j.status === 'Cancelled') t.cancelled += 1
    else if (j.status === 'Completed') {
      t.completed += 1
      t.spent = round2(t.spent + num(j.cost))
      if (j.cost == null) t.noCost += 1
      if (j.daysToComplete != null) { t.daysTotal += num(j.daysToComplete); t.daysCount += 1 }
    } else {
      t.open += 1
      t.openCost = round2(t.openCost + num(j.cost))
    }
    t.billed = round2(t.billed + num(j.billed))
    t.recovered = round2(t.recovered + num(j.recovered))
  })
  t.cost = round2(t.spent + t.openCost)
  t.net = round2(t.cost - t.billed)
  t.avgDays = t.daysCount ? round2(t.daysTotal / t.daysCount) : null
  return t
}

const unitLabel = (j) => (j.unitNumber ? `${j.buildingName} – ${j.unitNumber}` : `${j.buildingName} (building)`)

export const GROUP_BY = {
  Category: { key: (j) => j.category || 'Other', label: (k) => k },
  Building: { key: (j) => j.buildingName || '—', label: (k) => k },
  Unit: { key: unitLabel, label: (k) => k },
  Month: {
    key: (j) => day(j.jobDate).slice(0, 7),
    label: (k) => { const [y, m] = k.split('-'); return y && m ? `${MONTHS[Number(m) - 1]} ${y}` : k },
    sortByKey: true,
  },
  'Assigned To': { key: (j) => j.assignedTo || 'Not assigned', label: (k) => k },
}

// One row per group with the same totals; Month in date order, the others by cost (largest first)
export const groupJobs = (jobs, by) => {
  const g = GROUP_BY[by]
  const map = new Map()
  jobs.forEach((j) => {
    const k = g.key(j)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(j)
  })
  return [...map.entries()]
    .map(([k, list]) => ({ key: k, label: g.label(k), ...totalsOf(list) }))
    .sort((a, b) => (g.sortByKey ? a.key.localeCompare(b.key) : b.cost - a.cost || a.label.localeCompare(b.label)))
}
