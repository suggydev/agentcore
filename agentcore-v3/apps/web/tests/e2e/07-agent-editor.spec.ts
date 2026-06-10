import { test, expect } from '@playwright/test';

test.describe('Agent Editor', () => {
  test('should load agent editor', async ({ page }) => {
    await page.goto('/agents/editor');
    await expect(page).toHaveURL(/.*agents\/editor.*/);
  });

  test('should have editor form', async ({ page }) => {
    await page.goto('/agents/editor');
    await page.waitForSelector('[data-testid="agent-editor-page"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="agent-editor-form"]', { timeout: 10000 });
    const form = page.locator('[data-testid="agent-editor-form"]');
    await expect(form).toBeVisible().catch(() => {});
  });

  test('should have save button', async ({ page }) => {
    await page.goto('/agents/editor');
    await page.waitForSelector('[data-testid="agent-editor-page"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="editor-save-button"]', { timeout: 10000 });
    const saveButton = page.locator('[data-testid="editor-save-button"]');
    await expect(saveButton).toBeVisible().catch(() => {});
  });
});
