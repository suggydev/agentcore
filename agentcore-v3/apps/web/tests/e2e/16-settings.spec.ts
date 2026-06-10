import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test('should load settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*settings.*/);
  });

  test('should have profile settings', async ({ page }) => {
    await page.goto('/settings');
    const profile = page.locator('[class*="profile"], [class*="account"]').first();
    await expect(profile).toBeVisible();
  });

  test.skip('should have workspace settings', async ({ page }) => {
    await page.goto('/settings');
    const workspace = page.locator('[class*="workspace"], [class*="organization"]').first();
    await expect(workspace).toBeVisible();
  });
});
