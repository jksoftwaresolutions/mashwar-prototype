# 01 — Approved Design Checklist

**Status:** Draft for client review — Phase 1
**Applies to:** React review prototype (this repository), Riyadh / Saudi Arabia market configuration
**Purpose:** Record the client's sign-off, or requested changes, for every screen and cross-cutting design rule before production design and development start.

## How to use this checklist

1. Open the prototype and go through each item. The **Where** column says where to find the screen.
2. Tick **Approved** or **Changes requested** for each item. Write any change in **Notes**.
3. An item counts as approved only when **Approved** is ticked and **Notes** is empty or says "none".
4. Approval covers **layout, content, flow and visual design only**. It does not approve the commercial values shown on screen (fares, fees, commission, coupons). Those are provisional, and the client approves them separately in `05-fare-and-fee-rules.md`.
5. Anything labelled *simulated*, *demo* or *illustrative* in the prototype is approved as a **design** only. Production integrations are listed in `03-requirements-and-scope.md`.

Legend: `[ ]` = not yet reviewed, `[x]` = ticked by the client.

---

## A. Showcase (landing / presentation screen)

| # | Item | Where | Approved | Changes requested | Notes |
|---|---|---|---|---|---|
| A1 | Header: logo, "Prototype with simulated data" badge, language switch | Showcase, top | [ ] | [ ] | |
| A2 | Hero: headline, Phase 1 review label (Riyadh), route brand mark | Showcase, hero | [ ] | [ ] | |
| A3 | Three entry cards: Rider app, Captain app, Admin dashboard | Showcase, hero | [ ] | [ ] | |
| A4 | Device stage: rider phone (trip in progress), captain phone (new request), admin "same ride" chip | Showcase, right of hero | [ ] | [ ] | |
| A5 | "Ride lifecycle, end to end" five steps and the "Start the guided demo" button | Showcase, middle | [ ] | [ ] | |
| A6 | "What's simulated" panel (maps, payments, SMS, analytics) and the provisional-commission notice | Showcase, lower section | [ ] | [ ] | |
| A7 | Footer: "MASHWAR is a working name" disclaimer | Showcase, footer | [ ] | [ ] | Brand name is a working name. Final name is an open question. |
| A8 | Prototype shell: top bar, role switcher, story panel (≥1280 px), demo control panel (≥1024 px), reset | Any app view | [ ] | [ ] | Review tool only. It does not ship in production. |

## B. Rider app (تطبيق الراكب)

| # | Item | Where | Approved | Changes requested | Notes |
|---|---|---|---|---|---|
| B1 | Welcome screen: map backdrop, city chip, tagline, Create account / Log in, terms notice | Onboarding | [ ] | [ ] | |
| B2 | Phone entry: full name (register only), +966 prefix, 9-digit validation | Onboarding → phone | [ ] | [ ] | |
| B3 | OTP screen: 4 digits, 30 s resend timer, demo-code notice and autofill | Onboarding → OTP | [ ] | [ ] | Production OTP length and expiry still to be decided. |
| B4 | Home: greeting, notifications bell with badge, pickup card, map with nearby cars, "Where to?" | Home tab | [ ] | [ ] | |
| B5 | Home shortcuts: Home / Work, recent destinations, promo banner, tap-map-to-pick hint | Home tab | [ ] | [ ] | |
| B6 | Search: pickup and destination fields, swap, "Choose on map", suggested places with distance | Home → Where to? | [ ] | [ ] | |
| B7 | Ride selection: category list (Economy, Comfort, Family) with seats, description, ETA, trip time and estimated fare | Booking → Choose a ride | [ ] | [ ] | |
| B8 | Booking summary: route, category, pickup ETA, payment method (card / cash), promo code, fare breakdown, confirm | Booking → Continue | [ ] | [ ] | |
| B9 | Searching state: radar animation, captains nearby, fare, Cancel request | Live trip → requested | [ ] | [ ] | |
| B10 | Captain assigned / en route: captain card (name, rating, car, plate), ETA tile, chat / call / share | Live trip → accepted | [ ] | [ ] | |
| B11 | Captain arrived: waiting-fee notice (free minutes, then a per-minute fee) | Live trip → arrived | [ ] | [ ] | Fee values are provisional. |
| B12 | Trip in progress: progress bar, arrival time, payment and total | Live trip → in progress | [ ] | [ ] | |
| B13 | Cancel confirmation: copy that changes with the fee situation (free / after grace / after arrival) | Live trip → Cancel | [ ] | [ ] | |
| B14 | Safety sheet: share trip, contact support, emergency call | Live trip → Safety | [ ] | [ ] | The emergency number shown (911) must be confirmed. |
| B15 | In-trip chat sheet with quick replies | Live trip → Chat | [ ] | [ ] | |
| B16 | Trip completed: total, duration / distance / payment, fare lines (fare, discount, waiting fee), star rating, tags, comment, Skip | Live trip → completed | [ ] | [ ] | |
| B17 | My trips: All / Completed / Cancelled filters, trip cards | Trips tab | [ ] | [ ] | |
| B18 | Trip detail sheet: map, ID, status, fields, rating, Report an issue form | Trips → a trip | [ ] | [ ] | |
| B19 | Wallet: MASHWAR balance, Top up, Coupons, saved cards (mada / Visa), default card, remove card, cash, recent transactions | Wallet tab | [ ] | [ ] | |
| B20 | Add card sheet | Wallet → Add card | [ ] | [ ] | Production uses the payment provider's secure card form (see `10-payment-gateway-plan.md`). |
| B21 | Account: profile, trips / rating / tier, menu, log out | Account tab | [ ] | [ ] | "Gold" tier is placeholder content. Loyalty is not in scope (see 03). |
| B22 | Saved addresses: list, remove, add from places | Account → Saved addresses | [ ] | [ ] | |
| B23 | Coupons list: active / expired, copy code | Account → Coupons | [ ] | [ ] | |
| B24 | Notifications list (read / unread) | Account → Notifications | [ ] | [ ] | |
| B25 | Rating history | Account → Rating history | [ ] | [ ] | |
| B26 | Support: live chat / call tiles, new complaint, my tickets with status, FAQ | Account → Support | [ ] | [ ] | |
| B27 | Language page (Arabic / English) | Account → Language | [ ] | [ ] | |

