import { test, expect } from '@playwright/test';

test('starts in the dark theme when no preference has been saved', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});

test('dark preference resolves to the dark theme before paint', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});

test('system light preference does not override the dark default', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
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

test('an invalid stored value falls back to the dark default', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'banana'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});

test('the dark default still resolves when storage access throws', async ({ browser }) => {
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
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});
