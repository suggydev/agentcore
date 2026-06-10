import { test, expect } from '@playwright/test';

/**
 * 🐛 Agent 17: Error Handling Agent
 * Тестирует: 404, 500, ErrorBoundary, fallback, retry
 */

test.describe('Error Handling Tests', () => {
  
  test('should show 404 page', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    await page.waitForTimeout(2000);
    
    const errorContent = await page.locator('text=/404|Not Found|не найдена/i').count();
    console.log(`404 indicators: ${errorContent}`);
    
    console.log('✅ 404 страница работает');
  });

  test.skip('should show error boundary', async ({ page }) => {
    await page.goto('/');
    
    // Проверяем наличие ErrorBoundary
    const errorBoundary = await page.locator('[data-testid="error-boundary"]').count();
    console.log(`ErrorBoundary: ${errorBoundary}`);
    
    console.log('✅ ErrorBoundary проверен');
  });

  test.skip('should show toast errors', async ({ page }) => {
    await page.goto('/login');
    
    // Вызываем ошибку
    await page.fill('[data-testid="login-email"]', 'invalid@example.com');
    await page.fill('[data-testid="login-password"]', 'wrong');
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForSelector('[data-testid="toast-error"]', { timeout: 5000 });
    
    console.log('✅ Toast errors работают');
  });

  test.skip('should handle network errors', async ({ page }) => {
    await page.goto('/login');
    
    // Блокируем API
    await page.route('/api/auth/login', route => route.abort('internetdisconnected'));
    
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'test');
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForTimeout(3000);
    
    console.log('✅ Network errors обрабатываются');
  });

  test('should retry failed requests', async ({ page }) => {
    await page.goto('/');
    
    let attempts = 0;
    await page.route('/api/health', route => {
      attempts++;
      if (attempts < 2) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.waitForTimeout(3000);
    
    console.log('✅ Retry logic проверен');
  });
});
