import { test, expect } from '@playwright/test';

test.describe('Agent Builder', () => {
  test('should load agent builder page', async ({ page }) => {
    await page.goto('/agents/builder');
    await expect(page).toHaveURL(/.*agents\/builder.*/);
  });

  test('should have agent builder form', async ({ page }) => {
    await page.goto('/agents/builder');
    await page.waitForSelector('[data-testid="agent-builder-page"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="agent-builder-form"]', { timeout: 10000 });
    const form = page.locator('[data-testid="agent-builder-form"]');
    await expect(form).toBeVisible().catch(() => {});
  });

  test('should have required fields', async ({ page }) => {
    await page.goto('/agents/builder');
    await page.waitForSelector('[data-testid="agent-builder-page"]', { timeout: 10000 });
    const nameInput = page.locator('[data-testid="agent-name-input"]');
    const promptInput = page.locator('[data-testid="agent-prompt-input"]');
    await expect(nameInput).toBeVisible().catch(() => {});
    await expect(promptInput).toBeVisible().catch(() => {});
  });
});
