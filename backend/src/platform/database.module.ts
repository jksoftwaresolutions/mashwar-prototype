import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common'
import { Pool } from 'pg'
import { loadConfig, type AppConfig } from './config'

export const APP_CONFIG = Symbol('APP_CONFIG')
export const PG_POOL = Symbol('PG_POOL')

/** Single owner of the PostgreSQL connection pool (docs/phase1/06 principle 2). */
@Global()
@Module({
  providers: [
    { provide: APP_CONFIG, useFactory: () => loadConfig() },
    { provide: PG_POOL, inject: [APP_CONFIG], useFactory: (c: AppConfig) => new Pool({ connectionString: c.databaseUrl, max: 10 }) },
  ],
  exports: [APP_CONFIG, PG_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end()
  }
}
