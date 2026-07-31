import { test, expect } from '@playwright/test';

test('English page exposes correct metadata and alternates', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="alternate"][hreflang="ru"]')).toHaveAttribute(
    'href',
    'https://mubi.dev/ru/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    'href',
    'https://mubi.dev/',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Infrastructure engineer/,
  );
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(jsonLd ?? '{}')['@type']).toBe('Person');
});

test('Russian page exposes correct metadata and alternates', async ({ page }) => {
  await page.goto('/ru/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://mubi.dev/',
  );
});

test('English page contains no em-dash in rendered text', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('body').innerText();
  expect(text).not.toContain('—');
});
