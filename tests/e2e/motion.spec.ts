import { expect, test } from '@playwright/test';

test('reduced motion collapses transitions', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const duration = await page
    .getByTestId('hero-cta')
    .evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(parseFloat(duration)).toBeLessThan(0.05);
  await context.close();
});

test('routine interaction transitions stay within the visual-system budget', async ({ page }) => {
  await page.goto('/');
  const durations = await page
    .locator('.nav-link, .icon-button, .button, .social-link')
    .evaluateAll((nodes) =>
      nodes.flatMap((node) =>
        getComputedStyle(node)
          .transitionDuration.split(',')
          .map((duration) => parseFloat(duration) * (duration.includes('ms') ? 1 : 1000)),
      ),
    );

  expect(durations.length).toBeGreaterThan(0);
  for (const duration of durations.filter((value) => value > 0)) {
    expect(duration).toBeGreaterThanOrEqual(140);
    expect(duration).toBeLessThanOrEqual(260);
  }
});

test('no element animates the all property', async ({ page }) => {
  await page.goto('/');
  const offenders = await page.evaluate(() =>
    Array.from(document.querySelectorAll('*'))
      .filter((node) => {
        const style = getComputedStyle(node);
        return style.transitionProperty === 'all' && parseFloat(style.transitionDuration) > 0;
      })
      .map((node) => node.tagName),
  );
  expect(offenders).toEqual([]);
});
