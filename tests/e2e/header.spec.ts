import { test, expect } from '@playwright/test';

test('language switch moves between locales in both directions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Русский' }).click();
  await expect(page).toHaveURL(/\/ru\/$/);
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL('http://localhost:4321/');
});

test('navigation targets the evidence-first sections in reading order', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('header [data-site-nav] [data-section-link]');
  await expect(links).toHaveCount(5);
  await expect(links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')))).resolves.toEqual([
    '#home',
    '#work',
    '#expertise',
    '#experience',
    '#contact',
  ]);

  for (const id of ['home', 'work', 'expertise', 'experience', 'contact']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.locator('header a[href="#about"]')).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(links.filter({ visible: true })).toHaveCount(4);
  await expect(links.filter({ visible: true }).evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')))).resolves.toEqual([
    '#home',
    '#work',
    '#experience',
    '#contact',
  ]);
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

test('theme indicator reflects the active theme', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  const indicator = page.getByTestId('theme-indicator');
  await expect(indicator).toHaveAttribute('data-theme-icon', 'dark');
  await page.getByRole('button', { name: /theme/i }).click();
  await expect(indicator).toHaveAttribute('data-theme-icon', 'light');
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

test('every header control animates both color and transform with the short motion token', async ({ browser }) => {
  // The global reduced-motion rule collapses transition durations, so this assertion
  // needs an explicit no-preference context rather than the default test context.
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('/');
  const controls = page.locator('header a, header button');
  for (let index = 0; index < (await controls.count()); index += 1) {
    const control = controls.nth(index);
    const { property, duration } = await control.evaluate((element) => {
      const style = getComputedStyle(element);
      return { property: style.transitionProperty, duration: style.transitionDuration };
    });
    expect(property, `control ${index} transition-property`).toContain('color');
    expect(property, `control ${index} transition-property`).toContain('transform');
    expect(duration, `control ${index} transition-duration`).toContain('0.14s');
  }
  await context.close();
});
