import { describe, expect, it } from 'vitest'
import { kpis, leasesEndingSoon, recentPayments, topOverdue } from '../dashboard'

const today = '2026-10-13'
const months = [
  { monthYear: '2026-09', totalRentDue: 50000, collectedAmount: 50000 },
  { monthYear: '2026-10', totalRentDue: 80000, collectedAmount: 60000 },
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
    months,
    arrears,
    roll,
    payments,
    deposits: [{ held: 15000 }, { held: 5000 }],
    today,
  })

  it('uses this month for billed / collected / rate', () => {
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
  it('cash received nets reversals; deposits held summed', () => {
    expect(k.cashReceived).toBe(17000)
    expect(k.depositsHeld).toBe(20000)
  })
  it('no invoices this month -> no rate', () => {
    expect(kpis({ months: [], today }).collectionRate).toBeNull()
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
