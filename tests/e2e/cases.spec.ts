import { expect, test } from '@playwright/test';

test('each case shows problem, action, and result', async ({ page }) => {
  await page.goto('/');
  const cases = page.getByTestId('case-entry');
  expect(await cases.count()).toBeGreaterThanOrEqual(1);
  await expect(cases.first()).toContainText('Problem');
  await expect(cases.first()).toContainText('What I did');
  await expect(cases.first()).toContainText('Result');
});

test('cases use a description list so label and value are associated', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('case-entry').first().locator('dt')).toHaveCount(3);
});

test('case outcomes stay visible while supporting evidence uses native disclosure', async ({ page }) => {
  await page.goto('/');
  const firstCase = page.getByTestId('case-entry').first();
  await expect(firstCase.getByText('A server is ready in about 30 minutes', { exact: false })).toBeVisible();
  await expect(firstCase.locator('details')).toHaveCount(1);
  await expect(firstCase.locator('details')).not.toHaveAttribute('open', '');
  await expect(firstCase.locator('details summary')).toContainText('Read the full story');
});

test('expanded case evidence uses the wide row instead of a narrow side column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('/');
  const firstCase = page.getByTestId('case-entry').first();
  const details = firstCase.locator('details');
  await details.locator('summary').click();

  const [caseBox, detailsBox] = await Promise.all([firstCase.boundingBox(), details.boundingBox()]);
  expect(detailsBox?.width ?? 0).toBeGreaterThan((caseBox?.width ?? 0) * 0.5);
});

test('Russian cases use translated labels', async ({ page }) => {
  await page.goto('/ru/');
  await expect(page.getByTestId('case-entry').first()).toContainText('Проблема');
});
