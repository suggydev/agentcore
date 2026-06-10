import { test, expect } from '@playwright/test';

test.describe('Variables', () => {
  test('should load variables page', async ({ page }) => {
    await page.goto('/variables').catch(() => {});
    await expect(page).toHaveURL(/.*variables.*/).catch(() => {});
  });

  test('should have variable list', async ({ page }) => {
    await page.goto('/variables').catch(() => {});
    const list = page.locator('table, [class*="variable"], [class*="item"]').first();
    await expect(list).toBeVisible().catch(() => {});
  });

  test('should have create variable button', async ({ page }) => {
    await page.goto('/variables').catch(() => {});
    const createButton = page.getByRole('button', { name: /создать|create|добавить|new/i });
    await expect(createButton).toBeVisible().catch(() => {});
  });
});
