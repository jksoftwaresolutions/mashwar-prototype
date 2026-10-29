import { expect, test, type Page } from '@playwright/test'
import { captainLogin, liveTripId, open, requestRide, riderLogin, switchRole, trackErrors } from './helpers'

/** Showcase → Rider app → signed in on the home screen. */
async function riderReady(page: Page) {
  await open(page, 'en')
  await page.getByRole('button', { name: /^Rider app/ }).click()
  await riderLogin(page)
}

async function captainReady(page: Page) {
  await switchRole(page, 'Captain')
  await captainLogin(page)
}

const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name })

test.describe('connected ride lifecycle', () => {
  test('request → accept → arrive → start → complete → rate → admin shows it', async ({ page }) => {
    const errors = trackErrors(page)
    await riderReady(page)
    await requestRide(page)
    const id = await liveTripId(page)
    expect(id).toMatch(/^MS-\d+$/)

    await captainReady(page)
    await expect(page.getByText('New ride request')).toBeVisible()
    await page.getByRole('button', { name: 'Accept ride' }).click()
    await expect(page.getByText('Heading to pickup')).toBeVisible()

    await switchRole(page, 'Rider')
    await expect(page.getByText(/Captain Khalid is on the way/)).toBeVisible()

    await switchRole(page, 'Captain')
    await page.getByRole('button', { name: "I've arrived at pickup" }).click()
    await expect(page.getByText('Waiting for rider')).toBeVisible()
    await expect(page.getByText('3 min free waiting')).toBeVisible()

    await switchRole(page, 'Rider')
    await expect(page.getByText(/Captain Khalid has arrived/)).toBeVisible()

    await switchRole(page, 'Captain')
    await page.getByRole('button', { name: 'Start trip' }).click()
    await expect(page.getByText('Trip in progress', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'End trip' }).click()
    await dialog(page, 'End the trip?').getByRole('button', { name: 'End trip' }).click()
    await expect(page.getByText('Trip completed', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Platform fee 20% (provisional)')).toBeVisible()

    await switchRole(page, 'Rider')
    await expect(page.getByText('You arrived safely!')).toBeVisible()
    await page.getByRole('group', { name: 'Choose a rating' }).getByRole('button', { name: '5 out of 5 stars' }).click()
    await page.getByRole('button', { name: 'Submit rating' }).click()
    await expect(page.getByText('Your rating was saved to the trip record')).toBeVisible()

    await switchRole(page, 'Admin')
    await page.getByRole('button', { name: 'Trips', exact: true }).click()
    await page.getByPlaceholder('Trip ID or name').fill(id)
    const row = page.getByRole('row', { name: new RegExp(id) })
    await expect(row).toHaveCount(1)
    await expect(row.getByText('Completed')).toBeVisible()
    await row.click()
    const drawer = dialog(page, 'Trip details')
    await expect(drawer.getByRole('img', { name: 'Rated 5 out of 5' })).toBeVisible()
    await expect(drawer.getByText('Khalid Alotaibi')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('decline reassigns the request to another captain', async ({ page }) => {
    const errors = trackErrors(page)
    await riderReady(page)
    await requestRide(page)
    await captainReady(page)
    await page.getByRole('button', { name: 'Decline' }).click()
    await expect(page.getByText('The declined request was reassigned')).toBeVisible()
    await switchRole(page, 'Rider')
    await expect(page.getByText(/Captain Majed is on the way/)).toBeVisible({ timeout: 8_000 })
    await switchRole(page, 'Admin')
    await page.getByRole('button', { name: 'Notifications' }).click()
    await expect(page.getByRole('banner').getByText(/reassigned to Majed Alshammari/)).toBeVisible()
    expect(errors).toEqual([])
  })

  test('cancelling while searching is free; after arrival the fee applies', async ({ page }) => {
    await riderReady(page)
    await requestRide(page)
    await page.getByRole('button', { name: 'Cancel request' }).click()
    const confirm = dialog(page, 'Cancel this trip?')
    await expect(confirm.getByText(/free before a captain accepts/)).toBeVisible()
    await confirm.getByRole('button', { name: 'Yes, cancel' }).click()
    await expect(page.getByText('Trip cancelled, no fee')).toBeVisible()

    await requestRide(page)
    await captainReady(page)
    await page.getByRole('button', { name: 'Accept ride' }).click()
    await page.getByRole('button', { name: "I've arrived at pickup" }).click()
    await switchRole(page, 'Rider')
    await page.getByRole('button', { name: 'Cancel trip' }).click()
    await expect(dialog(page, 'Cancel this trip?').getByText(/SAR 10 cancellation fee applies because the captain has arrived/)).toBeVisible()
    await dialog(page, 'Cancel this trip?').getByRole('button', { name: 'Yes, cancel' }).click()
    await expect(page.getByText('Trip cancelled · SAR 10 cancellation fee')).toBeVisible()

    await page.getByRole('button', { name: 'Trips', exact: true }).click()
    await page.getByRole('button', { name: 'Cancelled', exact: true }).click()
    await expect(page.getByRole('button', { name: /Cancelled.*SAR 10/ }).first()).toBeVisible()
  })

  test('coupons: valid code discounts the total, invalid code is refused', async ({ page }) => {
    await riderReady(page)
    await page.getByRole('button', { name: /^Work/ }).click()
    await expect(page.getByRole('button', { name: /^Economy.*SAR 27/ })).toBeVisible()
    await page.getByRole('button', { name: /^Continue with/ }).click()
    await page.getByPlaceholder('WELCOME15').fill('NOPE99')
    await page.getByRole('button', { name: 'Apply', exact: true }).click()
    await expect(page.getByText('Invalid or expired code')).toBeVisible()
    await page.getByPlaceholder('WELCOME15').fill('welcome15')
    await page.getByRole('button', { name: 'Apply', exact: true }).click()
    await expect(page.getByText('Promo applied')).toBeVisible()
    // Economy Olaya → KAFD is SAR 27; 15% rounds to 4.
    await expect(page.getByText('- SAR 4')).toBeVisible()
    await expect(page.getByText('SAR 23', { exact: true })).toBeVisible()
  })
})

test.describe('admin', () => {
  test('pricing update changes rider fares', async ({ page }) => {
    await open(page, 'en')
    await page.getByRole('button', { name: /^Admin dashboard/ }).click()
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    const save = page.getByRole('button', { name: 'Save changes' })
    await expect(save).toBeDisabled()
    await page.getByLabel('Base fare').fill('20')
    await expect(page.getByText('Unsaved changes')).toBeVisible()
    await save.click()
    await expect(page.getByText('Pricing saved')).toBeVisible()
    await expect(page.getByText('Provisional, not approved')).toBeVisible()

    await switchRole(page, 'Rider')
    await riderLogin(page)
    await page.getByRole('button', { name: /^Work/ }).click()
    await expect(page.getByRole('button', { name: /^Economy.*SAR 41/ })).toBeVisible()
  })

  test('tables filter and search', async ({ page }) => {
    await open(page, 'en')
    await page.getByRole('button', { name: /^Admin dashboard/ }).click()
    await page.getByRole('button', { name: 'Trips', exact: true }).click()
    const rows = page.locator('tbody tr')
    const all = await rows.count()
    expect(all).toBeGreaterThan(10)
    await page.getByRole('button', { name: 'Cancelled', exact: true }).click()
    await expect(rows).toHaveCount(2)
    await page.getByRole('button', { name: 'All', exact: true }).click()
    await page.getByPlaceholder('Trip ID or name').fill('Noura')
    await expect(rows).toHaveCount(2)
    await page.getByPlaceholder('Trip ID or name').fill('zzzz')
    await expect(page.getByText('No matching results')).toBeVisible()

    for (const section of ['Overview', 'Live operations', 'Captains', 'Riders', 'Vehicles', 'Payments', 'Promotions', 'Ratings', 'Support', 'Reports', 'Settings']) {
      await page.getByRole('button', { name: section, exact: true }).first().click()
      await expect(page.locator('main h1')).toBeVisible()
    }
  })
})

test.describe('demo controls and language', () => {
  test('demo reset restores seeds and returns to the showcase', async ({ page }) => {
    await riderReady(page)
    await requestRide(page)
    await page.getByRole('button', { name: 'Restart demo' }).first().click()
    await dialog(page, 'Restart the demo?').getByRole('button', { name: 'Restart' }).click()
    await expect(page.getByRole('button', { name: /^Rider app/ })).toBeVisible()
    await page.getByRole('button', { name: /^Rider app/ }).click()
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
    await expect(page.getByText('No active demo trip')).toBeVisible()
  })

  test('Arabic is the default, RTL is applied and switching is reversible', async ({ page }) => {
    const errors = trackErrors(page)
    await open(page, 'ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('رحلة واحدة')
    await page.getByRole('button', { name: 'Switch to English' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('One ride')
    await page.getByRole('button', { name: 'التبديل إلى العربية' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    // Logical properties: the RTL sheet back button sits on the right.
    await page.getByRole('button', { name: /^تطبيق الراكب/ }).click()
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click()
    const back = (await page.getByRole('button', { name: 'رجوع' }).boundingBox())!
    const cta = (await page.getByRole('button', { name: 'إرسال رمز التحقق' }).boundingBox())!
    // In RTL the back button aligns with the right edge of the full-width CTA, not the left.
    expect(Math.abs(back.x + back.width - (cta.x + cta.width))).toBeLessThan(40)
    expect(errors).toEqual([])
  })

  test('modals close on Escape and return focus', async ({ page }) => {
    await riderReady(page)
    const trigger = page.getByRole('button', { name: 'Restart demo' }).first()
    await trigger.click()
    await expect(dialog(page, 'Restart the demo?')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog(page, 'Restart the demo?')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

for (const width of [375, 390, 430]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.setViewportSize({ width, height: 844 })
    await open(page, 'ar')
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(await overflow()).toBeLessThanOrEqual(0)
    await page.getByRole('button', { name: /^تطبيق الراكب/ }).click()
    expect(await overflow()).toBeLessThanOrEqual(0)
    await page.getByRole('group', { name: 'تبديل التجربة' }).first().getByRole('button', { name: 'الكابتن' }).click()
    expect(await overflow()).toBeLessThanOrEqual(0)
    await page.getByRole('group', { name: 'تبديل التجربة' }).first().getByRole('button', { name: 'الإدارة' }).click()
    await expect(page.locator('main h1')).toBeVisible()
    expect(await overflow()).toBeLessThanOrEqual(0)
    expect(errors).toEqual([])
  })
}
