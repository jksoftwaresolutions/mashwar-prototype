import { Controller, Get, HttpCode, HttpStatus, Inject, Res } from '@nestjs/common'
import type { Response } from 'express'
import type { Pool } from 'pg'
import { PG_POOL } from '../platform/database.module'

/** Liveness/readiness for the deployment platform. Reports database reachability, nothing more. */
@Controller('v1/health')
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check(@Res({ passthrough: true }) res: Response) {
    try {
      await this.pool.query('select 1')
      return { status: 'ok', database: 'up' }
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE)
      return { status: 'degraded', database: 'down' }
    }
  }
}
