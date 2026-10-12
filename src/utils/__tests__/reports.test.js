// Report helpers: Arrears Ageing, Billing vs Collection, Occupancy / Rent Roll, Maintenance Cost
import { describe, expect, test } from 'vitest'
import { bucketOf, groupArrears, totalsOf as arrearsTotals } from '../arrears'
import { collectionRate, monthCount, monthPresetRange, totalsOf as billingTotals } from '../billing'
import { byBuilding, daysBetween, daysToExpiry, leaseStateOf, summarize } from '../rentRoll'
import { groupJobs, isOpenJob, totalsOf as costTotals } from '../maintenanceCost'

describe('arrears ageing', () => {
  test.each([
    [-5, 'current'],
    [0, 'current'],
    [1, 'd30'],
    [30, 'd30'],
    [31, 'd60'],
    [60, 'd60'],
    [61, 'd90'],
    [90, 'd90'],
    [91, 'd90plus'],
    [400, 'd90plus'],
  ])('day %i -> %s', (d, b) => expect(bucketOf(d)).toBe(b))

  test('groups per tenant; credits are shown apart and taken off net', () => {
    const groups = groupArrears([
      {
        tenantId: 1,
        tenantName: 'A',
        buildingName: 'T',
        unitNumber: '1',
        owed: 1000,
        daysOverdue: 10,
      },
      {
        tenantId: 1,
        tenantName: 'A',
        buildingName: 'T',
        unitNumber: '1',
        owed: 500,
        daysOverdue: 95,
      },
      {
        tenantId: 1,
        tenantName: 'A',
        buildingName: 'T',
        unitNumber: '2',
        owed: -200,
        daysOverdue: 200,
      },
      { tenantId: 2, tenantName: 'B', owed: 300, daysOverdue: 0 },
    ])
    const a = groups.find((g) => g.tenantId === 1)
    expect(a).toMatchObject({
      d30: 1000,
      d90plus: 500,
      total: 1500,
      credit: 200,
      net: 1300,
      oldestDays: 95,
    })
    expect([...a.units]).toEqual(['T – 1', 'T – 2'])
    expect(arrearsTotals(groups)).toMatchObject({
      current: 300,
      d30: 1000,
      d90plus: 500,
      total: 1800,
      credit: 200,
      net: 1600,
    })
  })
})

describe('billing vs collection', () => {
  test('month presets', () => {
    expect(monthPresetRange('This Year', '2026-10-09')).toEqual({ from: '2026-01', to: '2026-10' })
    expect(monthPresetRange('Last Year', '2026-10-09')).toEqual({ from: '2025-01', to: '2025-12' })
    expect(monthPresetRange('Last 12 Months', '2026-10-09')).toEqual({
      from: '2025-11',
      to: '2026-10',
    })
    expect(monthPresetRange('Last 6 Months', '2026-03-09')).toEqual({
      from: '2025-10',
      to: '2026-03',
    })
    expect(monthPresetRange('x', '2026-03-09')).toBeNull()
  })
  test('month count', () => {
    expect(monthCount('2025-11', '2026-10')).toBe(12)
    expect(monthCount('2026-10', '2026-01')).toBe(0)
    expect(monthCount('', '2026-01')).toBe(0)
  })
  test('collection rate of what was due after discounts', () => {
    expect(collectionRate({ totalBilled: 100000, discounts: 20000, collected: 60000 })).toBe(75)
    expect(collectionRate({ totalBilled: 0, discounts: 0, collected: 0 })).toBeNull()
  })
  test('totals', () => {
    expect(
      billingTotals([
        { collected: 1.1, invoices: 2 },
        { collected: 2.2, invoices: 1, cashReceived: -5 },
      ]),
    ).toMatchObject({
      collected: 3.3,
      invoices: 3,
      cashReceived: -5,
      discounts: 0,
    })
  })
})

