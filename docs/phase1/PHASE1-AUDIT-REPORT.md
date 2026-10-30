# Phase 1 audit report

Status: Audit completed 2026-10-30 — Phase 1 **not yet ready for acceptance** (see §1)

Scope: Phase 1 of the MASHWAR contract ($240, 6 days): requirements analysis, UI/UX design, technical architecture and technical foundation. The audit compared the contract with the repository, ran every available check, and corrected what could be corrected safely inside Phase 1. Later-phase work was not started.

## 1. Verdict

| Question | Answer | Evidence |
|---|---|---|
| Is the UI/UX approved? | **Overall direction: yes.** Individual screens: not yet signed. | Client message "The design is good and I like it. Continue as agreed."; per-screen sign-off is A1–A6 in [PHASE1-ACCEPTANCE-CHECKLIST.md](PHASE1-ACCEPTANCE-CHECKLIST.md) |
| Are the Flutter projects initialised? | **Yes** — rider and captain apps (Android + iOS targets) and two shared packages, created with `flutter create`. | `mobile/`; `flutter analyze`: no issues; 15 Dart/Flutter tests pass |
| Does the backend scaffold exist? | **Yes** — NestJS with configuration validation, health check, migration runner, trip state machine and staff permission map. | `backend/`; 20 unit tests pass; built server answers `GET /v1/health` with 200 against PostgreSQL |
| Is the PostgreSQL schema implemented or only designed? | **Implemented and tested** as migrations (49 tables in 9 schemas). | `backend/db/migrations/`; 10 database tests pass on PostgreSQL 17 + PostGIS 3.5 |
| Are authentication and permissions coded? | **Permissions: coded at foundation level** (roles, permission map, guard, tests). **Authentication: documented only** — OTP, tokens and staff MFA are built in Phase 2/3. | `backend/src/auth/`; 07 §9; 12 §2 |
| Is the repository under client ownership? | **No.** Hosted temporarily under the delivery team's GitHub account until the client provides an organisation. | CLIENT-DECISIONS C9 |
| Are the Phase 1 documents ready? | **Yes, for client review** — 11 deliverables plus admin architecture (12), revised in this audit. | §5 below |
| What still needs the client? | Screen-by-screen design sign-off, review of the rules and architecture, and answers (or dates) for the decisions needed before Phase 2. | [CLIENT-DECISIONS.md](CLIENT-DECISIONS.md) |

**Ready for acceptance?** Not yet. The delivery team's side is complete: the foundation was pushed and the GitHub Actions run passed on 2026-10-30 ([run 41041636730](https://github.com/jksoftwaresolutions/mashwar-prototype/actions/runs/41041636730)). Android debug builds of both apps succeed; iOS build verification needs a Mac and moves to Phase 2. Acceptance also requires the client's sign-offs in the checklist.

## 2. Validation performed (2026-10-30, Windows 11 workstation)

