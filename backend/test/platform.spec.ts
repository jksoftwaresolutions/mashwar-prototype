import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { ConfigError, loadConfig } from '../src/platform/config'
import { HealthController } from '../src/health/health.controller'
import { PG_POOL } from '../src/platform/database.module'

describe('loadConfig', () => {
  const valid = { NODE_ENV: 'test', PORT: '3000', DATABASE_URL: 'postgres://u:p@localhost:5432/db', REDIS_URL: 'redis://localhost:6379' }

  it('accepts a complete environment', () => {
    expect(loadConfig(valid)).toEqual({ nodeEnv: 'test', port: 3000, databaseUrl: valid.DATABASE_URL, redisUrl: valid.REDIS_URL })
  })

  it('lists every problem at once', () => {
    expect(() => loadConfig({ NODE_ENV: 'prod', PORT: '99999' })).toThrow(ConfigError)
    try {
      loadConfig({ NODE_ENV: 'prod', PORT: '99999' })
    } catch (e) {
      const msg = (e as Error).message
      for (const key of ['NODE_ENV', 'PORT', 'DATABASE_URL', 'REDIS_URL']) expect(msg).toContain(key)
    }
  })
})

describe('GET /v1/health', () => {
  async function appWith(query: () => Promise<unknown>): Promise<INestApplication> {
    const mod = await Test.createTestingModule({ controllers: [HealthController], providers: [{ provide: PG_POOL, useValue: { query } }] }).compile()
    const app = mod.createNestApplication()
    await app.init()
    return app
  }

  it('reports ok when the database answers', async () => {
    const app = await appWith(async () => ({ rows: [] }))
    await request(app.getHttpServer()).get('/v1/health').expect(200, { status: 'ok', database: 'up' })
    await app.close()
  })

  it('reports 503 when the database is down', async () => {
    const app = await appWith(async () => {
      throw new Error('connection refused')
    })
    await request(app.getHttpServer()).get('/v1/health').expect(503, { status: 'degraded', database: 'down' })
    await app.close()
  })
})
