import { test, expect } from '@playwright/test';

test('English page renders the wordmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=mubi.dev').first()).toBeVisible();
});
