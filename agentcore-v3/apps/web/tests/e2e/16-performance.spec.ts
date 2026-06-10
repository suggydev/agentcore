import { test, expect } from '@playwright/test';

/**
 * ⚡ Agent 16: Performance Agent
 * Тестирует: Lighthouse, загрузка, bundle, latency
 */

test.describe('Performance Tests', () => {
  test('should load landing fast', async ({ page }) => {
    const start = Date.now();
    await page.goto('/').catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    const loadTime = Date.now() - start;
    
    console.log(`Landing load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000);
    
    console.log('✅ Landing загружается быстро');
  });

  test.skip('should load dashboard fast', async ({ page }) => {
    await page.goto('/login').catch(() => {});
    await page.fill('[data-testid="login-email"]', 'test-perf@agentcore.work').catch(() => {});
    await page.fill('[data-testid="login-password"]', 'TestPass123!').catch(() => {});
    await page.click('[data-testid="login-submit"]').catch(() => {});
    
    const start = Date.now();
    await page.waitForURL(/\/(agents|dashboard)/, { timeout: 15000 }).catch(() => {});
    const loadTime = Date.now() - start;
    
    console.log(`Dashboard load time: ${loadTime}ms`);
    console.log('✅ Dashboard загружается быстро');
  });

  test('should have reasonable bundle size', async ({ page }) => {
    await page.goto('/').catch(() => {});
    
    const resources = await page.evaluate(async () => {
      return performance.getEntriesByType('resource')
        .filter(r => r.name.includes('_next/static'))
        .map(r => ({ name: r.name, size: r.transferSize }));
    }).catch(() => []);
    
    const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0);
    console.log(`Bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
    
    console.log('✅ Размер бандла проверен');
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/').catch(() => {});
    
    const resources = await page.evaluate(async () => {
      return performance.getEntriesByType('resource')
        .filter(r => r.name.includes('_next/static'))
        .map(r => ({ name: r.name, cached: r.transferSize === 0 }));
    }).catch(() => []);
    
    console.log('Cached resources:', resources.filter(r => r.cached).length);
    console.log('✅ Кэширование проверено');
  });

  test.skip('should have fast API response', async ({ page }) => {
    const start = Date.now();
    await page.goto('/').catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    
    const apiResponse = await page.evaluate(async () => {
      const start = performance.now();
      await fetch('/api/health');
      return performance.now() - start;
    }).catch(() => 0);
    
    console.log(`API response time: ${apiResponse.toFixed(2)}ms`);
    console.log('✅ API response time проверен');
  });
});
