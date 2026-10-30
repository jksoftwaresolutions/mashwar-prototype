# 12 — Administration Dashboard Architecture

Status: Draft for client review — Phase 1

| | |
|---|---|
| Scope | Architecture of the web administration dashboard (built in Phase 3 per the contract) |
| Related | 03 (admin requirements A-01…A-12), 06 §5.9 (RBAC and audit tables), 07 §3–4 and §9 (admin module, `/admin/v1`, security), 01 (approved admin screens) |
| Implemented now | `admin/` shell: React + Vite + TypeScript, Arabic RTL default with English, the 12 approved sections driven by a permission map, and a live call to `GET /v1/health`. No sign-in and no business data yet. |

## 1. Shape **[Proposal — technical, recommended]**

A static single-page application (React + Vite + TypeScript), served from the same hosting as the backend behind HTTPS. It talks only to the backend's `/admin/v1/*` API; it never connects to the database.

| Choice | Reason |
|---|---|
| SPA, not server-rendered (Next.js) | The dashboard is behind a login, needs no SEO and no server rendering. A static build is cheaper to host and simpler to secure. It stays within the agreed React stack and reuses the prototype's components and design tokens. |
| Same design system as the prototype | The client approved the admin design in the prototype (12 sections). Tokens are shared (`DESIGN_SYSTEM.md` §1). |
| Server is authoritative | Pricing, refunds, captain approval and trip cancellation are commands to the backend; the dashboard never computes money. |

## 2. Authentication and authorization

| Concern | Design |
|---|---|
| Staff sign-in | Email + password with mandatory TOTP MFA, or the client's SSO if they have one (07 §9). Separate from rider/captain phone OTP. |
| Session | Short-lived access token in memory; refresh via an `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to `/admin/v1/auth`. No tokens in `localStorage`. |
| Permissions | Roles and permissions from `admin.roles` / `admin.role_permissions` (06 §5.9), implemented in `backend/src/auth/rbac.ts` and enforced on every `/admin/v1` route by `PermissionsGuard`. The dashboard hides navigation the staff member cannot use (`admin/src/navigation.ts`) — a convenience, not a security control. |
| City scope | Optional per-city role grants (`admin_user_roles.city_id`): an operator for Riyadh sees only Riyadh data. |
| Four-eyes | `pricing.edit` creates a provisional plan; a different admin with `pricing.approve` approves it (enforced by the backend and by the `approved` overlap rule in the schema). |
| Sensitive data | KYC documents and personal data need `pii.view`; files are opened through short-lived signed URLs; every view is audit-logged. |
| Audit | Every mutation writes `admin.audit_log` (append-only) with actor, before/after, reason and request id. |

## 3. Data and real time

- Lists use cursor pagination and server-side filters (`/admin/v1/trips?status=active&cursor=…`).
- Live operations (map of captains and active trips) subscribe to an admin WebSocket room; positions are throttled server-side (07 §6).
- Reports read from aggregate queries; heavy exports run as background jobs and are downloaded when ready.

## 4. Module layout (Phase 3)

```text
admin/src/
  api/            typed client for /admin/v1 (generated from the backend OpenAPI document)
  auth/           sign-in, MFA, session refresh, permission context
  features/       overview, trips, live, captains, riders, vehicles, payments,
                  promotions, ratings, support, reports, settings
  components/     shared UI (tables, drawers, modals, charts) from the prototype design system
  i18n/           ar/en dictionaries (same keys as prototype/src/i18n/messages.ts)
```

## 5. Security checklist

Content-Security-Policy without inline scripts; no third-party scripts; dependency audit in CI; all admin API calls over HTTPS; rate limits and lockout on staff sign-in; session timeout after inactivity; IP allow-listing optional (client decision).

## 6. Open questions

| # | Question | Owner |
|---|---|---|
| AD1 | Does the client have an identity provider for staff SSO, or do we use email + password + MFA? | Client |
| AD2 | Which staff roles are needed at launch (06 §5.9 proposes seven)? | Client |
| AD3 | Should the dashboard be restricted to office IP addresses? | Client |
