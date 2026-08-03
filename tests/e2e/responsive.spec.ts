import { expect, test } from '@playwright/test';

const widths = [320, 375, 768, 1280, 2560];

for (const width of widths) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`no horizontal overflow at ${width}px with 200 percent text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px';
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`visible header controls are at least 44px at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    const controls = await page.locator('header a[href], header button').evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0;
        })
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            label: node.getAttribute('aria-label') ?? node.textContent?.trim() ?? node.tagName,
            width: rect.width,
            height: rect.height,
          };
        }),
    );

    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.width, `${control.label} width`).toBeGreaterThanOrEqual(44);
      expect(control.height, `${control.label} height`).toBeGreaterThanOrEqual(44);
    }
  });
}

test('body copy is capped at a comfortable measure', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const widths = await page
    .locator('main p')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  expect(widths.length).toBeGreaterThan(0);
  for (const width of widths) {
    expect(width).toBeLessThanOrEqual(800);
  }
});

test('localized headings stay fully inside the desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('/ru/');
  const clipped = await page.locator('main h1, main h2, main h3').evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        return rect.left < 0 || rect.right > window.innerWidth;
      })
      .map((node) => node.textContent?.trim()),
  );

  expect(clipped).toEqual([]);
});
