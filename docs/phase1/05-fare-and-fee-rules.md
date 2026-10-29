# 05 — Fare and Fee Rules

**Status:** Draft for client review — Phase 1
**Source:** `src/config/market.ts` (`MARKETS.SA.pricing`, `commission`, `waitingFee`, `cancellationFee`, `captainNet`), `src/store.tsx` (`calcFare`, `estimate`, `tripTotal`, coupon discount)

> ## ⚠ All commercial values are PROVISIONAL
>
> Every fare, fee, multiplier, coupon value and the **20 % platform commission** in this document and in the prototype is a **demo placeholder**. **None of them has been approved by the client.** `market.ts` marks them as `commission.status = 'provisional'` and `pricingStatus = 'provisional'`. They must not be used for launch, contracts, captain communications or marketing until the client signs off section 8.

This document records the formulas **exactly as the prototype implements them**, so that the client can approve or change both the formulas and the values. In production the same rules run **only on the server**.

---

## 1. Trip fare

```
fare = max( minFare, round( (base + km × perKm + min × perMin) × categoryMultiplier ) )
```

- `km` and `min` are the trip's estimated distance and duration at request time. The fare is **locked when the ride is requested** and does not change if pricing is edited mid-trip.
- `round` is JavaScript `Math.round`: halves round up, to whole SAR.
- The minimum fare is applied **after** the category multiplier, and **before** any discount.
- Prototype-only distance model: `km = round(manhattan_px / 26, 1 dp) + 1.2` and `min = round(km × 1.9 + 4)`. In production, distance and time come from the routing provider.

## 2. Coupon discount

```
discount = min( maxOff, round( fare × pct / 100 ) )
```

- Applied to the trip `fare` only. It is **not** applied to waiting or cancellation fees.
- Validity in the prototype: the code exists, `active = true` and `uses < limit` and the expiry date is today or later (G6, fixed in this build).
- The rider total can fall below `minFare` after a discount. A decision is needed (section 8).

## 3. Waiting fee

```
over       = waitMinutes − freeMins           // waitMinutes = (startedAt − arrivedAt) / 60 000 ms
waitingFee = over > 0 ? ceil(over) × perMin : 0
```

- Charged **per started minute** after the free period (for example, 3 min 01 s of waiting with `freeMins = 3` counts as 1 chargeable minute).
- The clock starts when the captain marks *arrived* and stops when the captain starts the trip. The fee is frozen at start.
- With `perMin = 0.5` the fee can be fractional (for example 1.5 SAR), even though the currency is configured with 0 decimals. A rounding decision is needed.

## 4. Rider cancellation fee

| Trip state when the rider cancels | Fee |
|---|---|
| `requested` (still searching) | **0** |
| `accepted` and `now − acceptedAt ≤ graceMins` | **0** |
| `accepted` and `now − acceptedAt > graceMins` | `riderAfterGrace` |
| `arrived` | `riderAfterArrival`. This applies immediately on arrival, whatever the waiting time |
| `in_progress` | Not cancellable |

- The grace check is strictly *greater than*: exactly 2:00 after acceptance is still free.
- A cancelled trip's total is the cancellation fee only (`tripTotal` returns `cancelFee`).
- **Captain no-show** (captain never arrives) and **rider no-show** (captain cancels after waiting) are **not implemented**. See section 8.

## 5. Rider total and captain net

```
riderTotal  = status == 'cancelled' ? cancelFee : fare − discount + waitingFee
captainNet  = round( riderTotal × (1 − commission) )
platformFee = riderTotal − captainNet
```

- Commission is applied to the **rider-paid total after the discount**. This means the captain shares the cost of every coupon. It is a provisional modelling choice, and the client must confirm or change it.
- `captainNet` rounds per trip to whole SAR, so the effective commission on a single trip can differ from the nominal rate (see the worked example).
- The admin Payments page computes commission on the **sum** of all trips (one rounding), so its totals can differ slightly from the sum of per-trip captain earnings.

---

## 6. Current demo values (Saudi Arabia / Riyadh): PROVISIONAL

| Parameter | Key | Value | Unit |
|---|---|---|---|
| Base fare | `base` | 6.00 | SAR |
| Per kilometre | `perKm` | 1.55 | SAR / km |
| Per minute | `perMin` | 0.30 | SAR / min |
| Minimum fare | `minFare` | 12 | SAR |
| Multiplier: Economy (اقتصادي) | `mult.economy` | × 1.00 | — |
| Multiplier: Comfort (مريح) | `mult.comfort` | × 1.42 | — |
| Multiplier: Family (عائلي) | `mult.family` | × 1.88 | — |
| Free waiting | `waiting.freeMins` | 3 | min |
| Waiting rate | `waiting.perMin` | 0.50 | SAR / started min |
| Free cancellation grace after acceptance | `cancellation.graceMins` | 2 | min |
| Rider cancel fee after grace | `cancellation.riderAfterGrace` | 5 | SAR |
| Rider cancel fee after arrival | `cancellation.riderAfterArrival` | 10 | SAR |
| Platform commission | `commission.rate` | 20 % (0.20) | of rider total |
| Currency | `currency` | SAR, 0 decimals | — |
| Service areas | `areas` | North, Central, East, KKIA Airport = on; West = off | (toggles have no effect on booking yet) |

Demo coupons (seed data): `WELCOME15` 15 % up to 15 SAR · `RIYADH10` 10 % up to 10 SAR · `WEEKEND20` 20 % up to 20 SAR · `RAMADAN25` 25 % up to 25 SAR (inactive).

