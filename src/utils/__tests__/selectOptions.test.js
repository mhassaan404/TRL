import { describe, expect, it } from 'vitest'
import { visibleOptions } from '../selectOptions'

const many = Array.from({ length: 1200 }, (_, i) => ({
  value: String(i),
  label: `#${i} · Unit U${i % 20}`,
}))

describe('searchable dropdown options', () => {
  it('no limit: everything, as before', () => {
    expect(visibleOptions(many, '', undefined)).toMatchObject({ total: 1200 })
    expect(visibleOptions(many, '', undefined).shown).toHaveLength(1200)
  })
  it('limit keeps the first (most useful) ones and reports the total', () => {
    const r = visibleOptions(many, '', 50)
    expect(r.shown).toHaveLength(50)
    expect(r.shown[0].value).toBe('0')
    expect(r.total).toBe(1200)
  })
  it('search runs over all options, not only the shown ones', () => {
    const r = visibleOptions(many, '#1150 ', 50) // trimmed, older than the first 50
    expect(r.shown.map((o) => o.value)).toEqual(['1150'])
    expect(r.total).toBe(1)
  })
  it('case-insensitive; no match = empty', () => {
    expect(visibleOptions([{ value: 'a', label: 'Rent Correction' }], 'rent corr', 50).total).toBe(
      1,
    )
    expect(visibleOptions(many, 'zzz', 50)).toEqual({ shown: [], total: 0 })
  })
})
