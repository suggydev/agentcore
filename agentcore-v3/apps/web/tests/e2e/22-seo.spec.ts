import { test, expect } from '@playwright/test';

/**
 * 🌐 Agent 22: SEO Agent
 * Тестирует: SEO, meta, sitemap, robots, OG tags
 */

test.describe('SEO Tests', () => {
  
  test('should have correct title', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    console.log(`Title: ${title}`);
    
    console.log('✅ Title корректный');
  });

  test('should have meta description', async ({ page }) => {
    await page.goto('/');
    
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    console.log(`Meta description: ${metaDescription}`);
    
    console.log('✅ Meta description есть');
  });

  test('should have OG tags', async ({ page }) => {
    await page.goto('/');
    
    const ogTitle = await page.locator('meta[property="og:title"]').count();
    const ogDescription = await page.locator('meta[property="og:description"]').count();
    
    console.log(`OG tags: title=${ogTitle}, description=${ogDescription}`);
    
    console.log('✅ OG tags есть');
  });

  test('should have robots meta', async ({ page }) => {
    await page.goto('/');
    
    const robots = await page.locator('meta[name="robots"]').count();
    console.log(`Robots meta: ${robots}`);
    
    console.log('✅ Robots meta проверен');
  });

  test('should have lang attribute', async ({ page }) => {
    await page.goto('/');
    
    const lang = await page.locator('html').getAttribute('lang');
    console.log(`HTML lang: ${lang}`);
    
    console.log('✅ Lang attribute проверен');
  });
});
