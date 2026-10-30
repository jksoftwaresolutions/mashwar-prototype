# 03 — Requirements and Scope

**Status:** Draft for client review — Phase 1
**Source:** React review prototype (`prototype/src/`), `HANDOFF.md`, `DESIGN_SYSTEM.md`, `prototype/src/config/market.ts`
**Target production stack:** Flutter rider and captain apps · React (Vite) SPA admin · NestJS backend · PostgreSQL + PostGIS · Redis (live locations) · WebSockets · licensed map, payment, SMS and push providers

## 0. Delivery status categories

Every requirement in this document has one of three status tags.

| Tag | Meaning |
|---|---|
| **[P] Prototype** | Works in the React prototype as a browser simulation. There is no backend, real integration or persistence. |
| **[D] Designed** | The screen or rule is designed or documented, but the prototype only shows a placeholder or toast. |
| **[X] Not implemented** | Production functionality that does not exist in any form yet. It is built during development. |

**Nothing in the prototype is production functionality.** In particular, the prototype has no backend, no database, no real authentication, no payments, no GPS, no SMS, no push notifications and no multi-user state. Data resets on reload.

---

## 1. Functional requirements: Rider app

| ID | Requirement | Status | Notes |
|---|---|---|---|
| R-01 | Register / log in with a Saudi mobile number (+966, 9 digits) and an OTP | [P] UI · [X] real OTP | The demo OTP is always `1234`. Production needs a licensed Saudi SMS provider plus rate limiting. |
| R-02 | Accept the terms and privacy policy at signup | [D] | Text notice only. Production needs explicit, recorded consent under PDPL (to verify with counsel). |
| R-03 | Bilingual UI (Arabic default, English), with the language switchable at any time | [P] | |
| R-04 | Show the current pickup and nearby available captains on a map | [P] simulated | SVG map of Riyadh. [X] real map SDK and device location. |
| R-05 | Search destinations, pick on the map, swap pickup and destination | [P] fixed list of 10 places | [X] places / geocoding API, free-text search. |
| R-06 | Saved places (Home, Work, custom): add and remove | [P] in memory | [X] persistence. |
| R-07 | Choose a vehicle category (Economy, Comfort, Family) with seats, ETA and an upfront fare estimate | [P] | ETAs are fixed demo values. Distance is a straight-line approximation. [X] routing-based distance and time. |
| R-08 | Choose a payment method (saved card or cash) | [P] simulated | Wallet balance is **not** offered at booking. See open questions. |
| R-09 | Apply a promo code (validity, active flag, expiry, usage limit) | [P] | Expiry is checked (G6 fixed). There is no per-user limit. See section 7. |
| R-10 | Confirm a ride request. Only one active ride per rider | [P] | |
| R-11 | Live trip states: searching → captain en route → arrived → in progress → completed | [P] simulated | See `04-trip-lifecycle-spec.md`. |
| R-12 | Captain card: name, rating, car, plate, ETA | [P] | |
| R-13 | In-trip chat with quick replies | [P] auto-reply after 1.4 s | [X] real messaging. |
| R-14 | Call the captain | [D] toast only | [X] masked calling (number proxy) is recommended so neither party sees the other's number. |
| R-15 | Share trip / safety sheet / emergency call | [D] toast only | [X] shareable tracking link, SOS escalation to operations. |
| R-16 | Cancel a ride, with a cancellation fee based on state and time (see 05) | [P] | |
| R-17 | Waiting fee after free waiting time (see 05) | [P] | |
| R-18 | Trip completion: total and fare lines, rate the captain (1–5 stars, tags, comment), or skip | [P] | |
| R-19 | Trip history with filters and a trip detail view | [P] | |
| R-20 | Report an issue on a trip / submit a complaint. Track ticket status | [P] creates an admin ticket | |
| R-21 | Wallet: balance, top up, recent transactions | [D] static figures | [X] stored-value wallet. This needs a regulatory check (see 10). |
| R-22 | Saved cards: add, set default, remove | [D] demo list | [X] PSP tokenization. **The prototype's card form must not be reused in production.** |
| R-23 | Coupons list (copy code) | [P] | |
| R-24 | Notifications inbox (read / unread) | [P] in-app list | [X] push notifications (FCM / APNs). |
| R-25 | Rating history | [P] | |
| R-26 | Receipts / tax invoices for trips | [X] | ZATCA-compliant simplified tax invoice. See NFR-COMP-03 and 10. |
| R-27 | Account deletion and data export on request | [X] | PDPL data-subject rights. |
| R-28 | Scheduled rides ("Now" chip suggests a later option) | [X] | The UI shows "Now" only. In or out of MVP is an open question. |

