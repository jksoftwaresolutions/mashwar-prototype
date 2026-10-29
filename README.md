# MASHWAR — ride-hailing prototype (Phase 1)

Interactive React prototype of a Saudi ride-hailing platform: rider app, captain app and admin dashboard on shared, simulated data. Arabic (RTL) first, with English.

**This is a review prototype.** Maps, GPS, payments, SMS and notifications are simulated. All fares, fees and the 20% platform commission are provisional values not yet approved by the client.

- Phase 1 documents: [docs/phase1/README.md](docs/phase1/README.md)
- Developer handoff: [HANDOFF.md](HANDOFF.md)
- Design system: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)

## Run locally

```bash
pnpm install
pnpm dev          # http://localhost:8443
pnpm check        # typecheck + production build
pnpm test:e2e     # Playwright suite (first run: pnpm exec playwright install chromium)
```

Pushes to `main` run the test suite and deploy to GitHub Pages (`.github/workflows/deploy.yml`).
