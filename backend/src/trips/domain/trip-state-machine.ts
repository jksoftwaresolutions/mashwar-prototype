/**
 * Server-authoritative trip state machine (docs/phase1/04-trip-lifecycle-spec.md).
 * Pure TypeScript, no framework imports. The database guard trigger enforces the same
 * transitions from ride.trip_status_transitions (db/migrations/0002_reference_data.sql);
 * a unit test keeps the two in sync.
 */
export const TRIP_STATUSES = ['requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled', 'expired'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export type TripActor = 'rider' | 'captain' | 'system' | 'admin'

export const TERMINAL_STATUSES: ReadonlySet<TripStatus> = new Set(['completed', 'cancelled', 'expired'])
export const ACTIVE_STATUSES: ReadonlySet<TripStatus> = new Set(['requested', 'accepted', 'arrived', 'in_progress'])

interface Transition {
  from: TripStatus
  to: TripStatus
  actors: readonly TripActor[]
}

export const TRIP_TRANSITIONS: readonly Transition[] = [
  { from: 'requested', to: 'accepted', actors: ['captain'] },
  { from: 'requested', to: 'cancelled', actors: ['rider', 'admin'] },
  { from: 'requested', to: 'expired', actors: ['system'] }, // no captain found before the search timeout
  { from: 'accepted', to: 'arrived', actors: ['captain'] },
  { from: 'accepted', to: 'requested', actors: ['captain', 'system'] }, // captain cancels or no-show: re-dispatch
  { from: 'accepted', to: 'cancelled', actors: ['rider', 'admin'] },
  { from: 'arrived', to: 'in_progress', actors: ['captain'] },
  { from: 'arrived', to: 'cancelled', actors: ['rider', 'captain', 'admin'] }, // captain only for rider no-show
  { from: 'in_progress', to: 'completed', actors: ['captain'] },
  { from: 'in_progress', to: 'cancelled', actors: ['admin'] }, // T14, mandatory reason
]

// Lookup keyed by "from>to": transitions are checked on every trip command.
const byKey = new Map(TRIP_TRANSITIONS.map((t) => [`${t.from}>${t.to}`, t]))

export type TransitionCheck =
  | { ok: true }
  | { ok: false; code: 'TRIP_TERMINAL' | 'INVALID_TRANSITION' | 'ACTOR_NOT_ALLOWED' }

export function checkTransition(from: TripStatus, to: TripStatus, actor: TripActor): TransitionCheck {
  if (TERMINAL_STATUSES.has(from)) return { ok: false, code: 'TRIP_TERMINAL' }
  const t = byKey.get(`${from}>${to}`)
  if (!t) return { ok: false, code: 'INVALID_TRANSITION' }
  if (!t.actors.includes(actor)) return { ok: false, code: 'ACTOR_NOT_ALLOWED' }
  return { ok: true }
}

export function nextStatuses(from: TripStatus, actor: TripActor): TripStatus[] {
  return TRIP_TRANSITIONS.filter((t) => t.from === from && t.actors.includes(actor)).map((t) => t.to)
}
