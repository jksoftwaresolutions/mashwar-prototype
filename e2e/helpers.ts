import { expect, type Page } from '@playwright/test'

/** Collects uncaught page errors and console errors so every test can assert none happened. */
export function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
  return errors
}

/** Opens the showcase. The prototype starts in Arabic; pass `en` to switch first. */
export async function open(page: Page, lang: 'ar' | 'en' = 'en') {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  if (lang === 'en') {
    await page.getByRole('button', { name: 'Switch to English' }).first().click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  }
}

export const switchRole = (page: Page, name: 'Rider' | 'Captain' | 'Admin') =>
  page.getByRole('group', { name: 'Switch experience' }).first().getByRole('button', { name }).click()

export async function riderLogin(page: Page) {
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByRole('button', { name: 'Send code' }).click()
  await page.getByRole('button', { name: 'Autofill' }).click()
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page.getByRole('button', { name: /Where to today/ })).toBeVisible()
}

export async function captainLogin(page: Page) {
  await page.getByRole('button', { name: 'Demo sign in' }).click()
  await page.getByRole('button', { name: 'Start driving' }).click()
}

/** Books Olaya → KAFD (the "Work" shortcut) in the given category, optionally with a promo code. */
export async function requestRide(page: Page, o: { category?: 'Economy' | 'Comfort' | 'Family'; coupon?: string } = {}) {
  await page.getByRole('button', { name: /^Work/ }).click()
  if (o.category) await page.getByRole('button', { name: new RegExp(`^${o.category}`) }).click()
  await page.getByRole('button', { name: /^Continue with/ }).click()
  if (o.coupon) {
    await page.getByPlaceholder('WELCOME15').fill(o.coupon)
    await page.getByRole('button', { name: 'Apply', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Confirm ride request' }).click()
  await expect(page.getByText('Finding a captain near you…')).toBeVisible()
}

/** Reads the live trip id from the demo control panel (desktop layout). */
export const liveTripId = async (page: Page) => (await page.getByTestId('live-trip-id').innerText()).trim()