| Check | Command | Result |
|---|---|---|
| Prototype typecheck | `pnpm --filter mashwar-prototype typecheck` | Pass |
| Prototype production build | `pnpm --filter mashwar-prototype build` | Pass |
| Prototype Playwright suite (24 tests: connected lifecycle, decline and reassignment, cancellation fees, coupons, pricing change, admin filters and all 12 sections, reset, Arabic RTL, Escape/focus, no horizontal overflow at 375/390/430 px, fare rules) | `pnpm --filter mashwar-prototype test:e2e` | **24/24 pass with one worker.** With 4–8 parallel workers on this machine, 3–8 tests timed out (the first test in each worker stuck on "Loading…" while the module request stalled in the browser; the dev server itself answered in milliseconds). The same suite passed 24/24 in parallel on GitHub Actions (commit 3cfd97d). Local runs now default to one worker (`prototype/playwright.config.ts`); CI stays parallel. |
| Backend typecheck, unit tests, build | `pnpm --filter @mashwar/backend typecheck`, `test`, `build` | Pass; 20 tests |
| Backend boots and reports health | `node dist/main.js` + `GET /v1/health` | 200 `{"status":"ok","database":"up"}`; unknown route 404; missing configuration stops start-up with a list of problems |
| Migrations on a real database | `docker compose -f infra/docker-compose.yml up`, then `test:db` | Pass; 10 tests (see §4) |
| Admin shell | `pnpm --filter @mashwar/admin typecheck`, `test`, `build` | Pass; 3 tests |
| Flutter static analysis | `flutter analyze` (in `mobile/`) | No issues |
| Dart/Flutter tests | `dart test` / `flutter test` per member | 15 tests pass (core 8, ui 3, rider 2, captain 2) |
| Frozen install as in CI | `CI=true pnpm install --frozen-lockfile` (pnpm 10.34.3) | Pass |
| Markdown links and anchors | custom checker over 20+ Markdown files | No broken links (after creating this report and its companions) |
| Mermaid diagrams | `mermaid.parse` (Mermaid 11) in Chromium for all 10 diagrams | 10/10 parse after fixing one syntax error in 10 |
| GitHub Actions run of the new monorepo workflow | [run 41041636730](https://github.com/jksoftwaresolutions/mashwar-prototype/actions/runs/41041636730), 2026-10-30 | Pass: all six jobs (prototype, backend + PostGIS, admin, mobile, Pages build, Pages deploy) |
| iOS build | — | **Not run**: requires macOS + Xcode |

## 3. Deliverables matrix

Statuses: COMPLETE AND VERIFIED · IMPLEMENTED BUT NOT VERIFIED · DOCUMENTED ONLY · PARTIALLY COMPLETE · MISSING · AWAITING CLIENT APPROVAL · OUT OF PHASE 1 SCOPE.

### A. Requirements analysis

| Deliverable | Required | Actual status | Evidence | Missing work | Acceptance criteria |
|---|---|---|---|---|---|
| Business requirements reviewed | Yes | AWAITING CLIENT APPROVAL | [03](03-requirements-and-scope.md) (functional per app, NFRs, MVP in/out, contractual commitments) | Client review (checklist B1) | Client ticks B1 |
| Rider and captain roles | Yes | AWAITING CLIENT APPROVAL | 03; `backend/src/auth/rbac.ts` (`APP_ROLES`) | Client review | Client ticks B1 |
| Administration permissions | Yes | AWAITING CLIENT APPROVAL | 06 §5.9, [12](12-admin-architecture.md) §2; roles/permissions in `0002_reference_data.sql` and `rbac.ts`, kept in sync by a test | Client confirms the seven roles (C29) | Client ticks C4 |
| Ride lifecycle | Yes | COMPLETE AND VERIFIED (definition and enforcement rules) | [04](04-trip-lifecycle-spec.md); `backend/src/trips/domain/trip-state-machine.ts`, `mobile/packages/mashwar_core/lib/src/ride_status.dart`, DB guard trigger — the three are tested against the same transition table | Timer values are client decisions (C35) | Client ticks B2 |
| Cancellation behaviour | Yes | AWAITING CLIENT APPROVAL | 04 (paths, actors, failure table), 05 (fees) | Fee values (C18, C19) | Client ticks B2, B3 |
| Pricing and commissions | Yes | AWAITING CLIENT APPROVAL | [05](05-fare-and-fee-rules.md) (formula, integer halalas, VAT placeholder, D1–D20); all values provisional | Commission model and values (C13–C24) — needed before Phase 3 | Client ticks B3 (rules); values answered later |
| Vehicle categories | Yes | AWAITING CLIENT APPROVAL | 05 D16, `market.vehicle_categories` table; demo values only in `dev_seed.sql` | C2 | Client answers C2 |
| Payment integration requirements | Yes | DOCUMENTED ONLY | [10](10-payment-gateway-plan.md) (methods, pre-auth/capture, webhooks, idempotency, refunds, reconciliation, cash, sandbox, production activation, account ownership) | PSP choice (C10) | Client ticks B4 |
| Acceptance criteria | Yes | COMPLETE AND VERIFIED (documented) | [PHASE1-ACCEPTANCE-CHECKLIST.md](PHASE1-ACCEPTANCE-CHECKLIST.md); milestones per phase in 11 | — | Client uses the checklist |
| Saudi launch vs expansion | Yes | DOCUMENTED ONLY | [09](09-country-expansion-strategy.md); `market.countries` / `market.cities` tables exist, only Saudi Arabia seeded | — (multi-country is not a working capability and is not claimed) | Client ticks B5 |

### B. UI/UX design

| Deliverable | Required | Actual status | Evidence | Missing work | Acceptance criteria |
|---|---|---|---|---|---|
| Prototype reviewed and refined | Yes | COMPLETE AND VERIFIED | `prototype/`; 24 Playwright tests | — | — |
| Consistent design system | Yes | COMPLETE AND VERIFIED | [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md); Flutter tokens in `mobile/packages/mashwar_ui` (tested); admin shell uses the same tokens | — | Client ticks A5 |
| Rider, captain and admin experiences | Yes | COMPLETE AND VERIFIED (prototype) / AWAITING CLIENT APPROVAL (per screen) | Prototype preview; [01](01-approved-design-checklist.md) | Per-screen sign-off | Client ticks A1–A3 |
| Arabic RTL and English | Yes | COMPLETE AND VERIFIED | Playwright RTL tests; Flutter widget tests open RTL in Arabic and switch to English; admin shell RTL by default | — | Client ticks A4 |
| Design assets and handoff documentation | Yes | PARTIALLY COMPLETE | [design/README.md](../../design/README.md), brand mark SVGs, HANDOFF.md, DESIGN_SYSTEM.md, review screenshots | App icons and splash screens wait for the final brand (C3); produced at the start of Phase 2 | Client ticks A5 |
| Client feedback incorporated | Yes | COMPLETE AND VERIFIED | Feedback received was approval without change requests | Record any new change requests (A6) | Client ticks A6 |
| Design approval | Yes | AWAITING CLIENT APPROVAL | Overall direction approved; 01 checklist unsigned | Per-screen sign-off | Client signs 01 |

### C. Technical architecture

| Deliverable | Required | Actual status | Evidence | Missing work | Acceptance criteria |
|---|---|---|---|---|---|
| Flutter architecture | Yes | COMPLETE AND VERIFIED (documented and scaffolded) | [08](08-flutter-architecture.md); `mobile/` follows its MVVM layout | — | Client ticks C3 |
| Backend architecture | Yes | DOCUMENTED ONLY (scaffold implemented) | [07](07-backend-architecture.md); `backend/` | Feature modules in Phases 2–3 | Client ticks C2 |
| Administration architecture | Yes | DOCUMENTED ONLY (shell implemented) | [12](12-admin-architecture.md) — **created in this audit**; `admin/` | Features in Phase 3 | Client ticks C4 |
| Database architecture and ERD | Yes | COMPLETE AND VERIFIED | [06](06-database-architecture.md) (ERD); migrations tested on PostGIS | — | Client ticks C1 |
| Authentication and authorization | Yes | PARTIALLY COMPLETE (by design) | Authorization: `rbac.ts`, `PermissionsGuard`, tests. Authentication: 07 §9, 12 §2 | OTP/JWT/MFA implementation is Phase 2/3 work | Client ticks C2 |
| Ride state management | Yes | COMPLETE AND VERIFIED | Server state machine, DB guard, optimistic version, accept-race indexes, app-side event ordering (`decideEvent`) — all tested | — | Client ticks B2 |
| Real-time tracking architecture | Yes | DOCUMENTED ONLY | 07 §4.3, §6; 08 §9, §11 | Implementation in Phase 3 | Client ticks C2 |
| Notifications and payment architecture | Yes | DOCUMENTED ONLY | 07, 08 §10, 10; `notify` and `finance` schemas implemented | Implementation in Phase 3 (sandbox) | Client ticks C2, B4 |
| Country expansion plan | Yes | DOCUMENTED ONLY | 09; country/city tables | — | Client ticks B5 |

### D. Technical foundation

| Deliverable | Required | Actual status | Evidence | Missing work | Acceptance criteria |
|---|---|---|---|---|---|
| Flutter rider project | Yes | COMPLETE AND VERIFIED (analyze + tests) | `mobile/apps/rider` | — | D4 |
| Flutter captain project | Yes | COMPLETE AND VERIFIED (analyze + tests) | `mobile/apps/captain` | — | D4 |
| Android build of the apps | Yes | COMPLETE AND VERIFIED (debug) | `flutter build apk --debug` succeeded for rider and captain (§4) | Release signing (Phase 4) | D5 |
| iOS build of the apps | Yes | IMPLEMENTED BUT NOT VERIFIED | iOS targets created by `flutter create` | Build on a Mac (Phase 2) | D6 |
| Backend project | Yes | COMPLETE AND VERIFIED | `backend/`; 20 unit tests; health check against PostgreSQL | — | D2 |
| Admin application structure | Yes | COMPLETE AND VERIFIED | `admin/`; 3 tests; build | — | D7 |
| PostgreSQL configuration | Yes | COMPLETE AND VERIFIED | `infra/docker-compose.yml` (PostGIS 17-3.5, Redis 7.4) | — | D8 |
| Initial schema / migrations | Yes | COMPLETE AND VERIFIED | `backend/db/migrations/0001_initial_schema.sql`, `0002_reference_data.sql`, runner `db/migrate.ts`; 10 DB tests | — | D3 |
| Environment templates | Yes | PARTIALLY COMPLETE | `backend/.env.example`, `admin/.env.example`, compose defaults | Flutter flavours (dev/staging/prod) and `--dart-define` config arrive with the API client in Phase 2 | D8 |
| Modular organisation | Yes | COMPLETE AND VERIFIED | pnpm workspace + Dart pub workspace; README layout table | — | D1 |
| Authentication/role structure (foundation) | Yes | COMPLETE AND VERIFIED (roles and permissions) | `backend/src/auth/` with tests | Authentication itself is Phase 2 | D2 |
| Repository configuration | Yes | COMPLETE AND VERIFIED | `.gitignore`, `.gitattributes`, workspaces, lockfile (frozen install verified) | — | D1 |
| Development commands | Yes | COMPLETE AND VERIFIED | Root `package.json` scripts; README "Run it" (each command executed in this audit) | — | D1 |
| Initial automated checks (CI) | Yes | COMPLETE AND VERIFIED | `.github/workflows/deploy.yml`: prototype, backend + PostGIS service, admin, Flutter jobs; green [run](https://github.com/jksoftwaresolutions/mashwar-prototype/actions/runs/41041636730) on 2026-10-30 | — | D9 |
| Documentation for running the foundation | Yes | COMPLETE AND VERIFIED | Root README, app READMEs | — | D1 |

### E. Ownership and delivery

| Deliverable | Required | Actual status | Evidence | Missing work | Acceptance criteria |
|---|---|---|---|---|---|
| Source and design assets organised | Yes | COMPLETE AND VERIFIED | Repository tree, design/README.md | — | E1 |
| Git history preserved | Yes | COMPLETE AND VERIFIED | The prototype was moved with `git mv` (history follows); 2 prior commits on `main` | — | E1 |
| No secrets committed | Yes | COMPLETE AND VERIFIED | §6 | — | E2 |
| Client-owned repository | Yes | AWAITING CLIENT APPROVAL | Repository under the delivery team's account | Client provides a GitHub organisation (C9); transfer | E4 |
| Temporary demo hosting identified | Yes | COMPLETE AND VERIFIED | README: GitHub Pages preview labelled temporary, simulated data, no indexing | — | E3 |
| Handover documentation | Yes (Phase 1 level) | COMPLETE AND VERIFIED | README, HANDOFF.md, DESIGN_SYSTEM.md, docs/phase1 | Full handover is Phase 4 | — |

### Counts

Counted from the matrix above (47 rows; a row is counted under the first status in its status cell).

| Status | Items |
|---|---|
| COMPLETE AND VERIFIED | 28 |
| AWAITING CLIENT APPROVAL | 8 |
| DOCUMENTED ONLY | 7 |
| PARTIALLY COMPLETE | 3 |
| IMPLEMENTED BUT NOT VERIFIED | 1 |
| MISSING | 0 |
| OUT OF PHASE 1 SCOPE | 0 |

No completion percentage is given: most open items wait on the client, not on engineering effort, so a percentage would mislead.

## 4. Technical foundation detail

**Database (verified on PostgreSQL 17 + PostGIS 3.5 in Docker).** The 10 tests in `backend/test/schema.db-spec.ts` check that:
- migrations apply on an empty database and re-running them is a no-op (checksums guard edited migrations);
- all nine schemas exist and **every foreign-key column is indexed**;
- money is `bigint` halalas and ids are time-ordered UUIDv7;
- a rider can have only one active trip and a captain only one active trip; a captain can hold only one pending offer;
- the accept race has one winner (the second accept updates 0 rows);
- the database guard rejects invalid transitions, changes without a version increment and any change after a terminal state;
- a trip settles exactly once and an unbalanced ledger transaction is rejected at commit; ledger rows cannot be deleted;
- a provisional pricing draft can coexist with an approved plan but two approved plans cannot overlap (four-eyes approval);
- the phone format rule holds except for anonymised (PDPL) accounts.

**Android build — verified.** `flutter build apk --debug` succeeded for both apps on 2026-10-30 (Flutter 3.44.8, Android SDK 36, Gradle 9.1): rider in 120 s, captain afterwards. No SDK licence was accepted on the client's behalf. Release builds need the client's signing key and application ids (C4, C5) and are Phase 4 work.

## 5. Document audit — corrections made

Two independent reviews read all documents in full. Verified findings were fixed in the documents (and, where relevant, in the schema):

| Area | Problem found | Correction |
|---|---|---|
| Roadmap (11) | Five phases of 30–46 weeks and an 8.5-person team, contradicting the four-phase, 30-day, $1,200 contract | Rewritten to the contract's Phases 2–4 with their days and scope; post-contract backlog separated; team of 1–2 developers |
| Contract terms (03, 10, README) | Store publishing, real-device testing, the 45-day warranty, client ownership of accounts and "production payment activation at no extra programming fee" were missing | Added as explicit commitments; merchant account and Apple Pay merchant ID owned by the client |
| Money (05) | Floating-point amounts and no VAT placement | Integer halalas with one documented rounding; VAT placement section marked open for the client's tax advisor |
| Lifecycle (04, 06, 07, 08) | Different state lists (`expired` vs cancel), offer statuses and event ordering across documents; admin cancel contradiction; incomplete accept-race guard; no failure/recovery rules | One model applied everywhere; atomic offer-and-trip accept; failure and recovery table; `409 INVALID_TRANSITION` |
| Database (06) | DDL that would not run (`uuidv7()` on PostgreSQL 17, a partitioned table with a non-partition primary key, `payments` without `psp`), pricing overlap blocking four-eyes approval, phone check blocking anonymisation | Fixed in 06 **and implemented and tested** in the migration |
| Payments (10) | No declined branch, wrong payment state machine, decided points re-asked as open questions | Corrected; mada, Apple Pay, cards and cash treated as required |
| Budget fit (07, 08, 11) | Kubernetes, Terraform, read replica, OpenTelemetry, 8 Flutter packages | One NestJS process, Docker Compose, managed PostgreSQL and Redis; two shared Flutter packages; the rest marked post-contract |
| Stale statements (01, 03, 05) | Items fixed in the prototype still described as broken (offer timeout, coupon expiry, captain waiting meter, editable fees) | Updated |
| Admin architecture | No document | [12-admin-architecture.md](12-admin-architecture.md) created |
| Mermaid (10) | One sequence diagram failed to parse | Fixed; all 10 diagrams parse |
| Prototype paths | Documents pointed at `src/...` after the prototype moved to `prototype/` | Updated |

## 6. Security and secrets review

- No API keys, tokens or production credentials are in the repository. Searched for key/token/secret patterns; matches are documentation only.
- Passwords present are for disposable local/CI databases only: `mashwar_local_dev` (local Docker default, overridable by `POSTGRES_PASSWORD`) and `ci_only_password` (GitHub Actions service container). Neither protects real data.
- `.env*` files are ignored; `backend/.env.example` contains placeholders only.
- The rider "Add card" form in the prototype keeps a typed card number in browser memory (demo only); production uses PSP-hosted fields/SDK and never handles card numbers (10).

## 7. Architecture and security risks

| Risk | Mitigation (proportionate to this contract) | Phase |
|---|---|---|
| Two captains accept the same trip | Atomic conditional update on the offer, then the trip; partial unique indexes — **implemented and tested** in the schema | 2 |
| Offers stuck if Redis/queue is lost | Database sweeper for expired offers (`for update skip locked`) as a safety net | 2–3 |
| Duplicate or out-of-order events on the apps | `tripVersion` ordering; resync on gaps — **implemented and tested** in `mashwar_core` | 2 |
| Duplicate payments or settlements | Idempotency keys per payment row; ledger idempotency key `trip:{id}:settle` — **schema implemented and tested** | 3 |
| Forged payment webhooks | Signature verification, `psp_webhook_events` de-duplication (table implemented), status fetched from the PSP when in doubt | 3 |
| Broken access control on admin APIs | Permission guard on every route (implemented), object-level checks, audit log (table implemented), MFA for staff | 2–3 |
| OTP abuse | Rate limits per phone/device/IP, HMAC-stored codes in Redis, short expiry | 2 |
| Refresh-token theft | Rotation with reuse detection and a short grace window | 2 |
| Background location on iOS/Android | Foreground service on Android, "when in use" + background mode on iOS; field test on real devices in Phase 4 | 3–4 |
| Personal data (PDPL) | Minimisation, application-level encryption for national ID and IBAN (columns implemented as encrypted bytes), retention jobs, hosting region decided with counsel (C6) | 2–4 |
| Push notifications not delivered | Inbox in the database as the source of truth; push as a hint; delivery tracking table (implemented) | 3 |
| Operations blind spots | Health check (implemented), error tracking and uptime monitoring from Phase 2 staging | 2 |

## 8. Remaining work

**CRITICAL (before Phase 1 acceptance)**
1. ~~Push the foundation commit and confirm a green GitHub Actions run~~ — done 2026-10-30.
2. Client sign-off of checklist sections A–C; record change requests.

**IMPORTANT (within Phase 1 if possible)**
3. Client answers or dates for CLIENT-DECISIONS section A (C1–C9), especially developer accounts (long lead).
4. Repository transfer to the client's GitHub organisation (C9).

**FUTURE (Phases 2–4, not started)**
5. iOS build verification on a Mac; app icons and splash from the final brand.
6. Authentication (OTP, tokens, staff MFA), maps, booking, real-time tracking, notifications, payment sandbox, admin features, real-device testing, store publishing, handover.

## 9. Phase 2 transition plan

| Step | Prerequisite | Output |
|---|---|---|
| Kick-off | Phase 1 accepted; C1–C8 answered or dated | Phase 2 calendar dates |
| Staging environment | C6 hosting account (client-owned) | Backend + PostgreSQL + Redis on staging, deployed by CI |
| Authentication | C7 SMS provider sandbox | OTP sign-in for riders and captains, tokens, device binding |
| Maps and booking | C1 service areas, C8 maps key | Quote and booking against the backend, nearest-captain dispatch, basic lifecycle |
| App identities | C3–C5 | Final bundle ids, icons, internal test builds |

## 10. What the client can test now vs later

| Now | Later |
|---|---|
| Interactive prototype (all three experiences, simulated data) at the preview link | Real sign-in, maps, GPS tracking, notifications (Phases 2–3) |
| All Phase 1 documents in `docs/phase1/` | Payment sandbox (Phase 3); production payments after the client's merchant onboarding |
| The foundation: run the backend health check, migrations, admin shell and Flutter apps from the README | Store builds and real-device testing (Phase 4) |

## 11. Files changed in this audit

New: `backend/` (scaffold, migrations, tests), `admin/` (shell), `mobile/` (workspace, apps, packages), `infra/docker-compose.yml`, `design/` (brand mark), root `package.json`, `pnpm-workspace.yaml`, docs 12 and this report, the acceptance checklist and the client decisions list. Moved: the prototype from the repository root to `prototype/` (history preserved). Updated: the CI workflow, README, HANDOFF.md, DESIGN_SYSTEM.md, `.gitignore`, documents 01, 03–11 and the docs README, `prototype/playwright.config.ts` (local worker count).
