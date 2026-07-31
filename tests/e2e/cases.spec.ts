import { expect, test } from '@playwright/test';

test('each case shows problem, action, and result', async ({ page }) => {
  await page.goto('/');
  const cases = page.getByTestId('case-entry');
  expect(await cases.count()).toBeGreaterThanOrEqual(1);
  await expect(cases.first()).toContainText('Problem');
  await expect(cases.first()).toContainText('What I did');
  await expect(cases.first()).toContainText('Result');
});

test('cases use a description list so label and value are associated', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('case-entry').first().locator('dt')).toHaveCount(3);
});

test('Russian cases use translated labels', async ({ page }) => {
  await page.goto('/ru/');
  await expect(page.getByTestId('case-entry').first()).toContainText('Проблема');
});
