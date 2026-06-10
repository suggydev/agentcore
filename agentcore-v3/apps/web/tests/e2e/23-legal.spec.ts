import { test, expect } from '@playwright/test';

/**
 * 📝 Agent 23: Legal Agent
 * Тестирует: Terms, Privacy, Refund, Requisites, Delivery
 */

test.describe('Legal Pages Tests', () => {
  
  test('should show terms page', async ({ page }) => {
    await page.goto('/terms');
    
    const content = await page.locator('text=/terms|условия|Terms/i').count();
    expect(content).toBeGreaterThan(0);
    
    console.log('✅ Terms page работает');
  });

  test('should show privacy page', async ({ page }) => {
    await page.goto('/privacy');
    
    const content = await page.locator('text=/privacy|конфиденциальность|Privacy/i').count();
    expect(content).toBeGreaterThan(0);
    
    console.log('✅ Privacy page работает');
  });

  test('should show refund page', async ({ page }) => {
    await page.goto('/refund');
    
    const content = await page.locator('text=/refund|возврат|Refund/i').count();
    expect(content).toBeGreaterThan(0);
    
    console.log('✅ Refund page работает');
  });

  test('should show requisites page', async ({ page }) => {
    await page.goto('/requisites');
    
    const content = await page.locator('text=/requisites|реквизиты|Requisites/i').count();
    expect(content).toBeGreaterThan(0);
    
    console.log('✅ Requisites page работает');
  });

  test('should show delivery page', async ({ page }) => {
    await page.goto('/delivery');
    
    const content = await page.locator('text=/delivery|доставка|Delivery/i').count();
    expect(content).toBeGreaterThan(0);
    
    console.log('✅ Delivery page работает');
  });
});
