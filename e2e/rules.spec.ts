import { expect, test } from '@playwright/test'
import { MARKET, cancellationFee, captainNet, commissionPct, formatMoney, waitingFee } from '../src/config/market'
import { calcFare, estimate, place, tripTotal } from '../src/store'

// Pure business-rule checks (no browser). Values mirror docs/phase1/05-fare-and-fee-rules.md.
const p = MARKET.pricing
const MIN = 60_000

test('market config is Saudi Arabia with provisional commercial values', () => {
  expect(MARKET.country.iso2).toBe('SA')
  expect(MARKET.currency.code).toBe('SAR')
  expect(MARKET.callingCode).toBe('+966')
  expect(MARKET.city.timezone).toBe('Asia/Riyadh')
  expect(MARKET.commission).toEqual({ rate: 0.2, status: 'provisional' })
  expect(MARKET.pricingStatus).toBe('provisional')
  expect(MARKET.vehicleCategories.map((c) => c.id)).toEqual(['economy', 'comfort', 'family'])
})

test('fare formula with minimum fare and category multiplier', () => {
  // (6 + 9.5 × 1.55 + 22 × 0.3) × 1 = 27.325 → 27
  expect(calcFare(p, 9.5, 22, 'economy')).toBe(27)
  expect(calcFare(p, 9.5, 22, 'comfort')).toBe(39)
  expect(calcFare(p, 9.5, 22, 'family')).toBe(51)
  expect(calcFare(p, 0.5, 1, 'economy')).toBe(p.minFare)
  expect(estimate(p, place('olaya'), place('kafd'), 'economy')).toEqual({ km: 9.5, mins: 22, fare: 27 })
})

test('waiting fee: free period, then per started minute', () => {
  expect(waitingFee(0, p)).toBe(0)
  expect(waitingFee(3 * MIN, p)).toBe(0)
  expect(waitingFee(3 * MIN + 1_000, p)).toBe(0.5)
  expect(waitingFee(5.5 * MIN, p)).toBe(1.5)
})

test('cancellation fee: free while searching and in the grace window', () => {
  const now = 1_000_000_000
  expect(cancellationFee({ status: 'requested', now }, p)).toBe(0)
  expect(cancellationFee({ status: 'accepted', acceptedAt: now - 1 * MIN, now }, p)).toBe(0)
  expect(cancellationFee({ status: 'accepted', acceptedAt: now - 3 * MIN, now }, p)).toBe(p.cancellation.riderAfterGrace)
  expect(cancellationFee({ status: 'arrived', acceptedAt: now, now }, p)).toBe(p.cancellation.riderAfterArrival)
})

test('rider total and captain net', () => {
  expect(tripTotal({ status: 'completed', fare: 27, discount: 4, waitFee: 1 })).toBe(24)
  expect(tripTotal({ status: 'cancelled', fare: 27, discount: 0, cancelFee: 10 })).toBe(10)
  expect(tripTotal({ status: 'cancelled', fare: 27, discount: 0 })).toBe(0)
  expect(captainNet(27)).toBe(22)
  expect(commissionPct()).toBe(20)
})

test('money formatting keeps Latin digits in both languages', () => {
  expect(formatMoney(1240, 'en')).toBe('SAR 1,240')
  expect(formatMoney(1240, 'ar')).toBe('1,240 ر.س')
  expect(formatMoney(0.5, 'en')).toBe('SAR 0.5')
})
