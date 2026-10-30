# Client decisions

Status: Open — prepared 2026-10-30 for client review (Phase 1)

This list contains only business and operational decisions that need the client. Technical choices that are ours to make are recorded as proposals in documents 04–12 and are not repeated here.

- **Recommendation** is a reasonable default, **not** a decision. Nothing on this page is approved until the client answers.
- **Already decided by the client** (not asked again): Saudi Arabia as the launch country; rider and captain apps for Android and iOS; admin web dashboard; custom backend and database; mada, Apple Pay and cards through a Saudi gateway; cash at launch; sandbox payments during development and production activation later at no extra programming fee; client ownership of all code, assets and production accounts; overall design direction ("The design is good and I like it. Continue as agreed.").
- **Blocks Phase 1?** None of these decisions blocks Phase 1 acceptance. Phase 1 acceptance needs the sign-offs in [PHASE1-ACCEPTANCE-CHECKLIST.md](PHASE1-ACCEPTANCE-CHECKLIST.md). The *Needed by* column shows which later phase waits on each answer.

## A. Needed before Phase 2 starts

| # | Question | Recommendation | Consequence of the choice | Needed by | Refs |
|---|---|---|---|---|---|
| C1 | Launch city and service areas: which city, which districts, and is the airport included? | Riyadh; client supplies the district list (we draw the boundaries for approval); airport included as its own zone. | Booking is refused outside the boundary. Adding areas later is a configuration change. | Phase 2 | 03 Q2, 09 E2 |
| C2 | Vehicle categories at launch | Economy, Comfort, Family as in the approved prototype, with minimum model years per category. | Each category needs captains and pricing; fewer categories means faster matching at launch. | Phase 2 | 03 Q3, 05 D16 |
| C3 | Final brand name, logo and store listing names | Confirm "MASHWAR / مَشوار" or provide the final brand before app icons are produced. | App identifiers and store listings are hard to rename after publication. | Phase 2 | 03 Q19, design/README.md |
| C4 | Legal entity that owns the Apple Developer, Google Play, domain and hosting accounts | The client's company registers all accounts and invites the team with limited roles. | Apple organisation enrolment needs a D-U-N-S number and can take weeks; it gates TestFlight and store publication. | Phase 2 | 03 assumptions, 11 §5.2 |
| C5 | App identifiers (bundle id / application id) | Reverse domain of the client's domain, e.g. `com.<clientdomain>.rider` and `.captain`. The scaffolds use the placeholder `sa.mashwar.*`. | Cannot change after the first store upload. | Phase 2 | mobile/apps/*/README.md |
| C6 | Hosting provider and data region | A provider with a Saudi region, subject to the client's counsel on PDPL and data residency. | Region affects latency, cost and compliance; moving later is expensive. | Phase 2 (staging) | 03 Q17, 07 §11 |
| C7 | SMS/OTP provider and OTP format | A licensed Saudi SMS provider with a registered sender ID; 6-digit codes valid for 5 minutes (the prototype shows 4 digits). | Sender-ID registration takes time; 6 digits resist guessing better. | Phase 2 | 07 §9 |
| C8 | Maps provider | Google Maps Platform (Arabic place names and coverage in Riyadh), billed to the client's account; Mapbox as the alternative. | Usage-based cost on the client's account; affects map look and directions quality. | Phase 2 | 08 §8 |
| C9 | GitHub organisation for the client-owned repository | Client creates an organisation and we transfer the repository with its history. | Until then the repository is hosted temporarily under the delivery team's account. | Before Phase 2 (recommended) | README.md |

## B. Needed before Phase 3 (pricing, payments, admin)

