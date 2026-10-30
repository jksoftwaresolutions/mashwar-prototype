/**
 * Shared UI strings, keyed and typed. Use `t('payment.card')` from the store.
 *
 * Migration status: shared/common strings (navigation, statuses, payment methods, common actions)
 * live here. Screen-specific copy still uses inline `t(ar, en)` pairs and moves here screen by screen.
 * The Flutter apps should load the same keys from ARB files generated from this dictionary.
 */
import type { Lang } from '../config/market'

type Entry = Record<Lang, string>

export const messages = {
  // Common actions
  'common.close': { ar: 'إغلاق', en: 'Close' },
  'common.back': { ar: 'رجوع', en: 'Back' },
  'common.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'common.notifications': { ar: 'الإشعارات', en: 'Notifications' },
  'common.loading': { ar: 'جارٍ التحميل…', en: 'Loading…' },
  'common.remove': { ar: 'إزالة', en: 'Remove' },

  // Bottom navigation
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.myTrips': { ar: 'رحلاتي', en: 'Trips' },
  'nav.trips': { ar: 'الرحلات', en: 'Trips' },
  'nav.wallet': { ar: 'المحفظة', en: 'Wallet' },
  'nav.earnings': { ar: 'الأرباح', en: 'Earnings' },
  'nav.account': { ar: 'حسابي', en: 'Account' },

  // Payment methods
  'payment.card': { ar: 'بطاقة', en: 'Card' },
  'payment.cash': { ar: 'نقدًا', en: 'Cash' },

  // Ride status badges
  'status.requested': { ar: 'بانتظار كابتن', en: 'Requested' },
  'status.accepted': { ar: 'الكابتن في الطريق', en: 'Driver en route' },
  'status.arrived': { ar: 'الكابتن وصل', en: 'Arrived' },
  'status.in_progress': { ar: 'جارية', en: 'In progress' },
  'status.completed': { ar: 'مكتملة', en: 'Completed' },
  'status.cancelled': { ar: 'ملغاة', en: 'Cancelled' },

  // Ride lifecycle timeline steps
  'step.requested': { ar: 'تم الطلب', en: 'Requested' },
  'step.accepted': { ar: 'تم القبول', en: 'Accepted' },
  'step.arrived': { ar: 'وصل الكابتن', en: 'Arrived' },
  'step.in_progress': { ar: 'جارية', en: 'In progress' },
  'step.completed': { ar: 'مكتملة', en: 'Completed' },

  // Shell
  'shell.switchExperience': { ar: 'تبديل التجربة', en: 'Switch experience' },
  'shell.rider': { ar: 'الراكب', en: 'Rider' },
  'shell.captain': { ar: 'الكابتن', en: 'Captain' },
  'shell.admin': { ar: 'الإدارة', en: 'Admin' },
  'shell.restartDemo': { ar: 'إعادة تشغيل التجربة', en: 'Restart demo' },
} satisfies Record<string, Entry>

export type MsgKey = keyof typeof messages
