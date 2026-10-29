# MASHWAR Design System

These specs are written to be shared by the React prototype and the future Flutter apps.
Values are given as both Tailwind tokens and plain hex or logical pixels (1 rem = 16 lp).

## 1. Color tokens (`src/index.css` → `@theme`)

| Token | Hex | Use |
|---|---|---|
| `navy` | `#101B2E` | Brand primary, dark surfaces, primary text on light, captain app background |
| `navy-2` | `#17243B` | Raised dark surfaces (sheets, cards in captain app) |
| `emerald` | `#0FAF92` | Primary action, live or progress state, success |
| `emerald-d` | `#0B8F77` | Emerald text on light tints, hover/pressed |
| `mint` | `#E6F8F2` | Success and selected tints |
| `gold` | `#D7A867` | Accent: ratings, rewards, en-route state, destination pin on dark map |
| `ink` | `#182335` | Body text |
| `muted` | `#718096` | Secondary text (AA contrast on white at 14 px or larger) |
| `line` | `#E7EBF1` | Borders, dividers |
| `bg` | `#F6F8FB` | App canvas, input fill |

Status colors (`STATUS_META` in `components/ui.tsx`): requested amber `#E3A13A`, en route gold, arrived and in progress blue `#3B82F6`, completed emerald, cancelled red `#E25B53`.
Always pair a status color with a text label. Never use color alone.

## 2. Typography

- Arabic: **IBM Plex Sans Arabic** (300–700). Latin: **Inter** (400–700). Both are loaded from Google Fonts; no key is required.
- `html[lang=ar]` uses line-height 1.55 and no letter-spacing. Never letter-space Arabic.
- IDs, plates, codes and phone numbers render with `dir="ltr"` and/or `font-mono`.

| Role | Size / weight |
|---|---|
| Display (showcase hero) | 38–54 / 700 |
| Page title (admin) | 24 / 700 |
| Screen title (mobile) | 20 / 700 |
| Sheet title | 18 / 700 |
| Card title / primary value | 15–16 / 700 |
| Body | 14 / 400–600 |
| Caption | 11–12 / 500 |
| Micro label | 10 / 500 (minimum allowed) |

## 3. Spacing

4-pt base. Common steps: 4, 8, 10, 12, 16, 20, 24, 32.
Mobile screen gutter is **20** (`px-5`). Admin page padding is 16 (mobile) or 24 (≥640). The card grid gap is 16.

## 4. Radius

| Size | Value | Use |
|---|---|---|
| sm | 8–12 | Chips, small buttons, table actions |
| md | 16 (`rounded-2xl`) | Buttons, inputs, list cards |
| lg | 24 (`rounded-3xl`) | Cards, modals |
| sheet | 28–30 | Bottom-sheet top corners |
| device | 54 | Phone frame (showcase only) |

## 5. Elevation

- **Card:** `0 1px 2px rgba(16,27,46,.04), 0 12px 32px -18px rgba(16,27,46,.18)`
- **Sheet:** `0 -20px 40px -20px rgba(16,27,46,.3)`
- **Primary button glow:** `0 10px 24px -10px rgba(15,175,146,.7)`

Use elevation sparingly. Prefer borders (`line`) on light surfaces.

## 6. Components (`src/components/ui.tsx`)

| Component | Notes |
|---|---|
| `Btn` | Variants `primary`, `dark`, `outline`, `soft`, `ghost`, `danger`. Minimum height is 44, and 56 (`h-14`) for primary mobile CTAs. Shows a pressed state (scale .98) and 50% opacity when disabled. |
| `Card` | White, 24 radius, `line` border, card elevation. |
| `Segmented` | Filter or tab switcher, with light and dark variants. |
| `Toggle` | `role="switch"`, 48×28. |
| `Stars` | Rating input or display, always LTR. |
| `StatusBadge`, `Pill` | Status labels (dot plus text). |
| `RideStatusTimeline` | Five-step lifecycle, horizontal bar or vertical list. |
| `Modal`, `ConfirmationModal`, `Drawer` (side panel), `Sheet` (bottom sheet scoped to the phone frame) | Overlays. All close on Esc or backdrop tap. |
| `Toasts` | Global feedback with `success`, `info` and `warn` tones. |
| `PhoneFrame`, `StatusBar` | Device chrome for presenting the mobile apps on desktop. |
| `Avatar`, `Logo`, `CarIllustration` | Brand and identity elements. |
| `MapCanvas` (`components/MapCanvas.tsx`) | Stylized SVG map of Riyadh: cars, pickup (emerald dot), destination (navy or gold pin), route (glow plus progress), zoom and locate controls. |

**Inputs:** height 44–56, 16 radius, `bg` fill, `line` border, emerald border on focus, white fill when focused. The `.inp` class is used for admin forms.

## 7. Navigation patterns

- **Mobile:** four-tab bottom bar (Home, Trips, Wallet or Earnings, Account). The active tab uses a mint pill (passenger) or emerald text (captain). Sub-pages use a back button that is mirrored for RTL.
- **Admin:** a fixed 256-wide navy sidebar (from the `lg` breakpoint), a slide-in sidebar on smaller screens, and a sticky blurred top bar with search, role switcher, language, reset, notifications and profile.
- **Prototype shell:** a top bar with the role switcher (Rider / Captain / Admin), a story panel (`xl`) and a demo-control panel (`lg`).