Vehicle categories: Economy (4 seats), Comfort (4 seats), Family (7 seats). The demo ETAs of 3 / 5 / 7 min are display-only.

## 7. Worked example (demo values)

**Route:** Al Olaya, Tahlia St → King Abdullah Financial District. Prototype estimate: **9.5 km, 22 min**.

**Step 1: metered amount before the multiplier**
`6 + 9.5 × 1.55 + 22 × 0.30 = 6 + 14.725 + 6.60 = 27.325 SAR`

**Step 2: fare per category**

| Category | Calculation | Rounded | After `minFare` (12) |
|---|---|---|---|
| Economy | 27.325 × 1.00 = 27.325 | 27 | **27 SAR** |
| Comfort | 27.325 × 1.42 = 38.80 | 39 | **39 SAR** |
| Family | 27.325 × 1.88 = 51.37 | 51 | **51 SAR** |

**Step 3: a Comfort ride with coupon `WELCOME15`, and the rider boards 5 min 20 s after the captain arrives, paying by card**

| Line | Calculation | Amount |
|---|---|---|
| Fare | from step 2 | 39.00 |
| Discount | min(15, round(39 × 15 / 100 = 5.85)) = 6 | − 6.00 |
| Waiting fee | over = 5.33 − 3 = 2.33 → ceil = 3 min × 0.50 | + 1.50 |
| **Rider total** | 39 − 6 + 1.5 | **34.50 SAR** |
| Captain net | round(34.50 × 0.80 = 27.60) | **28.00 SAR** |
| Platform fee | 34.50 − 28.00 | **6.50 SAR** (effective 18.8 %, not 20 %, because of rounding) |

**Cancellation variants of the same booking**

| Scenario | Fee |
|---|---|
| Rider cancels while searching | 0 SAR |
| Rider cancels 1 min 30 s after acceptance | 0 SAR |
| Rider cancels 2 min 10 s after acceptance, captain still en route | 5 SAR |
| Rider cancels after the captain has arrived (any waiting time) | 10 SAR |

VAT is **not** shown or calculated anywhere in the prototype.

---

## 8. Decisions the client must make

| # | Decision | Options to consider | Current prototype behaviour |
|---|---|---|---|
| D1 | **Commission model** | Flat % of the total · % of the fare only (fees go fully to the captain or the platform) · fixed fee per trip · tiered by volume · subscription / daily fee | Flat 20 % of the rider total (provisional) |
| D2 | **Commission base vs promotions** | Platform funds coupons (captain earns on the pre-discount fare) · shared (current) · campaign-specific | Shared: commission on the post-discount total |
| D3 | **All fare parameters** | Base, per km, per min, minimum, multipliers per category, per city / zone | Demo values in section 6 |
| D4 | **Surge / dynamic pricing** | None at launch · capped multiplier by zone and time · scheduled peak pricing. If used: cap, transparency rules, regulatory check | None |
| D5 | **VAT treatment** | Prices VAT-inclusive or exclusive. VAT on fare, waiting fee, cancellation fee and commission. Who is the supplier of transport (platform or captain). Invoice issuer. *Must be confirmed with a tax advisor* | VAT not modelled |
| D6 | **Waiting fee** | Free minutes, rate, per started minute or per second, cap, whether the captain sees a timer | 3 free min, 0.5 SAR per started min, no cap, no captain timer |
| D7 | **Rider cancellation fees** | Grace length, fee after grace, fee after arrival. Whether the arrival fee waits until the free waiting ends. Who receives the fee (captain share) | 2 min grace, 5 SAR, 10 SAR immediately on arrival. No captain share defined |
| D8 | **Rider no-show fee** | Threshold (minutes after arrival), fee amount, captain compensation | Not implemented |
| D9 | **Captain no-show / late cancellation** | Penalty, acceptance-rate impact, rider credit | Not implemented |
| D10 | **Rounding** | Whole SAR vs 2 decimals for fares and fees. Rounding mode (half-up, bankers'). Round per line or on the total. Captain-net rounding (favour the captain?) | Whole-SAR fare; fractional waiting fee; captain net rounded half-up per trip |
| D11 | **Minimum fare vs discounts** | Allow the total below the minimum, or floor the rider total at the minimum | Total can fall below the minimum |
| D12 | **Final fare basis** | Locked upfront quote · recalculate from the actual route / time · upfront with a deviation threshold (for example ±20 %) | Locked at request |
| D13 | **Airport fees** | Pickup / drop-off surcharge at KKIA (and other airports). Airport zone rules. Pass-through of any airport access charges | None. The airport is only a service-area toggle |
| D14 | **Tolls and parking** | Pass-through to the rider, included in the fare, or not applicable in the launch city | None |
| D15 | **Booking / service fee** | Fixed per-trip platform fee to the rider, separate from the fare | None |
| D16 | **Category multipliers vs separate rate cards** | Keep one formula with multipliers, or separate base / km / min per category | One formula with multipliers |
| D17 | **Coupon rules** | Expiry enforcement, per-user limits, first-ride only, minimum fare, budget caps, stacking | %, cap and total limit only. No expiry check |
| D18 | **Cash trips** | Same prices as card? Rounding of cash totals to convenient amounts? | Same prices |

**Approval record**

| Item | Approved value / rule | Approved by | Date |
|---|---|---|---|
| D1 Commission model and rate | | | |
| D3 Fare parameters | | | |
| D5 VAT treatment | | | |
| D6–D9 Waiting, cancellation, no-show | | | |
| D10 Rounding | | | |
| Others | | | |
