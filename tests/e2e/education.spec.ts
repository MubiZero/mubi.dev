import { expect, test } from '@playwright/test';

test('education renders the degree, institution, and period', async ({ page }) => {
  await page.goto('/');
  const entry = page.getByTestId('education-entry');
  await expect(entry).toHaveCount(1);
  await expect(entry).toContainText('Moscow Financial and Industrial University');
  await expect(entry).toContainText("Bachelor's degree in Computer Software Engineering");
  await expect(entry).toContainText('2021');
});

test('education is localized in Russian', async ({ page }) => {
  await page.goto('/ru/');
  await expect(page.getByTestId('education-entry')).toContainText(
    'Московский финансово-промышленный университет',
  );
});