| # | Question | Recommendation | Consequence | Needed by | Refs |
|---|---|---|---|---|---|
| C10 | Payment gateway (PSP) and merchant account | Shortlist two licensed Saudi PSPs that support mada, Apple Pay and cards with tokenisation and pre-authorisation; the client contracts one. | Sandbox integration needs sandbox keys from the chosen PSP; the client's merchant onboarding gates production. | Phase 3 | 10 P1 |
| C11 | Extra payment methods | No extras at launch (STC Pay / Google Pay later). | Each extra method adds integration and testing. | Phase 3 | 10 P2, 03 Q7 |
| C12 | Card flow: pre-authorise then capture, or charge at trip end | Pre-authorise (quote − discount) with a buffer, capture the final amount; fall back to charge-at-end if mada pre-auth is not supported by the PSP. | Pre-auth protects against failed payments; charge-at-end is simpler. | Phase 3 | 10 P3, P4 |
| C13 | Commission model and rate (20% is provisional) | A percentage of the trip fare after discount; the client sets the rate. | Determines captain earnings and platform revenue on every trip. | Phase 3 | 05 D1, D2 |
| C14 | Commission on waiting and cancellation fees | Commission applies to the waiting fee; cancellation fees go fully to the captain who travelled. | Affects captain fairness and disputes. | Phase 3 | 05 D19 |
| C15 | Who funds coupon discounts | The platform funds coupons; the captain is paid as if no coupon was used. | If captains fund discounts, they bear marketing cost. | Phase 3 | 05 D2 |
| C16 | Fare parameters per category (base, per km, per minute, minimum) | Start from the prototype values as a provisional pilot tariff and review after market research. | Every quoted fare depends on them. | Phase 3 | 05 D3 |
| C17 | Waiting fee | 3 free minutes after arrival, then a charge per started minute (amount to be set). | Too strict upsets riders; too lenient costs captains time. | Phase 3 | 05 D6 |
| C18 | Rider cancellation and no-show fees | Free during search and for 2 minutes after acceptance; a fee after that; a higher fee after the captain arrives; a no-show fee after a set wait. | Discourages abuse; must be shown before cancelling (already in the prototype). | Phase 3 | 05 D7, D8, 03 Q14 |
| C19 | Captain late cancellation and no-show | Re-dispatch the trip; count it against the captain's acceptance rate; no money penalty at launch. | Money penalties need dispute handling. | Phase 3 | 05 D9 |
| C20 | VAT treatment and who invoices the rider | Prices shown VAT-inclusive; confirm the supplier model and ZATCA e-invoicing scope with the client's tax advisor. | Changes every displayed price and the receipt format. | Phase 3 | 05 D5, 10 P8 |
| C21 | Rounding | Compute in halalas; show the rider total with up to 2 decimals, no rounding to whole riyals. | Rounding to whole riyals changes revenue slightly on every trip. | Phase 3 | 05 D10 |
| C22 | Surge or peak pricing | None at launch. | Simpler and more transparent for a pilot. | Phase 3 | 05 D4 |
| C23 | Minimum fare vs discounts; airport fees; tolls; booking fee | Rider total may go below the minimum fare only through a coupon; no airport fee, toll pass-through or booking fee at launch unless the client wants them. | Each fee needs display, receipts and admin settings. | Phase 3 | 05 D11, D13–D15 |
| C24 | Coupon rules | Expiry, total limit and one use per rider by default; first-ride-only coupons allowed. | Per-rider limits prevent abuse. | Phase 3 | 05 D17 |
| C25 | Cash: captain commission debt limits and how captains pay it | Block cash trips above a debt limit and block going online above a higher one; captains pay by card in the app or by bank transfer. Client sets both limits. | Protects platform revenue on cash trips. | Phase 3 | 10 CB2–CB4, P5 |
| C26 | Captain payouts | Weekly bank transfer to the captain's IBAN. | Frequency affects captain satisfaction and cash flow. | Phase 3 | 10 P6, 03 Q10 |
| C27 | Wallet | No stored-value wallet at launch. | A wallet may need regulatory review. | Phase 3 | 10 P7, 03 Q8 |
| C28 | Refund approval limits and chargebacks | Finance role issues refunds up to a set amount; above it needs a super admin; chargebacks owned by the platform. | Controls financial risk. | Phase 3 | 10 P9, P10 |
| C29 | Staff roles and sign-in | Use the seven proposed roles; email + password + MFA unless the client has SSO. | Determines who can see personal data and move money. | Phase 3 | 12 AD1–AD3, 06 §5.9 |

## C. Operational and regulatory (needed before launch)

| # | Question | Recommendation | Consequence | Needed by | Refs |
|---|---|---|---|---|---|
| C30 | TGA licence holder and the captain document list | Client confirms its licence status and the documents TGA requires; we model them as document types. | Captain onboarding cannot be finalised without it. | Phase 3 | 03 Q1 |
| C31 | Emergency number and SOS escalation | Show the unified emergency number (to verify for each launch city) plus an operations hotline. | Safety feature; must be correct. | Phase 2 | 03 Q15 |
| C32 | Support channels and hours | In-app tickets plus a phone line during operating hours. | Staffing cost. | Phase 3 | 03 Q18 |
| C33 | Optional features | Not in the MVP: scheduled rides, captains rating riders. | Each adds screens and rules. | Phase 2 | 03 Q13, Q16 |
| C34 | Numerals and calendar | Latin digits and Gregorian dates (as in the approved prototype). | Arabic-Indic digits would change every screen. | Phase 2 | 03 Q20 |
| C35 | Search timeout and number of offers per request | Search for up to 3 minutes; stop earlier after a set number of offers. | Longer searches find more captains but keep riders waiting. | Phase 2 | 04 (T3, T5) |
| C36 | Expansion beyond Saudi Arabia | Not planned in this contract; the data model is ready for more countries and cities. | Each new country needs its own payment, SMS, tax and regulatory work. | After launch | 09 E1–E4 |

## Answer record

| # | Client answer | Date | By |
|---|---|---|---|
| | | | |
