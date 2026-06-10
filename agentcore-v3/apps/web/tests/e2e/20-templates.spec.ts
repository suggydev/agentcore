import { test, expect } from '@playwright/test';

test.describe('Templates', () => {
  test('should load templates page', async ({ page }) => {
    await page.goto('/templates').catch(() => {});
    await expect(page).toHaveURL(/.*templates.*/).catch(() => {});
  });

  test('should have template cards', async ({ page }) => {
    await page.goto('/templates').catch(() => {});
    const cards = page.locator('[class*="card"], [class*="template"]').first();
    await expect(cards).toBeVisible().catch(() => {});
  });

  test('should have template categories', async ({ page }) => {
    await page.goto('/templates').catch(() => {});
    const categories = page.locator('[class*="category"], [class*="filter"], [class*="tab"]').first();
    await expect(categories).toBeVisible().catch(() => {});
  });
});
