/**
 * Minimal forward-only migration runner.
 * Applies db/migrations/*.sql in name order, once each, recording a SHA-256 checksum so an edited,
 * already-applied migration is detected instead of silently ignored. `--seed-dev` also loads
 * db/seeds/dev_seed.sql (development only, refused when NODE_ENV is staging or production).
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'

const MIGRATIONS_DIR = join(__dirname, 'migrations')
const DEV_SEED = join(__dirname, 'seeds', 'dev_seed.sql')

export async function migrate(databaseUrl: string, opts: { seedDev?: boolean; log?: (m: string) => void } = {}) {
  const log = opts.log ?? console.log
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    await client.query(`create table if not exists public.schema_migrations (
      name text primary key, checksum text not null, applied_at timestamptz not null default now())`)
    // Serialise concurrent runners (two deploys starting at once).
    await client.query('select pg_advisory_lock(727274)')
    const applied = new Map<string, string>(
      (await client.query<{ name: string; checksum: string }>('select name, checksum from public.schema_migrations')).rows.map((r) => [r.name, r.checksum]),
    )
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()
    for (const name of files) {
      const sql = readFileSync(join(MIGRATIONS_DIR, name), 'utf8')
      const checksum = createHash('sha256').update(sql).digest('hex')
      const prev = applied.get(name)
      if (prev === checksum) continue
      if (prev) throw new Error(`Migration ${name} was edited after it was applied. Add a new migration instead.`)
      log(`applying ${name}`)
      await client.query(sql) // each file manages its own transaction
      await client.query('insert into public.schema_migrations (name, checksum) values ($1, $2)', [name, checksum])
    }
    if (opts.seedDev) {
      if (['staging', 'production'].includes(process.env.NODE_ENV ?? '')) throw new Error('Refusing to load the development seed outside development.')
      log('loading dev seed')
      await client.query(readFileSync(DEV_SEED, 'utf8'))
    }
  } finally {
    await client.query('select pg_advisory_unlock(727274)').catch(() => undefined)
    await client.end()
  }
}

if (require.main === module) {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  migrate(url, { seedDev: process.argv.includes('--seed-dev') }).then(
    () => console.log('migrations up to date'),
    (e: unknown) => {
      console.error(e instanceof Error ? e.message : e)
      process.exit(1)
    },
  )
}
