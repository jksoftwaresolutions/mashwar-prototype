# MASHWAR: Phase 1 deliverables

Status: Draft for client review — Phase 1

Phase 1 ($240, 6 days, of a $1,200 / 30-day four-phase contract) covers requirements, UX/UI, architecture and the technical foundation. Nothing here is a production system. Built so far: the React prototype in `prototype/` (runs entirely in the browser on simulated data) and the Phase 1 technical foundation (repository layout, backend scaffold, migrations, Flutter and admin scaffolds; see [11 §4a](11-project-structure-and-roadmap.md)).

Client feedback on the prototype ("The design is good and I like it. Continue as agreed.") is recorded as approval of the overall design direction only. Individual policies and commercial values remain open.

## Documents

| # | Deliverable | File |
|---|---|---|
| 1 | Approved-design checklist | [01-approved-design-checklist.md](01-approved-design-checklist.md) |
| 2 | Updated design system | [../../DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) (section 12 covers the review-build changes) |
| 3 | Requirements and scope review | [03-requirements-and-scope.md](03-requirements-and-scope.md) |
| 4 | Trip lifecycle specification | [04-trip-lifecycle-spec.md](04-trip-lifecycle-spec.md) |
| 5 | Fare, waiting, cancellation and commission rules | [05-fare-and-fee-rules.md](05-fare-and-fee-rules.md) |
| 6 | Preliminary database architecture and ERD | [06-database-architecture.md](06-database-architecture.md) |
| 7 | Backend architecture proposal | [07-backend-architecture.md](07-backend-architecture.md) |
| 8 | Flutter application architecture proposal | [08-flutter-architecture.md](08-flutter-architecture.md) |
| 9 | Country expansion strategy | [09-country-expansion-strategy.md](09-country-expansion-strategy.md) |
| 10 | Payment gateway integration plan | [10-payment-gateway-plan.md](10-payment-gateway-plan.md) |
| 11 | Project structure and development roadmap | [11-project-structure-and-roadmap.md](11-project-structure-and-roadmap.md) |
| 12 | Administration dashboard architecture | [12-admin-architecture.md](12-admin-architecture.md) |
| — | Design assets (brand mark, asset index) | [../../design/README.md](../../design/README.md) |
| — | Phase 1 audit report (test and check results) | [PHASE1-AUDIT-REPORT.md](PHASE1-AUDIT-REPORT.md) |
| — | Phase 1 acceptance checklist | [PHASE1-ACCEPTANCE-CHECKLIST.md](PHASE1-ACCEPTANCE-CHECKLIST.md) |
| — | Decisions needed from the client | [CLIENT-DECISIONS.md](CLIENT-DECISIONS.md) |

## Contractual commitments

| Commitment | Where it is specified |
|---|---|
| App Store and Google Play publishing of both apps, under the client's accounts (Phase 4) | [03 §6](03-requirements-and-scope.md), [08 §15](08-flutter-architecture.md), [11 §5](11-project-structure-and-roadmap.md) |
| Automated tests plus real-device testing on iOS and Android (Phase 4) | [03 §6](03-requirements-and-scope.md), [08 §14](08-flutter-architecture.md), [11 §5](11-project-structure-and-roadmap.md) |
| 45-day implementation-defect warranty, starting after both apps are published | [03 §6](03-requirements-and-scope.md), [11 §5](11-project-structure-and-roadmap.md) |
| Client ownership of the GitHub repository (when provided), source code, design and assets, and all production accounts (Apple, Google Play, PSP merchant and Apple Pay merchant ID, hosting, domain, SMS) | [03 §8](03-requirements-and-scope.md) assumption 3, [10 §1a](10-payment-gateway-plan.md), [11 §1](11-project-structure-and-roadmap.md) |
| Payment sandbox during development (Phase 3), then production gateway activation with the client's live keys at no additional programming fee | [10 §11](10-payment-gateway-plan.md), [03 §6](03-requirements-and-scope.md) |

## What is real, what is documented, what is not built

| Category | Contents |
|---|---|
| **Working in the React prototype** (verified by `pnpm test:e2e`; results in [PHASE1-AUDIT-REPORT.md](PHASE1-AUDIT-REPORT.md)) | Rider booking, fare estimate, coupons, live trip, rating. Captain online toggle, offer with 30 s timeout, accept/decline with reassignment, arrive/start/end, waiting meter, earnings. Admin: 12 sections, trip search and filters, pricing and fee settings that update rider fares live. Arabic RTL and English. Demo reset. Layouts at 375/390/430 px and desktop. |
| **Phase 1 technical foundation** (in the repository) | Repository layout (`prototype/`, `backend/`, `admin/`, `mobile/`, `infra/`), NestJS scaffold with health endpoint, trip state machine and RBAC map with unit tests, PostgreSQL + PostGIS migrations (`backend/db/migrations/`) verified by migration tests, Flutter rider / captain scaffolds with shared packages, admin shell, `infra/docker-compose.yml`, env templates, CI. See 11 §4a. |
| **Designed and documented only** | Dispatch, backend modules and APIs, Flutter app features, payment flows, multi-country configuration, roadmap. |
| **Not implemented (production work)** | Real maps and GPS, live tracking, SMS OTP, payments, refunds and payouts, push notifications, KYC, authentication, any production backend feature. Multi-country support beyond Saudi Arabia. |

All fares, fees and the 20% platform commission are **provisional demo values and have not been approved by the client.**
