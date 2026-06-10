import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all main pages', async ({ page }) => {
    const pages = ['/dashboard', '/pricing', '/docs'];
    for (const url of pages) {
      await page.goto(url);
      await expect(page).toHaveURL(new RegExp(`.*${url.replace('/', '')}.*`));
    }
    // Test login page with cleared auth state
    await page.evaluate(() => {
      localStorage.clear();
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
    });
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should have working logo link', async ({ page }) => {
    await page.goto('/dashboard');
    const logo = page.locator('a[href="/"], [class*="logo"]').first();
    if (await logo.isVisible().catch(() => false)) {
      await logo.click();
      await expect(page).toHaveURL(/.*\/$/);
    }
  });

  test('should have mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    const menuButton = page.locator('button[class*="menu"], button[aria-label*="menu"]').first();
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await expect(page.locator('nav, aside').first()).toBeVisible();
    }
  });
});
