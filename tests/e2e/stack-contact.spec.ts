import { expect, test } from '@playwright/test';

test('stack renders grouped technologies without proficiency indicators', async ({ page }) => {
  await page.goto('/');
  const groups = page.getByTestId('stack-group');
  expect(await groups.count()).toBeGreaterThanOrEqual(2);
  await expect(groups.first()).toContainText('Docker');
  await expect(page.locator('progress, [role="progressbar"], meter')).toHaveCount(0);
  await expect(groups.first()).not.toContainText('%');
});

test('contact exposes a mailto and absolute profile links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('contact-email')).toHaveAttribute('href', /^mailto:/);
  const links = page.getByTestId('contact-links').locator('a');
  expect(await links.count()).toBeGreaterThanOrEqual(2);
  for (let index = 0; index < (await links.count()); index += 1) {
    await expect(links.nth(index)).toHaveAttribute('href', /^https:\/\//);
  }
});

test('the page ships no contact form', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('form')).toHaveCount(0);
});

test('every link is functional', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('a');
  for (let index = 0; index < (await links.count()); index += 1) {
    const href = await links.nth(index).getAttribute('href');
    expect(href, `link ${index} href`).toBeTruthy();
    expect(href, `link ${index} href`).not.toBe('#');
  }
});
