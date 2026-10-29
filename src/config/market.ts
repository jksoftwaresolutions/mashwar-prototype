/**
 * Market configuration — the single source of truth for country-specific values
 * (country, currency, locale, calling code, city, pricing, fees, commission, vehicle categories).
 *
 * Only Saudi Arabia is implemented. To prepare another market, add an entry to
 * MARKETS and switch ACTIVE_MARKET_ID; no component should hardcode these values.
 * In production this data comes from the backend per operating city and is
 * authoritative there — the client only displays quotes.
 *
 * IMPORTANT: every commercial value below (fares, fees, commission) is a
 * PROVISIONAL demo value. None of them has been approved by the client yet.
 */
export type Lang = 'ar' | 'en'
export type Category = 'economy' | 'comfort' | 'family'

/** Whether a commercial value has been signed off by the client. */
export type ApprovalState = 'provisional' | 'approved'

export interface VehicleCategory {
  id: Category
  ar: string
  en: string
  descAr: string
  descEn: string
  seats: number
  /** Demo-only typical pickup time in minutes. Production: computed by dispatch. */
  eta: number
}

export interface WaitingFeeConfig {
  /** Free waiting time after the captain arrives, in minutes. */
  freeMins: number
  /** Charge per started minute after the free period. */
  perMin: number
}

export interface CancellationFeeConfig {
  /** Free cancellation window after the request is accepted, in minutes. */
  graceMins: number
  /** Fee when the rider cancels after the grace window while the captain is en route. */
  riderAfterGrace: number
  /** Fee when the rider cancels after the captain has arrived. */
  riderAfterArrival: number
}

export interface PricingConfig {
  base: number
  perKm: number
  perMin: number
  minFare: number
  mult: Record<Category, number>
  waiting: WaitingFeeConfig
  cancellation: CancellationFeeConfig
  areas: { id: string; ar: string; en: string; on: boolean }[]
}

export interface CommissionConfig {
  /** Platform commission (0–1) deducted from the captain's fare. */
  rate: number
  status: ApprovalState
}

export interface MarketConfig {
  id: string
  country: { iso2: string; nameAr: string; nameEn: string }
  city: { id: string; nameAr: string; nameEn: string; timezone: string }
  currency: { code: string; symbolAr: string; symbolEn: string; decimals: number }
  /** BCP-47 locales used for dates and numbers. Latin digits are kept for readability. */
  locale: Record<Lang, string>
  defaultLang: Lang
  /** E.164 country calling code. */
  callingCode: string
  /** Local mobile number length without the calling code. */
  phoneDigits: number
  phonePlaceholder: string
  commission: CommissionConfig
  /** Commercial values in `pricing` share this approval state. */
  pricingStatus: ApprovalState
  vehicleCategories: VehicleCategory[]
  pricing: PricingConfig
}

export const MARKETS: Record<string, MarketConfig> = {
  SA: {
    id: 'SA',
    country: { iso2: 'SA', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia' },
    city: { id: 'riyadh', nameAr: 'الرياض', nameEn: 'Riyadh', timezone: 'Asia/Riyadh' },
    currency: { code: 'SAR', symbolAr: 'ر.س', symbolEn: 'SAR', decimals: 0 },
    locale: { ar: 'ar-SA-u-nu-latn-ca-gregory', en: 'en-GB' },
    defaultLang: 'ar',
    callingCode: '+966',
    phoneDigits: 9,
    phonePlaceholder: '5X XXX XXXX',
    commission: { rate: 0.2, status: 'provisional' },
    pricingStatus: 'provisional',
    vehicleCategories: [
      { id: 'economy', ar: 'اقتصادي', en: 'Economy', descAr: 'رحلات يومية بسعر مناسب', descEn: 'Affordable daily rides', seats: 4, eta: 3 },
      { id: 'comfort', ar: 'مريح', en: 'Comfort', descAr: 'سيدان فاخرة بمساحة أوسع', descEn: 'Comfortable premium sedan', seats: 4, eta: 5 },
      { id: 'family', ar: 'عائلي', en: 'Family', descAr: 'مركبة أكبر تتسع للعائلة', descEn: 'Larger family vehicle', seats: 7, eta: 7 },
    ],
    pricing: {
      base: 6, perKm: 1.55, perMin: 0.3, minFare: 12,
      mult: { economy: 1, comfort: 1.42, family: 1.88 },
      waiting: { freeMins: 3, perMin: 0.5 },
      cancellation: { graceMins: 2, riderAfterGrace: 5, riderAfterArrival: 10 },
      areas: [
        { id: 'n', ar: 'شمال الرياض', en: 'North Riyadh', on: true },
        { id: 'c', ar: 'وسط الرياض', en: 'Central Riyadh', on: true },
        { id: 'e', ar: 'شرق الرياض', en: 'East Riyadh', on: true },
        { id: 'w', ar: 'غرب الرياض', en: 'West Riyadh', on: false },
        { id: 'a', ar: 'مطار الملك خالد', en: 'KKIA Airport', on: true },
      ],
    },
  },
}

export const ACTIVE_MARKET_ID = 'SA'
export const MARKET: MarketConfig = MARKETS[ACTIVE_MARKET_ID]

export const currencySymbol = (lang: Lang, m: MarketConfig = MARKET) => (lang === 'ar' ? m.currency.symbolAr : m.currency.symbolEn)

export function formatMoney(n: number, lang: Lang, m: MarketConfig = MARKET) {
  const v = n.toLocaleString('en-US', { maximumFractionDigits: Math.max(m.currency.decimals, n % 1 ? 2 : 0) })
  return lang === 'ar' ? `${v} ${m.currency.symbolAr}` : `${m.currency.symbolEn} ${v}`
}

export const formatPhone = (local: string, m: MarketConfig = MARKET) => `${m.callingCode} ${local}`
export const commissionPct = (m: MarketConfig = MARKET) => Math.round(m.commission.rate * 100)
export const captainNet = (gross: number, m: MarketConfig = MARKET) => Math.round(gross * (1 - m.commission.rate))

/** Waiting fee for a given wait in milliseconds. Charged per started minute after the free period. */
export function waitingFee(waitMs: number, p: PricingConfig) {
  const over = waitMs / 60_000 - p.waiting.freeMins
  return over > 0 ? Math.ceil(over) * p.waiting.perMin : 0
}

/**
 * Rider cancellation fee. Free while searching and inside the grace window after acceptance;
 * a flat fee after the grace window; a higher flat fee once the captain has arrived.
 */
export function cancellationFee(o: { status: string; acceptedAt?: number; now?: number }, p: PricingConfig) {
  const now = o.now ?? Date.now()
  if (o.status === 'arrived') return p.cancellation.riderAfterArrival
  if (o.status === 'accepted' && o.acceptedAt && now - o.acceptedAt > p.cancellation.graceMins * 60_000) return p.cancellation.riderAfterGrace
  return 0
}
