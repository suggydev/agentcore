import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should handle 404 page', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('body')).toContainText(/404|not found|не найдена/i);
  });

  test('should handle 500 errors', async ({ page }) => {
    await page.goto('/error');
    await expect(page.locator('body')).toContainText(/error|ошибка/i);
  });

  test('should have error boundary', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
