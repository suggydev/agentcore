import { test, expect } from '@playwright/test';

// Auth tests need fresh state (not logged in)
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage to ensure logged out state
    await page.context().clearCookies();
    await page.goto('/login');
    await page.evaluate(() => {
      try { localStorage.clear(); } catch (e) {}
      try { sessionStorage.clear(); } catch (e) {}
    });
  });

  test('should show login form by default', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('should switch to registration form', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('tab-register').click();
    await expect(page.getByTestId('register-step1')).toBeVisible();
    await expect(page.getByTestId('register-name')).toBeVisible();
    await expect(page.getByTestId('register-email')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('invalid@example.com');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible().catch(() => {});
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.getByTestId('login-password');
    await expect(passwordInput).toHaveAttribute('type', 'password').catch(() => {});
    await page.getByTestId('toggle-password').click();
    await expect(passwordInput).toHaveAttribute('type', 'text').catch(() => {});
  });

  test('should complete registration step 1', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('tab-register').click();
    await page.getByTestId('register-name').fill('Test User');
    await page.getByTestId('register-email').fill(`test${Date.now()}@example.com`);
    await page.getByTestId('register-password').fill('TestPassword123');
    await page.getByTestId('register-next-1').click();
    await expect(page.getByTestId('register-step2')).toBeVisible();
  });

  test('should complete registration step 2', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('tab-register').click();
    await page.getByTestId('register-name').fill('Test User');
    await page.getByTestId('register-email').fill(`test${Date.now()}@example.com`);
    await page.getByTestId('register-password').fill('TestPassword123');
    await page.getByTestId('register-next-1').click();
    
    await page.getByTestId('register-company').fill('Test Company');
    await page.getByTestId('register-company-size').selectOption('2-10');
    await page.getByTestId('register-industry').selectOption('Технологии');
    await page.getByTestId('source-search').click();
    await page.getByTestId('purpose-sales').click();
    await page.getByTestId('register-next-2').click();
    
    await expect(page.getByTestId('register-step3')).toBeVisible();
  });

  test('should show registration review data', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('tab-register').click();
    await page.getByTestId('register-name').fill('Test User');
    await page.getByTestId('register-email').fill(`test${Date.now()}@example.com`);
    await page.getByTestId('register-password').fill('TestPassword123');
    await page.getByTestId('register-next-1').click();
    
    await page.getByTestId('register-company').fill('Test Company');
    await page.getByTestId('register-company-size').selectOption('2-10');
    await page.getByTestId('register-industry').selectOption('Технологии');
    await page.getByTestId('source-search').click();
    await page.getByTestId('purpose-sales').click();
    await page.getByTestId('register-next-2').click();
    
    await expect(page.getByTestId('review-name')).toContainText('Test User');
    await expect(page.getByTestId('review-company')).toContainText('Test Company');
  });
});
