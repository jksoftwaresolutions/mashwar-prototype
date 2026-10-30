import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { DatabaseModule } from './platform/database.module'
import { HealthController } from './health/health.controller'
import { PermissionsGuard } from './auth/permissions.guard'

/**
 * Phase 1 foundation. Feature modules from docs/phase1/07 section 3 (auth, riders, captains, vehicles,
 * markets, dispatch, trips, tracking, realtime, payments, promotions, ratings, support, notifications,
 * admin, reporting) are added in Phases 2 and 3.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: PermissionsGuard }],
})
export class AppModule {}
