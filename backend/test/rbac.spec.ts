import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ADMIN_ROLES, hasPermissions, PERMISSIONS, ROLE_PERMISSIONS, type AdminRole, type Principal } from '../src/auth/rbac'
import { PermissionsGuard, PERMISSIONS_KEY } from '../src/auth/permissions.guard'

const admin = (...roles: AdminRole[]): Principal => ({ kind: 'admin', adminId: 'a1', roles })

describe('RBAC map', () => {
  it('grants super_admin every permission', () => {
    expect(hasPermissions(admin('super_admin'), PERMISSIONS)).toBe(true)
  })

  it('separates pricing edit from pricing approval (four-eyes)', () => {
    expect(hasPermissions(admin('operations'), ['pricing.edit'])).toBe(true)
    expect(hasPermissions(admin('operations'), ['pricing.approve'])).toBe(false)
    expect(hasPermissions(admin('finance'), ['pricing.approve'])).toBe(true)
    expect(hasPermissions(admin('finance'), ['pricing.edit'])).toBe(false)
  })

  it('limits personal data to onboarding and super admins', () => {
    const withPii = ADMIN_ROLES.filter((r) => ROLE_PERMISSIONS[r].includes('pii.view')).sort()
    expect(withPii).toEqual(['captain_onboarding', 'super_admin'])
  })

  it('never grants staff permissions to rider or captain app users', () => {
    expect(hasPermissions({ kind: 'app', userId: 'u1', app: 'captain' }, ['trips.view'])).toBe(false)
    expect(hasPermissions(undefined, ['trips.view'])).toBe(false)
  })

  it('combines permissions across roles', () => {
    expect(hasPermissions(admin('marketing', 'support_agent'), ['coupons.manage', 'tickets.manage'])).toBe(true)
  })

  it('matches the roles and grants in the reference-data migration', () => {
    const sql = readFileSync(join(__dirname, '..', 'db', 'migrations', '0002_reference_data.sql'), 'utf8')
    const roles = [...sql.slice(sql.indexOf('insert into admin.roles'), sql.indexOf('insert into admin.permissions')).matchAll(/\('(\w+)',/g)].map((m) => m[1]).sort()
    expect(roles).toEqual([...ADMIN_ROLES].sort())
    const perms = [...sql.slice(sql.indexOf('insert into admin.permissions'), sql.indexOf('insert into admin.role_permissions')).matchAll(/\('([\w.]+)',/g)].map((m) => m[1]).sort()
    expect(perms).toEqual([...PERMISSIONS].sort())
    const grantBlock = sql.slice(sql.lastIndexOf('insert into admin.role_permissions'), sql.indexOf('insert into market.countries'))
    const grants = [...grantBlock.matchAll(/\('(\w+)', '([\w.]+)'\)/g)].map((m) => `${m[1]}:${m[2]}`).sort()
    const code = ADMIN_ROLES.filter((r) => r !== 'super_admin').flatMap((r) => ROLE_PERMISSIONS[r].map((p) => `${r}:${p}`)).sort()
    expect(grants).toEqual(code)
  })
})

describe('PermissionsGuard', () => {
  const ctx = (principal?: Principal) =>
    ({ getHandler: () => undefined, getClass: () => undefined, switchToHttp: () => ({ getRequest: () => ({ principal }) }) }) as unknown as ExecutionContext
  const guard = (required?: string[]) => new PermissionsGuard({ getAllAndOverride: (key: string) => (key === PERMISSIONS_KEY ? required : undefined) } as unknown as Reflector)

  it('lets unprotected routes through', () => {
    expect(guard().canActivate(ctx())).toBe(true)
  })
  it('answers 401 without a principal', () => {
    expect(() => guard(['trips.view']).canActivate(ctx())).toThrow(UnauthorizedException)
  })
  it('answers 403 without the permission', () => {
    expect(() => guard(['refunds.issue']).canActivate(ctx(admin('marketing')))).toThrow(ForbiddenException)
  })
  it('allows a staff member with the permission', () => {
    expect(guard(['refunds.issue']).canActivate(ctx(admin('finance')))).toBe(true)
  })
})
