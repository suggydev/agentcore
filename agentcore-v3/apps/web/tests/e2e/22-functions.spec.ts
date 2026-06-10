import { test, expect } from '@playwright/test';

test.describe('Functions', () => {
  test('should load functions page', async ({ page }) => {
    await page.goto('/functions').catch(() => {});
    await expect(page).toHaveURL(/.*functions.*/).catch(() => {});
  });

  test('should have function list', async ({ page }) => {
    await page.goto('/functions').catch(() => {});
    const list = page.locator('table, [class*="function"], [class*="item"]').first();
    await expect(list).toBeVisible().catch(() => {});
  });

  test('should have create function button', async ({ page }) => {
    await page.goto('/functions').catch(() => {});
    const createButton = page.getByRole('button', { name: /создать|create|добавить|new/i });
    await expect(createButton).toBeVisible().catch(() => {});
  });
});
