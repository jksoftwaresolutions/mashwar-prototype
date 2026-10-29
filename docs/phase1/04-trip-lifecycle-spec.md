# 04 — Trip Lifecycle Specification

**Status:** Draft for client review — Phase 1
**Source of current behaviour:** `src/store.tsx` (ride simulation), `src/config/market.ts` (fee rules), `src/Driver.tsx` (offer UI)
**Production rule:** the backend owns the trip state. Apps send *commands*. The server validates them, changes the state and broadcasts *events*. No client timer may change a trip's state in production.

Status tags: **[P]** works in the prototype (simulated) · **[D]** designed or documented only · **[X]** production, not yet implemented.

---

## 1. States

| State | Arabic label (UI) | Meaning | Terminal | In prototype |
|---|---|---|---|---|
| `requested` | جاري البحث | The rider has confirmed; the system is looking for a captain | No | [P] |
| `accepted` | في الطريق | A captain has accepted and is driving to pickup | No | [P] |
| `arrived` | وصل الكابتن | The captain is at pickup and waiting for the rider | No | [P] |
| `in_progress` | الرحلة جارية | The rider is on board and the trip has started | No | [P] |
| `completed` | مكتملة | The trip has ended at the destination. Settlement follows | Yes | [P] |
| `cancelled` | ملغاة | Cancelled before start by the rider (prototype). In production also by the captain, admin or the system | Yes | [P] (rider only) |
| `expired` *(proposed)* | لا يوجد كابتن | No captain accepted within the search timeout | Yes | [X] |

**Offer sub-state (production, per captain):** `offered → accepted | declined | timed_out | withdrawn`. This sits inside `requested` and is tracked in a separate `trip_offers` table. The prototype has one implicit offer, with a single `rejected` flag on the trip.

## 2. State diagram

```mermaid
stateDiagram-v2
    [*] --> requested : rider confirms request

    requested --> accepted : captain accepts offer
    requested --> requested : captain declines / offer times out → re-offer to next captain
    requested --> cancelled : rider cancels (free)
    requested --> expired : search timeout, no captain (proposed)

    accepted --> arrived : captain marks arrived (geofence check in production)
    accepted --> cancelled : rider cancels (free within grace, fee after)
    accepted --> requested : captain cancels → re-dispatch (proposed)

    arrived --> in_progress : captain starts trip
    arrived --> cancelled : rider cancels (arrival fee)
    arrived --> cancelled : captain reports rider no-show (proposed)

    in_progress --> completed : captain ends trip

    completed --> [*]
    cancelled --> [*]
    expired --> [*]
```

## 3. Transitions

| # | From → To | Command (prototype function) | Actor | Guards (server-side in production) | Side effects |
|---|---|---|---|---|---|
| T1 | ∅ → `requested` | `requestRide` | Rider | Rider authenticated and not blocked [X]. No other active trip for this rider [P]. Pickup inside an enabled service area [X]. A valid quote token that has not expired [X]. Coupon valid: active, under its limit [P], not expired [X], per-user limit [X]. Payment method valid; card pre-authorization succeeds [X] | Trip created with a **locked fare quote** [P]. Coupon usage reserved [P counts immediately]. Dispatch starts [X]. Notify: captain(s) (offer), admin (new request) [P] |
| T2 | `requested` → `accepted` | `acceptRide` | Captain | Captain approved, online, not on another trip, category eligible [X]. Offer still open for this captain [X]. **First accept wins**: atomic conditional update [X] | `driverId` and `acceptedAt` set [P]. Captain status → `enroute` [P]. Other open offers withdrawn [X]. Notify: rider ("Captain X accepted"), admin [P] |
| T3 | `requested` → `requested` (re-offer) | `rejectRide` | Captain (decline) or System (timeout) | The offer belongs to this captain and is still open | Offer marked declined / timed out [X]. Next eligible captain offered [X]. The prototype marks `rejected` and auto-assigns demo captain `d4` after **3 s** [P]. Notify: admin ("reassigned") [P], rider (optional) |
| T4 | `requested` → `cancelled` | `cancelRide` | Rider | Status is `requested` | Fee = 0 [P]. Pre-authorization voided [X]. Open offers withdrawn [X]. Coupon reservation released [X; prototype keeps the use]. Notify: admin [P], offered captain [X] |
| T5 | `requested` → `expired` | — | System | Search timeout reached with no acceptance | Pre-authorization voided. Coupon released. Notify rider ("No captains available"), admin. [X] |
| T6 | `accepted` → `arrived` | `arrive` | Captain (manual) or simulated captain (auto) | Status `accepted`. In production, the captain is within an *X m* geofence of pickup (proposed 100–150 m) [X] | `arrivedAt` set (starts the waiting clock) [P]. Notify: rider ("Your captain has arrived") [P for manual only] |
| T7 | `accepted` → `cancelled` | `cancelRide` | Rider | Status `accepted` | Fee = 0 if `now − acceptedAt ≤ graceMins`, else `riderAfterGrace` [P]. Captain → `available` [P]. Notify: admin [P], **captain [X — missing in prototype]** |
| T8 | `accepted` → `requested` *(proposed)* | — | Captain cancels | Status `accepted` | Captain penalty or acceptance-rate impact (decision). Re-dispatch keeping the original quote. Notify the rider. [X] |
| T9 | `arrived` → `in_progress` | `startRide` | Captain (manual) or simulated captain (auto, 4 s after arrival) | Status `arrived`. Optional rider PIN / verification (decision) [X] | `startedAt` set. **Waiting fee computed and frozen** from `startedAt − arrivedAt` [P]. Captain → `ontrip` [P manual only]. Notify: admin [P], rider [X] |
| T10 | `arrived` → `cancelled` | `cancelRide` | Rider | Status `arrived` | Fee = `riderAfterArrival` [P]. Captain → `available` [P]. Notify: admin [P], captain [X] |
| T11 | `arrived` → `cancelled` *(proposed)* | — | Captain (rider no-show) | Status `arrived` and `now − arrivedAt ≥ noShowMins` (decision). Captain inside the geofence | No-show fee charged to the rider (decision; see 05). Captain compensated (decision). [X] |
| T12 | `in_progress` → `completed` | `endRide` | Captain (manual) or simulated captain (auto) | Status `in_progress`. In production, a location sanity check near the destination or a confirmation prompt [X] | `endedAt` set [P]. Final fare: locked quote, or recalculated from the actual route (decision) [X]. Settlement (section 6). Captain → `available`, rides +1 [P]. Rider rides +1 and spend + total [P]. Notify: rider ("Rate your trip"), admin [P] |
| T13 | `completed` (rating) | `rate` | Rider | Trip `completed`, not already rated, by the trip's rider | Rating and review stored [P]. Captain average updated [X]. Notify: captain, admin [P]. Low rating flags support [X] |
| T14 | Any non-terminal → `cancelled` *(proposed)* | — | Admin | Admin role with permission. A reason code is required | Fee override (none / standard / custom). Audit-log entry. Notify both parties. [X] |

