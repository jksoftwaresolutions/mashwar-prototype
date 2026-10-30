/**
 * Admin sections (the 12 sections approved in the prototype) and the staff permission each needs.
 * Permission ids match backend/src/auth/rbac.ts; the backend remains the authority, this only hides
 * navigation a staff member cannot use.
 */
export type Permission =
  | 'trips.view' | 'trips.cancel' | 'captains.approve' | 'captains.suspend' | 'riders.block' | 'coupons.manage'
  | 'pricing.edit' | 'pricing.approve' | 'zones.edit' | 'refunds.issue' | 'tickets.manage' | 'reports.view'
  | 'pii.view' | 'admins.manage'

export interface Section {
  id: string
  ar: string
  en: string
  /** Any one of these grants access. */
  anyOf: readonly Permission[]
  phase: 3
}

export const SECTIONS: readonly Section[] = [
  { id: 'overview', ar: 'نظرة عامة', en: 'Overview', anyOf: ['reports.view', 'trips.view'], phase: 3 },
  { id: 'trips', ar: 'الرحلات', en: 'Trips', anyOf: ['trips.view'], phase: 3 },
  { id: 'live', ar: 'الرحلات المباشرة', en: 'Live operations', anyOf: ['trips.view'], phase: 3 },
  { id: 'captains', ar: 'الكباتن', en: 'Captains', anyOf: ['captains.approve', 'captains.suspend'], phase: 3 },
  { id: 'riders', ar: 'الركاب', en: 'Riders', anyOf: ['riders.block'], phase: 3 },
  { id: 'vehicles', ar: 'المركبات', en: 'Vehicles', anyOf: ['captains.approve'], phase: 3 },
  { id: 'payments', ar: 'المدفوعات', en: 'Payments', anyOf: ['refunds.issue', 'reports.view'], phase: 3 },
  { id: 'promotions', ar: 'العروض والكوبونات', en: 'Promotions', anyOf: ['coupons.manage'], phase: 3 },
  { id: 'ratings', ar: 'التقييمات', en: 'Ratings', anyOf: ['trips.view'], phase: 3 },
  { id: 'support', ar: 'الدعم والشكاوى', en: 'Support', anyOf: ['tickets.manage'], phase: 3 },
  { id: 'reports', ar: 'التقارير', en: 'Reports', anyOf: ['reports.view'], phase: 3 },
  { id: 'settings', ar: 'الإعدادات', en: 'Settings', anyOf: ['pricing.edit', 'pricing.approve', 'zones.edit'], phase: 3 },
]

export function visibleSections(granted: ReadonlySet<Permission>): Section[] {
  return SECTIONS.filter((s) => s.anyOf.some((p) => granted.has(p)))
}
