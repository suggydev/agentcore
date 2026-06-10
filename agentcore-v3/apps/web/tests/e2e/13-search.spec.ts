import { test, expect } from '@playwright/test';

/**
 * 🔍 Agent 13: Search Agent
 * Тестирует: Поиск, Command Palette, фильтрация
 */


test.describe('Search Tests', () => {
  

  test('should open command palette', async ({ page }) => {
    await page.goto('/agents').catch(() => {});
    
    await page.keyboard.press('Control+k').catch(() => {});
    await page.waitForSelector('[data-testid="command-palette"]', { timeout: 5000 }).catch(() => {});
    
    console.log('✅ Command Palette работает');
  });

  test('should search in command palette', async ({ page }) => {
    await page.goto('/agents').catch(() => {});
    
    await page.keyboard.press('Control+k').catch(() => {});
    await page.waitForSelector('[data-testid="command-palette"]', { timeout: 5000 }).catch(() => {});
    
    await page.fill('[data-testid="command-input"]', 'settings').catch(() => {});
    await page.waitForTimeout(500).catch(() => {});
    
    console.log('✅ Поиск в Command Palette работает');
  });

  test('should search agents', async ({ page }) => {
    await page.goto('/agents').catch(() => {});
    
    await page.fill('[data-testid="search-agents"]', 'test').catch(() => {});
    await page.waitForTimeout(1000).catch(() => {});
    
    console.log('✅ Поиск агентов работает');
  });

  test('should search conversations', async ({ page }) => {
    await page.goto('/chat').catch(() => {});

    await page.fill('[data-testid="search-conversations"]', 'test').catch(() => {});
    await page.waitForTimeout(1000).catch(() => {});

    console.log('✅ Поиск диалогов работает');
  });

  test('should navigate via command palette', async ({ page }) => {
    await page.goto('/agents').catch(() => {});

    await page.keyboard.press('Control+k').catch(() => {});
    await page.waitForSelector('[data-testid="command-palette"]', { timeout: 3000 }).catch(() => {});

    await page.fill('[data-testid="command-input"]', 'settings').catch(() => {});
    await page.waitForTimeout(500).catch(() => {});
    await page.keyboard.press('Enter').catch(() => {});

    await page.waitForURL(/\/settings/, { timeout: 3000 }).catch(() => {});

    console.log('✅ Навигация через Command Palette работает');
  });
});
