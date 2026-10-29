# 09 — Country Expansion Strategy

**Status:** Draft for client review — Phase 1
**Source:** `src/config/market.ts` (`MarketConfig`, `MARKETS`, `ACTIVE_MARKET_ID`)

> **Only Saudi Arabia exists.** The prototype contains exactly one market (`SA`, Riyadh). **Multi-country and multi-city operation is NOT a working capability**, in the prototype or anywhere else. This document describes how the configuration is structured so that expansion is possible later, and what must be built before any second market can launch. No other country should be presented as supported.

---

## 1. What the prototype's market config already separates

All country-specific values in the prototype are read from one `MarketConfig` object rather than hard-coded in screens.

| Field | SA value today | Purpose |
|---|---|---|
| `id` | `SA` | Market key |
| `country` | `{ iso2: 'SA', nameAr, nameEn }` | Display, legal entity mapping |
| `city` | `{ id: 'riyadh', nameAr, nameEn, timezone: 'Asia/Riyadh' }` | **One** city per market (limitation) |
| `currency` | `{ code: 'SAR', symbolAr: 'ر.س', symbolEn: 'SAR', decimals: 0 }` | Money formatting |
| `locale` | `ar: 'ar-SA-u-nu-latn-ca-gregory'`, `en: 'en-GB'` | Dates and numbers, Latin digits |
| `defaultLang` | `ar` | First-launch language and direction |
| `callingCode`, `phoneDigits`, `phonePlaceholder` | `+966`, 9, `5X XXX XXXX` | Phone entry and validation |
| `commission` | `{ rate: 0.2, status: 'provisional' }` | Platform commission with an approval flag |
| `pricingStatus` | `provisional` | Approval flag for all pricing |
| `vehicleCategories` | Economy, Comfort, Family (seats, demo ETA) | Category catalogue |
| `pricing` | base, perKm, perMin, minFare, multipliers, waiting, cancellation, areas | Fare rules (see 05) |

Switching `ACTIVE_MARKET_ID` is a **build-time** change in the prototype. There is no runtime market selection, no per-city data and no per-user market.

## 2. Target production model

Configuration moves to the backend and becomes hierarchical:

```
Market (country)
 ├─ legal entity, tax regime, regulator, currency, calling code, locales, payment methods
 └─ City (operating area)
     ├─ timezone, service-area polygons (PostGIS), launch status
     ├─ Vehicle categories enabled in this city
     └─ Zones (airport, downtown, events)
         └─ Rate cards (per category × zone × time band), versioned with effective dates
```

| Concern | Prototype | Production |
|---|---|---|
| Source of truth | `market.ts` in the client bundle | `markets`, `cities`, `zones`, `rate_cards`, `categories` tables. Admin-editable with approval workflow and audit |
| Delivery to apps | Compiled in | `GET /config?lat,lng` or by city ID, cached with a version / ETag. Apps never compute prices |
| Pricing | One rate card per market | Rate card per city / zone / category / time band. Versioned so historic trips keep their original rules |
| Service areas | Name + on / off toggle with no effect | Polygons. Pickup validation. Drop-off-outside-area rules |
| Categories | Fixed union type `'economy' \| 'comfort' \| 'family'` | Data-driven catalogue per city (IDs, names AR / EN, seats, vehicle eligibility rules) |
| Currency | Single currency, integer display | ISO 4217 code, minor units, rounding rules per market (amounts stored as integer minor units) |
| Time | One timezone | Store UTC. Render in the city timezone. Reports per city local day |
| Phone | Single calling code and length | E.164 validation library. Multiple allowed prefixes |
| Language | `ar` / `en` inline strings | i18n dictionaries. Additional locales per market (for example `ar-EG`, `ur`, `hi` for captains if needed) |
| Feature flags | None | Per market / city: cash enabled, wallet, scheduled rides, surge, categories |

**Must move server-side before any expansion:** pricing and fees, commission, coupons, service areas, category catalogue, payment-method availability, tax rules, legal texts (terms, privacy) per market and version, support contacts, and emergency numbers.

## 3. Considerations per new market

For each candidate country the client needs a **market-entry assessment** covering at least the following. MASHWAR's team can provide the technical side. Legal, tax and licensing advice must come from local counsel.

| Area | Questions to answer |
|---|---|
| **Ride-hailing regulation** | Is app-based ride-hailing legal? Which regulator and licence? Captain eligibility (nationality, licence class, background checks)? Vehicle requirements? Fare regulation or caps? Mandatory data sharing or trip reporting? |
| **Data protection** | Local data-protection law, consent rules, data-residency or localisation requirements, cross-border transfer from or to KSA systems |
| **Tax and invoicing** | VAT / GST rate and registration. E-invoicing mandate and format. Withholding on captain payouts. Permanent-establishment considerations |
| **Legal entity** | Local entity or branch needed? Who contracts with riders and captains? |
| **Payments** | Domestic card schemes and wallets. Licensed PSPs available. Settlement currency and bank accounts. Cash share of trips. Payout rails to captains |
| **Language** | Arabic dialect and terminology, additional languages for captains, RTL / LTR mix, number system preference |
| **Maps and addresses** | Map-data quality, local address systems (for example national address / short codes), place search coverage |
| **Telecoms** | SMS sender-ID registration, OTP deliverability, masked-calling availability |
| **Operations** | Support language and hours, emergency numbers, insurance requirements, airport or zone agreements |
| **Commercial** | Local pricing, commission, competitor landscape, promotions regulation |

## 4. Engineering prerequisites for a second market

| # | Work item | Status |
|---|---|---|
| 1 | Backend market / city / zone / rate-card model with admin UI and approval workflow | [X] |
| 2 | Market resolution from rider location and captain registration city | [X] |
| 3 | Money as integer minor units with per-currency rounding | [X] |
| 4 | i18n dictionaries, locale fallback, translation workflow | [X] (prototype uses inline pairs) |
| 5 | Per-market payment-provider routing (PSP adapter interface) | [X] |
| 6 | Per-market tax / invoicing adapters (ZATCA for KSA; others per country) | [X] |
| 7 | Per-market legal documents with versioned consent records | [X] |
| 8 | Per-market feature flags | [X] |
| 9 | Reporting partitioned by market and city, multi-currency finance exports | [X] |
| 10 | Admin RBAC scoped by market / city | [X] |

## 5. Recommended approach

1. **Launch KSA single-city first.** Build the backend data model as *market → city → zone* from day one, even though only one row exists. This is cheap now and expensive to retrofit.
2. Add **further Saudi cities** before any new country. Same regulator, tax regime, currency and payments; only geography, pricing and operations change.
3. Treat each new country as a separate project with its own regulatory, payment and tax workstreams, starting with the assessment in section 3.

## 6. Open questions for the client

| # | Question |
|---|---|
| E1 | Is expansion beyond Saudi Arabia on the roadmap? If so, which countries and in what timeframe? |
| E2 | Which additional Saudi cities after the launch city, and in what order? |
| E3 | Should the same brand and apps serve all markets, or separate app-store listings per market? |
| E4 | Will captains or riders ever travel across markets (for example cross-border trips)? Recommended: no |
