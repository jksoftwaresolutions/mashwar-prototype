/**
 * Role and permission map (docs/phase1/06 section 5.9, 07 section 9). Proposed starting set.
 * App users are riders or captains; staff use admin roles with explicit permissions.
 * Must match admin.roles / admin.role_permissions in db/migrations/0002_reference_data.sql.
 */
export const APP_ROLES = ['rider', 'captain'] as const
export type AppRole = (typeof APP_ROLES)[number]

export const PERMISSIONS = [
  'trips.view', 'trips.cancel', 'captains.approve', 'captains.suspend', 'riders.block', 'coupons.manage',
  'pricing.edit', 'pricing.approve', 'zones.edit', 'refunds.issue', 'tickets.manage', 'reports.view',
  'pii.view', 'admins.manage',
] as const
export type Permission = (typeof PERMISSIONS)[number]

export const ADMIN_ROLES = [
  'super_admin', 'operations', 'captain_onboarding', 'support_agent', 'finance', 'marketing', 'read_only_analyst',
] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  operations: ['trips.view', 'trips.cancel', 'captains.suspend', 'riders.block', 'zones.edit', 'pricing.edit', 'tickets.manage', 'reports.view'],
  captain_onboarding: ['trips.view', 'captains.approve', 'captains.suspend', 'pii.view'],
  support_agent: ['trips.view', 'tickets.manage', 'riders.block'],
  finance: ['trips.view', 'refunds.issue', 'pricing.approve', 'reports.view'],
  marketing: ['coupons.manage', 'reports.view'],
  read_only_analyst: ['trips.view', 'reports.view'],
}

/** Authenticated caller. Authentication itself (OTP, JWT, admin SSO/MFA) is built in Phase 2/3. */
export type Principal =
  | { kind: 'app'; userId: string; app: AppRole }
  | { kind: 'admin'; adminId: string; roles: readonly AdminRole[]; cityIds?: readonly string[] }

export function permissionsOf(roles: readonly AdminRole[]): Set<Permission> {
  const out = new Set<Permission>()
  for (const r of roles) for (const p of ROLE_PERMISSIONS[r]) out.add(p)
  return out
}

export function hasPermissions(principal: Principal | undefined, required: readonly Permission[]): boolean {
  if (!principal || principal.kind !== 'admin') return false
  const granted = permissionsOf(principal.roles)
  return required.every((p) => granted.has(p))
}
