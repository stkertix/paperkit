import { test, expect } from '@playwright/test'

test('home loads PaperKit', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'PaperKit', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Merge PDF' })).toBeVisible()
})

test('privacy page is reachable', async ({ page }) => {
  await page.goto('./#/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible()
  await expect(page.getByText('processed locally')).toBeVisible()
})