describe('occupancy / rent roll', () => {
  const today = '2026-10-09'
  test('days between', () => {
    expect(daysBetween('2026-10-09', '2026-11-08')).toBe(30)
    expect(daysBetween('2026-10-09T00:00:00', '2026-10-01')).toBe(-8)
  })
  test('lease state', () => {
    expect(leaseStateOf({ leaseId: 1, leaseIsActive: true, endDate: '2027-01-01' }, today)).toBe(
      'Active',
    )
    expect(leaseStateOf({ leaseId: 1, leaseIsActive: true, endDate: '2026-10-01' }, today)).toBe(
      'Holdover',
    )
    expect(leaseStateOf({ leaseId: 1, leaseIsActive: false }, today)).toBe('Renewed')
    expect(leaseStateOf({ tenantName: 'X' }, today)).toBe('No lease')
    expect(leaseStateOf({ nextLeaseId: 3 }, today)).toBe('Booked')
    expect(leaseStateOf({}, today)).toBe('')
  })
  test('days to expiry only for active leases without a booked next term', () => {
    expect(daysToExpiry({ leaseId: 1, leaseIsActive: true, endDate: '2026-10-19' }, today)).toBe(10)
    expect(
      daysToExpiry(
        { leaseId: 1, leaseIsActive: true, endDate: '2026-10-19', nextLeaseId: 2 },
        today,
      ),
    ).toBeNull()
    expect(
      daysToExpiry({ leaseId: 1, leaseIsActive: false, endDate: '2026-10-19' }, today),
    ).toBeNull()
  })
  test('summary and per building', () => {
    const rows = [
      {
        buildingName: 'B',
        isOccupied: true,
        leaseId: 1,
        leaseIsActive: true,
        endDate: '2026-10-19',
        baseRent: 100,
        currentRent: 90,
        arrears: 50,
      },
      { buildingName: 'B', isOccupied: false, baseRent: 100 },
      { buildingName: 'A', isOccupied: false, markedStatus: 'Under Maintenance', baseRent: 50 },
      {
        buildingName: 'A',
        isOccupied: true,
        leaseId: 2,
        leaseIsActive: true,
        endDate: '2026-09-01',
        baseRent: 50,
        currentRent: 50,
      },
    ]
    expect(summarize(rows, today)).toMatchObject({
      units: 4,
      occupied: 2,
      available: 1,
      maintenance: 1,
      potentialRent: 300,
      contractedRent: 140,
      vacancyLoss: 150,
      arrears: 50,
      holdover: 1,
      ends30: 1,
      ends90: 1,
      occupancy: 50,
      economicOccupancy: 46.67,
    })
    expect(byBuilding(rows, today).map((b) => [b.buildingName, b.units])).toEqual([
      ['A', 2],
      ['B', 2],
    ])
    expect(summarize([], today)).toMatchObject({
      units: 0,
      occupancy: null,
      economicOccupancy: null,
    })
  })
})

describe('maintenance cost', () => {
  const jobs = [
    {
      status: 'Completed',
      cost: 1000,
      billed: 400,
      recovered: 200,
      daysToComplete: 2,
      category: 'AC',
      buildingName: 'A',
      jobDate: '2026-09-03',
    },
    {
      status: 'Completed',
      cost: null,
      daysToComplete: 4,
      category: 'AC',
      buildingName: 'A',
      jobDate: '2026-10-01',
    },
    {
      status: 'In Progress',
      cost: 300,
      category: 'Plumbing',
      buildingName: 'B',
      unitNumber: '7',
      jobDate: '2026-10-02',
    },
    { status: 'Cancelled', cost: 999, category: 'Other', buildingName: 'B', jobDate: '2026-10-02' },
  ]
  test('cancelled jobs cost nothing; net = cost - billed', () => {
    expect(isOpenJob(jobs[2])).toBe(true)
    expect(costTotals(jobs)).toMatchObject({
      jobs: 4,
      completed: 2,
      open: 1,
      cancelled: 1,
      spent: 1000,
      openCost: 300,
      cost: 1300,
      billed: 400,
      recovered: 200,
      net: 900,
      noCost: 1,
      avgDays: 3,
    })
    expect(costTotals([]).avgDays).toBeNull()
  })
  test('grouping', () => {
    expect(groupJobs(jobs, 'Month').map((g) => g.label)).toEqual(['Sep 2026', 'Oct 2026'])
    expect(groupJobs(jobs, 'Category')[0].key).toBe('AC')
    expect(
      groupJobs(jobs, 'Unit')
        .map((g) => g.key)
        .sort(),
    ).toEqual(['A (building)', 'B (building)', 'B – 7'])
  })
})
