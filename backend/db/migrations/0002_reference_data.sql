-- MASHWAR reference data (Phase 1 foundation)
-- Structural facts only. Commercial values (vehicle categories, fares, fees, commission, launch city)
-- are NOT approved and live in db/seeds/dev_seed.sql for local development.

begin;

-- Trip state machine. Must match backend/src/trips/domain/trip-state-machine.ts (enforced by a unit test).
insert into ride.trip_status_transitions (from_status, to_status, allowed_actors) values
  ('requested',   'accepted',    '{captain}'),
  ('requested',   'cancelled',   '{rider,admin}'),
  ('requested',   'expired',     '{system}'),
  ('accepted',    'arrived',     '{captain}'),
  ('accepted',    'requested',   '{captain,system}'),
  ('accepted',    'cancelled',   '{rider,admin}'),
  ('arrived',     'in_progress', '{captain}'),
  ('arrived',     'cancelled',   '{rider,captain,admin}'),
  ('in_progress', 'completed',   '{captain}'),
  ('in_progress', 'cancelled',   '{admin}');

insert into ride.cancellation_reasons (id, actor, name_ar, name_en, fee_applies) values
  ('rider_changed_mind', 'rider',   'غيّرت رأيي',              'Changed my mind',        true),
  ('rider_wait_too_long', 'rider',  'الانتظار طويل',           'Waiting too long',       false),
  ('rider_no_show',      'captain', 'الراكب لم يحضر',          'Rider did not show up',  true),
  ('captain_unable',     'captain', 'لا أستطيع إكمال الطلب',   'Unable to take the trip', false),
  ('admin_safety',       'admin',   'إلغاء من الإدارة (سلامة)', 'Cancelled by operations (safety)', false),
  ('admin_other',        'admin',   'إلغاء من الإدارة',         'Cancelled by operations', false);

-- Staff RBAC: proposed starting set (docs/phase1/06 section 5.9). Must match backend/src/auth/rbac.ts.
insert into admin.roles (id, name_ar, name_en) values
  ('super_admin',        'مدير النظام',        'Super admin'),
  ('operations',         'العمليات',           'Operations'),
  ('captain_onboarding', 'اعتماد الكباتن',     'Captain onboarding'),
  ('support_agent',      'الدعم',              'Support agent'),
  ('finance',            'المالية',            'Finance'),
  ('marketing',          'التسويق',            'Marketing'),
  ('read_only_analyst',  'محلل (قراءة فقط)',   'Read-only analyst');

insert into admin.permissions (id, description) values
  ('trips.view',       'View trips and live operations'),
  ('trips.cancel',     'Cancel a non-terminal trip with a reason'),
  ('captains.approve', 'Approve or reject captain applications and documents'),
  ('captains.suspend', 'Suspend or reinstate captains'),
  ('riders.block',     'Block or unblock riders'),
  ('coupons.manage',   'Create, edit and deactivate coupons'),
  ('pricing.edit',     'Propose pricing plan changes (provisional)'),
  ('pricing.approve',  'Approve a provisional pricing plan (different admin than the editor)'),
  ('zones.edit',       'Edit service areas and zones'),
  ('refunds.issue',    'Issue refunds'),
  ('tickets.manage',   'Handle support tickets'),
  ('reports.view',     'View reports and exports'),
  ('pii.view',         'View personal data such as KYC documents'),
  ('admins.manage',    'Manage staff accounts and roles');

insert into admin.role_permissions (role_id, permission_id)
select 'super_admin', id from admin.permissions;

insert into admin.role_permissions (role_id, permission_id) values
  ('operations', 'trips.view'), ('operations', 'trips.cancel'), ('operations', 'captains.suspend'),
  ('operations', 'riders.block'), ('operations', 'zones.edit'), ('operations', 'pricing.edit'),
  ('operations', 'tickets.manage'), ('operations', 'reports.view'),
  ('captain_onboarding', 'trips.view'), ('captain_onboarding', 'captains.approve'),
  ('captain_onboarding', 'captains.suspend'), ('captain_onboarding', 'pii.view'),
  ('support_agent', 'trips.view'), ('support_agent', 'tickets.manage'), ('support_agent', 'riders.block'),
  ('finance', 'trips.view'), ('finance', 'refunds.issue'), ('finance', 'pricing.approve'), ('finance', 'reports.view'),
  ('marketing', 'coupons.manage'), ('marketing', 'reports.view'),
  ('read_only_analyst', 'trips.view'), ('read_only_analyst', 'reports.view');

-- Contracted launch country. VAT rate is left null until confirmed with the client's tax advisor.
insert into market.countries (iso2, name_ar, name_en, currency, currency_minor_units, calling_code, phone_digits, default_lang, vat_bps, is_active)
values ('SA', 'المملكة العربية السعودية', 'Saudi Arabia', 'SAR', 2, '+966', 9, 'ar', null, true);

insert into support.ticket_categories (id, name_ar, name_en, default_priority) values
  ('vehicle_quality', 'جودة المركبة',  'Vehicle quality', 'medium'),
  ('captain_delay',   'تأخر الكابتن',  'Captain delay',   'low'),
  ('fare_issue',      'مشكلة في الأجرة', 'Fare issue',    'high'),
  ('refund_request',  'استرداد مبلغ',  'Refund request',  'high'),
  ('lost_item',       'أغراض مفقودة',  'Lost item',       'high'),
  ('safety',          'سلامة',         'Safety',          'high'),
  ('other',           'أخرى',          'Other',           'low');

commit;