## 2. Functional requirements: Captain app

| ID | Requirement | Status | Notes |
|---|---|---|---|
| C-01 | Sign in with a mobile number and OTP | [D] one-tap demo sign-in | [X] OTP. |
| C-02 | Captain onboarding: personal data, national ID / iqama, licence, vehicle registration, insurance, photos, bank account (IBAN) | [X] | Not designed. Only the *documents status* page exists [D]. TGA requirements decide the document list. |
| C-03 | Approval gate: only approved captains can go online | [D] | Admin approve / suspend works [P], but it is **not enforced** on the demo captain. |
| C-04 | Online / offline toggle | [P] | |
| C-05 | Receive ride offers with a 30 s countdown, estimated net earnings, distance, route, rider name and rating, payment type | [P] UI | At 0 the offer expires and is passed on like a decline (G1 fixed). Distance to pickup ("1.8 km") is fixed text. |
| C-06 | Accept or decline an offer. A declined offer is reassigned | [P] simulated | Reassignment always goes to one fixed demo captain after 3 s. |
| C-07 | Navigate to pickup and to the destination | [D] illustrative banner | [X] turn-by-turn navigation (hand-off to Google Maps / Waze, or an in-app SDK). |
| C-08 | Mark arrived, start trip, end trip (with confirmation) | [P] | |
| C-09 | Cancel a trip / mark the rider as a no-show | [X] | Not in the prototype. Needs rules (see 04 and 05). |
| C-10 | Trip summary: net earnings, platform fee, cash-collection prompt | [P] | |
| C-11 | Earnings: day / week / month, chart, average per ride | [P] illustrative baselines + demo trips | |
| C-12 | Payout request and available balance | [D] toast only | [X] payouts and cash-commission netting (see 10). |
| C-13 | Trip history with net per trip | [P] | |
| C-14 | Ratings received and distribution | [P] partly static | |
| C-15 | Rate the rider | [X] | Not in the prototype. Confirm whether it is required. |
| C-16 | Vehicle info and documents (expiry, upload) | [D] | [X] document upload, expiry reminders. |
| C-17 | Support categories, including an urgent safety report | [D] toast only | [X] ticketing for captains (admin tickets currently support riders only). |
| C-18 | Settings: request sound, auto-accept, language | [P] language · [D] sound, auto-accept | Auto-accept has no behaviour. |
| C-19 | Continuous location streaming while online | [X] | WebSocket to the backend. Battery-aware intervals. |

## 3. Functional requirements: Admin dashboard (12 sections)

| ID | Section | Requirement | Status | Notes |
|---|---|---|---|---|
| A-01 | Overview | KPIs (trips, active, online captains, revenue), charts, recent rides, map, top captains, activity, quick actions | [P] illustrative + live demo trips | "Revenue" is total rider payments (GMV), not platform revenue. Labelling needs a decision. |
| A-02 | Trips | Search, filter by status, trip detail (timeline, fare, discount, rating) | [P] | [X] admin interventions: force-cancel, refund, reassign. |
| A-03 | Live operations | Map of captains by status, active trips, selected trip | [P] simulated | [X] real-time positions over WebSocket. |
| A-04 | Captains | Search, filter by approval, profile, approve / suspend / reactivate | [P] | [X] document review, KYC, audit log. |
| A-05 | Riders | Search, detail, history, block / unblock | [P] | Block is **not enforced** on the demo rider. |
| A-06 | Vehicles | Fleet by category | [P] | [X] vehicle CRUD, inspection / insurance expiry. |
| A-07 | Payments | Collected, platform fee, captain payouts, transactions | [P] simulated | Excludes cancellation fees. All rows show "Settled". |
| A-08 | Promotions | Create coupon (code, %, cap, limit), enable / disable, usage | [P] | The expiry date cannot be set: it is fixed at 90 days after creation. No budget or eligibility rules. |
| A-09 | Ratings | All / low ratings | [P] | |
| A-10 | Support | Tickets by status, detail, start review, resolve | [P] | Internal notes are not saved. No assignment or SLA. |
| A-11 | Reports | Completed vs cancelled, revenue, popular locations, categories, ratings, export | [P] illustrative | Export is a toast. [X] real reporting / CSV / finance exports. |
| A-12 | Settings | Base, per km, per min, minimum fare, category multipliers, service-area toggles, fare preview | [P] | Waiting and cancellation fees are editable. Commission is read-only and labelled "Provisional, not approved". Service-area toggles **do not affect booking**. |
| A-13 | Admin authentication, roles and permissions (RBAC) | [X] | The prototype has a single implicit admin. |
| A-14 | Audit log of admin actions | [X] | Required (HANDOFF §8). |
| A-15 | Notifications centre | [P] in-app | |

