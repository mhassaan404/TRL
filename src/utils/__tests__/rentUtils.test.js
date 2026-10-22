// Payment window maths (Rent Collection) and shared formatting
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  applyGlobalDiscountAmount,
  applyGlobalDiscountPercent,
  computeTotals,
  fmt,
  getRemainingRent,
  toggleInvoiceSelect,
  toggleSelectAll,
  updateInvoiceField,
} from '../rentUtils'
import { exportCSV } from '../exportUtils'
import { toLocalDateString } from '../dates'

const inv = (id, remaining, extra = {}) => ({
  invoiceId: id,
  remainingAmount: remaining,
  dueDate: `2026-0${id}-05`,
  ...extra,
})

describe('fmt', () => {
  test('en-US grouping, up to 2 decimals, never NaN', () => {
    expect(fmt(20000)).toBe('20,000')
    expect(fmt(1500.555)).toBe('1,500.56')
    expect(fmt(-45000)).toBe('-45,000')
    expect(fmt('abc')).toBe('0')
    expect(fmt(undefined)).toBe('0')
  })
})

describe('payment window', () => {
  test('selecting fills the remaining amount; paid invoices cannot be selected', () => {
    const list = toggleSelectAll([inv(1, 5000), inv(2, 0)], true)
    expect(list.map((i) => [i.selected, i.payAmount])).toEqual([
      [true, 5000],
      [false, 0],
    ])
    expect(toggleInvoiceSelect([inv(2, 0)], 2, true)[0].selected).toBeUndefined()
    expect(toggleInvoiceSelect([inv(1, 300)], 1, true)[0]).toMatchObject({
      selected: true,
      payAmount: 300,
    })
  })

  test('cash is capped at the balance after discounts', () => {
    let list = [inv(1, 10000, { selected: true, payAmount: 10000 })]
    list = updateInvoiceField(list, 1, 'discountAmount', 2500)
    expect(list[0]).toMatchObject({ discountAmount: 2500, payAmount: 7500 })
    list = updateInvoiceField(list, 1, 'payAmount', 99999)
    expect(list[0].payAmount).toBe(7500)
    list = updateInvoiceField(list, 1, 'discountAmount', 50000)
    expect(list[0]).toMatchObject({ discountAmount: 10000, payAmount: 0 })
    expect(getRemainingRent(list[0])).toBe(0)
    expect(updateInvoiceField(list, 1, 'payAmount', -5)[0].payAmount).toBe(0)
  })

  test('global discount amount goes to the oldest due first and is not added twice', () => {
    const list = [
      inv(2, 3000, { selected: true, payAmount: 3000 }),
      inv(1, 2000, { selected: true, payAmount: 2000 }),
      inv(3, 9000),
    ]
    let out = applyGlobalDiscountAmount(list, 2500)
    expect(out.map((i) => i.discountAmount)).toEqual([500, 2000, undefined])
    expect(out.map((i) => i.payAmount)).toEqual([2500, 0, undefined])
    out = applyGlobalDiscountAmount(out, 2500)
    expect(out.map((i) => i.discountAmount)).toEqual([500, 2000, undefined])
  })

  test('global discount percent is of the balance, capped at 100%', () => {
    const out = applyGlobalDiscountPercent(
      [inv(1, 10000, { selected: true, payAmount: 10000, discountAmount: 9500 })],
      10,
    )
    expect(out[0]).toMatchObject({ computedDiscount: 1000, discountAmount: 9000, payAmount: 0 })
    expect(
      applyGlobalDiscountPercent([inv(1, 10000, { selected: true })], 250)[0].computedDiscount,
    ).toBe(10000)
  })

  test('totals of the selected invoices; waived late fees are left out', () => {
    const t = computeTotals([
      inv(1, 0, { selected: true, payAmount: 1000, discountAmount: 100, lateFee: 500 }),
      inv(2, 0, { selected: true, payAmount: 2000, lateFee: 300, waveLateFee: true }),
      inv(3, 0, { selected: false, payAmount: 9999, lateFee: 9999 }),
    ])
    expect(t).toEqual({
      selectedCount: 2,
      sumSelectedPayAmount: 3000,
      sumSelectedLateFees: 500,
      sumSelectedDiscounts: 100,
      anyWaived: true,
      grandTotal: 3000,
      anySelected: true,
    })
    expect(
      computeTotals([inv(1, 0, { selected: true, lateFee: 500 })], true).sumSelectedLateFees,
    ).toBe(0)
  })
})

describe('local dates', () => {
  test('uses local time, not UTC', () => {
    expect(toLocalDateString(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01')
  })
})

describe('CSV export', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('quotes values and guards against spreadsheet formulas', async () => {
    let blob
    const link = { click: vi.fn() }
    vi.stubGlobal('URL', {
      createObjectURL: (b) => {
        blob = b
        return 'blob:x'
      },
      revokeObjectURL: vi.fn(),
    })
    vi.stubGlobal('document', {
      createElement: () => link,
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    })
    exportCSV(
      [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'note', header: 'Note' },
        { id: 'actions', header: 'Actions' },
      ],
      [
        { name: '=HYPERLINK("x")', note: 'say "hi", ok' },
        { name: '-5', note: null },
      ],
      'out.csv',
    )
    expect(link.download).toBe('out.csv')
    expect(link.click).toHaveBeenCalledOnce()
    expect((await blob.text()).split('\n')).toEqual([
      '"Name","Note"',
      '"\'=HYPERLINK(""x"")","say ""hi"", ok"',
      '"\'-5",""',
    ])
    // starts with the UTF-8 BOM, so Excel shows "—" and Urdu text correctly
    expect([...new Uint8Array(await blob.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  })
})
