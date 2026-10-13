import { describe, expect, test } from 'vitest'
import { INVOICE_STATUS_COLOR, invoiceStatusColor } from '../invoiceStatus'

describe('invoice status colours (one map for every page)', () => {
  test('every status the API returns has a real CoreUI colour', () => {
    for (const s of ['Paid', 'Partial', 'Unpaid', 'Pending', 'Overpaid', 'Cancelled']) {
      expect(['success', 'warning', 'danger', 'info', 'dark', 'secondary']).toContain(
        INVOICE_STATUS_COLOR[s],
      )
    }
  })
  test('Overpaid has a visible badge colour (was the undefined "purple")', () =>
    expect(invoiceStatusColor('Overpaid')).toBe('dark'))
  test('unknown status falls back to secondary', () =>
    expect(invoiceStatusColor('Something')).toBe('secondary'))
})