## 4. Platform / backend functional requirements (production only)

All of these are **[X] Not implemented**.

| ID | Requirement |
|---|---|
| B-01 | Identity: OTP authentication, sessions / refresh tokens, device binding, rate limits |
| B-02 | Server-authoritative trip state machine (see 04) with an event log |
| B-03 | Dispatch and matching: nearest eligible captain by category, approval status and online state; sequential or batched offers; timeouts |
| B-04 | Pricing service per market / city / zone: quotes locked at request time, fees, commission (see 05) |
| B-05 | Geo: PostGIS service-area polygons, airport zones, geofencing of pickups |
| B-06 | Real time: WebSocket gateway for captain location, trip events to rider, captain and admin; push fallback |
| B-07 | Payments: PSP integration, tokenization, pre-authorization / capture, refunds, cash ledger, payouts, webhooks (see 10) |
| B-08 | Invoicing: ZATCA e-invoices / receipts per trip and per fee |
| B-09 | Notifications: push, SMS, in-app inbox, templates in AR / EN |
| B-10 | Support and ticketing for riders and captains, linked to trips |
| B-11 | Promotions engine: eligibility, expiry, per-user limits, budget caps, abuse checks |
| B-12 | Reporting / analytics pipeline, finance reconciliation exports |
| B-13 | Market configuration served from the backend (see 09) |
| B-14 | Regulatory reporting interfaces, if required by TGA (open question) |

---

## 5. Non-functional requirements

All targets below are **proposed**, for the client to confirm. None is implemented ([X]).

### 5.1 Performance

| ID | Requirement (proposed target) |
|---|---|
| NFR-PERF-01 | API p95 latency < 300 ms for read endpoints and < 500 ms for write endpoints, under expected peak load |
| NFR-PERF-02 | Trip event delivery (server → rider / captain) p95 < 2 s |
| NFR-PERF-03 | Captain location update interval 3–5 s while on a trip, adaptive while idle |
| NFR-PERF-04 | First offer sent to a captain within 5 s of the request (when an eligible captain exists) |
| NFR-PERF-05 | App cold start < 3 s on mid-range Android devices |
| NFR-PERF-06 | Admin dashboard initial load < 3 s, with analytics lazy-loaded |
| NFR-PERF-07 | Peak load figures (concurrent riders, captains, trips per hour) are **unknown**. See open questions |

### 5.2 Availability and reliability

| ID | Requirement (proposed target) |
|---|---|
| NFR-AV-01 | 99.9 % monthly availability for the booking, dispatch and trip APIs |
| NFR-AV-02 | Contract scope: managed PostgreSQL with automated backups, one application host with health checks and restart policy (see 07). Multi-AZ database and multiple API replicas are post-contract options |
| NFR-AV-03 | RPO ≤ 5 min, RTO ≤ 1 h for the primary database |
| NFR-AV-04 | Graceful degradation: active trips continue if the real-time channel drops (polling or push fallback) |
| NFR-AV-05 | Idempotent write APIs and webhook handlers (see 04 and 10) |

### 5.3 Security

| ID | Requirement |
|---|---|
| NFR-SEC-01 | TLS 1.2+ everywhere. HSTS on web. Certificate pinning considered for mobile |
| NFR-SEC-02 | No card data (PAN / CVV) stored or processed by MASHWAR systems. PSP tokenization only (PCI-DSS scope minimisation; see 10) |
| NFR-SEC-03 | Secrets in a managed vault. No secrets in apps or repositories |
| NFR-SEC-04 | RBAC for admin users, MFA for admin login, least privilege |
| NFR-SEC-05 | Audit log for all admin and financial actions (who, what, when, before / after) |
| NFR-SEC-06 | OTP brute-force and SMS-pumping protection (rate limits, device checks) |
| NFR-SEC-07 | OWASP ASVS L2 baseline. An independent penetration test before launch is recommended but is a post-contract option (see 11) |
| NFR-SEC-08 | Masked phone numbers between rider and captain (recommended) |

