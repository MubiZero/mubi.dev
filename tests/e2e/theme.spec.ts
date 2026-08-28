import { test, expect } from '@playwright/test';

test('starts in the system light theme when no preference has been saved', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await context.close();
});

test('dark preference resolves to the dark theme before paint', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});

test('stored preference wins over the system preference', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});

test('an invalid stored value falls back to the system theme', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'banana'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await context.close();
});

test('the system theme still resolves when storage access throws', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('storage disabled');
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await context.close();
});

for (const screen of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`the theme wave opens from the control on ${screen.name}`, async ({ page }) => {
    // A phone once ran this out of the top left corner while the button sat top
    // right. The origin is asserted where the page states it, not where the
    // code that computes it says it should be, and at every width because the
    // failure was width-dependent.
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await page.goto('/');
    await page.evaluate(() => {
      const start = document.startViewTransition.bind(document);
      document.startViewTransition = (callback: () => void) => {
        const style = getComputedStyle(document.documentElement);
        Object.assign(window, {
          __wave: [style.getPropertyValue('--wave-x'), style.getPropertyValue('--wave-y')],
        });
        return start(callback);
      };
    });

    const toggle = page.locator('#theme-toggle');
    const box = (await toggle.boundingBox())!;
    await toggle.click();

    const wave = await page.evaluate(() => (window as unknown as { __wave?: string[] }).__wave);
    expect(wave, 'no transition was started').toBeTruthy();

    // Percentages of the viewport, which is what the stylesheet resolves them
    // against; converting back is the only way to compare them to the button.
    const x = (parseFloat(wave![0]) / 100) * screen.width;
    const y = (parseFloat(wave![1]) / 100) * screen.height;

    expect(x).toBeGreaterThanOrEqual(box.x);
    expect(x).toBeLessThanOrEqual(box.x + box.width);
    expect(y).toBeGreaterThanOrEqual(box.y);
    expect(y).toBeLessThanOrEqual(box.y + box.height);
  });
}

test('the wave covers the screen from wherever it opens', async ({ page }) => {
  // 142% of a percentage radius is the full diagonal, so the circle reaches
  // every corner from any point inside. A smaller radius would leave the old
  // theme showing in the far corner when the button is at the opposite one.
  await page.goto('/');
  const radius = await page.evaluate(() => {
    const rules = [...document.styleSheets].flatMap((sheet) => {
      try {
        return [...sheet.cssRules];
      } catch {
        return [];
      }
    });
    const frames = rules.find(
      (rule): rule is CSSKeyframesRule =>
        rule instanceof CSSKeyframesRule && rule.name === 'theme-wave',
    );
    return frames?.cssRules[frames.cssRules.length - 1]?.cssText ?? '';
  });
  expect(radius).toMatch(/circle\(\s*1(4[2-9]|[5-9]\d)%/);
});

test('moving between languages is a transition, not a reload flash', async ({ page }) => {
  // Cross-document view transitions are opted into from CSS, and the only
  // proof they took is the new document reporting one on pagereveal. Asserting
  // the @view-transition rule instead would only prove the stylesheet parsed.
  await page.addInitScript(() => {
    window.addEventListener('pagereveal', (event) => {
      Object.assign(window, {
        __revealed: Boolean((event as PageRevealEvent).viewTransition),
      });
    });
  });

  await page.goto('/');
  await page.getByRole('link', { name: /switch language/i }).first().click();
  await page.waitForURL('**/ru/');

  expect(await page.evaluate(() => (window as unknown as { __revealed?: boolean }).__revealed)).toBe(
    true,
  );
});
