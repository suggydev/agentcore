import { test, expect } from '@playwright/test';

test.describe('Logs', () => {
  test('should load logs page', async ({ page }) => {
    await page.goto('/logs');
    await expect(page).toHaveURL(/.*logs.*/);
  });

  test('should have log entries', async ({ page }) => {
    await page.goto('/logs');
    const entries = page.locator('table, [class*="log"], [class*="entry"]').first();
    await expect(entries).toBeVisible();
  });

  test('should have filter controls', async ({ page }) => {
    await page.goto('/logs');
    const filter = page.locator('input, select, [class*="filter"]').first();
    await expect(filter).toBeVisible();
  });
});
