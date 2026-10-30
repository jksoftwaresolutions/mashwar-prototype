-- MASHWAR initial schema (Phase 1 foundation)
-- Source of truth: docs/phase1/06-database-architecture.md
-- Target: PostgreSQL 17+ with PostGIS 3.5+. Money is stored in halalas (bigint).
-- This migration creates structure only. No business values are approved; see 0002_reference_data.sql.

begin;

create extension if not exists postgis;
create extension if not exists btree_gist;
create extension if not exists citext;
create extension if not exists pgcrypto;

-- UUIDv7 (time-ordered) for PostgreSQL 17. PostgreSQL 18 ships pg_catalog.uuidv7(),
-- which takes precedence in the default search_path, so this fallback is harmless there.
create or replace function public.uuidv7() returns uuid
language sql volatile parallel safe as $$
  select encode(
    set_bit(set_bit(
      overlay(uuid_send(gen_random_uuid())
              placing substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
              from 1 for 6),
      52, 1), 53, 1),
    'hex')::uuid
$$;

create schema if not exists market;
create schema if not exists core;
create schema if not exists admin;
create schema if not exists ride;
create schema if not exists finance;
create schema if not exists promo;
create schema if not exists support;
create schema if not exists notify;
create schema if not exists infra;

create or replace function infra.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- admin: staff accounts and RBAC (created first: other tables reference admins)
-- ---------------------------------------------------------------------------
create table admin.admin_users (
  id            uuid primary key default uuidv7(),
  email         citext not null unique,
  name          text not null,
  status        text not null default 'active' check (status in ('active','disabled')),
  mfa_enrolled  boolean not null default false,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table admin.roles (
  id      text primary key,
  name_ar text not null,
  name_en text not null
);

create table admin.permissions (
  id          text primary key,
  description text not null
);

create table admin.role_permissions (
  role_id       text not null references admin.roles(id) on delete cascade,
  permission_id text not null references admin.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);
create index role_permissions_permission_idx on admin.role_permissions (permission_id);

-- ---------------------------------------------------------------------------
-- market: countries, cities, zones, categories, pricing
-- ---------------------------------------------------------------------------
create table market.countries (
  iso2          char(2) primary key check (iso2 ~ '^[A-Z]{2}$'),
  name_ar       text not null,
  name_en       text not null,
  currency      char(3) not null check (currency ~ '^[A-Z]{3}$'),
  currency_minor_units smallint not null default 2 check (currency_minor_units between 0 and 3),
  calling_code  text not null check (calling_code ~ '^\+[1-9][0-9]{0,3}$'),
  phone_digits  smallint not null check (phone_digits between 6 and 12),
  default_lang  text not null check (default_lang in ('ar','en')),
  vat_bps       integer check (vat_bps between 0 and 10000),   -- null until confirmed with a tax advisor
  is_active     boolean not null default false,
  created_at    timestamptz not null default now()
);

create table market.cities (
  id           uuid primary key default uuidv7(),
  country_iso2 char(2) not null references market.countries(iso2),
  slug         text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_ar      text not null,
  name_en      text not null,
  timezone     text not null,
  is_active    boolean not null default false,
  created_at   timestamptz not null default now()
);
create index cities_country_idx on market.cities (country_iso2);

create table market.zones (
  id         uuid primary key default uuidv7(),
  city_id    uuid not null references market.cities(id),
  code       text not null,
  name_ar    text not null,
  name_en    text not null,
  kind       text not null check (kind in ('service_area','airport','restricted','surge')),
  boundary   geography(MultiPolygon, 4326) not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (city_id, code)
);
create index zones_boundary_gist on market.zones using gist (boundary);

create table market.vehicle_categories (
  id         text primary key check (id ~ '^[a-z_]+$'),
  name_ar    text not null,
  name_en    text not null,
  desc_ar    text,
  desc_en    text,
  seats      smallint not null check (seats between 1 and 20),
  sort_order smallint not null default 0,
  is_active  boolean not null default true
);

create table market.pricing_plans (
  id                            uuid primary key default uuidv7(),
  city_id                       uuid not null references market.cities(id),
  category_id                   text not null references market.vehicle_categories(id),
  currency                      char(3) not null,
  base_fare                     numeric(10,4) not null check (base_fare >= 0),
  per_km                        numeric(10,4) not null check (per_km >= 0),
  per_min                       numeric(10,4) not null check (per_min >= 0),
  min_fare_halalas              bigint not null check (min_fare_halalas >= 0),
  waiting_free_mins             smallint not null check (waiting_free_mins >= 0),
  waiting_per_min               numeric(10,4) not null check (waiting_per_min >= 0),
  cancel_grace_mins             smallint not null check (cancel_grace_mins >= 0),
  cancel_after_grace_halalas    bigint not null check (cancel_after_grace_halalas >= 0),
  cancel_after_arrival_halalas  bigint not null check (cancel_after_arrival_halalas >= 0),
  commission_bps                integer not null check (commission_bps between 0 and 10000),
  approval_status               text not null default 'provisional' check (approval_status in ('provisional','approved')),
  approved_by                   uuid references admin.admin_users(id),
  approved_at                   timestamptz,
  effective                     tstzrange not null,
  created_by                    uuid references admin.admin_users(id),
  created_at                    timestamptz not null default now(),
  constraint pricing_plans_approval_consistent
    check ((approval_status = 'approved') = (approved_by is not null and approved_at is not null)),
  -- Only approved plans may not overlap; a provisional draft can coexist with the live plan (four-eyes approval).
  constraint pricing_plans_no_overlap
    exclude using gist (city_id with =, category_id with =, effective with &&) where (approval_status = 'approved')
);
create index pricing_plans_category_idx on market.pricing_plans (category_id);
create index pricing_plans_approved_by_idx on market.pricing_plans (approved_by);
create index pricing_plans_created_by_idx on market.pricing_plans (created_by);

create table market.zone_surcharges (
  id              uuid primary key default uuidv7(),
  zone_id         uuid not null references market.zones(id),
  category_id     text references market.vehicle_categories(id),
  pickup_halalas  bigint not null default 0 check (pickup_halalas >= 0),
  dropoff_halalas bigint not null default 0 check (dropoff_halalas >= 0),
  effective       tstzrange not null,
  created_at      timestamptz not null default now()
);
create index zone_surcharges_zone_idx on market.zone_surcharges (zone_id);
create index zone_surcharges_category_idx on market.zone_surcharges (category_id);

-- City-scoped admin roles (needs market.cities)
create table admin.admin_user_roles (
  admin_user_id uuid not null references admin.admin_users(id) on delete cascade,
  role_id       text not null references admin.roles(id),
  city_id       uuid references market.cities(id),
  created_at    timestamptz not null default now()
);
create unique index admin_user_roles_unique on admin.admin_user_roles
  (admin_user_id, role_id, coalesce(city_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index admin_user_roles_role_idx on admin.admin_user_roles (role_id);
create index admin_user_roles_city_idx on admin.admin_user_roles (city_id);

-- ---------------------------------------------------------------------------
-- core: identity, riders, captains, vehicles, devices, KYC
-- ---------------------------------------------------------------------------
create table core.users (
  id             uuid primary key default uuidv7(),
  phone_e164     text unique,          -- null only after anonymisation (status = 'deleted')
  phone_hash     bytea,                -- keyed hash kept after anonymisation for fraud checks
  display_name   text,
  preferred_lang text not null default 'ar' check (preferred_lang in ('ar','en')),
  email          citext,
  status         text not null default 'active' check (status in ('active','blocked','deleted')),
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint users_phone_valid
    check (status = 'deleted' or (phone_e164 is not null and phone_e164 ~ '^\+[1-9][0-9]{7,14}$'))
);

create table core.riders (
  user_id         uuid primary key references core.users(id),
  rating_avg      numeric(3,2) check (rating_avg between 1 and 5),
  rating_count    integer not null default 0 check (rating_count >= 0),
  trips_completed integer not null default 0 check (trips_completed >= 0),
  status          text not null default 'active' check (status in ('active','blocked')),
  blocked_reason  text,
  blocked_by      uuid references admin.admin_users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index riders_blocked_by_idx on core.riders (blocked_by);

create table core.captains (
  user_id          uuid primary key references core.users(id),
  city_id          uuid not null references market.cities(id),
  approval_status  text not null default 'pending' check (approval_status in ('pending','approved','suspended','rejected')),
  national_id_enc  bytea,                -- application-encrypted (PDPL); never plaintext
  national_id_hash bytea unique,         -- keyed hash for duplicate detection
  date_of_birth    date,
  iban_enc         bytea,
  rating_avg       numeric(3,2) check (rating_avg between 1 and 5),
  rating_count     integer not null default 0 check (rating_count >= 0),
  acceptance_rate  numeric(5,4) check (acceptance_rate between 0 and 1),
  approved_at      timestamptz,
  approved_by      uuid references admin.admin_users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index captains_city_status_idx on core.captains (city_id, approval_status);
create index captains_approved_by_idx on core.captains (approved_by);

create table core.vehicles (
  id            uuid primary key default uuidv7(),
  plate_ar      text not null,
  plate_latin   text not null,
  make          text not null,
  model         text not null,
  year          smallint not null check (year between 1990 and 2100),
  color_name_ar text,
  color_name_en text,
  color_hex     text check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  category_id   text not null references market.vehicle_categories(id),
  seats         smallint not null check (seats between 1 and 20),
  status        text not null default 'pending' check (status in ('pending','approved','suspended','deleted')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index vehicles_plate_unique on core.vehicles (upper(plate_latin)) where status <> 'deleted';
create index vehicles_category_idx on core.vehicles (category_id);

create table core.captain_vehicles (
  captain_id uuid not null references core.captains(user_id),
  vehicle_id uuid not null references core.vehicles(id),
  is_primary boolean not null default false,
  valid      tstzrange not null default tstzrange(now(), null),
  created_at timestamptz not null default now(),
  primary key (captain_id, vehicle_id)
);
create unique index captain_vehicles_one_primary on core.captain_vehicles (captain_id)
  where is_primary and upper_inf(valid);
create index captain_vehicles_vehicle_idx on core.captain_vehicles (vehicle_id);

create table core.user_devices (
  id                      uuid primary key default uuidv7(),
  user_id                 uuid not null references core.users(id),
  app                     text not null check (app in ('rider','captain')),
  platform                text not null check (platform in ('ios','android')),
  device_fingerprint_hash bytea,
  push_token              text,
  app_version             text,
  last_seen_at            timestamptz,
  revoked_at              timestamptz,
  created_at              timestamptz not null default now()
);
create index user_devices_user_idx on core.user_devices (user_id) where revoked_at is null;

create table core.refresh_tokens (
  id          uuid primary key default uuidv7(),
  user_id     uuid not null references core.users(id),
  device_id   uuid not null references core.user_devices(id),
  token_hash  bytea not null unique,     -- only hashes are stored
  family_id   uuid not null,             -- rotation family for reuse detection
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  replaced_by uuid,
  created_at  timestamptz not null default now()
);
create index refresh_tokens_user_idx on core.refresh_tokens (user_id);
create index refresh_tokens_device_idx on core.refresh_tokens (device_id);
create index refresh_tokens_family_idx on core.refresh_tokens (family_id);

create table core.document_types (
  id              text primary key,
  applies_to      text not null check (applies_to in ('captain','vehicle')),
  requires_expiry boolean not null,
  name_ar         text not null,
  name_en         text not null
);

create table core.captain_documents (
  id               uuid primary key default uuidv7(),
  captain_id       uuid not null references core.captains(user_id),
  vehicle_id       uuid references core.vehicles(id),
  type_id          text not null references core.document_types(id),
  storage_key      text not null,          -- private object storage key; never file bytes
  sha256           bytea not null,
  number_enc       bytea,
  issued_on        date,
  expires_on       date,
  status           text not null default 'submitted' check (status in ('submitted','approved','rejected','expired')),
  reviewed_by      uuid references admin.admin_users(id),
  reviewed_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz not null default now(),
  check (expires_on is null or issued_on is null or expires_on > issued_on)
);
create index captain_documents_captain_idx on core.captain_documents (captain_id);
create index captain_documents_vehicle_idx on core.captain_documents (vehicle_id);
create index captain_documents_type_idx on core.captain_documents (type_id);
create index captain_documents_reviewed_by_idx on core.captain_documents (reviewed_by);
create index captain_documents_expiry_idx on core.captain_documents (expires_on) where status = 'approved';

-- ---------------------------------------------------------------------------
-- finance (part 1): saved payment methods are referenced by trips
-- ---------------------------------------------------------------------------
create table finance.payment_methods (
  id         uuid primary key default uuidv7(),
  rider_id   uuid not null references core.riders(user_id),
  psp        text not null,
  psp_token  text not null,               -- PSP token only; card data never reaches our servers
  brand      text not null check (brand in ('mada','visa','mastercard','amex','apple_pay','stc_pay','other')),
  last4      char(4) check (last4 ~ '^[0-9]{4}$'),
  exp_month  smallint check (exp_month between 1 and 12),
  exp_year   smallint check (exp_year between 2000 and 2100),
  is_default boolean not null default false,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (psp, psp_token)
);
create unique index payment_methods_one_default on finance.payment_methods (rider_id)
  where is_default and revoked_at is null;

-- ---------------------------------------------------------------------------
-- ride: quotes, trips, offers, events, locations, ratings
-- ---------------------------------------------------------------------------
create table ride.cancellation_reasons (
  id          text primary key,
  actor       text not null check (actor in ('rider','captain','system','admin')),
  name_ar     text not null,
  name_en     text not null,
  fee_applies boolean not null default false
);

create table ride.trip_status_transitions (
  from_status    text not null,
  to_status      text not null,
  allowed_actors text[] not null,
  primary key (from_status, to_status)
);

create table ride.fare_quotes (
  id              uuid primary key default uuidv7(),
  rider_id        uuid not null references core.riders(user_id),
  city_id         uuid not null references market.cities(id),
  category_id     text not null references market.vehicle_categories(id),
  pricing_plan_id uuid not null references market.pricing_plans(id),
  pickup          geography(Point, 4326) not null,
  dropoff         geography(Point, 4326) not null,
  distance_m      integer not null check (distance_m >= 0),
  duration_s      integer not null check (duration_s >= 0),
  fare_halalas    bigint not null check (fare_halalas >= 0),
  currency        char(3) not null,
  breakdown       jsonb not null,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);
create index fare_quotes_rider_idx on ride.fare_quotes (rider_id, created_at desc);
create index fare_quotes_city_idx on ride.fare_quotes (city_id);
create index fare_quotes_category_idx on ride.fare_quotes (category_id);
create index fare_quotes_plan_idx on ride.fare_quotes (pricing_plan_id);

create table ride.trips (
  id                       uuid primary key default uuidv7(),
  code                     text not null unique,
  city_id                  uuid not null references market.cities(id),
  rider_id                 uuid not null references core.riders(user_id),
  captain_id               uuid references core.captains(user_id),
  vehicle_id               uuid references core.vehicles(id),
  category_id              text not null references market.vehicle_categories(id),
  quote_id                 uuid not null unique references ride.fare_quotes(id),
  pricing_plan_id          uuid not null references market.pricing_plans(id),

  status                   text not null default 'requested'
                           check (status in ('requested','accepted','arrived','in_progress','completed','cancelled','expired')),
  version                  integer not null default 1 check (version >= 1),

  pickup                   geography(Point, 4326) not null,
  pickup_label_ar          text,
  pickup_label_en          text,
  dropoff                  geography(Point, 4326) not null,
  dropoff_label_ar         text,
  dropoff_label_en         text,

  payment_type             text not null check (payment_type in ('cash','card')),   -- wallet is post-MVP
  payment_method_id        uuid references finance.payment_methods(id),

  currency                 char(3) not null,
  quoted_fare_halalas      bigint not null check (quoted_fare_halalas >= 0),
  final_fare_halalas       bigint check (final_fare_halalas >= 0),
  discount_halalas         bigint not null default 0 check (discount_halalas >= 0),
  waiting_fee_halalas      bigint not null default 0 check (waiting_fee_halalas >= 0),
  cancellation_fee_halalas bigint not null default 0 check (cancellation_fee_halalas >= 0),
  commission_bps           integer not null check (commission_bps between 0 and 10000),
  fare_breakdown           jsonb,

  cancelled_by             text check (cancelled_by in ('rider','captain','system','admin')),
  cancellation_reason_id   text references ride.cancellation_reasons(id),

  requested_at             timestamptz not null default now(),
  accepted_at              timestamptz,
  arrived_at               timestamptz,
  started_at               timestamptz,
  completed_at             timestamptz,
  cancelled_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint trips_captain_required
    check (status in ('requested','cancelled','expired') or captain_id is not null),
  constraint trips_completed_has_fare
    check (status <> 'completed' or (final_fare_halalas is not null and completed_at is not null)),
  constraint trips_cancelled_has_actor
    check (status <> 'cancelled' or (cancelled_by is not null and cancelled_at is not null)),
  constraint trips_discount_le_fare
    check (discount_halalas <= coalesce(final_fare_halalas, quoted_fare_halalas)),
  constraint trips_card_needs_method
    check (payment_type <> 'card' or payment_method_id is not null)
);
-- Concurrency invariants (doc 06 section 6)
create unique index trips_one_active_per_rider on ride.trips (rider_id)
  where status in ('requested','accepted','arrived','in_progress');
create unique index trips_one_active_per_captain on ride.trips (captain_id)
  where status in ('accepted','arrived','in_progress');
-- Query paths (doc 06 section 7)
create index trips_live_ops_idx on ride.trips (city_id, status, requested_at)
  where status in ('requested','accepted','arrived','in_progress');
create index trips_rider_history_idx on ride.trips (rider_id, requested_at desc, id);
create index trips_captain_history_idx on ride.trips (captain_id, requested_at desc, id);
create index trips_completed_report_idx on ride.trips (city_id, completed_at) where status = 'completed';
create index trips_pickup_gist on ride.trips using gist (pickup);
create index trips_vehicle_idx on ride.trips (vehicle_id);
create index trips_category_idx on ride.trips (category_id);
create index trips_plan_idx on ride.trips (pricing_plan_id);
create index trips_payment_method_idx on ride.trips (payment_method_id);
create index trips_cancel_reason_idx on ride.trips (cancellation_reason_id);

create trigger trips_set_updated_at before update on ride.trips
  for each row execute function infra.set_updated_at();

-- Defence in depth: reject transitions that are not in ride.trip_status_transitions and
-- any change out of a terminal state. The service layer enforces actors and versions.
create or replace function ride.guard_trip_transition() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if old.status in ('completed','cancelled','expired') then
      raise exception 'trip % is in terminal state %', old.id, old.status using errcode = 'check_violation';
    end if;
    if not exists (select 1 from ride.trip_status_transitions t
                   where t.from_status = old.status and t.to_status = new.status) then
      raise exception 'invalid trip transition % -> %', old.status, new.status using errcode = 'check_violation';
    end if;
    if new.version <> old.version + 1 then
      raise exception 'trip status change must increment version' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger trips_guard_transition before update of status on ride.trips
  for each row execute function ride.guard_trip_transition();

create table ride.trip_offers (
  id           bigint generated always as identity primary key,
  trip_id      uuid not null references ride.trips(id),
  captain_id   uuid not null references core.captains(user_id),
  attempt      smallint not null check (attempt >= 1),
  eta_s        integer check (eta_s >= 0),
  distance_m   integer check (distance_m >= 0),
  offered_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  status       text not null default 'pending' check (status in ('pending','accepted','declined','expired','cancelled')),
  responded_at timestamptz,
  unique (trip_id, captain_id, attempt),
  check (expires_at > offered_at)
);
create unique index trip_offers_one_pending on ride.trip_offers (trip_id) where status = 'pending';
create unique index trip_offers_one_pending_per_captain on ride.trip_offers (captain_id) where status = 'pending';
create index trip_offers_captain_idx on ride.trip_offers (captain_id, offered_at desc);

-- Append-only. Partition by time only once the table approaches ~100M rows (post-contract).
create table ride.trip_events (
  id           bigint generated always as identity,
  trip_id      uuid not null,
  occurred_at  timestamptz not null default now(),
  type         text not null,
  from_status  text,
  to_status    text,
  actor_type   text not null check (actor_type in ('rider','captain','system','admin')),
  actor_id     uuid,
  trip_version integer not null,
  payload      jsonb,
  primary key (id)
);
create index trip_events_trip_idx on ride.trip_events (trip_id, occurred_at);

create table ride.trip_location_points (
  id          bigint generated always as identity,
  trip_id     uuid not null,
  captain_id  uuid not null,
  recorded_at timestamptz not null,
  position    geography(Point, 4326) not null,
  speed_mps   real,
  heading     smallint check (heading between 0 and 359),
  accuracy_m  real,
  primary key (id)
);
create index trip_location_points_trip_idx on ride.trip_location_points (trip_id, recorded_at);
create index trip_location_points_time_brin on ride.trip_location_points using brin (recorded_at);

create table ride.ratings (
  id         uuid primary key default uuidv7(),
  trip_id    uuid not null references ride.trips(id),
  rater_role text not null check (rater_role in ('rider','captain')),
  rater_id   uuid not null references core.users(id),
  ratee_id   uuid not null references core.users(id),
  stars      smallint not null check (stars between 1 and 5),
  comment    text check (length(comment) <= 500),
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (trip_id, rater_role),
  check (rater_id <> ratee_id)
);
create index ratings_rater_idx on ride.ratings (rater_id);
create index ratings_ratee_idx on ride.ratings (ratee_id, created_at desc);

-- ---------------------------------------------------------------------------
-- finance (part 2): payments, refunds, double-entry ledger, payouts, invoices
-- ---------------------------------------------------------------------------
create table finance.payments (
  id                uuid primary key default uuidv7(),
  trip_id           uuid not null references ride.trips(id),
  payment_method_id uuid references finance.payment_methods(id),
  method            text not null check (method in ('mada','apple_pay','card','stc_pay')),
  authorized_halalas bigint not null check (authorized_halalas > 0),
  captured_halalas  bigint not null default 0 check (captured_halalas >= 0),
  currency          char(3) not null,
  status            text not null default 'pending'
                    check (status in ('pending','requires_action','authorized','captured','partially_captured','voided','failed')),
  psp               text not null,
  psp_reference     text,
  idempotency_key   text not null unique,
  failure_code      text,
  raw               jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (psp, psp_reference),
  check (captured_halalas <= authorized_halalas)
);
create index payments_trip_idx on finance.payments (trip_id);
create index payments_method_idx on finance.payments (payment_method_id);
create index payments_open_idx on finance.payments (created_at) where status in ('pending','requires_action','authorized');

-- One PSP payment receives several webhooks; de-duplicate on the PSP's event id, not the payment reference.
create table finance.psp_webhook_events (
  id           bigint generated always as identity primary key,
  psp          text not null,
  event_id     text not null,
  event_type   text not null,
  payload      jsonb not null,
  signature_ok boolean not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  unique (psp, event_id)
);
create index psp_webhook_events_unprocessed_idx on finance.psp_webhook_events (received_at) where processed_at is null;

create table finance.refunds (
  id              uuid primary key default uuidv7(),
  payment_id      uuid not null references finance.payments(id),
  amount_halalas  bigint not null check (amount_halalas > 0),
  reason          text not null,
  status          text not null default 'pending' check (status in ('pending','succeeded','failed')),
  psp_reference   text,
  idempotency_key text not null unique,
  requested_by    uuid references admin.admin_users(id),
  ticket_id       uuid,          -- FK added after support.tickets exists
  created_at      timestamptz not null default now()
);
create index refunds_payment_idx on finance.refunds (payment_id);
create index refunds_requested_by_idx on finance.refunds (requested_by);

create table finance.payouts (
  id             uuid primary key default uuidv7(),
  captain_id     uuid not null references core.captains(user_id),
  amount_halalas bigint not null check (amount_halalas > 0),
  currency       char(3) not null,
  iban_last4     char(4),
  status         text not null default 'pending' check (status in ('pending','sent','failed')),
  bank_reference text,
  period         tstzrange not null,
  created_at     timestamptz not null default now()
);
create index payouts_captain_idx on finance.payouts (captain_id, created_at desc);

create table finance.ledger_accounts (
  id         bigint generated always as identity primary key,
  owner_type text not null check (owner_type in ('captain','rider','platform','psp','tax')),
  owner_id   uuid,
  code       text not null check (code in ('captain_earnings','captain_cash_held','rider_wallet','platform_commission',
                                            'promo_expense','psp_clearing','psp_fees','vat_payable')),
  currency   char(3) not null,
  created_at timestamptz not null default now()
);
create unique index ledger_accounts_unique on finance.ledger_accounts
  (owner_type, coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), code, currency);

create table finance.ledger_transactions (
  id              bigint generated always as identity primary key,
  kind            text not null check (kind in ('trip_settlement','cancellation_fee','refund','payout','adjustment')),
  trip_id         uuid references ride.trips(id),
  payout_id       uuid references finance.payouts(id),
  idempotency_key text not null unique,     -- e.g. trip:{id}:settle guarantees exactly-once settlement
  posted_at       timestamptz not null default now(),
  posted_by       uuid references admin.admin_users(id)
);
create index ledger_transactions_trip_idx on finance.ledger_transactions (trip_id);
create index ledger_transactions_payout_idx on finance.ledger_transactions (payout_id);
create index ledger_transactions_posted_by_idx on finance.ledger_transactions (posted_by);

create table finance.ledger_entries (
  id             bigint generated always as identity primary key,
  transaction_id bigint not null references finance.ledger_transactions(id),
  account_id     bigint not null references finance.ledger_accounts(id),
  amount_halalas bigint not null check (amount_halalas <> 0),   -- positive = debit, negative = credit
  created_at     timestamptz not null default now()
);
create index ledger_entries_transaction_idx on finance.ledger_entries (transaction_id);
create index ledger_entries_account_idx on finance.ledger_entries (account_id, id);

-- Double-entry invariant: every transaction's entries sum to zero, checked at commit.
create or replace function finance.check_transaction_balanced() returns trigger
language plpgsql as $$
declare
  total bigint;
begin
  select coalesce(sum(amount_halalas), 0) into total
    from finance.ledger_entries where transaction_id = new.transaction_id;
  if total <> 0 then
    raise exception 'ledger transaction % is unbalanced (sum % halalas)', new.transaction_id, total
      using errcode = 'check_violation';
  end if;
  return null;
end $$;

create constraint trigger ledger_entries_balanced
  after insert or update on finance.ledger_entries
  deferrable initially deferred
  for each row execute function finance.check_transaction_balanced();

-- Append-only ledger: the application role must never rewrite history.
create or replace function infra.forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception '% on %.% is not allowed (append-only)', tg_op, tg_table_schema, tg_table_name
    using errcode = 'insufficient_privilege';
end $$;

create trigger ledger_entries_append_only before update or delete on finance.ledger_entries
  for each row execute function infra.forbid_mutation();

create table finance.account_balances (
  account_id      bigint primary key references finance.ledger_accounts(id),
  balance_halalas bigint not null default 0,
  last_entry_id   bigint
);

create table finance.invoices (
  id              uuid primary key default uuidv7(),
  trip_id         uuid not null unique references ride.trips(id),
  number          text not null unique,
  issued_at       timestamptz not null default now(),
  zatca_uuid      uuid,
  zatca_status    text,
  qr_payload      text,
  xml_storage_key text
);

-- ---------------------------------------------------------------------------
-- promo: coupons and redemptions (usage derived from redemptions, no hot counter)
-- ---------------------------------------------------------------------------
create table promo.coupons (
  id                   uuid primary key default uuidv7(),
  code                 text not null,
  city_id              uuid references market.cities(id),
  discount_type        text not null check (discount_type in ('percent','fixed')),
  percent_bps          integer check (percent_bps between 1 and 10000),
  fixed_halalas        bigint check (fixed_halalas > 0),
  max_discount_halalas bigint check (max_discount_halalas > 0),
  global_limit         integer check (global_limit > 0),
  per_rider_limit      integer not null default 1 check (per_rider_limit > 0),
  first_trip_only      boolean not null default false,
  category_ids         text[],
  valid                tstzrange not null,
  is_active            boolean not null default true,
  desc_ar              text,
  desc_en              text,
  created_by           uuid references admin.admin_users(id),
  created_at           timestamptz not null default now(),
  check ((discount_type = 'percent') = (percent_bps is not null)),
  check ((discount_type = 'fixed') = (fixed_halalas is not null))
);
create unique index coupons_code_unique on promo.coupons (upper(code));
create index coupons_city_idx on promo.coupons (city_id);
create index coupons_created_by_idx on promo.coupons (created_by);

create table promo.coupon_redemptions (
  id               bigint generated always as identity primary key,
  coupon_id        uuid not null references promo.coupons(id),
  rider_id         uuid not null references core.riders(user_id),
  trip_id          uuid not null unique references ride.trips(id),
  discount_halalas bigint not null check (discount_halalas >= 0),
  status           text not null default 'reserved' check (status in ('reserved','applied','released')),
  created_at       timestamptz not null default now()
);
create index coupon_redemptions_coupon_idx on promo.coupon_redemptions (coupon_id) where status <> 'released';
create index coupon_redemptions_rider_idx on promo.coupon_redemptions (rider_id, coupon_id);

-- ---------------------------------------------------------------------------
-- support: tickets and messages
-- ---------------------------------------------------------------------------
create table support.ticket_categories (
  id               text primary key,
  name_ar          text not null,
  name_en          text not null,
  default_priority text not null check (default_priority in ('high','medium','low'))
);

create table support.tickets (
  id                uuid primary key default uuidv7(),
  code              text not null unique,
  opened_by_user_id uuid not null references core.users(id),
  opened_by_role    text not null check (opened_by_role in ('rider','captain')),
  trip_id           uuid references ride.trips(id),
  category_id       text not null references support.ticket_categories(id),
  priority          text not null check (priority in ('high','medium','low')),
  status            text not null default 'open' check (status in ('open','review','resolved','closed')),
  assigned_admin_id uuid references admin.admin_users(id),
  sla_due_at        timestamptz,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index tickets_queue_idx on support.tickets (status, priority, created_at) where status in ('open','review');
create index tickets_user_idx on support.tickets (opened_by_user_id);
create index tickets_trip_idx on support.tickets (trip_id);
create index tickets_category_idx on support.tickets (category_id);
create index tickets_assignee_idx on support.tickets (assigned_admin_id);

alter table finance.refunds
  add constraint refunds_ticket_fk foreign key (ticket_id) references support.tickets(id);
create index refunds_ticket_idx on finance.refunds (ticket_id);

create table support.ticket_messages (
  id          bigint generated always as identity primary key,
  ticket_id   uuid not null references support.tickets(id),
  author_type text not null check (author_type in ('user','admin','system')),
  author_id   uuid,
  body        text not null check (length(body) between 1 and 4000),
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);
create index ticket_messages_ticket_idx on support.ticket_messages (ticket_id, id);

-- ---------------------------------------------------------------------------
-- notify: templates, inbox, deliveries
-- ---------------------------------------------------------------------------
create table notify.notification_templates (
  key      text primary key,
  channel  text not null check (channel in ('push','sms','inbox','email')),
  title_ar text not null,
  title_en text not null,
  body_ar  text not null,
  body_en  text not null,
  version  integer not null default 1
);

create table notify.notifications (
  id             bigint generated always as identity primary key,
  recipient_type text not null check (recipient_type in ('user','admin')),
  recipient_id   uuid not null,
  template_key   text not null references notify.notification_templates(key),
  params         jsonb not null default '{}',
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index notifications_unread_idx on notify.notifications (recipient_id, created_at desc) where read_at is null;
create index notifications_template_idx on notify.notifications (template_key);

create table notify.notification_deliveries (
  id                  bigint generated always as identity primary key,
  notification_id     bigint not null references notify.notifications(id),
  channel             text not null check (channel in ('push','sms','email')),
  provider            text not null,
  status              text not null default 'queued' check (status in ('queued','sent','delivered','failed')),
  provider_message_id text,
  attempts            smallint not null default 0,
  last_error          text,
  created_at          timestamptz not null default now()
);
create index notification_deliveries_notification_idx on notify.notification_deliveries (notification_id);

-- ---------------------------------------------------------------------------
-- admin: append-only audit log
-- ---------------------------------------------------------------------------
create table admin.audit_log (
  id            bigint generated always as identity,
  occurred_at   timestamptz not null default now(),
  admin_user_id uuid not null,
  action        text not null,
  entity_type   text not null,
  entity_id     text,
  before        jsonb,
  after         jsonb,
  reason        text,
  ip            inet,
  user_agent    text,
  request_id    text,
  primary key (id)
);
create index audit_log_admin_idx on admin.audit_log (admin_user_id, occurred_at desc);
create index audit_log_entity_idx on admin.audit_log (entity_type, entity_id, occurred_at desc);

create trigger audit_log_append_only before update or delete on admin.audit_log
  for each row execute function infra.forbid_mutation();
create trigger trip_events_append_only before update or delete on ride.trip_events
  for each row execute function infra.forbid_mutation();

-- ---------------------------------------------------------------------------
-- infra: outbox and durable idempotency keys
-- ---------------------------------------------------------------------------
create table infra.outbox_events (
  id             bigint generated always as identity primary key,
  aggregate_type text not null,
  aggregate_id   uuid not null,
  event_type     text not null,
  payload        jsonb not null,
  created_at     timestamptz not null default now(),
  published_at   timestamptz,
  attempts       smallint not null default 0
);
create index outbox_unpublished_idx on infra.outbox_events (id) where published_at is null;

create table infra.idempotency_keys (
  key             text not null,
  user_id         uuid not null,
  endpoint        text not null,
  request_hash    bytea not null,
  response_status smallint,
  response_body   jsonb,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  primary key (user_id, endpoint, key)
);
create index idempotency_keys_expiry_idx on infra.idempotency_keys (expires_at);

commit;
