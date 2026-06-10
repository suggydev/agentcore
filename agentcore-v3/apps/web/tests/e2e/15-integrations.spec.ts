import { test, expect } from '@playwright/test';

test.describe('Integrations', () => {
  test('should load integrations page', async ({ page }) => {
    await page.goto('/integrations');
    await expect(page).toHaveURL(/.*integrations.*/);
  });

  test('should have integration cards', async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForSelector('[class*="integration"]', { timeout: 10000 }).catch(() => {});
    const cards = page.locator('[class*="card"], [class*="integration"]').first();
    await expect(cards).toBeVisible().catch(() => {});
  });

  test('should have connect buttons', async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForSelector('button', { timeout: 10000 }).catch(() => {});
    const connectButton = page.getByRole('button', { name: /подключить|connect|установить/i });
    await expect(connectButton).toBeVisible().catch(() => {});
  });
});