## C. Captain app (تطبيق الكابتن)

| # | Item | Where | Approved | Changes requested | Notes |
|---|---|---|---|---|---|
| C1 | Login: dark theme, "Captain app" badge, phone field, demo sign-in | Login | [ ] | [ ] | Production uses OTP plus KYC onboarding, which is not designed yet (see 03). |
| C2 | Profile confirmation: name, rating, trips, vehicle, plate, category, "approved / documents valid" | Login → profile | [ ] | [ ] | |
| C3 | Home (online): stats strip (today's earnings, trips, online hours), demand hint, online toggle, map | Home tab | [ ] | [ ] | |
| C4 | Home (offline) state and the "request waiting, go online" hint | Home tab, toggle off | [ ] | [ ] | |
| C5 | Incoming request card: 30 s countdown bar, category, estimated net earnings, distance, pickup / destination, rider and payment, Decline / Accept | Home, when a ride is requested | [ ] | [ ] | |
| C6 | Heading to pickup: turn banner, rider card, chat / call, pickup address, "I've arrived" | Active trip → accepted | [ ] | [ ] | |
| C7 | Waiting for rider: Start trip | Active trip → arrived | [ ] | [ ] | No waiting timer is shown to the captain. See Notes or 03, open question. |
| C8 | Trip in progress: elapsed time, progress, fare, destination, End trip with confirmation | Active trip → in progress | [ ] | [ ] | |
| C9 | Trip completed: net earnings, fare, platform fee %, distance, payment ("Cash — collect fare"), rider-rating status | Active trip → completed | [ ] | [ ] | Commission % is provisional. |
| C10 | Earnings: Today / Week / Month, total, chart, rides / hours / average, available payout and Payout button, recent trips | Earnings tab | [ ] | [ ] | |
| C11 | Trip history with expandable details (ID, distance, net, rider rating) | Trips tab | [ ] | [ ] | |
| C12 | Account: profile, verified badge, rating / trips / acceptance, menu, log out | Account tab | [ ] | [ ] | |
| C13 | My rating: score, distribution, rated trips | Account → My rating | [ ] | [ ] | |
| C14 | Vehicle info: car, plate, category, seats, VIN (masked), insurance, inspection | Account → Vehicle | [ ] | [ ] | |
| C15 | Documents and approval: licence, national ID, vehicle registration, background check (renewal and Upload) | Account → Documents | [ ] | [ ] | Production document list depends on TGA requirements (open question). |
| C16 | Notifications | Account → Notifications | [ ] | [ ] | |
| C17 | Support center categories, including urgent safety report | Account → Support | [ ] | [ ] | |
| C18 | Settings: receive requests, request sound, auto-accept, language | Account → Settings | [ ] | [ ] | Auto-accept is a design only and has no behaviour. Confirm whether it is wanted. |

## D. Admin dashboard (لوحة الإدارة)

| # | Item | Where | Approved | Changes requested | Notes |
|---|---|---|---|---|---|
| D1 | Shell: navy sidebar (12 sections), mobile slide-in menu, sticky top bar (search, role switcher, language, reset, notifications, profile) | All admin pages | [ ] | [ ] | |
| D2 | Overview: KPI cards, revenue and rides chart, ride-status donut, recent rides, operations map, top captains, activity timeline, quick actions | Overview | [ ] | [ ] | KPI baselines are illustrative. |
| D3 | Trips: search, status filter, table, trip detail drawer (map, timeline, fields, rating) | Trips | [ ] | [ ] | |
| D4 | Live operations: map with captain status colours, filter, legend, active-trip list, selected trip card | Live operations | [ ] | [ ] | Positions are simulated. |
| D5 | Captains: search, approval filter, table, profile drawer, approve / suspend / reactivate with confirmation | Captains | [ ] | [ ] | |
| D6 | Riders: search, list, detail panel (rides, rating, spend, history), block / unblock | Riders | [ ] | [ ] | |
| D7 | Vehicles: category filter, vehicle cards | Vehicles | [ ] | [ ] | |
| D8 | Payments: card / cash filter, collected / platform fee / captain payouts cards, transactions table | Payments | [ ] | [ ] | Simulated. Commission is provisional. |
| D9 | Promotions: coupon cards (usage, expiry, toggle), create-coupon modal | Promotions | [ ] | [ ] | |
| D10 | Ratings: all / low filter, rating cards | Ratings | [ ] | [ ] | |
| D11 | Support: status filter, ticket table, ticket drawer (message, internal note, start review, resolve) | Support | [ ] | [ ] | Internal notes are not saved in the prototype. |
| D12 | Reports: weekly / monthly, KPI cards, completed vs cancelled, revenue, popular locations, category usage, rating distribution, Export | Reports | [ ] | [ ] | Datasets are illustrative. |
| D13 | Settings (pricing): base / per km / per min / minimum fare, category multipliers, service areas, sample fare preview, save / discard | Settings | [ ] | [ ] | Waiting fees, cancellation fees and commission are not editable here yet. See 03. |

## E. Cross-cutting design rules

| # | Item | How to check | Approved | Changes requested | Notes |
|---|---|---|---|---|---|
| E1 | **Arabic is the default language** and the whole UI renders right to left | Load the prototype fresh | [ ] | [ ] | |
| E2 | **RTL mirroring**: back arrows, chevrons and send icons are mirrored. Brand, maps, media and star ratings are not | Navigate sub-pages in Arabic | [ ] | [ ] | |
| E3 | **Latin digits** for fares, times and IDs in Arabic (`ar-SA-u-nu-latn`) | Booking summary in Arabic | [ ] | [ ] | Confirm Latin digits, or Arabic-Indic (٠١٢٣) instead. |
| E4 | IDs, plates, codes and phone numbers render left to right / monospaced | Trip detail, captain card | [ ] | [ ] | |
| E5 | **English** version complete and natural, LTR layout | Switch language on any screen | [ ] | [ ] | |
| E6 | Typography: IBM Plex Sans Arabic and Inter. No letter-spacing on Arabic | Any screen | [ ] | [ ] | |
| E7 | Colour tokens (navy, emerald, gold, mint) and status colours. Status is never shown by colour alone | Status badges, timeline | [ ] | [ ] | |
| E8 | **Mobile widths 375–430 px**: no horizontal scroll, sheets max 64–68 % height, primary CTA 56 px, safe-area padding | Browser device mode at 375, 390, 430 | [ ] | [ ] | |
| E9 | Admin responsive: sidebar from 1024 px, slide-in menu below, tables scroll horizontally | Resize the admin view | [ ] | [ ] | |
| E10 | **Accessibility (design level)**: touch targets ≥44 px, text ≥10 px, AA contrast for muted text at ≥14 px, labelled icon buttons, `role="switch"` toggles, Esc / backdrop closes overlays | Keyboard and screen-reader spot check | [ ] | [ ] | A formal WCAG 2.1 AA audit is a production task. |
| E11 | **Reduced motion**: animations disabled under `prefers-reduced-motion` | OS setting "reduce motion" | [ ] | [ ] | |
| E12 | **Simulated vs real labelling**: every simulated feature says so on screen (OTP "1234", "Live trip · simulated", demo calls, "Simulated payment", "Illustrative figures", "Simulated positions") | Walk the full demo | [ ] | [ ] | Production builds must remove all demo labels and the demo shell. |
| E13 | **Provisional commercial values** are labelled as such (Showcase notice, cancel-dialog suffix) | Showcase; cancel dialog | [ ] | [ ] | Not every screen with a fee or commission carries the label, for example the captain request card and admin Payments. |
| E14 | Toast feedback tones (success / info / warn) and confirmation dialogs for destructive actions | Cancel trip, remove card, suspend captain | [ ] | [ ] | |

---

## Sign-off

| Role | Name | Decision | Date | Signature |
|---|---|---|---|---|
| Client product owner | | ☐ Approved ☐ Approved with changes ☐ Rejected | | |
| Client operations lead | | ☐ Approved ☐ Approved with changes ☐ Rejected | | |
| Delivery lead | | ☐ Approved ☐ Approved with changes ☐ Rejected | | |

**Changes requested summary** (to be filled in after review):

| Item # | Requested change | Owner | Target date |
|---|---|---|---|
| | | | |
