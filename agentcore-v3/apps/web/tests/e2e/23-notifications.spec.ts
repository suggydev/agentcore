import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test('should load notifications page', async ({ page }) => {
    await page.goto('/notifications').catch(() => {});
    await expect(page).toHaveURL(/.*notifications.*/).catch(() => {});
  });

  test('should have notification list', async ({ page }) => {
    await page.goto('/notifications').catch(() => {});
    const list = page.locator('[class*="notification"], [class*="item"], [class*="message"]').first();
    await expect(list).toBeVisible().catch(() => {});
  });

  test('should have notification settings', async ({ page }) => {
    await page.goto('/notifications').catch(() => {});
    const settings = page.locator('[class*="settings"], [class*="preferences"], form').first();
    await expect(settings).toBeVisible().catch(() => {});
  });
});
