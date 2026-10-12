import { describe, expect, test } from 'vitest'
import {
  buildMessage,
  dueState,
  formatDay,
  groupByTenant,
  invoiceLabel,
  outstanding,
  toWhatsAppNumber,
  whatsAppLink,
} from '../reminders'

const today = '2026-10-09'

describe('reminders', () => {
  test('due state', () => {
    expect(dueState('2026-10-08', today)).toBe('Overdue')
    expect(dueState('2026-10-09T00:00:00', today)).toBe('Due today')
    expect(dueState('2026-10-12', today)).toBe('Due soon')
    expect(dueState('2026-10-13', today)).toBe('Upcoming')
    expect(dueState(null, today)).toBe('Upcoming')
    expect(dueState('2026-11-01', '2026-10-30')).toBe('Due soon') // across month end
  })

  test('labels and amounts', () => {
    expect(formatDay('2026-10-06T00:00:00')).toBe('06 Oct 2026')
    expect(formatDay('')).toBe('')
    expect(invoiceLabel({ chargeType: 'Utility' })).toBe('Utility')
    expect(invoiceLabel({ invoiceMonth: '2026-08-01' })).toBe('Aug 2026')
    expect(outstanding({ balance: 1000, lateFee: 500 })).toBe(1500)
  })

  test.each([
    ['0347-0377136', '923470377136'],
    ['+92 347 0377136', '923470377136'],
    ['3470377136', '923470377136'],
    ['021-34567890', null],
    ['', null],
  ])('WhatsApp number %s', (phone, wa) => expect(toWhatsAppNumber(phone)).toBe(wa))

  test('one group per tenant, earliest due first, firmer message when overdue', () => {
    const groups = groupByTenant(
      [
        {
          tenantId: 1,
          tenantName: 'Zed',
          phone: '03001234567',
          invoiceId: 5,
          dueDate: '2026-10-20',
          balance: 100,
          invoiceMonth: '2026-10-01',
        },
        {
          tenantId: 1,
          tenantName: 'Zed',
          phone: '03001234567',
          invoiceId: 3,
          dueDate: '2026-09-05',
          balance: 200,
          lateFee: 50,
          invoiceMonth: '2026-09-01',
          unitNumber: '7',
        },
        {
          tenantId: 2,
          tenantName: 'Amy',
          phone: 'x',
          invoiceId: 9,
          dueDate: '2026-10-10',
          balance: 10,
        },
      ],
      today,
    )
    expect(groups.map((g) => g.tenantName)).toEqual(['Amy', 'Zed'])
    const zed = groups[1]
    expect(zed.invoices.map((i) => i.invoiceId)).toEqual([3, 5])
    expect(zed.total).toBe(350)
    expect(zed.whatsApp).toBe('923001234567')
    const msg = buildMessage(zed)
    expect(msg).toContain('Your rent payment is overdue')
    expect(msg).toContain('• Invoice #3 – Unit 7 – Sep 2026')
    expect(msg).toContain('Late fees: PKR 50')
    expect(msg).toContain('Total outstanding: PKR 350')
    expect(buildMessage(groups[0])).toContain('This is a reminder of your outstanding rent')
    expect(whatsAppLink(groups[0])).toBeNull()
    expect(whatsAppLink(zed)).toMatch(/^https:\/\/wa\.me\/923001234567\?text=Dear%20Zed/)
  })
})
