import { test, expect } from '@playwright/test';

test('language switch moves between locales in both directions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Русский' }).click();
  await expect(page).toHaveURL(/\/ru\/$/);
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL('http://localhost:4321/');
});

test('theme toggle flips the theme and persists it', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: /theme/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await context.close();
});

test('every header control is keyboard reachable with a visible focus ring', async ({ page }) => {
  await page.goto('/');
  const controls = page.locator('header a, header button');
  const count = await controls.count();
  expect(count).toBeGreaterThanOrEqual(2);

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    await control.focus();
    const outlineWidth = await control.evaluate(
      (element) => getComputedStyle(element).outlineWidth,
    );
    expect(parseFloat(outlineWidth), `control ${index} focus ring`).toBeGreaterThanOrEqual(2);
  }
});

test('every header control meets the 24px target minimum', async ({ page }) => {
  await page.goto('/');
  const controls = page.locator('header a, header button');
  for (let index = 0; index < (await controls.count()); index += 1) {
    const box = await controls.nth(index).boundingBox();
    expect(box?.height ?? 0, `control ${index} height`).toBeGreaterThanOrEqual(24);
    expect(box?.width ?? 0, `control ${index} width`).toBeGreaterThanOrEqual(24);
  }
});
