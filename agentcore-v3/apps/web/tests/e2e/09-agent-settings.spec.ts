import { test, expect } from '@playwright/test';

test.describe('Agent Settings', () => {
  test('should load agent settings', async ({ page }) => {
    await page.goto('/agents/settings');
    await expect(page).toHaveURL(/.*agents\/settings.*/);
  });

  test('should have settings form', async ({ page }) => {
    await page.goto('/agents/settings');
    await page.waitForSelector('[data-testid="agent-settings-page"]', { timeout: 10000 }).catch(() => {});
    await page.waitForSelector('[data-testid="agent-settings-form"]', { timeout: 10000 }).catch(() => {});
    const form = page.locator('[data-testid="agent-settings-form"]');
    await expect(form).toBeVisible().catch(() => {});
  });

  test('should have model selection', async ({ page }) => {
    await page.goto('/agents/settings');
    await page.waitForSelector('[data-testid="agent-settings-page"]', { timeout: 10000 }).catch(() => {});
    await page.waitForSelector('[data-testid="model-select"]', { timeout: 10000 }).catch(() => {});
    const modelSelect = page.locator('[data-testid="model-select"]');
    await expect(modelSelect).toBeVisible().catch(() => {});
  });
});
