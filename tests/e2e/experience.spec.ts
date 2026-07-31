import { expect, test } from '@playwright/test';

test('experience renders every entry with period, employer, and role', async ({ page }) => {
  await page.goto('/');
  const entries = page.getByTestId('experience-entry');
  expect(await entries.count()).toBeGreaterThanOrEqual(1);
  await expect(entries.first()).toContainText('Bank Eskhata');
  await expect(entries.first()).toContainText('2022');
});

test('experience entries sit on a single shared axis', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('experience-axis')).toHaveCount(1);
});

test('Russian experience renders the translated employer', async ({ page }) => {
  await page.goto('/ru/');
  await expect(page.getByTestId('experience-entry').first()).toContainText('Банк Эсхата');
});
