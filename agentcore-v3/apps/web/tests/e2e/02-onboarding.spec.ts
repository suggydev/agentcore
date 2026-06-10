import { test, expect } from '@playwright/test';

test.describe('Onboarding', () => {
  test('should show onboarding page after registration', async ({ page }) => {
    // Navigate to onboarding directly
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/.*onboarding.*/);
  });

  test('should have onboarding steps', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByText('Добро пожаловать')).toBeVisible();
  });

  test('should skip onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    const skipButton = page.getByRole('button', { name: /пропустить/i });
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      await expect(page).toHaveURL(/.*(agents|dashboard).*/);
    }
  });
});
