# Phase 1 acceptance checklist

Status: Ready for client review — not yet accepted (2026-10-30)

Phase 1 ($240, 6 days) is accepted when every **required** item below is ticked by the client. Items marked *delivery team* are already done and can be checked by the client; items marked *client* need the client's review or action. Commercial values (fares, fees, commission) are **not** part of Phase 1 acceptance — they stay open in [CLIENT-DECISIONS.md](CLIENT-DECISIONS.md) and are needed before Phase 3.

## A. Design (UI/UX)

| # | Item | How to check | Owner | Required | Done |
|---|---|---|---|---|---|
| A1 | Rider app screens approved | Open the [prototype preview](https://jksoftwaresolutions.github.io/mashwar-prototype/) → Rider app; tick section B of [01](01-approved-design-checklist.md) | Client | Yes | [ ] |
| A2 | Captain app screens approved | Prototype → Captain app; section C of 01 | Client | Yes | [ ] |
| A3 | Admin dashboard screens approved | Prototype → Admin dashboard; section D of 01 | Client | Yes | [ ] |
| A4 | Arabic (RTL) and English, phone sizes 375–430 px | Switch language in the prototype; section E of 01 | Client | Yes | [ ] |
| A5 | Design system and brand mark | [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md), [design/README.md](../../design/README.md); brand name may stay a working name (C3) | Client | Yes | [ ] |
| A6 | Change requests recorded | Any requested changes listed in 01 with "Changes requested", and scheduled | Client + team | Yes | [ ] |

Overall design direction is already approved by the client ("The design is good and I like it. Continue as agreed."). A1–A4 confirm the individual screens.

## B. Requirements and business rules

| # | Item | How to check | Owner | Required | Done |
|---|---|---|---|---|---|
| B1 | Scope, roles and requirements reviewed | [03](03-requirements-and-scope.md): in-scope / out-of-scope lists, MVP, contractual commitments | Client | Yes | [ ] |
| B2 | Ride lifecycle reviewed (search, accept, decline and reassignment, arrival, trip, completion, cancellation, failures) | [04](04-trip-lifecycle-spec.md) | Client | Yes | [ ] |
| B3 | Fare, waiting, cancellation and commission **rules** reviewed; values acknowledged as provisional | [05](05-fare-and-fee-rules.md) | Client | Yes | [ ] |
| B4 | Payment plan reviewed (mada, Apple Pay, cards, cash, sandbox, production activation, account ownership) | [10](10-payment-gateway-plan.md) | Client | Yes | [ ] |
| B5 | Saudi launch vs future expansion understood (multi-country is designed, not built) | [09](09-country-expansion-strategy.md) | Client | Yes | [ ] |
| B6 | Open decisions have an answer or an agreed date | [CLIENT-DECISIONS.md](CLIENT-DECISIONS.md) section A (needed before Phase 2) | Client | Yes (dates) | [ ] |

## C. Architecture

| # | Item | Evidence | Owner | Required | Done |
|---|---|---|---|---|---|
| C1 | Database design and ERD | [06](06-database-architecture.md) | Client review | Yes | [ ] |
| C2 | Backend architecture (auth, permissions, dispatch, real-time, notifications, payments) | [07](07-backend-architecture.md) | Client review | Yes | [ ] |
| C3 | Flutter app architecture | [08](08-flutter-architecture.md) | Client review | Yes | [ ] |
| C4 | Admin dashboard architecture | [12](12-admin-architecture.md) | Client review | Yes | [ ] |
| C5 | Repository structure and roadmap matching the four contract phases | [11](11-project-structure-and-roadmap.md) | Client review | Yes | [ ] |

## D. Technical foundation (can be verified now)

| # | Item | How to verify | Owner | Required | Done |
|---|---|---|---|---|---|
| D1 | Monorepo layout: `prototype/`, `backend/`, `admin/`, `mobile/`, `infra/`, `docs/` | Root [README](../../README.md) | Delivery team | Yes | [x] |
| D2 | Backend scaffold with health check, configuration validation, trip state machine and staff permission map, with tests | `pnpm --filter @mashwar/backend test` (20 tests) | Delivery team | Yes | [x] |
| D3 | PostgreSQL + PostGIS schema as migrations, verified on a real database | `pnpm db:up`, then `test:db` (10 tests) | Delivery team | Yes | [x] |
| D4 | Flutter rider and captain projects (Android and iOS) with shared packages, theme, Arabic/English | `flutter analyze` (no issues), `flutter test` (15 tests) | Delivery team | Yes | [x] |
| D5 | Android build of the scaffold | `flutter build apk --debug` succeeds for both apps (audit report §4) | Delivery team | Yes | [x] |
| D6 | iOS build of the scaffold | Needs a Mac with Xcode; not verified in Phase 1 | Delivery team | No (Phase 2) | [ ] |
| D7 | Admin dashboard shell | `pnpm --filter @mashwar/admin build`; 3 tests | Delivery team | Yes | [x] |
| D8 | Local services and environment templates | `infra/docker-compose.yml`, `backend/.env.example`, `admin/.env.example` | Delivery team | Yes | [x] |
| D9 | Continuous integration for all parts | `.github/workflows/deploy.yml`; a green run on GitHub after the foundation is pushed | Delivery team | Yes | [ ] pending push |
| D10 | Prototype regression suite | 24 Playwright tests pass | Delivery team | Yes | [x] |

## E. Ownership and delivery

| # | Item | How to check | Owner | Required | Done |
|---|---|---|---|---|---|
| E1 | Source, designs and documents organised in one repository with history | Git log, repository tree | Delivery team | Yes | [x] |
| E2 | No secrets committed (only local/CI development passwords for disposable databases) | PHASE1-AUDIT-REPORT.md §6 | Delivery team | Yes | [x] |
| E3 | Prototype hosting identified as temporary demo hosting | Root README | Delivery team | Yes | [x] |
| E4 | Repository transferred to the client's GitHub organisation | Client provides the organisation (C9); team transfers | Client + team | Yes, when provided | [ ] |
| E5 | Client-side long-lead accounts started (Apple, Google Play, hosting, SMS, maps, PSP) | CLIENT-DECISIONS C4–C10 | Client | No (needed for Phases 2–3) | [ ] |

## Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| Client | | | |
| Delivery lead | | | |