**Not allowed:** cancelling from `in_progress` (the prototype hides the button and the guard rejects it). Mid-trip termination (safety, breakdown) is handled as *end trip early*, which completes the trip with the fare so far, or by an admin cancellation with a reason. This needs a client decision.

## 4. Timeouts and timers

| Timer | Value (current / proposed) | Owner in production | Prototype behaviour |
|---|---|---|---|
| Captain offer window | **30 s** | Server (offer `expires_at`) | Countdown shown [P]; at 0 the offer expires and is passed on like a decline [P] (G1, fixed) |
| Reassignment after decline | Immediate re-offer (proposed) | Server dispatch | Fixed 3 s delay, then always captain `d4` [P] |
| Total search timeout → `expired` | To be decided (for example 3–5 min) | Server | Not implemented. The request waits indefinitely |
| Max offers per request | To be decided (for example 5–10 captains) | Server | — |
| Rider free-cancellation grace after acceptance | **2 min** (`graceMins`) | Server | [P] |
| Free waiting after arrival | **3 min** (`freeMins`) | Server | [P] |
| Waiting fee rate | **0.5 SAR per started minute** after free time | Server | [P] |
| Rider no-show threshold | To be decided (for example 5 min after arrival) | Server | Not implemented |
| Quote validity (quote → request) | To be decided (for example 2–5 min) | Server | Fare is locked at request. No expiry |
| Rating window | To be decided (for example 72 h) | Server | Unlimited, until dismissed |
| Simulated approach to pickup | ~14.5 s (`+0.035` every 500 ms) | — | [P] simulation only |
| Simulated auto-start after arrival | 4 s (non-demo captains only) | — | [P] simulation only |
| Simulated trip progress | ~23 s (`+0.022` every 500 ms) | — | [P] simulation only |

## 5. Cancellation paths

| Path | Actor | State at cancel | Fee to rider (current rule) | Captain compensation | Status |
|---|---|---|---|---|---|
| Cancel while searching | Rider | `requested` | 0 | — | [P] |
| Cancel within grace | Rider | `accepted`, ≤ 2 min since accept | 0 | — | [P] |
| Cancel after grace | Rider | `accepted`, > 2 min since accept | 5 SAR (`riderAfterGrace`) | Decision | [P] fee · [X] compensation |
| Cancel after arrival | Rider | `arrived` | 10 SAR (`riderAfterArrival`), regardless of time waited | Decision | [P] fee · [X] compensation |
| Rider no-show | Captain | `arrived`, ≥ threshold | Decision | Decision | [X] |
| Captain cancels | Captain | `accepted` | 0 (re-dispatch) | Penalty decision | [X] |
| No captain found | System | `requested` | 0 | — | [X] |
| Admin cancels | Admin | any non-terminal | Admin chooses | Admin chooses | [X] |

