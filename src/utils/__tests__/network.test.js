import { describe, expect, it } from 'vitest'
import { shouldPreloadPages } from '../network'

describe('background page loading', () => {
  it('fast connections preload', () => {
    expect(shouldPreloadPages({ connection: { effectiveType: '4g', saveData: false } })).toBe(true)
  })
  it('slow connections and data saver do not', () => {
    for (const t of ['slow-2g', '2g', '3g'])
      expect(shouldPreloadPages({ connection: { effectiveType: t } })).toBe(false)
    expect(shouldPreloadPages({ connection: { effectiveType: '4g', saveData: true } })).toBe(false)
  })
  it('browsers without connection info preload (unchanged behaviour)', () => {
    expect(shouldPreloadPages({})).toBe(true)
    expect(shouldPreloadPages(undefined)).toBe(true)
  })
})
