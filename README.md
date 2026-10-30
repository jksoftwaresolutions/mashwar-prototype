# MASHWAR — ride-hailing platform (Phase 1)

Saudi ride-hailing platform: rider and captain apps (Flutter, Android and iOS), an admin dashboard (React) and a custom backend (NestJS, PostgreSQL + PostGIS).

**Status: Phase 1 — requirements, UX/UI, architecture and technical foundation.** Nothing here is a production system. The interactive prototype runs on simulated data: maps, GPS, payments, SMS and notifications are not real. All fares, fees and the 20% platform commission are provisional values not yet approved by the client.

- Phase 1 documents and audit: [docs/phase1/README.md](docs/phase1/README.md)
- Design system: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) · Prototype handoff: [HANDOFF.md](HANDOFF.md)
- Prototype preview (temporary demo hosting, simulated data): https://jksoftwaresolutions.github.io/mashwar-prototype/

## Repository layout

| Folder | What it is | Phase 1 state |
|---|---|---|
| `prototype/` | Interactive React prototype (rider, captain, admin) used for design approval | Complete; Playwright suite |
| `backend/` | NestJS backend: config, health check, migration runner, trip state machine, staff RBAC map | Foundation only; unit + database tests |
| `backend/db/` | PostgreSQL + PostGIS migrations, reference data, development seed | Initial schema implemented and tested |
| `admin/` | Admin dashboard shell (React + Vite) | Navigation, RTL, backend health check; features in Phase 3 |
| `mobile/` | Dart workspace: `apps/rider`, `apps/captain`, `packages/mashwar_core`, `packages/mashwar_ui` | Created with `flutter create`; theme, Arabic/English, tests; features in Phase 2 |
| `infra/` | Docker Compose for local PostgreSQL + PostGIS and Redis | Local development only |
| `docs/` | Phase 1 deliverables | See docs/phase1 |

## Requirements

Node 22, pnpm 10 (`corepack enable`), Docker, Flutter 3.44 (Dart 3.12).

## Run it

```bash
pnpm install
pnpm prototype:dev          # prototype at http://localhost:8443
pnpm prototype:e2e          # Playwright suite (first run: pnpm --filter mashwar-prototype exec playwright install chromium)
```

Backend and database:

```bash
pnpm db:up                  # PostgreSQL 17 + PostGIS 3.5 on :55432, Redis on :56379
cp backend/.env.example backend/.env
DATABASE_URL=postgres://mashwar:mashwar_local_dev@localhost:55432/mashwar pnpm db:migrate
pnpm --filter @mashwar/backend db:seed:dev   # optional: Riyadh, categories, PROVISIONAL demo pricing
pnpm backend:test           # unit tests
DATABASE_URL=postgres://mashwar:mashwar_local_dev@localhost:55432/mashwar pnpm --filter @mashwar/backend test:db
pnpm --filter @mashwar/backend build && pnpm --filter @mashwar/backend start   # GET /v1/health
```

Admin shell: `pnpm admin:dev` (http://localhost:5174; set `VITE_API_BASE_URL` from `admin/.env.example`).

Mobile:

```bash
cd mobile && flutter pub get && flutter analyze
cd apps/rider && flutter test && flutter run
```

## Continuous integration

`.github/workflows/deploy.yml` runs on every push and pull request: prototype typecheck and Playwright, backend unit tests and schema tests against a PostGIS service container, admin typecheck/test/build, and `flutter analyze` plus all Dart/Flutter tests. Pushes to `main` that pass the prototype tests redeploy the prototype preview to GitHub Pages.

## Ownership

All source code, designs and project assets belong to the client. The repository currently lives under the delivery team's GitHub account as temporary hosting and transfers to the client's organisation when provided. Production accounts (Apple, Google Play, payment gateway, hosting, SMS, domain) are opened under the client's ownership.