### 5.4 Data protection: PDPL (نظام حماية البيانات الشخصية)

| ID | Requirement |
|---|---|
| NFR-PDPL-01 | Comply with the Saudi Personal Data Protection Law and its implementing regulations, supervised by SDAIA |
| NFR-PDPL-02 | Lawful basis and explicit consent where required. Privacy notice in Arabic and English. Consent records stored |
| NFR-PDPL-03 | Data minimisation: location history, national ID / iqama data and trip data kept only as long as needed. Retention periods to be defined with the client's counsel |
| NFR-PDPL-04 | Data-subject rights: access, correction, deletion, and a copy of data. In-app request flows |
| NFR-PDPL-05 | Data residency and cross-border transfer rules: the hosting region and any processors outside KSA need legal review |
| NFR-PDPL-06 | Breach-notification procedure within the statutory timeframe (confirm with counsel) |
| NFR-PDPL-07 | Encryption at rest for personal data. Field-level encryption for identity documents |

### 5.5 Ride-hailing regulation: TGA (الهيئة العامة للنقل)

| ID | Requirement |
|---|---|
| NFR-TGA-01 | The operator must hold the required TGA licence for app-based passenger transport. **Licensing status is an open question for the client** |
| NFR-TGA-02 | Captain and vehicle eligibility checks per current TGA rules (for example nationality / residency, licence type, vehicle age and condition). The exact rules must be confirmed with TGA or counsel |
| NFR-TGA-03 | Any data sharing or trip reporting that TGA requires is to be confirmed |
| NFR-TGA-04 | Fare transparency: an upfront estimate and an itemised receipt (already reflected in the design). The specific TGA obligation is to verify with counsel |

### 5.6 Tax and invoicing: ZATCA (هيئة الزكاة والضريبة والجمارك)

| ID | Requirement |
|---|---|
| NFR-COMP-01 | VAT treatment of fares, waiting fees, cancellation fees, discounts and commission to be confirmed with a tax advisor (see 05, decisions) |
| NFR-COMP-02 | Whether displayed prices are VAT-inclusive is an open question. The prototype does not show VAT |
| NFR-COMP-03 | E-invoicing (FATOORA): issue compliant simplified tax invoices (B2C) with the required fields and QR code. Integrate with the ZATCA platform per the client's assigned integration wave (requirements and wave to verify with the client's tax advisor). ZATCA production integration is a post-contract item (see 11) |
| NFR-COMP-04 | Invoicing model to be decided: who is the supplier of transport (the platform or the captain), and the invoicing of commission to captains |

### 5.7 Accessibility

| ID | Requirement |
|---|---|
| NFR-A11Y-01 | WCAG 2.1 AA for the admin web. Equivalent platform guidelines for the Flutter apps (Semantics, dynamic type, TalkBack / VoiceOver) |
| NFR-A11Y-02 | Touch targets ≥ 44 pt / 48 dp. Status never conveyed by colour alone ([P] in prototype) |
| NFR-A11Y-03 | Reduced-motion support ([P] in prototype) |
| NFR-A11Y-04 | Screen-reader labels in both languages |

### 5.8 Arabic-first localisation

| ID | Requirement |
|---|---|
| NFR-L10N-01 | Arabic is the default locale. RTL layouts use logical properties ([P]) |
| NFR-L10N-02 | All strings in an i18n dictionary (the prototype uses inline `t(ar, en)` pairs) |
| NFR-L10N-03 | Numbers use Latin digits by default, configurable per market ([P]) |
| NFR-L10N-04 | Notifications, SMS, receipts, invoices and support replies in the user's language |
| NFR-L10N-05 | Gregorian calendar and the Asia/Riyadh timezone ([P] config). Hijri display is an open question |

---

## 6. MVP scope

### IN scope for MVP (proposed)

