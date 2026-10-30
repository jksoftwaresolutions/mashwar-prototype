# MASHWAR — Developer Handoff

> This handoff covers the React prototype in `prototype/`. Paths below are relative to that folder. The production foundation (backend, admin shell, Flutter apps, database) is described in the root [README](README.md) and [docs/phase1/11](docs/phase1/11-project-structure-and-roadmap.md).

An interactive **prototype** of a Saudi ride-hailing platform with three connected experiences: the passenger app, the captain app and the admin dashboard.
It runs on React 19, TypeScript, Vite 8, Tailwind CSS v4, Recharts and Lucide.
All data is simulated in the browser. There is no backend and no API keys or secrets.

## 1. Project structure

```
src/
  main.tsx              entry: mounts <App/>, imports index.css
  App.tsx               StoreProvider, role routing (Passenger/Driver/Admin lazy-loaded), prototype shell (top bar, story and demo panels)
  store.tsx             shared simulation state (React Context): seed data, ride lifecycle, notifications
  config/market.ts      market configuration: country, city, currency, locale, calling code, vehicle categories,
                        pricing, waiting and cancellation fees, provisional commission; fee helpers (SA only)
  i18n/messages.ts      typed shared-string dictionary, read with t('key')
  i18n/locale.tsx       LocaleProvider / useLocale(): lang, t, dir, money (changes only on language switch)
  role.tsx              RoleProvider / useRole(): which experience is on screen
  Showcase.tsx          landing and presentation screen
  Passenger.tsx         passenger app (onboarding, booking, live trip, rating, trips, wallet, account)
  Driver.tsx            captain app (login, online toggle, requests, navigation, earnings, history, account)
  Admin.tsx             admin dashboard (12 sections)
  components/ui.tsx     design-system primitives (see DESIGN_SYSTEM.md)
  components/shell.tsx  RoleSwitcher, LangSwitch, ResetButton (shared by shell, admin header and showcase)
  components/ride.tsx   RideCard, ChatSheet, Empty (shared by rider and captain apps)
  components/MapCanvas.tsx  SVG map of Riyadh and route helpers (routePts, pointAlong)
  index.css             Tailwind import, theme tokens, base layer, keyframes, reduced-motion rules
e2e/
  flow.spec.ts          connected lifecycle, decline/reassign, cancellation fees, coupons, pricing, filters, reset, RTL, overflow
  rules.spec.ts         pure fare/fee/commission rule checks
  screens.spec.ts       screenshot capture for design review (writes e2e/screens/)
docs/phase1/            Phase 1 deliverables (start at docs/phase1/README.md)
```

Page title, language and meta tags are set in `index.html`; `public/robots.txt` keeps the prototype out of search engines. Set `BASE_PATH` when building for a sub-path host (GitHub Pages).

## 2. Shared ride simulation (`store.tsx`)

- The lifecycle is `requested → accepted → arrived → in_progress → completed`, or `cancelled`.
- Every transition function checks the current status and does nothing if the step is invalid:
  - `requestRide` → `acceptRide` / `rejectRide` → `arrive` → `startRide` → `endRide` → `rate`
  - `cancelRide` is available before the trip starts.
- `rejectRide` reassigns the request to another captain after 3 seconds.
- If an auto-simulated captain is assigned, the ride advances on its own.
- An effect settles a completed live trip exactly once. It updates the rider's ride count and spend, and frees the captain.
- Demo helpers:
  - `advance` runs the next step.
  - `fastForward` jumps to completion.
  - `reset` restores all seeds, clears both logins and returns to the showcase.
- `t(ar, en)` handles translation and `money(n)` formats prices through `config/market.ts`.

## 3. Run and build

```bash
pnpm install          # from the repository root (pnpm workspace)
cd prototype
pnpm dev              # Vite dev server (default port 8443, or $PORT)
pnpm typecheck        # tsc --noEmit
pnpm build            # production build into dist/
pnpm check            # typecheck + build
pnpm test:e2e         # Playwright suite (starts Vite on port 5199). First run: pnpm exec playwright install chromium
```

## 4. What is simulated

- **Map and tracking:** a stylized SVG map with interpolated car movement. There is no GPS.
- **Authentication:** the passenger OTP is always `1234`. Captain sign-in is a one-tap demo.
- **Payments, cards, wallet, payouts and calls:** no real transactions or calls. The toasts say so.
- **Chat:** an automatic reply after 1.4 seconds.
- **Admin analytics:** chart series and KPI baselines are illustrative. Live demo trips are added on top of them.
- **Multi-country:** the config layer is ready, but only Saudi Arabia (`SA`) exists. Nothing else is presented as implemented.

## 5. Known limitations

- State is in memory only and is lost on reload.
- One demo rider (`r1`) and one demo captain (`d1`).
- Initial JS is about 270 kB (about 88 kB gzip, main chunk plus map). The rider, captain and admin apps are lazy chunks, and Recharts (about 350 kB) loads only with the captain or admin app.
- `Passenger.tsx` (~850 lines) and `Admin.tsx` (~690 lines) are still large; split them per screen next.
- Only shared strings are in `src/i18n/messages.ts`; screen copy still uses inline `t(ar, en)` pairs.
- See docs/phase1/03-requirements-and-scope.md section 7 for the remaining prototype gaps (G2–G5, G7–G9, G11–G13, G16–G20).
- Some admin form inputs (coupon dates, internal notes) are not persisted.

## 6. Recommended next steps

1. Split the screen files into `features/passenger/*`, `features/driver/*` and `features/admin/*`. Keep `components/ui.tsx` as the primitives layer.
2. Move the bilingual strings into an i18n dictionary (for example `src/i18n/{ar,en}.ts`) instead of inline `t()` pairs.
3. Extract the lifecycle into a pure reducer (`rideMachine.ts`) with unit tests. The status guards already define the allowed transitions.
4. Add React Router (or similar) for deep links to each app and admin section.
5. Lazy-load the admin dashboard and Recharts.

## 7. Flutter (passenger and captain apps)

- Port the tokens from `DESIGN_SYSTEM.md` into `ThemeData` plus a `ThemeExtension`.
- Mirror `config/market.ts` as a `MarketConfig` model loaded from the backend.
- Model the ride as a sealed `RideStatus` driven by a server stream (WebSocket or FCM), not by local timers.
- Use `flutter_localizations` with Arabic as the default locale and `Directionality`.
- Use Google Maps or Mapbox with custom markers that match `MapCanvas`.
- Use `DraggableScrollableSheet` for the booking and trip sheets.

## 8. Production backend

- **Services:** auth (OTP through a licensed Saudi SMS provider), riders, captains with KYC and vehicle docs, trips with a server-authoritative state machine, dispatch and matching, pricing per market and zone, payments (mada, Apple Pay, STC Pay through a licensed PSP), promotions, ratings, support and notifications.
- **Real time:** captains stream location over WebSocket; trip events go out to riders and admins.
- **Data:** PostgreSQL (PostGIS for zones and geo queries) and Redis for live captain locations.
- **Compliance:** follow Saudi Transport General Authority (TGA) requirements for ride-hailing apps, PDPL data protection, ZATCA e-invoicing for receipts, and audit logs for admin actions.
- **Pricing and commission:** must be server-side. The client only displays quotes.