## 8. Mobile layout conventions

- Design width is 390. The layout is verified for 375–430.
- Map screens use a full-bleed map behind a top overlay (status, actions) and a bottom sheet (max height 64–68%) with an internal scroll and safe-area bottom padding.
- Primary actions sit at the bottom of the sheet, full width, 56 high.
- Keep only one primary action per sheet state.

## 9. RTL rules

- Use logical properties only: `ps-` / `pe-`, `ms-` / `me-`, `start-` / `end-`, `text-start`, `border-s` / `border-e`.
- Mirror directional icons (back arrows, chevrons, send). Do not mirror the brand, maps, media or ratings.
- Numbers use Latin digits (locale `ar-SA-u-nu-latn`) for fare legibility. This is configured per market.
- Charts render inside `dir="ltr"`, and their axes are reversed in Arabic.

## 10. Motion

- `anim-fade-up` (450 ms), `anim-sheet` (420 ms), `anim-side` (380 ms), `anim-fade` (300 ms), all with the easing `cubic-bezier(.2,.8,.2,1)`.
- Car movement uses a 500 ms linear transform.
- Live indicators use a soft ping.
- Everything is disabled under `prefers-reduced-motion`.

## 11. Flutter mapping

| React | Flutter |
|---|---|
| Theme tokens | `ThemeData.colorScheme` plus a `ThemeExtension` for status colors |
| `Btn` | `FilledButton` / `OutlinedButton` with a shape radius of 16 |
| `Sheet` | `DraggableScrollableSheet` |
| `Segmented` | `SegmentedButton` |
| RTL | `Directionality`, driven by locale |
| Map | Replace `MapCanvas` with Google Maps or Mapbox, keeping the same marker and route styles |

## 12. Phase 1 review build: changes and rules

These rules come from defects found while browser-testing the export. Follow them in React and mirror them in Flutter.

- **CSS layering (Tailwind v4).** Global element rules (`html`, `body`, `button { font: inherit }`, focus rings) live in `@layer base` in `src/index.css`. Unlayered rules beat every utility. Before this fix, `button { font: inherit }` silently overrode `text-xs`, `text-sm` and `font-semibold` on every button.
- **Positioned components.** A component must not add `relative` when the caller passes `absolute` or `fixed` (see `MapCanvas`). `relative` wins in the generated CSS and the element collapses to zero height. This was the cause of the blank captain home map and the blank showcase previews.
- **Grid children with scrollable tables** need `min-w-0` (`Card` in `ChartCard`, `DataTable`, `StatCard`). Without it, a `min-w-[620px]` table widens the whole page on phones.
- **Numbers in RTL.** Signed deltas (`+8.2%`), timers, plates and IDs render inside `dir="ltr"`. Table numbers use `tabular-nums`.
- **Copy.** Use the ellipsis character (`…`), not three periods. Loading and searching states end with it.
- **Brand.** The wordmark is wrapped in `translate="no"`.

### Showcase

- The hero leads with a single brand gesture: a drawn route line (navy pickup dot → emerald path → gold destination) that echoes the logo mark. The path draws once on load (`.route-draw`, 1.4 s) and is static under reduced motion.
- There are three entry cards ("doors") for Rider, Captain and Admin. On phones they are compact rows; from `sm` they are cards. The captain door is the navy one, matching the captain app surface.
- The lifecycle section uses numbered markers because the content is a real sequence. The last step (Admin) is gold.
- The "What's simulated" panel is mandatory for client builds. It lists the mocked integrations and states that commercial values are provisional.

### Admin

- KPI cards are 2-up on phones (`grid-cols-2`, `p-4`, value `text-xl`) and 4-up from `xl`.
- The Settings page groups fare inputs, category multipliers, waiting and cancellation fees, the commission (read-only, with a "Provisional, not approved" pill) and service areas. Save and Discard stay disabled until the draft differs from the saved values.

### Accessibility primitives (`components/ui.tsx`)

- `Modal`, `Drawer` and `Sheet` have `role="dialog"`, `aria-modal`, an accessible name, Esc to close, and focus that moves into the dialog and back to the trigger.
- `Toasts` is a polite live region.
- `Stars` is a labelled button group when editable ("4 out of 5 stars") and a single labelled image when read-only ("Rated 4 out of 5").
- `Segmented` and `RoleSwitcher` expose `aria-pressed`. All icon-only buttons and form inputs have localized labels.

### Translations

- Shared strings live in `src/i18n/messages.ts` and are read with `t('payment.card')`. Screen copy still uses inline `t(ar, en)` pairs and moves to the dictionary screen by screen. Flutter ARB files should be generated from the same keys.

### State and re-renders

- Read language data with `useLocale()` and the current experience with `useRole()`. Use `useStore()` only in components that show ride data.
- The ride store changes every 500 ms during a live trip. Components that subscribe to it re-render on every tick, and so do their children. Before this split, the shell header re-rendered 26 times in 5 s during a trip; it now re-renders 0 times.
