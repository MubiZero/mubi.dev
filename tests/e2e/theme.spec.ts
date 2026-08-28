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

test('the theme wave starts from the control, not from a corner', async ({ page }) => {
  // A phone once ran this animation out of the top left corner while the button
  // sat top right. Asserting the rendered circle rather than the code that
  // computes it is the only way to notice that happening again.
  await page.goto('/');
  await page.evaluate(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (
      keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: number | KeyframeAnimationOptions,
    ) {
      const pseudo = typeof options === 'object' ? options?.pseudoElement : undefined;
      const frames = keyframes as PropertyIndexedKeyframes | null;
      if (String(pseudo).includes('view-transition')) {
        Object.assign(window, { __clip: (frames?.clipPath as string[] | undefined)?.[0] });
      }
      return original.call(this, keyframes, options);
    };
  });

  const toggle = page.locator('#theme-toggle');
  const box = (await toggle.boundingBox())!;
  await toggle.click();

  // The animation is started from the view transition's ready promise, so it
  // does not exist yet when the click returns.
  await page.waitForFunction(() => (window as unknown as { __clip?: string }).__clip);
  const clip = await page.evaluate(() => (window as unknown as { __clip?: string }).__clip);
  const origin = clip?.match(/circle\(0px at ([\d.]+)px ([\d.]+)px\)/);
  expect(origin, `no circle was animated, got ${clip}`).toBeTruthy();

  const [x, y] = [Number(origin![1]), Number(origin![2])];
  expect(x).toBeGreaterThanOrEqual(box.x);
  expect(x).toBeLessThanOrEqual(box.x + box.width);
  expect(y).toBeGreaterThanOrEqual(box.y);
  expect(y).toBeLessThanOrEqual(box.y + box.height);
});
