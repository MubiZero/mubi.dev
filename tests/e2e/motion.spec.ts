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
