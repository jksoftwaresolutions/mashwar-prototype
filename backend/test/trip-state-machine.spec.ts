import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkTransition, nextStatuses, TRIP_STATUSES, TRIP_TRANSITIONS, type TripStatus } from '../src/trips/domain/trip-state-machine'

describe('trip state machine', () => {
  it('follows the happy path with the right actors', () => {
    const path: [TripStatus, TripStatus, 'captain'][] = [
      ['requested', 'accepted', 'captain'],
      ['accepted', 'arrived', 'captain'],
      ['arrived', 'in_progress', 'captain'],
      ['in_progress', 'completed', 'captain'],
    ]
    for (const [from, to, actor] of path) expect(checkTransition(from, to, actor)).toEqual({ ok: true })
  })

  it('never leaves a terminal state', () => {
    for (const from of ['completed', 'cancelled', 'expired'] as const)
      for (const to of TRIP_STATUSES) expect(checkTransition(from, to, 'admin')).toEqual({ ok: false, code: 'TRIP_TERMINAL' })
  })

  it('rejects skipped steps and unknown transitions', () => {
    expect(checkTransition('requested', 'completed', 'captain')).toEqual({ ok: false, code: 'INVALID_TRANSITION' })
    expect(checkTransition('accepted', 'in_progress', 'captain')).toEqual({ ok: false, code: 'INVALID_TRANSITION' })
    expect(checkTransition('requested', 'requested', 'system')).toEqual({ ok: false, code: 'INVALID_TRANSITION' })
  })

  it('enforces who may act', () => {
    expect(checkTransition('requested', 'accepted', 'rider')).toEqual({ ok: false, code: 'ACTOR_NOT_ALLOWED' })
    expect(checkTransition('in_progress', 'cancelled', 'rider')).toEqual({ ok: false, code: 'ACTOR_NOT_ALLOWED' })
    expect(checkTransition('in_progress', 'cancelled', 'captain')).toEqual({ ok: false, code: 'ACTOR_NOT_ALLOWED' })
    expect(checkTransition('in_progress', 'cancelled', 'admin')).toEqual({ ok: true })
    expect(checkTransition('requested', 'expired', 'rider')).toEqual({ ok: false, code: 'ACTOR_NOT_ALLOWED' })
  })

  it('re-dispatches when a captain gives up an accepted trip', () => {
    expect(checkTransition('accepted', 'requested', 'captain')).toEqual({ ok: true })
    expect(nextStatuses('accepted', 'captain').sort()).toEqual(['arrived', 'requested'])
  })

  it('matches ride.trip_status_transitions in the reference-data migration', () => {
    const sql = readFileSync(join(__dirname, '..', 'db', 'migrations', '0002_reference_data.sql'), 'utf8')
    const block = sql.slice(sql.indexOf('insert into ride.trip_status_transitions'), sql.indexOf(';', sql.indexOf('insert into ride.trip_status_transitions')))
    const rows = [...block.matchAll(/\('(\w+)',\s*'(\w+)',\s*'\{([\w,]+)\}'\)/g)].map((m) => `${m[1]}>${m[2]}:${m[3].split(',').sort().join(',')}`).sort()
    const code = TRIP_TRANSITIONS.map((t) => `${t.from}>${t.to}:${[...t.actors].sort().join(',')}`).sort()
    expect(rows).toEqual(code)
  })
})
