import { test, expect } from '@playwright/test';

test.describe('Webhooks', () => {
  test('should load webhooks page', async ({ page }) => {
    await page.goto('/webhooks');
    await expect(page).toHaveURL(/.*webhooks.*/);
  });

  test('should have webhook list', async ({ page }) => {
    await page.goto('/webhooks');
    const list = page.locator('table, [class*="webhook"], [class*="endpoint"]').first();
    await expect(list).toBeVisible();
  });

  test('should have create webhook button', async ({ page }) => {
    await page.goto('/webhooks');
    const createButton = page.getByRole('button', { name: /создать|create|добавить|new/i });
    await expect(createButton).toBeVisible();
  });
});
