import { describe, expect, it } from 'vitest'
import { SECTIONS, visibleSections } from './navigation'

describe('admin navigation', () => {
  it('keeps the 12 approved sections', () => {
    expect(SECTIONS).toHaveLength(12)
  })
  it('shows marketing only promotions and reports', () => {
    expect(visibleSections(new Set(['coupons.manage', 'reports.view'])).map((s) => s.id)).toEqual(['overview', 'payments', 'promotions', 'reports'])
  })
  it('shows nothing without permissions', () => {
    expect(visibleSections(new Set())).toEqual([])
  })
})
