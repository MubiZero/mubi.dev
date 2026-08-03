import { test, expect } from '@playwright/test';

test('English page renders the wordmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=mubi.dev').first()).toBeVisible();
});

for (const path of ['/', '/ru/']) {
  test(`${path} renders localized UI content`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main-content');
  });
}
