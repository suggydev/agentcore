import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    const url = page.url();
    const ok = url.includes('dashboard') || url.includes('agents');
    expect(ok).toBe(true);
  });

  test('should have navigation sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('nav, aside, [class*="sidebar"], [class*="navigation"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    await page.goto('/dashboard');
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });
});
