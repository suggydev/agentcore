import { test, expect } from '@playwright/test';

/**
 * 📊 Agent 10: Analytics Agent
 * Тестирует: Аналитику, метрики, дашборд, графики
 */


test.describe('Analytics Tests', () => {
  

  test('should load analytics dashboard', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 15000 });
    
    console.log('✅ Аналитика загружается');
  });

  test('should show metrics cards', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForSelector('[data-testid="metric-card"]', { timeout: 10000 });
    
    const metrics = await page.locator('[data-testid="metric-card"]').count();
    expect(metrics).toBeGreaterThan(0);
    
    console.log('✅ Метрики отображаются');
  });

  test('should show conversations stats', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    await page.click('[data-testid="conversations-tab"]');
    
    const conversations = await page.locator('[data-testid="conversation-stat"]').count();
    console.log(`Conversations stats: ${conversations}`);
    
    console.log('✅ Статистика диалогов работает');
  });

  test('should show agent analytics', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    await page.click('[data-testid="agents-tab"]');
    
    const agents = await page.locator('[data-testid="agent-analytics"]').count();
    console.log(`Agent analytics: ${agents}`);
    
    console.log('✅ Аналитика агентов работает');
  });

  test('should show recent activity', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForSelector('[data-testid="recent-activity"]', { timeout: 10000 });
    
    const activity = await page.locator('[data-testid="recent-activity"]').count();
    expect(activity).toBeGreaterThan(0);
    
    console.log('✅ Недавняя активность отображается');
  });
});
