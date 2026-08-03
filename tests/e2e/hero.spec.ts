import { expect, test } from '@playwright/test';

test('hero states the name and current man line while the page exposes the stack', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mubinjon Mukhamedov');
  await expect(page.getByText('Infrastructure engineer and product developer')).toBeVisible();
  await expect(page.getByText('Linux', { exact: false }).first()).toBeVisible();
});

for (const { path, label } of [
  { path: '/', label: 'Discuss a task' },
  { path: '/ru/', label: 'Обсудить задачу' },
]) {
  test(`${path} hero has the exact task CTA pointing at mailto`, async ({ page }) => {
    await page.goto(path);
    const cta = page.getByTestId('hero-cta');
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveText(label);
    await expect(cta).toHaveAttribute('href', /^mailto:/);
  });
}

test('hero secondary links use HTTPS profile URLs', async ({ page }) => {
  await page.goto('/');
  const links = page.getByTestId('hero-secondary').locator('a');
  await expect(links).toHaveCount(3);
  for (let index = 0; index < (await links.count()); index += 1) {
    await expect(links.nth(index)).toHaveAttribute('href', /^https:\/\//);
  }
});

test('verified proof follows the hero before selected work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('proof-item')).toHaveCount(3);
  await expect(page.locator('main > section').nth(1)).toHaveAttribute('id', 'proof');
  await expect(page.locator('main > section').nth(2)).toHaveAttribute('id', 'work');
  await expect(page.locator('.workspace-module')).toHaveCount(0);
});

test('the page has exactly one h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
});
