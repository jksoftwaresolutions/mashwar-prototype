import { test, type Page } from '@playwright/test'
import { captainLogin, open, riderLogin, switchRole } from './helpers'

// Visual capture for design review. Writes PNGs to e2e/screens/ — run with:
//   pnpm test:e2e screens
const shot = async (page: Page, name: string) => { await page.waitForTimeout(700); await page.screenshot({ path: `e2e/screens/${name}.png`, fullPage: false }) }

for (const lang of ['ar', 'en'] as const) {
  test.describe(`screens ${lang}`, () => {
    test(`desktop ${lang}`, async ({ page }) => {
      await open(page, lang)
      await shot(page, `${lang}-desktop-showcase`)
    })
  })
}

test('desktop flow screens (en)', async ({ page }) => {
  await open(page, 'en')
  await page.getByRole('button', { name: /^Rider app/ }).click()
  await shot(page, 'en-desktop-rider-welcome')
  await riderLogin(page)
  await shot(page, 'en-desktop-rider-home')
  await page.getByRole('button', { name: /^Work/ }).click()
  await shot(page, 'en-desktop-rider-select')
  await switchRole(page, 'Captain')
  await captainLogin(page)
  await shot(page, 'en-desktop-captain-home')
  await switchRole(page, 'Admin')
  await page.waitForTimeout(800)
  await shot(page, 'en-desktop-admin-overview')
  await page.getByRole('button', { name: 'Settings' }).first().click()
  await shot(page, 'en-desktop-admin-settings')
})

for (const width of [375, 390, 430]) {
  test(`mobile ${width} (ar)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await open(page, 'ar')
    await shot(page, `ar-${width}-showcase`)
    await page.getByRole('button', { name: /^تطبيق الراكب/ }).click()
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click()
    await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click()
    await page.getByRole('button', { name: 'تعبئة تلقائية' }).click()
    await page.getByRole('button', { name: 'تأكيد' }).click()
    await shot(page, `ar-${width}-rider-home`)
    await page.getByRole('button', { name: /^العمل/ }).click()
    await shot(page, `ar-${width}-rider-select`)
    await page.getByRole('group', { name: 'تبديل التجربة' }).first().getByRole('button', { name: 'الإدارة' }).click()
    await page.waitForTimeout(800)
    await shot(page, `ar-${width}-admin`)
  })
}
