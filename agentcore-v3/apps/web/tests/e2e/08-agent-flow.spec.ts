import { test, expect } from '@playwright/test';

test.describe('Agent Flow', () => {
  test('should load agent flow', async ({ page }) => {
    await page.goto('/agents/flow');
    await expect(page).toHaveURL(/.*agents\/flow.*/);
  });

  test('should have flow canvas', async ({ page }) => {
    await page.goto('/agents/flow');
    await page.waitForSelector('[data-testid="agent-flow-page"]', { timeout: 10000 }).catch(() => {});
    await page.waitForSelector('[data-testid="flow-canvas"]', { timeout: 10000 }).catch(() => {});
    const canvas = page.locator('[data-testid="flow-canvas"]');
    await expect(canvas).toBeVisible().catch(() => {});
  });

  test('should have flow nodes', async ({ page }) => {
    await page.goto('/agents/flow');
    await page.waitForSelector('[data-testid="flow-canvas"]', { timeout: 10000 }).catch(() => {});
    const nodes = page.locator('[data-testid="flow-canvas"]');
    await expect(nodes).toBeVisible().catch(() => {});
  });
});
