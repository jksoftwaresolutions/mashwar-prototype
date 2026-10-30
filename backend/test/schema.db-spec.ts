/**
 * Verifies the PostgreSQL schema against a real PostGIS database: migrations apply on an empty
 * database, re-running is a no-op, and the invariants from docs/phase1/06 hold under the database's
 * own constraints (not just in application code).
 *
 * Needs DATABASE_URL for a server where the test may create and drop the `mashwar_schema_test` database.
 */
import { Client } from 'pg'
import { migrate } from '../db/migrate'

const baseUrl = process.env.DATABASE_URL
const TEST_DB = 'mashwar_schema_test'
const describeDb = baseUrl ? describe : describe.skip

function urlFor(db: string) {
  const u = new URL(baseUrl!)
  u.pathname = `/${db}`
  return u.toString()
}

describeDb('database schema', () => {
  let db: Client

  beforeAll(async () => {
    const admin = new Client({ connectionString: baseUrl })
    await admin.connect()
    await admin.query(`drop database if exists ${TEST_DB} with (force)`)
    await admin.query(`create database ${TEST_DB}`)
    await admin.end()
    await migrate(urlFor(TEST_DB), { seedDev: true, log: () => undefined })
    db = new Client({ connectionString: urlFor(TEST_DB) })
    await db.connect()
  })

  afterAll(async () => {
    await db?.end()
  })

  const expectError = async (sql: string, params: unknown[], pattern: RegExp) => {
    await db.query('savepoint t')
    await expect(db.query(sql, params)).rejects.toThrow(pattern)
    await db.query('rollback to savepoint t')
  }

  it('is idempotent: running migrations again changes nothing', async () => {
    await expect(migrate(urlFor(TEST_DB), { log: () => undefined })).resolves.toBeUndefined()
    const { rows } = await db.query('select count(*)::int as n from public.schema_migrations')
    expect(rows[0].n).toBe(2)
  })

  it('creates every schema from the design', async () => {
    const { rows } = await db.query(`select schema_name from information_schema.schemata
      where schema_name in ('market','core','ride','finance','promo','support','notify','admin','infra') order by 1`)
    expect(rows.map((r) => r.schema_name)).toEqual(['admin', 'core', 'finance', 'infra', 'market', 'notify', 'promo', 'ride', 'support'])
  })

  it('indexes every foreign key column', async () => {
    const { rows } = await db.query(`
      select c.conrelid::regclass::text as tbl, a.attname as col
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
      where c.contype = 'f'
        and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])`)
    expect(rows).toEqual([])
  })

  describe('trip invariants', () => {
    let cityId: string
    let planId: string
    const newUser = async (phone: string) => (await db.query(`insert into core.users (phone_e164) values ($1) returning id`, [phone])).rows[0].id as string
    const newRider = async (phone: string) => {
      const id = await newUser(phone)
      await db.query('insert into core.riders (user_id) values ($1)', [id])
      return id
    }
    const newCaptain = async (phone: string) => {
      const id = await newUser(phone)
      await db.query(`insert into core.captains (user_id, city_id, approval_status) values ($1, $2, 'approved')`, [id, cityId])
      return id
    }
    const newTrip = async (riderId: string, code: string) => {
      const quote = await db.query(
        `insert into ride.fare_quotes (rider_id, city_id, category_id, pricing_plan_id, pickup, dropoff, distance_m, duration_s, fare_halalas, currency, breakdown, expires_at)
         values ($1, $2, 'economy', $3, 'SRID=4326;POINT(46.68 24.69)', 'SRID=4326;POINT(46.64 24.76)', 9500, 1320, 2700, 'SAR', '{}', now() + interval '5 minutes') returning id`,
        [riderId, cityId, planId],
      )
      return (
        await db.query(
          `insert into ride.trips (code, city_id, rider_id, category_id, quote_id, pricing_plan_id, pickup, dropoff, payment_type, currency, quoted_fare_halalas, commission_bps)
           values ($1, $2, $3, 'economy', $4, $5, 'SRID=4326;POINT(46.68 24.69)', 'SRID=4326;POINT(46.64 24.76)', 'cash', 'SAR', 2700, 2000) returning id`,
          [code, cityId, riderId, quote.rows[0].id, planId],
        )
      ).rows[0].id as string
    }

    beforeAll(async () => {
      cityId = (await db.query(`select id from market.cities where slug = 'riyadh'`)).rows[0].id
      planId = (await db.query(`select id from market.pricing_plans where category_id = 'economy'`)).rows[0].id
      await db.query('begin')
    })
    afterAll(async () => {
      await db.query('rollback')
    })

    it('stores money as integer halalas and generates time-ordered UUIDv7 ids', async () => {
      const rider = await newRider('+966500000001')
      const trip = await newTrip(rider, 'MS-T0001')
      expect(trip.charAt(14)).toBe('7')
      const { rows } = await db.query(`select data_type from information_schema.columns where table_schema = 'ride' and table_name = 'trips' and column_name = 'quoted_fare_halalas'`)
      expect(rows[0].data_type).toBe('bigint')
    })

    it('allows only one active trip per rider', async () => {
      const rider = await newRider('+966500000002')
      await newTrip(rider, 'MS-T0002')
      await db.query('savepoint t')
      await expect(newTrip(rider, 'MS-T0003')).rejects.toThrow(/trips_one_active_per_rider/)
      await db.query('rollback to savepoint t')
    })

    it('rejects invalid transitions and changes after a terminal state', async () => {
      const rider = await newRider('+966500000003')
      const trip = await newTrip(rider, 'MS-T0004')
      await expectError(`update ride.trips set status = 'completed', version = version + 1 where id = $1`, [trip], /invalid trip transition requested -> completed/)
      await expectError(`update ride.trips set status = 'cancelled' where id = $1`, [trip], /must increment version/)
      await db.query(`update ride.trips set status = 'cancelled', version = version + 1, cancelled_by = 'rider', cancelled_at = now() where id = $1`, [trip])
      await expectError(`update ride.trips set status = 'requested', version = version + 1 where id = $1`, [trip], /terminal state/)
    })

    it('lets only one captain win an accept race and keeps a captain on one active trip', async () => {
      const captain = await newCaptain('+966500000010')
      const t1 = await newTrip(await newRider('+966500000011'), 'MS-T0010')
      const t2 = await newTrip(await newRider('+966500000012'), 'MS-T0011')
      await db.query(`insert into ride.trip_offers (trip_id, captain_id, attempt, expires_at) values ($1, $2, 1, now() + interval '30 seconds')`, [t1, captain])
      await expectError(`insert into ride.trip_offers (trip_id, captain_id, attempt, expires_at) values ($1, $2, 1, now() + interval '30 seconds')`, [t2, captain], /trip_offers_one_pending_per_captain/)

      const accept = (trip: string) =>
        db.query(`update ride.trips set status = 'accepted', captain_id = $2, accepted_at = now(), version = version + 1 where id = $1 and status = 'requested' returning id`, [trip, captain])
      expect((await accept(t1)).rowCount).toBe(1)
      expect((await accept(t1)).rowCount).toBe(0) // the second accept loses: trip is no longer 'requested'
      await db.query('savepoint t')
      await expect(accept(t2)).rejects.toThrow(/trips_one_active_per_captain/)
      await db.query('rollback to savepoint t')
    })

    it('settles each trip exactly once with a balanced ledger', async () => {
      const acc = async (owner: string, code: string) =>
        (await db.query(`insert into finance.ledger_accounts (owner_type, code, currency) values ($1, $2, 'SAR') returning id`, [owner, code])).rows[0].id
      const clearing = await acc('psp', 'psp_clearing')
      const commission = await acc('platform', 'platform_commission')
      const tx = (key: string) => db.query(`insert into finance.ledger_transactions (kind, idempotency_key) values ('trip_settlement', $1) returning id`, [key])

      await db.query('savepoint t')
      const txId = (await tx('trip:demo:settle')).rows[0].id
      await db.query('insert into finance.ledger_entries (transaction_id, account_id, amount_halalas) values ($1, $2, 800), ($1, $3, -800)', [txId, clearing, commission])
      await db.query('set constraints all immediate')
      await db.query('release savepoint t')
      await db.query('set constraints all deferred') // back to commit-time checking for the next case

      await expectError(`insert into finance.ledger_transactions (kind, idempotency_key) values ('trip_settlement', $1)`, ['trip:demo:settle'], /duplicate key/)

      await db.query('savepoint t')
      const bad = (await tx('trip:unbalanced:settle')).rows[0].id
      await db.query('insert into finance.ledger_entries (transaction_id, account_id, amount_halalas) values ($1, $2, 800)', [bad, clearing])
      await expect(db.query('set constraints all immediate')).rejects.toThrow(/unbalanced/)
      await db.query('rollback to savepoint t')

      await expectError('delete from finance.ledger_entries', [], /append-only/)
    })

    it('lets a provisional pricing draft coexist with an approved plan, but not two approved plans', async () => {
      const admin = (await db.query(`insert into admin.admin_users (email, name) values ('ops@example.test', 'Ops') returning id`)).rows[0].id
      const plan = (from: string, status: string) =>
        db.query(
          `insert into market.pricing_plans (city_id, category_id, currency, base_fare, per_km, per_min, min_fare_halalas, waiting_free_mins, waiting_per_min,
             cancel_grace_mins, cancel_after_grace_halalas, cancel_after_arrival_halalas, commission_bps, approval_status, approved_by, approved_at, effective)
           values ($1, 'comfort', 'SAR', 6, 1.5, 0.3, 1200, 3, 0.5, 2, 500, 1000, 2000, $2, $3, $4, tstzrange($5::timestamptz, null))`,
          [cityId, status, status === 'approved' ? admin : null, status === 'approved' ? new Date() : null, from],
        )
      await plan('2030-01-01', 'approved')
      await plan('2030-01-01', 'provisional')
      await db.query('savepoint t')
      await expect(plan('2030-06-01', 'approved')).rejects.toThrow(/pricing_plans_no_overlap/)
      await db.query('rollback to savepoint t')
    })

    it('keeps the phone format rule except for anonymised users', async () => {
      await expectError(`insert into core.users (phone_e164) values ('0500000000')`, [], /users_phone_valid/)
      const id = await newUser('+966500000099')
      await db.query(`update core.users set phone_e164 = null, phone_hash = '\\x01', status = 'deleted', deleted_at = now() where id = $1`, [id])
    })
  })
})