All values are **provisional** (see `05-fare-and-fee-rules.md`). Every cancellation records `cancelled_by`, `reason_code` and `cancelled_at`. The prototype records none of these.

## 6. Settlement on completion

Settlement runs **exactly once** per trip.

1. Compute the rider total: `fare − discount + waitingFee` (see 05).
2. **Card:** capture against the pre-authorization (or the remainder of a partial capture). Issue the e-invoice / receipt.
3. **Cash:** the captain collects the total. The platform's commission is booked as a captain debt in the cash ledger (see 10).
4. Credit the captain's earnings with `captainNet`. Record the platform commission and the promotion cost.
5. Update the rider and captain aggregates (rides, spend). Release the captain to `available`.
6. Emit `trip.completed` and `trip.settled` events.

Prototype: a React effect settles the live trip when `settled` is false. `endRide` marks it settled inline [P]. There is no capture, no invoice and no ledger.

## 7. Side effects and notification matrix

| Event | Rider | Captain | Admin | Prototype |
|---|---|---|---|---|
| Request created | Toast "finding a captain" | Offer (push + in-app) | Feed item | [P] (in-app only) |
| Offer declined / reassigned | (optional) "Still searching" | Next captain offered | Feed item | [P] admin only |
| Accepted | Push "Captain X is on the way" | — | Feed item | [P] |
| Arrived | Push "Your captain has arrived" | Waiting timer | — | [P] manual captain only |
| Started | "Trip started" | — | Feed item | [P] admin only |
| Completed | Push "Rate your trip" and receipt | Earnings summary | Feed item | [P] |
| Rated | — | "You received N stars" | Feed item | [P] |
| Cancelled by rider | Toast with fee | **Push "Rider cancelled"** | Feed item | [P] admin only (gap G3) |
| Expired | "No captains available" | — | Feed item | [X] |

Captain status changes: `available → enroute` (T2), `enroute → ontrip` (T9), `→ available` (T4, T7, T10, T12). Suspending a captain forces `offline` [P in admin data only].

## 8. Idempotency and concurrency (production)

| Concern | Rule |
|---|---|
| Duplicate commands (retries, double taps) | Every mutating request carries an `Idempotency-Key` (UUID). The server stores the key with its result for ≥ 24 h and returns the same result on a repeat |
| Accept race (two captains) | Conditional update: `UPDATE trips SET status='accepted', captain_id=$1, version=version+1 WHERE id=$2 AND status='requested'`. Zero rows means "offer no longer available" |
| Stale clients | Each trip has a `version`. Commands may carry `expectedVersion`; a mismatch gives `409 Conflict` and the client refreshes |
| Rider cancels as the captain arrives | Transitions are serialised per trip (row lock or single-writer queue). Whichever commits first wins, and the other gets `409` with the current state |
| Event delivery | Transactional outbox. Events carry `tripId`, `seq` and `occurredAt`. Clients ignore events with `seq` ≤ the last applied one. Delivery is at least once |
| Settlement | A unique constraint on `(trip_id)` in `settlements`. Payment capture uses the PSP's idempotency key derived from the trip ID |
| Reconnect | On WebSocket reconnect the client fetches `GET /trips/{id}` (snapshot) and then resumes the event stream |

## 9. Server-authoritative rules (production)

1. **State lives only on the server.** Apps render server state and never advance it locally. This replaces the prototype's `setInterval` movement and auto-advance.
2. **Timers run on the server** (offer expiry, search timeout, grace, waiting, no-show) using durable scheduled jobs, not app timers.
3. **Prices are computed only on the server.** The app shows the quote returned by `POST /quotes`. The request references the quote ID. Fees and commission are applied server-side.
4. **Location is evidence, not authority.** Captain GPS feeds geofence checks (arrived, ended) and fraud signals. The server decides.
5. **Every transition is logged** to an append-only `trip_events` table: actor, command, previous / next state, timestamp and metadata.
6. **Permissions per actor:** riders can only create, cancel and rate their own trips; captains can only act on trips assigned to them; admin actions require RBAC and an audit entry.

## 10. Prototype simulation summary

| Behaviour | How the prototype simulates it |
|---|---|
| Single shared state | A React Context in one browser tab acts as "backend", rider, captain and admin |
| Demo captain `d1` | The user drives every step manually in the Captain app |
| Other captains (for example `d4` after a decline) | Auto-arrive when the approach reaches 100 %, auto-start after 4 s, auto-complete at 100 % progress |
| Movement | Interpolated `approach` / `progress` values on an SVG map. No GPS |
| Demo panel | "Next step" (`advance`) calls the next transition. "Fast finish" (`fastForward`) jumps to `completed` or creates a completed trip. "Reset" restores the seed data |
| Persistence | None. A reload resets everything |