- Rider and captain Flutter apps (iOS and Android) and the React (Vite) SPA admin, covering the screens in `01-approved-design-checklist.md` once approved.
- Saudi Arabia, **one launch city** (Riyadh in the prototype; to be confirmed), SAR, Arabic and English.
- OTP authentication. Captains created and approved by admin (captain self-service KYC document upload is a post-contract option; see 11 §5.4).
- Server-authoritative trip lifecycle, dispatch, offers with timeout and reassignment, cancellations, waiting fees.
- Upfront fare quotes from the server, with three vehicle categories (or as approved).
- Payments (client requirement): mada, Apple Pay and credit / debit cards through a licensed Saudi PSP, plus cash at launch. Sandbox integration during development (Phase 3). Later activation of the production gateway with the client's live keys at **no additional programming fee** (see 10). Refunds. Captain cash ledger. Payouts (manual or semi-automatic).
- Coupons with expiry, limits and per-user rules.
- Ratings (rider → captain; captain → rider if approved).
- Support tickets for riders and captains. Safety sheet with share-trip and SOS escalation.
- Push and in-app notifications. SMS for OTP.
- In-app trip receipts. ZATCA e-invoicing production integration is post-contract (11 §5.4), pending the tax advisor's decisions (05 D5).
- Admin: the 12 sections, RBAC, audit log, real-time live map, pricing settings including fees and commission.
- Quality: automated tests (unit, widget, integration, API) plus a real-device test matrix on iOS and Android (Phase 4).
- Publishing: App Store and Google Play publication of both apps under the **client's** developer accounts.
- Warranty: 45-day implementation-defect warranty, starting after both apps are published.
- Handover: documentation, source code, design files and assets transferred to the client, with the code in the client-owned GitHub repository when provided.

### OUT of scope for MVP (proposed, unless the client decides otherwise)

- Multi-country or multi-city operations. The prototype's `MarketConfig` separates country values; production multi-market support is not built (see 09 §4).
- Surge / dynamic pricing (decision pending; see 05).
- Scheduled rides, multi-stop rides, ride sharing / pooling.
- Stored-value wallet and top-ups (pending a regulatory and PSP check; see 10).
- Loyalty tiers (the "Gold" tier is placeholder content), referrals.
- Corporate / business accounts and B2B invoicing.
- In-app turn-by-turn navigation (hand-off to external navigation apps instead).
- In-app VoIP calling (masked PSTN calling instead, if approved).
- Delivery, rentals or other verticals.

---

## 7. Known gaps and inconsistencies in the prototype

These are recorded so that review feedback is not mistaken for production defects. All are fixed or specified in production.

| # | Observation | Where |
|---|---|---|
| G1 — fixed | The captain offer countdown reaches 0 with no effect (no expiry or reassignment) | `Driver.tsx` HomeScreen |
| G2 | Rejection always reassigns to captain `d4` after 3 s, whatever the category or distance. The category is not matched in dispatch (an Economy request can go to a Comfort captain) | `store.tsx` `rejectRide`, `acceptRide` |
| G3 | The captain is not notified when the rider cancels (only admin is notified) | `store.tsx` `cancelRide` |
| G4 | Auto-simulated captains change state without notifications and without setting the captain to "on trip" | `store.tsx` movement effect |
| G5 | The waiting fee is effectively 0 for auto-simulated captains (they start 4 s after arrival). The cancellation grace window (2 min) is longer than the simulated approach (~15 s) | `store.tsx` |
| G6 — fixed | Coupon expiry is not validated. Seed coupons and admin-created coupons have expiry dates in 2025 that are already past, yet they are still accepted | `validateCoupon`, `Coupons` |
| G7 | Coupon usage is counted at request time, even if the ride is later cancelled | `requestRide` |
| G8 | Suspending a captain or blocking a rider in admin does not stop the demo captain / rider from working | `Admin.tsx` vs `Driver.tsx` / `Passenger.tsx` |
| G9 | Service-area toggles in admin Settings do not affect booking | `PricingSettings` |
| G10 — fixed | Waiting / cancellation fees and commission are not editable in admin and are not labelled provisional there | `PricingSettings` |
| G11 | Admin Payments computes commission on the aggregate total (one rounding), not per trip. Captain earnings round per trip, so the totals can differ. Cancellation fees are excluded. All rows show "Settled" | `Payments` |
| G12 | Commission is applied to the rider-paid total *after* the coupon discount, so captains bear part of each promotion. This needs a client decision (see 05) | `captainNet(tripTotal(...))` |
| G13 | The rider "spent" figure excludes cancellation fees | `store.tsx` settlement |
| G14 — fixed | The completion screen labels the full metered fare "Base fare" | `Passenger.tsx` Completed |
| G15 — fixed | Trip IDs are random in a 600-value range and can collide | `requestRide` |
| G16 | Wallet balance and transactions are static, not linked to trips, and amounts are not formatted as currency. Wallet is not a payment option at booking | `WalletScreen` |
| G17 | The "Add card" sheet takes a raw card number into app state (demo only). Production must use PSP-hosted fields / SDK | `WalletScreen` |
| G18 | Auto-accept, request sound and some captain stats (acceptance 98 %, online hours) are placeholders | `Driver.tsx` |
| G19 | Rider support complaint category is stored in the current language only (`catEn = catAr`) | `TripDetailSheet`, `addTicket` |
| G20 | Fractional waiting fees (0.5 SAR per minute) conflict with the market's 0-decimal currency setting. The formatter shows decimals when present | `market.ts` |
| G21 | After a decline, the 3 s reassignment timer can mark captain `d4` en route and notify the rider even if the rider cancelled within those 3 s (only the trip row is guarded). See 04 §10 | `store.tsx` `rejectRide` |

