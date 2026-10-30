import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { hasPermissions, type Permission, type Principal } from './rbac'

export const PERMISSIONS_KEY = 'mashwar:permissions'

/** Declares the staff permissions an /admin/v1 handler needs. */
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions)

/**
 * Authorization only. An authentication guard (Phase 2/3) must run first and set request.principal.
 * Without a principal every protected route answers 401, so nothing is accidentally open.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(PERMISSIONS_KEY, [ctx.getHandler(), ctx.getClass()])
    if (!required?.length) return true
    const principal = ctx.switchToHttp().getRequest<{ principal?: Principal }>().principal
    if (!principal) throw new UnauthorizedException()
    if (!hasPermissions(principal, required)) throw new ForbiddenException()
    return true
  }
}
