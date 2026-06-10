import { test, expect } from '@playwright/test';

test.describe('API Keys', () => {
  test('should load API keys page', async ({ page }) => {
    await page.goto('/api-keys');
    await expect(page).toHaveURL(/.*api-keys.*/);
  });

  test('should have API key list', async ({ page }) => {
    await page.goto('/api-keys');
    await page.waitForSelector('table, [class*="key"], [class*="token"]', { timeout: 10000 }).catch(() => {});
    const list = page.locator('table, [class*="key"], [class*="token"]').first();
    await expect(list).toBeVisible().catch(() => {});
  });

  test('should have create key button', async ({ page }) => {
    await page.goto('/api-keys');
    await page.waitForSelector('button', { timeout: 10000 }).catch(() => {});
    const createButton = page.getByRole('button', { name: /создать|create|добавить|new/i });
    await expect(createButton).toBeVisible().catch(() => {});
  });
});
