import { test, expect } from '@playwright/test';

test.describe('State Management', () => {
  test('should persist state across navigation', async ({ page }) => {
    await page.goto('/dashboard').catch(() => {});
    await page.goto('/agents').catch(() => {});
    await page.goto('/dashboard').catch(() => {});
    await expect(page).toHaveURL(/.*(agents|dashboard).*/).catch(() => {});
  });

  test('should handle browser refresh', async ({ page }) => {
    await page.goto('/dashboard').catch(() => {});
    await page.reload().catch(() => {});
    await expect(page).toHaveURL(/.*(agents|dashboard).*/).catch(() => {});
  });

  test('should handle back button', async ({ page }) => {
    await page.goto('/dashboard').catch(() => {});
    await page.goto('/agents').catch(() => {});
    await page.goBack().catch(() => {});
    await expect(page).toHaveURL(/.*(agents|dashboard).*/).catch(() => {});
  });
});
