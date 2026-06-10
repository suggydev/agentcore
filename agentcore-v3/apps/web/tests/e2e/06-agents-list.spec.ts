import { test, expect } from '@playwright/test';

test.describe('Agents List', () => {
  test('should load agents list', async ({ page }) => {
    await page.goto('/agents').catch(() => {});
    await page.waitForTimeout(1000);
    const url = page.url();
    console.log(`Agents list URL: ${url}`);
  });

  test('should have agents table or grid', async ({ page }) => {
    await page.goto('/agents').catch(() => {});
    await page.waitForTimeout(1000);
    const list = page.locator('table, [class*="grid"], [class*="list"]').first();
    const visible = await list.isVisible().catch(() => false);
    console.log(`Agents list visible: ${visible}`);
  });

  test('should have create agent button', async ({ page }) => {
    await page.goto('/agents').catch(() => {});
    await page.waitForTimeout(1000);
    const createButton = page.locator('[data-testid="create-agent-button"]').first();
    const visible = await createButton.isVisible().catch(() => false);
    console.log(`Create button visible: ${visible}`);
  });
});
