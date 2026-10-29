# MASHWAR: Phase 1 deliverables

Status: Draft for client review — Phase 1

Phase 1 covers design approval, requirements, architecture and the technical foundation. Nothing here is a production system. The only built artifact is the React prototype in this repository. It runs entirely in the browser on simulated data.

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

## What is real, what is documented, what is not built

| Category | Contents |
|---|---|
| **Working in the React prototype** (verified by `pnpm test:e2e`) | Rider booking, fare estimate, coupons, live trip, rating. Captain online toggle, offer with 30 s timeout, accept/decline with reassignment, arrive/start/end, waiting meter, earnings. Admin: 12 sections, trip search and filters, pricing and fee settings that update rider fares live. Arabic RTL and English. Demo reset. Layouts at 375/390/430 px and desktop. |
| **Designed and documented only** | Server-authoritative state machine, dispatch, database schema, backend modules and APIs, Flutter app structure, payment flows, multi-country configuration, roadmap. |
| **Not implemented (production work)** | Real maps and GPS, live tracking over WebSockets, SMS OTP, payments, refunds and payouts, push notifications, KYC, persistence, authentication, any backend. Multi-country support beyond Saudi Arabia. |

All fares, fees and the 20% platform commission are **provisional demo values and have not been approved by the client.**
