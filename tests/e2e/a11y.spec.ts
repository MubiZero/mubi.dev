import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const paths = ['/', '/ru/'];
const themes = ['dark', 'light'] as const;

for (const path of paths) {
  for (const theme of themes) {
    test(`${path} has no axe violations in the ${theme} theme`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

test('every focusable element shows a focus ring at least 2px wide', async ({ page }) => {
  await page.goto('/');
  const focusables = page.locator('a[href], button:not([disabled])');
  expect(await focusables.count()).toBeGreaterThan(4);

  for (let index = 0; index < (await focusables.count()); index += 1) {
    const element = focusables.nth(index);
    await element.focus();
    const width = await element.evaluate((node) => getComputedStyle(node).outlineWidth);
    expect(parseFloat(width), `focusable ${index}`).toBeGreaterThanOrEqual(2);
  }
});

test('heading order is correct and there is a single h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  const levels = await page
    .locator('h1, h2, h3')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));
  for (let index = 1; index < levels.length; index += 1) {
    expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
  }
});

test('focusing the final contact link keeps it clear of sticky UI', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const contact = page.getByTestId('contact-email');
  await contact.focus();
  const obscured = await contact.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return rect.top < 0 || rect.bottom > window.innerHeight;
  });

  expect(obscured).toBe(false);
});