File names in the table are relative to `prototype/src/`.

**Resolved in the polished review build** (verified by the Playwright suite in `prototype/e2e/`):
- G1: an unanswered 30 s captain offer now expires and is passed on like a decline.
- G6: coupon expiry is validated; seed and admin-created expiry dates are relative to today.
- G10: waiting and cancellation fees are editable in admin Settings; commission is shown read-only and labelled "Provisional, not approved".
- G14: the completion receipt now says "Trip fare".
- G15: demo trip IDs are sequential.

---

## 8. Assumptions

1. The launch market is Saudi Arabia with a single city. The prototype uses Riyadh.
2. The client (or its operating entity) will obtain the TGA licence and the commercial registrations. MASHWAR's delivery team provides technical compliance only.
3. The client owns and contracts directly all production accounts: Apple Developer, Google Play, the PSP merchant account and Apple Pay merchant ID, the domain, cloud hosting, the SMS provider, the map provider and the GitHub repository (when provided). All source code, design files and assets transfer to the client. The delivery team works with scoped access granted by the client.
4. "MASHWAR" (مَشوار) is a working name. Final branding may change the logo and colours, but not the layout.
5. Captains are independent operators paid net of commission (the model shown in the prototype). This is not yet confirmed.
6. Arabic and English are the only languages at launch.
7. Prices are in SAR. Whether VAT is included is not yet known.
8. The design system in `DESIGN_SYSTEM.md` is the reference for Flutter theming.

## 9. Open questions for the client

| # | Question | Affects |
|---|---|---|
| Q1 | What is the status of the TGA licence? Which entity is the licensed operator? | Launch, NFR-TGA |
| Q2 | Which launch city or cities, and which service areas / zones (including airport)? | Pricing, geo |
| Q3 | Vehicle categories at launch: keep Economy / Comfort / Family? Names, seats, eligible vehicle models and ages? | Dispatch, pricing |
| Q4 | Commission model and rate (the 20 % is provisional) | 05, 10 |
| Q5 | Are all fees approved: base, per km, per min, minimum, multipliers, waiting, cancellation? | 05 |
| Q6 | Are prices shown VAT-inclusive? Who issues the invoice to the rider? | ZATCA, receipts |
| Q7 | STC Pay / Google Pay in addition to the required mada, Apple Pay, cards and cash? | 10 |
| Q8 | Is a stored-value wallet required at launch? | 10, regulation |
| Q9 | Which PSP, if one is already chosen or preferred? | 10 |
| Q10 | Captain payout frequency and method (weekly bank transfer, on demand)? | 10 |
| Q11 | Cash: maximum outstanding commission debt before a captain is blocked from cash trips? | 10 |
| Q12 | Expected volumes at launch and at 12 months (riders, captains, peak trips per hour)? | NFR-PERF, cost |
| Q13 | Should captains rate riders? Should low-rated riders be restricted? | C-15 |
| Q14 | Captain cancellation and rider no-show rules and fees? | 04, 05 |
| Q15 | Emergency number and SOS process: which number(s) to dial, and is there an operations escalation desk? | R-15 |
| Q16 | Scheduled rides in the MVP? | R-28 |
| Q17 | Data hosting region and any constraints from the client's legal counsel (PDPL, data residency)? | Architecture |
| Q18 | Support channels and hours (in-app chat, phone, WhatsApp)? | Support |
| Q19 | Final brand name and assets? | Design |
| Q20 | Arabic numerals: Latin (current) or Arabic-Indic? Hijri dates anywhere? | L10N |
