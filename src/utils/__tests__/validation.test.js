// Input rules shared with the API: tenant contact details, password change, unit status, maintenance rules
import { describe, expect, test } from 'vitest'
import { isValidCnicNtn, isValidEmail, isValidPhone, maskCnicNtn, maskPhone } from '../validators'
import { PASSWORD_MAX, validatePasswordChange } from '../passwordPolicy'
import { countUnitStatuses, UNIT_STATUS, unitStatusOf } from '../unitStatus'
import {
  billBlockedReason,
  filterJobs,
  locationLockReason,
  nextStatuses,
  summarize,
} from '../maintenance'

describe('tenant contact details', () => {
  test('phone mask and check', () => {
    expect(maskPhone('03001234567')).toBe('0300-1234567')
    expect(maskPhone('+92 300 1234567')).toBe('0300-1234567')
    expect(maskPhone('00923001234567')).toBe('0300-1234567')
    expect(maskPhone('02134567890')).toBe('021-34567890')
    expect(isValidPhone('0300-1234567')).toBe(true)
    expect(isValidPhone('021-34567890')).toBe(true)
    expect(isValidPhone('0300-12345')).toBe(false)
    expect(isValidPhone('')).toBe(false)
  })
  test('CNIC / NTN', () => {
    expect(maskCnicNtn('4210112345671', 'Individual')).toBe('42101-1234567-1')
    expect(maskCnicNtn('12345678', 'Company')).toBe('1234567-8')
    expect(isValidCnicNtn('42101-1234567-1', 'Individual')).toBe(true)
    expect(isValidCnicNtn('1234567-8', 'Individual')).toBe(false)
    expect(isValidCnicNtn('1234567-8', 'Company')).toBe(true)
  })
  test('email', () => {
    expect(isValidEmail(' a@b.co ')).toBe(true)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail(null)).toBe(false)
  })
})

describe('password change (same rules as Helpers/PasswordPolicy.cs)', () => {
  const ok = { current: 'Old-pass1', next: 'NewPass123', confirm: 'NewPass123' }
  test('valid change', () => expect(validatePasswordChange(ok, 'admin')).toEqual({}))
  test.each([
    [{ ...ok, current: '' }, 'current', 'current password'],
    [{ ...ok, next: 'Ab1', confirm: 'Ab1' }, 'next', 'at least 8'],
    [{ ...ok, next: 'a1'.repeat(33), confirm: 'a1'.repeat(33) }, 'next', `at most ${PASSWORD_MAX}`],
    [{ ...ok, next: ' Abcdefg1', confirm: ' Abcdefg1' }, 'next', 'start or end with a space'],
    [{ ...ok, next: 'Abcdefg1\u0001', confirm: 'Abcdefg1\u0001' }, 'next', "aren't allowed"],
    [{ ...ok, next: 'abcdefgh', confirm: 'abcdefgh' }, 'next', 'one letter and one number'],
    [{ ...ok, next: 'Admin1234', confirm: 'Admin1234' }, 'next', 'username'],
    [{ ...ok, next: ok.current, confirm: ok.current }, 'next', 'different'],
    [{ ...ok, confirm: 'x' }, 'confirm', "don't match"],
  ])('%o -> %s error', (input, field, text) => {
    expect(validatePasswordChange(input, 'admin1234')[field]).toContain(text)
  })
  test('72-byte BCrypt limit', () => {
    const multiByte = 'é1'.repeat(30) // 60 characters, 90 bytes
    expect(validatePasswordChange({ ...ok, next: multiByte, confirm: multiByte }).next).toContain(
      'at most',
    )
  })
})

describe('unit status', () => {
  test('maintenance > occupied > reserved > available', () => {
    expect(unitStatusOf({ status: 'Under Maintenance', isOccupied: true })).toBe(
      UNIT_STATUS.MAINTENANCE,
    )
    expect(unitStatusOf({ status: 'Reserved', isOccupied: true })).toBe(UNIT_STATUS.OCCUPIED)
    expect(unitStatusOf({ status: 'Reserved' })).toBe(UNIT_STATUS.RESERVED)
    expect(unitStatusOf({ status: 'Rented' })).toBe(UNIT_STATUS.AVAILABLE) // hand-set "Rented" is ignored
    expect(unitStatusOf(null)).toBe(UNIT_STATUS.AVAILABLE)
    expect(
      countUnitStatuses([
        { isOccupied: true },
        { status: 'Reserved' },
        {},
        { status: 'maintenance' },
      ]),
    ).toEqual({
      total: 4,
      occupied: 1,
      available: 1,
      maintenance: 1,
      reserved: 1,
    })
  })
})

describe('maintenance rules', () => {
  const jobs = [
    { id: 1, status: 'Open', priority: 'Urgent', title: 'Leak', buildingId: 1, unitId: 10 },
    { id: 2, status: 'In Progress', priority: 'Low', title: 'Paint', buildingId: 2 },
    { id: 3, status: 'Completed', priority: 'Urgent', completedDate: '2026-10-02', buildingId: 1 },
    { id: 4, status: 'Cancelled', priority: 'High', buildingId: 1 },
  ]
  test('summary and filters', () => {
    expect(summarize(jobs, '2026-10-09')).toEqual({
      open: 1,
      inProgress: 1,
      urgent: 1,
      completedThisMonth: 1,
    })
    expect(filterJobs(jobs, { status: 'Active' }).map((j) => j.id)).toEqual([1, 2])
    expect(filterJobs(jobs, { buildingId: '1', priority: 'Urgent' }).map((j) => j.id)).toEqual([
      1, 3,
    ])
    expect(filterJobs(jobs, { search: ' #2 ' }).map((j) => j.id)).toEqual([2])
  })
  test('status moves; completed and cancelled are final', () => {
    expect(nextStatuses(jobs[0])).toEqual(['In Progress', 'Completed', 'Cancelled'])
    expect(nextStatuses(jobs[2])).toEqual([])
  })
  test('bill and location locks', () => {
    expect(billBlockedReason({ status: 'Cancelled' })).toMatch(/Cancelled/)
    expect(billBlockedReason({ status: 'Open' })).toMatch(/No tenant/)
    expect(
      billBlockedReason({ status: 'Open', tenantId: 1, isBilled: true, chargeInvoiceId: 9 }),
    ).toMatch(/#9/)
    expect(billBlockedReason({ status: 'Completed', tenantId: 1 })).toBeNull()
    expect(locationLockReason({})).toBeNull()
    expect(locationLockReason({ id: 1, isBilled: true })).toMatch(/Billed/)
    expect(locationLockReason({ id: 1, markedUnit: true })).toMatch(/Under Maintenance/)
  })
})
