import { test, expect } from '@playwright/test';

test('agents loads debug', async ({ page }) => {
  console.log('Starting agents page navigation');
  await page.goto('/agents');
  console.log('Navigated to /agents');
  await page.waitForSelector('body', { timeout: 10000 });
  console.log('Body found');
  console.log('URL:', page.url());
  const cards = await page.locator('[data-testid="agent-card"]').count();
  console.log('Cards:', cards);
  const buttons = await page.locator('button').count();
  console.log('Buttons:', buttons);
});
