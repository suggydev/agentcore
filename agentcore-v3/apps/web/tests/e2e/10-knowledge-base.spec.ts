import { test, expect } from '@playwright/test';

test.describe('Knowledge Base', () => {
  test('should load knowledge base', async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*knowledge.*/);
  });

  test('should have knowledge items', async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForTimeout(500);
    const items = page.locator('table, [class*="item"], [class*="card"]').first();
    await expect(items).toBeVisible();
  });

  test.skip('should have upload button', async ({ page }) => {
    console.log('⏭️ Skipped: upload button test');
  });
});
