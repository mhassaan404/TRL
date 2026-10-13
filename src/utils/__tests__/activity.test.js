import { describe, expect, it } from 'vitest'
import { onActivity, requestFinished, requestStarted } from '../../api/activity'

describe('request activity (top loading bar)', () => {
  it('counts requests in flight and never goes below zero', () => {
    const seen = []
    const off = onActivity((n) => seen.push(n))
    requestStarted()
    requestStarted()
    requestFinished()
    requestFinished()
    requestFinished() // extra finish: stays 0
    off()
    requestStarted() // after unsubscribe: not seen
    requestFinished()
    expect(seen).toEqual([1, 2, 1, 0, 0])
  })
})
