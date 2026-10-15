import { describe, expect, it } from 'vitest'
import {
  chartSeries,
  inBuilding,
  kpis,
  leasesEndingSoon,
  monthName,
  recentPayments,
  shiftMonth,
  topOverdue,
} from '../dashboard'

const today = '2026-10-13'
// Billing vs Collection rows (one per month)
const bvc = [
  {
    monthStart: '2026-10-01T00:00:00',
    totalBilled: 80000,
    collected: 60000,
    outstanding: 20000,
    cashReceived: 17000,
  },
  {
    monthStart: '2026-09-01T00:00:00',
    totalBilled: 50000,
    collected: 50000,
    outstanding: 0,
    cashReceived: 52000,
  },
]
const arrears = [
  {
    tenantId: 1,
    tenantName: 'A',
    buildingName: 'B1',
    unitNumber: '101',
    owed: 20000,
    daysOverdue: 40,
  },
  {
    tenantId: 1,
    tenantName: 'A',
    buildingName: 'B1',
    unitNumber: '101',
    owed: 5000,
    daysOverdue: 0,
  },
  {
    tenantId: 2,
    tenantName: 'B',
    buildingName: 'B1',
    unitNumber: '102',
    owed: 30000,
    daysOverdue: 0,
  }, // not due yet
  {
    tenantId: 3,
    tenantName: 'C',
    buildingName: 'B2',
    unitNumber: '201',
    owed: 9000,
    daysOverdue: 5,
  },
  {
    tenantId: 4,
    tenantName: 'D',
    buildingName: 'B2',
    unitNumber: '202',
    owed: -1000,
    daysOverdue: 10,
  }, // credit
]
const unit = (o) => ({
  unitNumber: 'U',
  buildingName: 'B1',
  baseRent: 10000,
  markedStatus: 'Available',
  isOccupied: false,
  ...o,
})
const roll = [
  unit({
    unitNumber: '101',
    isOccupied: true,
    leaseId: 1,
    leaseIsActive: true,
    tenantName: 'A',
    endDate: '2026-11-01',
  }),
  unit({
    unitNumber: '102',
    isOccupied: true,
    leaseId: 2,
    leaseIsActive: true,
    tenantName: 'B',
    endDate: '2026-10-01',
  }),
  unit({
    unitNumber: '103',
    isOccupied: true,
    leaseId: 3,
    leaseIsActive: true,
    tenantName: 'C',
    endDate: '2027-06-01',
  }),
  unit({
    unitNumber: '104',
    isOccupied: true,
    leaseId: 4,
    leaseIsActive: true,
    tenantName: 'E',
    endDate: '2026-11-20',
    nextLeaseId: 9,
  }),
  unit({ unitNumber: '105' }),
]
const payments = [
  { paymentId: 1, paymentDate: '2026-10-02', amount: 10000, tenantId: 1 },
  { paymentId: 2, paymentDate: '2026-10-05', amount: 5000, tenantId: 2, reversedByPaymentId: 3 },
  { paymentId: 3, paymentDate: '2026-10-06', amount: -5000, tenantId: 2, reversalOfPaymentId: 2 },
  { paymentId: 4, paymentDate: '2026-10-09', amount: 7000, tenantId: 3 },
]

describe('dashboard kpis', () => {
  const k = kpis({
    bvc,
    month: '2026-10',
    arrears,
    roll,
    deposits: [{ held: 15000 }, { held: 5000 }],
    today,
  })

  it('uses the chosen month for billed / collected / rate / cash', () => {
    expect(k.billed).toBe(80000)
    expect(k.collected).toBe(60000)
    expect(k.collectionRate).toBe(75)
  })
  it('outstanding = positive owed only; overdue tenants = past due date', () => {
    expect(k.outstanding).toBe(64000)
    expect(k.overdueTenants).toBe(2) // A and C; B is not due yet, D is a credit
  })
  it('occupancy from the rent roll', () => {
    expect(k).toMatchObject({ units: 5, occupied: 4, vacant: 1, occupancy: 80 })
  })
  it('cash received from that month; deposits held summed', () => {
    expect(k.cashReceived).toBe(17000)
    expect(kpis({ bvc, month: '2026-09', today }).cashReceived).toBe(52000)
    expect(k.depositsHeld).toBe(20000)
  })
  it('no invoices this month -> no rate', () => {
    expect(kpis({ bvc, month: '2026-08', today }).collectionRate).toBeNull()
  })
})

describe('dashboard lists', () => {
  it('top overdue: largest first, only past due', () => {
    expect(topOverdue(arrears).map((t) => [t.tenantName, t.owed, t.days])).toEqual([
      ['A', 25000, 40],
      ['C', 9000, 5],
    ])
  })
  it('leases ending soon: holdover first, renewed and far-off ones left out', () => {
    expect(leasesEndingSoon(roll, today).map((l) => [l.tenantName, l.days])).toEqual([
      ['B', -12],
      ['A', 19],
    ])
  })
  it('recent payments: newest first, no reversals or reversed payments', () => {
    expect(recentPayments(payments).map((p) => p.paymentId)).toEqual([4, 1])
  })
})

describe('dashboard filters', () => {
  it('month helpers', () => {
    expect(shiftMonth('2026-10', -6)).toBe('2026-04')
    expect(shiftMonth('2026-02', -3)).toBe('2025-11')
    expect(monthName('2026-10')).toBe('Oct 2026')
  })
  it('building filter by name; empty = all', () => {
    expect(inBuilding(arrears, 'B2').map((r) => r.tenantId)).toEqual([3, 4])
    expect(inBuilding(arrears, '')).toHaveLength(5)
  })
  it('chart series oldest month first', () => {
    expect(chartSeries(bvc)).toEqual({
      labels: ['Sep 2026', 'Oct 2026'],
      billed: [50000, 80000],
      collected: [50000, 60000],
      outstanding: [0, 20000],
    })
  })
})

describe('collection card adds up', () => {
  it('billed - paid - discount = still owed (the October example)', () => {
    const oct = [
      {
        monthStart: '2026-10-01T00:00:00',
        totalBilled: 108484,
        collected: 65968,
        discounts: 500,
        outstanding: 42016,
        credit: 0,
      },
    ]
    const k = kpis({ bvc: oct, month: '2026-10', today })
    expect([k.billed, k.collected, k.discounts, k.monthOwed, k.monthCredit]).toEqual([
      108484, 65968, 500, 42016, 0,
    ])
    expect(k.billed - k.collected - k.discounts).toBe(k.monthOwed - k.monthCredit)
  })
  it('an overpaid invoice shows as credit, and the sum still holds', () => {
    const m = [
      {
        monthStart: '2026-10-01T00:00:00',
        totalBilled: 10000,
        collected: 12000,
        discounts: 0,
        outstanding: 1000,
        credit: 3000,
      },
    ]
    const k = kpis({ bvc: m, month: '2026-10', today })
    expect(k.billed - k.collected - k.discounts).toBe(k.monthOwed - k.monthCredit)
  })
  it('a month without invoices shows zeros', () => {
    expect(kpis({ bvc: [], month: '2026-10', today })).toMatchObject({
      discounts: 0,
      monthOwed: 0,
      monthCredit: 0,
    })
  })
})
