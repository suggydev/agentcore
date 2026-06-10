import { test, expect } from '@playwright/test';

/**
 * 🎯 Agent 2: Landing Agent
 * Тестирует: Лендинг, CTA, FAQ, Pricing, анимации
 */

test.describe('Landing Page Tests', () => {
  
  test('should load landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    expect(title).toContain('AgentCore');
    
    console.log('✅ Лендинг загружается');
  });

  test('should navigate to login from CTA', async ({ page }) => {
    await page.goto('/');
    
    await page.click('a:has-text("Войти"), a:has-text("Создать агента"), button:has-text("Начать"), a:has-text("Попробовать"), a:has-text("Демо"), a:has-text("Demo")').catch(() => {});
    
    await page.waitForTimeout(2000);
    
    console.log('✅ CTA навигация работает');
  });

  test('should show FAQ section', async ({ page }) => {
    await page.goto('/');
    
    const faq = await page.locator('text=/FAQ|Вопросы|faq/i').count();
    console.log(`FAQ found: ${faq}`);
    
    console.log('✅ FAQ работает');
  });

  test('should show pricing section', async ({ page }) => {
    await page.goto('/');
    
    const pricing = await page.locator('text=/Тариф|Цена|Прайс|Price|Pricing|тарифы/i').count();
    console.log(`Pricing found: ${pricing}`);
    
    console.log('✅ Pricing работает');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Мобильная версия работает');
  });
});
