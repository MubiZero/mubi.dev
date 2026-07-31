import { expect, test } from '@playwright/test';

test('hero states the name, the man line, and the stack', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mubinjon Mukhamedov');
  await expect(
    page.getByText('mubi - infrastructure engineer and product developer'),
  ).toBeVisible();
  await expect(page.getByText('Linux', { exact: false }).first()).toBeVisible();
});

test('hero has exactly one primary call to action pointing at mailto', async ({ page }) => {
  await page.goto('/');
  const cta = page.getByTestId('hero-cta');
  await expect(cta).toHaveCount(1);
  await expect(cta).toHaveAttribute('href', /^mailto:/);
});

test('hero secondary links use HTTPS profile URLs', async ({ page }) => {
  await page.goto('/');
  const links = page.getByTestId('hero-secondary').locator('a');
  expect(await links.count()).toBeGreaterThanOrEqual(2);
  for (let index = 0; index < (await links.count()); index += 1) {
    await expect(links.nth(index)).toHaveAttribute('href', /^https:\/\//);
  }
});

test('the page has exactly one h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
});
