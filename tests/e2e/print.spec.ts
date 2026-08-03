import { expect, test } from '@playwright/test';

test('print media hides controls and keeps content', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('header nav')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('contact-email')).toBeVisible();
  await expect(page.getByTestId('hero-cta')).toBeHidden();
  await expect(page.getByTestId('hero-secondary')).toBeHidden();

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

test('print uses the condensed experience and omits expanded case descriptions', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('.screen-experience')).toBeHidden();
  await expect(page.locator('.print-experience')).toBeVisible();
  await expect(page.locator('.print-experience')).toContainText('10 servers in parallel');
  await expect(page.getByTestId('case-entry').first()).toBeHidden();
  await expect(page.locator('.proof-module')).toBeHidden();
  await expect(page.locator('details summary').first()).toBeHidden();
});

test('print uses dark text on its white background', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });

  const colors = await page
    .locator('main h1, main p, main li, main dd')
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).color));
  expect(colors.length).toBeGreaterThan(0);
  expect(colors.every((color) => color === 'rgb(0, 0, 0)')).toBe(true);
});

test('print keeps the resume content inside a readable page gutter', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });

  const [titleBox, sectionBox] = await Promise.all([
    page.getByRole('heading', { level: 1 }).boundingBox(),
    page.locator('main h2:visible').first().boundingBox(),
  ]);

  expect(titleBox?.x).toBeGreaterThanOrEqual(32);
  expect(sectionBox?.x).toBeGreaterThanOrEqual(32);
});

test('print resume fits on one A4 page', async ({ page }) => {
  await page.goto('/');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  const pageCounts = [...pdf.toString('latin1').matchAll(/\/Count\s+(\d+)/g)].map((match) =>
    Number(match[1]),
  );

  expect(pageCounts.length).toBeGreaterThan(0);
  expect(Math.max(...pageCounts)).toBe(1);
});
