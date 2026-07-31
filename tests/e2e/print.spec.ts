import { expect, test } from '@playwright/test';

test('print media hides controls and keeps content', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('header nav')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('contact-email')).toBeVisible();

  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe('rgb(255, 255, 255)');
});

test('print exposes profile link targets', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  const printedUrl = await page
    .getByTestId('contact-links')
    .locator('a')
    .first()
    .evaluate((node) => getComputedStyle(node, '::after').content);
  expect(printedUrl).toContain('https://');
});
