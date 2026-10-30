-- DEVELOPMENT SEED ONLY. Never run against staging or production.
-- Every commercial value here mirrors the prototype (prototype/src/config/market.ts) and is
-- PROVISIONAL / NOT APPROVED by the client. See docs/phase1/CLIENT-DECISIONS.md.

begin;

insert into market.cities (id, country_iso2, slug, name_ar, name_en, timezone, is_active)
values ('01900000-0000-7000-8000-000000000001', 'SA', 'riyadh', 'الرياض', 'Riyadh', 'Asia/Riyadh', true)
on conflict (slug) do nothing;

insert into market.vehicle_categories (id, name_ar, name_en, desc_ar, desc_en, seats, sort_order) values
  ('economy', 'اقتصادي', 'Economy', 'رحلات يومية بسعر مناسب', 'Affordable daily rides', 4, 1),
  ('comfort', 'مريح',    'Comfort', 'سيدان فاخرة بمساحة أوسع', 'Comfortable premium sedan', 4, 2),
  ('family',  'عائلي',   'Family',  'مركبة أكبر تتسع للعائلة', 'Larger family vehicle', 7, 3)
on conflict (id) do nothing;

-- Prototype values folded per category (base/per-km/per-min × multiplier). All provisional.
insert into market.pricing_plans
  (city_id, category_id, currency, base_fare, per_km, per_min, min_fare_halalas,
   waiting_free_mins, waiting_per_min, cancel_grace_mins, cancel_after_grace_halalas, cancel_after_arrival_halalas,
   commission_bps, approval_status, effective)
select '01900000-0000-7000-8000-000000000001', c.id, 'SAR',
       6 * c.mult, 1.55 * c.mult, 0.30 * c.mult, 1200,
       3, 0.50, 2, 500, 1000,
       2000, 'provisional', tstzrange(now(), null)
from (values ('economy', 1.00::numeric), ('comfort', 1.42), ('family', 1.88)) as c(id, mult)
where not exists (select 1 from market.pricing_plans p where p.category_id = c.id);

-- Common KYC document types; the final list depends on TGA requirements (open).
insert into core.document_types (id, applies_to, requires_expiry, name_ar, name_en) values
  ('national_id',          'captain', true,  'الهوية الوطنية',   'National ID'),
  ('iqama',                'captain', true,  'الإقامة',          'Iqama'),
  ('driving_licence',      'captain', true,  'رخصة القيادة',     'Driving licence'),
  ('vehicle_registration', 'vehicle', true,  'استمارة المركبة',  'Vehicle registration'),
  ('vehicle_insurance',    'vehicle', true,  'تأمين المركبة',    'Vehicle insurance')
on conflict (id) do nothing;

commit;
