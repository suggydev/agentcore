import { test, expect } from '@playwright/test';

test.describe('Analytics', () => {
  test('should load analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL(/.*analytics.*/);
  });

  test('should have charts', async ({ page }) => {
    await page.goto('/analytics');
    const charts = page.locator('canvas, [class*="chart"], svg').first();
    await expect(charts).toBeVisible();
  });

  test('should have metrics', async ({ page }) => {
    await page.goto('/analytics');
    const metrics = page.locator('[class*="metric"], [class*="stat"], [class*="kpi"]').first();
    await expect(metrics).toBeVisible();
  });
});
